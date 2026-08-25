import { Hono } from "hono";
import { HonoEnv } from "../types/env";
import { requireAuth, requireRole } from "../middleware/auth-guard";
import { adminCsrfGuard } from "../middleware/security";
import { rateLimit } from "../middleware/rate-limiter";
import { purgeAllKVCache } from "../services/cache";
import { SSREngine } from "../engine/ssr";
import { getAllThemeMetas, hasTheme, getThemePackage } from "../themes";

export const apiAdminRoutes = new Hono<HonoEnv>();

function getBlogDOStub(c: any) {
  const id = c.env.BLOG_DO.idFromName("global-blog-instance");
  return c.env.BLOG_DO.get(id);
}

// Apply admin auth & CSRF guard to all admin api routes
apiAdminRoutes.use("/*", requireAuth, requireRole(["administrator"]), adminCsrfGuard);

// 1. Dashboard Stats
apiAdminRoutes.get("/stats", async (c) => {
  const blogDO = getBlogDOStub(c);
  const postsData = await (blogDO as any).listPosts({ limit: 1000 });
  const comments = await (blogDO as any).listAllComments();
  const users = await (blogDO as any).listUsers();
  const media = await (blogDO as any).listMedia();

  return c.json({
    posts_count: postsData.total,
    comments_count: comments.length,
    users_count: users.length,
    media_count: media.length
  });
});

// 2. Site Options
apiAdminRoutes.get("/options", async (c) => {
  const blogDO = getBlogDOStub(c);
  const options = await (blogDO as any).getSiteOptions();
  return c.json({ options });
});

apiAdminRoutes.put("/options", async (c) => {
  const body = await c.req.json();
  const blogDO = getBlogDOStub(c);
  await (blogDO as any).updateSiteOptions(body);
  const options = await (blogDO as any).getSiteOptions();
  return c.json({ success: true, options });
});

// 3. Full Data Backup JSON Export (Rate limited: 1 per 60s)
apiAdminRoutes.get(
  "/backup",
  rateLimit({
    keyPrefix: "admin_backup",
    limit: 1,
    windowSeconds: 60,
    errorMessage: "全站数据导出过于频繁，请 1 分钟后再试"
  }),
  async (c) => {
    const blogDO = getBlogDOStub(c);
    const backupData = await (blogDO as any).exportFullBackup();

    const filename = `blog-backup-${new Date().toISOString().slice(0, 10)}.json`;

    c.header("Content-Type", "application/json; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="${filename}"`);
    c.header("Cache-Control", "no-store, no-cache, must-revalidate");
    return c.body(JSON.stringify(backupData, null, 2));
  }
);

// 3.1. Full Data Backup JSON Restore / Import (Rate limited: 2 per 60s)
apiAdminRoutes.post(
  "/restore",
  rateLimit({
    keyPrefix: "admin_restore",
    limit: 2,
    windowSeconds: 60,
    errorMessage: "数据恢复请求过于频繁，请稍后再试"
  }),
  async (c) => {
    let body: any = {};
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "请求格式错误，必须为合法 JSON 数据" }, 400);
    }

    const { backup_data, mode = "merge" } = body;
    if (!backup_data || typeof backup_data !== "object") {
      return c.json({ error: "请提供有效的 JSON 备份数据内容" }, 400);
    }

    if (mode !== "merge" && mode !== "overwrite") {
      return c.json({ error: "恢复模式仅支持 merge (合并) 或 overwrite (覆盖)" }, 400);
    }

    const blogDO = getBlogDOStub(c);
    try {
      const result = await (blogDO as any).importFullBackup(backup_data, { mode });

      // Purge all KV caches across the edge
      if (c.env.CACHE_KV) {
        await purgeAllKVCache(c.env.CACHE_KV);
      }

      return c.json({
        success: true,
        message: mode === "overwrite" ? "全量覆盖还原数据成功，边缘缓存已同步刷新" : "增量合并恢复数据成功，边缘缓存已同步刷新",
        stats: result.stats
      });
    } catch (err: any) {
      return c.json({ error: "数据恢复失败: " + (err.message || "未知错误") }, 500);
    }
  }
);

// 4. Categories Management
apiAdminRoutes.get("/categories", async (c) => {
  const blogDO = getBlogDOStub(c);
  const categories = await (blogDO as any).listCategories();
  return c.json({ categories });
});

