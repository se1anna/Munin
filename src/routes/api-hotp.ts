import { Hono } from "hono";
import { HonoEnv } from "../types/env";
import { requireAuth, requireRole } from "../middleware/auth-guard";
import { hotpAuthMiddleware } from "../middleware/hotp-auth";
import { rateLimit } from "../middleware/rate-limiter";
import { generateHotpPool, batchWriteHotpToKV, checkHotpGenerationCooldown } from "../auth/hotp";
import { renderGutenbergHtml } from "../engine/gutenberg";

export const apiHotpRoutes = new Hono<HonoEnv>();

function getBlogDOStub(c: any) {
  const id = c.env.BLOG_DO.idFromName("global-blog-instance");
  return c.env.BLOG_DO.get(id);
}

// 1. Generate HOTP Pool & Non-blocking Stream Download (Admin Only, 10-Minute Cooldown)
apiHotpRoutes.post("/admin/hotp/generate", requireAuth, requireRole(["administrator"]), async (c) => {
  // Check generation cooldown lock (10 minutes)
  const { canGenerate, resetInSeconds } = await checkHotpGenerationCooldown(c.env.HOTP_KV, 600);
  if (!canGenerate) {
    return c.json(
      {
        error: `HOTP 密钥池生成过于频繁，为防止 KV 写入配额异常消耗，请在 ${resetInSeconds} 秒后再试`,
        reset_in_seconds: resetInSeconds
      },
      429
    );
  }

  // Generate 1000 random 10-char alphanumeric strings
  const keys = generateHotpPool(1000, 10);
  const textContent = keys.join("\n");

  // Asynchronous background chunked batch writing to KV (50 per batch)
  c.executionCtx.waitUntil(
    batchWriteHotpToKV(c.env.HOTP_KV, keys, 50).catch((err) => {
      console.error("[HOTP KV Batch Write Failed]", err);
    })
  );

  // Return streamed file download immediately to client
  c.header("Content-Type", "text/plain; charset=utf-8");
  c.header("Content-Disposition", 'attachment; filename="hotp-keys.txt"');
  c.header("Cache-Control", "no-store, no-cache, must-revalidate");
  return c.body(textContent);
});

// 2. Open External API: Submit Post via Single-use HOTP (Rate limited: max 20 req/min)
apiHotpRoutes.post(
  "/open/posts",
  rateLimit({ keyPrefix: "open_api_posts", limit: 20, windowSeconds: 60 }),
  hotpAuthMiddleware,
  async (c) => {
    const body = await c.req.json();
    const { title, slug, content_raw, excerpt, status = "published", category_ids = [], tag_ids = [] } = body;

    if (!title || !content_raw) {
      return c.json({ error: "文章标题与内容不能为空" }, 400);
    }

    if (title.length > 200) {
      return c.json({ error: "文章标题超出 200 字限制" }, 400);
    }

    if (content_raw.length > 200000) {
      return c.json({ error: "文章内容超出 200KB 限制" }, 400);
    }

    const blogDO = getBlogDOStub(c);
    const users = await (blogDO as any).listUsers();
    const adminUser = users.find((u: any) => u.role === "administrator") || users[0];
    const authorId = adminUser ? adminUser.id : "system";

    const finalSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^\w\u4e00-\u9fa5-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100);

    const contentHtml = renderGutenbergHtml(content_raw);
    const post = await (blogDO as any).createPost({
      slug: finalSlug,
      title,
      content_html: contentHtml,
      content_raw,
      excerpt: excerpt || contentHtml.replace(/<[^>]*>/g, "").slice(0, 150) + "...",
      status,
      author_id: authorId,
      category_ids,
      tag_ids
    });

    return c.json({
      success: true,
      message: "文章已通过 HOTP 鉴权成功发布，该 HOTP 令牌已即时核销消耗",
      post
    });
  }
);

// 3. Open External API: Query Comments via Single-use HOTP
apiHotpRoutes.get(
  "/open/comments",
  rateLimit({ keyPrefix: "open_api_comments", limit: 30, windowSeconds: 60 }),
  hotpAuthMiddleware,
  async (c) => {
    const blogDO = getBlogDOStub(c);
    const comments = await (blogDO as any).listAllComments();
    return c.json({
      success: true,
      message: "HOTP 令牌已核销消耗",
      comments
    });
  }
);

// 4. Open External API: Query Users List via Single-use HOTP
apiHotpRoutes.get(
  "/open/users",
  rateLimit({ keyPrefix: "open_api_users", limit: 30, windowSeconds: 60 }),
  hotpAuthMiddleware,
  async (c) => {
    const blogDO = getBlogDOStub(c);
    const users = await (blogDO as any).listUsers();
    const safeUsers = users.map((u: any) => ({
      id: u.id,
      username: u.username,
      // ⚠️ SECURITY: email removed from HOTP public API to protect PII
      role: u.role,
      display_name: u.display_name,
      created_at: u.created_at
    }));
    return c.json({
      success: true,
      message: "HOTP 令牌已核销消耗",
      users: safeUsers
    });
  }
);