apiAdminRoutes.post("/categories", async (c) => {
  const { name, slug } = await c.req.json();
  if (!name || typeof name !== "string") return c.json({ error: "分类名称不能为空" }, 400);

  const blogDO = getBlogDOStub(c);
  const category = await (blogDO as any).getOrCreateCategory(name.slice(0, 50), slug ? slug.slice(0, 50) : undefined);
  return c.json({ success: true, category });
});

// 5. Tags Management
apiAdminRoutes.get("/tags", async (c) => {
  const blogDO = getBlogDOStub(c);
  const tags = await (blogDO as any).listTags();
  return c.json({ tags });
});

apiAdminRoutes.post("/tags", async (c) => {
  const { name, slug } = await c.req.json();
  if (!name || typeof name !== "string") return c.json({ error: "标签名称不能为空" }, 400);

  const blogDO = getBlogDOStub(c);
  const tag = await (blogDO as any).getOrCreateTag(name.slice(0, 50), slug ? slug.slice(0, 50) : undefined);
  return c.json({ success: true, tag });
});

// 6. Media Library
apiAdminRoutes.get("/media", async (c) => {
  const blogDO = getBlogDOStub(c);
  const media = await (blogDO as any).listMedia();
  return c.json({ media });
});

// 7. OAuth Clients Management
apiAdminRoutes.get("/oauth/clients", async (c) => {
  const blogDO = getBlogDOStub(c);
  const clients = await (blogDO as any).listOAuthClients();
  return c.json({ clients });
});

apiAdminRoutes.post("/oauth/clients", async (c) => {
  const { client_name, redirect_uris, scopes, is_trusted } = await c.req.json();
  if (!client_name || typeof client_name !== "string") {
    return c.json({ error: "应用名称不能为空" }, 400);
  }

  let uris: string[] = [];
  if (Array.isArray(redirect_uris)) {
    uris = redirect_uris.map((u) => String(u).trim()).filter(Boolean);
  } else if (typeof redirect_uris === "string") {
    uris = redirect_uris.split("\n").map((u) => u.trim()).filter(Boolean);
  }

  if (uris.length === 0) {
    return c.json({ error: "至少需要配置一个有效的回调地址 (redirect_uri)" }, 400);
  }

  const blogDO = getBlogDOStub(c);
  const result = await (blogDO as any).createOAuthClient({
    client_name: client_name.trim().slice(0, 50),
    redirect_uris: uris,
    scopes: scopes ? String(scopes).slice(0, 100) : "openid profile email role",
    is_trusted: is_trusted !== false
  });

  return c.json({
    success: true,
    client: result.client,
    plain_secret: result.plainSecret,
    message: "OAuth 应用创建成功！请妥善保存客户端密钥，它将不会再次完整显示。"
  });
});

apiAdminRoutes.delete("/oauth/clients/:id", async (c) => {
  const id = c.req.param("id");
  const blogDO = getBlogDOStub(c);
  await (blogDO as any).deleteOAuthClient(id);
  return c.json({ success: true, message: "已删除该 OAuth 应用" });
});

apiAdminRoutes.post("/oauth/clients/:id/reset-secret", async (c) => {
  const id = c.req.param("id");
  const blogDO = getBlogDOStub(c);
  const newSecret = await (blogDO as any).resetOAuthClientSecret(id);
  if (!newSecret) {
    return c.json({ error: "应用不存在" }, 404);
  }
  return c.json({
    success: true,
    plain_secret: newSecret,
    message: "密钥重置成功！请及时更新子系统中的客户端密钥。"
  });
});

// 7. Theme Management & Discovery
apiAdminRoutes.get("/themes", async (c) => {
  const blogDO = getBlogDOStub(c);
  const options = await (blogDO as any).getSiteOptions();
  const themes = getAllThemeMetas();
  return c.json({
    themes,
    active_theme: options.active_theme || "bold-typography"
  });
});

apiAdminRoutes.post("/theme/switch", async (c) => {
  const { theme } = await c.req.json();
  if (!theme || !hasTheme(theme)) {
    return c.json({ error: "不支持的主题名称或主题包未安装" }, 400);
  }

  const blogDO = getBlogDOStub(c);
  await (blogDO as any).updateSiteOptions({ active_theme: theme });

  // 1. Purge all KV caches
  const purgedCount = await purgeAllKVCache(c.env.CACHE_KV);

  // 2. Pre-warm home page SSR cache immediately
  const ssr = new SSREngine(c.env, blogDO as any);
  await ssr.renderHome(1);

  const themePkg = getThemePackage(theme);

  return c.json({
    success: true,
    active_theme: theme,
    theme_meta: themePkg.meta,
    purged_keys_count: purgedCount,
    message: `已成功切换为「${themePkg.meta.name}」主题，并重构全站缓存！`
  });
});

// 8. One-click Purge and Rebuild All KV Cache
apiAdminRoutes.post("/cache/purge-rebuild", async (c) => {
  const blogDO = getBlogDOStub(c);
  const purgedCount = await purgeAllKVCache(c.env.CACHE_KV);

  // Pre-warm home page SSR cache immediately
  const ssr = new SSREngine(c.env, blogDO as any);
  await ssr.renderHome(1);

  return c.json({
    success: true,
    purged_keys_count: purgedCount,
    message: `全站 KV 缓存已彻底清空并完成预热重建（已清理 ${purgedCount} 个缓存项）！`
  });
});

// 9. Users Management & Search
apiAdminRoutes.get("/users", async (c) => {
  const q = c.req.query("q") || "";
  const blogDO = getBlogDOStub(c);
  const users = await (blogDO as any).searchUsers(q);
  return c.json({ users });
});

apiAdminRoutes.put("/users/:id/role", async (c) => {
  const id = c.req.param("id");
  const { role } = await c.req.json();
  if (!role || !["administrator", "author", "subscriber", "tester"].includes(role)) {
    return c.json({ error: "无效的用户角色" }, 400);
  }

  const currentUser = c.get("user");
  const blogDO = getBlogDOStub(c);
  const result = await (blogDO as any).updateUserRole(id, role, currentUser?.id);

  if (!result.success) {
    return c.json({ error: result.error || "更新角色失败" }, 400);
  }

  // Update token version in KV if present
  if (c.env.CACHE_KV && result.newVersion) {
    try {
      if (c.executionCtx && typeof c.executionCtx.waitUntil === "function") {
        c.executionCtx.waitUntil(
          c.env.CACHE_KV.put(`user_token_ver:${id}`, String(result.newVersion), { expirationTtl: 86400 * 7 }).catch(() => {})
        );
      }
    } catch {
      c.env.CACHE_KV.put(`user_token_ver:${id}`, String(result.newVersion), { expirationTtl: 86400 * 7 }).catch(() => {});
    }
  }

  return c.json({ success: true, message: "用户角色已更新", role, new_version: result.newVersion });
});

apiAdminRoutes.delete("/users/:id", async (c) => {
  const id = c.req.param("id");
  const currentUser = c.get("user");
  const blogDO = getBlogDOStub(c);
  const result = await (blogDO as any).deleteUser(id, currentUser?.id);

  if (!result.success) {
    return c.json({ error: result.error || "删除用户失败" }, 400);
  }

  if (c.env.CACHE_KV) {
    try {
      if (c.executionCtx && typeof c.executionCtx.waitUntil === "function") {
        c.executionCtx.waitUntil(
          c.env.CACHE_KV.delete(`user_token_ver:${id}`).catch(() => {})
        );
      }
    } catch {
      c.env.CACHE_KV.delete(`user_token_ver:${id}`).catch(() => {});
    }
  }

  return c.json({ success: true, message: "用户已成功删除" });
});

// 10. OAuth Audit Logs & Purge
apiAdminRoutes.get("/oauth/logs", async (c) => {
  const userId = c.req.query("user_id");
  const username = c.req.query("username");
  const clientId = c.req.query("client_id");
  const period = c.req.query("period");
  const startDate = c.req.query("start_date");
  const endDate = c.req.query("end_date");
  const limit = parseInt(c.req.query("limit") || "500", 10);

  const blogDO = getBlogDOStub(c);
  const logs = await (blogDO as any).queryOAuthLogs({
    userId,
    username,
    clientId,
    period,
    startDate,
    endDate,
    limit
  });

  return c.json({ logs });
});

apiAdminRoutes.delete("/oauth/logs", async (c) => {
  const { retention } = await c.req.json().catch(() => ({ retention: "all" }));
  if (!["all", "1d", "3d", "7d", "30d"].includes(retention)) {
    return c.json({ error: "无效的保留时段参数" }, 400);
  }

  const blogDO = getBlogDOStub(c);
  const { deletedCount } = await (blogDO as any).purgeOAuthLogs(retention);

  return c.json({
    success: true,
    deleted_count: deletedCount,
    message: retention === "all" ? `已成功清空全部 ${deletedCount} 条 OAuth 历史记录！` : `已成功清理指定时间段前的 ${deletedCount} 条记录！`
  });
});


