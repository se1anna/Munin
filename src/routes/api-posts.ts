import { Hono } from "hono";
import { HonoEnv } from "../types/env";
import { requireAuth } from "../middleware/auth-guard";
import { canManagePost } from "../auth/rbac";
import { renderGutenbergHtml } from "../engine/gutenberg";
import { invalidatePostAndFeeds } from "../services/cache";
import { rateLimit } from "../middleware/rate-limiter";

export const apiPostsRoutes = new Hono<HonoEnv>();

function getBlogDOStub(c: any) {
  const id = c.env.BLOG_DO.idFromName("global-blog-instance");
  return c.env.BLOG_DO.get(id);
}

// 1. List Posts with search query capping & rate limit
apiPostsRoutes.get(
  "/",
  rateLimit({ keyPrefix: "api_posts_list", limit: 60, windowSeconds: 60 }),
  async (c) => {
    const page = Math.max(1, Math.min(1000, parseInt(c.req.query("page") || "1", 10) || 1));
    const limit = Math.max(1, Math.min(50, parseInt(c.req.query("limit") || "10", 10) || 10));
    const rawStatus = c.req.query("status");
    const categorySlug = c.req.query("category");
    const tagSlug = c.req.query("tag");
    const rawSearch = c.req.query("search");

    if (rawStatus && rawStatus !== "published" && rawStatus !== "draft") {
      return c.json({ error: "无效的文章状态筛选值" }, 400);
    }

    // ⚠️ SECURITY: this route is public. Only editors may read unpublished posts,
    // otherwise `?status=draft` (or no status at all) leaks every draft body.
    const viewer = c.get("user");
    const canSeeUnpublished = viewer?.role === "administrator" || viewer?.role === "author";
    const status = canSeeUnpublished ? rawStatus : "published";

    // Cap search string to 50 chars to avoid expensive LIKE wildcard computation
    const search = rawSearch ? rawSearch.trim().slice(0, 50) : undefined;

    const blogDO = getBlogDOStub(c);
    const result = await (blogDO as any).listPosts({
      status,
      page,
      limit,
      categorySlug: categorySlug ? categorySlug.slice(0, 50) : undefined,
      tagSlug: tagSlug ? tagSlug.slice(0, 50) : undefined,
      search
    });

    return c.json(result);
  }
);

// 2. Get Post By ID
apiPostsRoutes.get(
  "/:id",
  rateLimit({ keyPrefix: "api_posts_get", limit: 120, windowSeconds: 60 }),
  async (c) => {
    const id = c.req.param("id");
    if (!id || id.length > 50) {
      return c.json({ error: "无效的文章 ID" }, 400);
    }
    const blogDO = getBlogDOStub(c);
    const post = await (blogDO as any).getPostById(id);
    if (!post) {
      return c.json({ error: "文章未找到" }, 404);
    }

    // ⚠️ SECURITY: unpublished posts are invisible unless the caller owns them.
    if (post.status !== "published") {
      const viewer = c.get("user");
      const canRead = viewer && canManagePost(viewer.role, post.author_id, viewer.id);
      if (!canRead) {
        return c.json({ error: "文章未找到" }, 404);
      }
    }

    return c.json({ post });
  }
);

// 3. Create Post
apiPostsRoutes.post("/", requireAuth, async (c) => {
  const user = c.get("user")!;
  if (user.role !== "administrator" && user.role !== "author") {
    return c.json({ error: "权限不足，仅作者或管理员可发布文章" }, 403);
  }

  const body = await c.req.json();
  const {
    title,
    slug,
    content_raw,
    excerpt,
    status = "draft",
    featured_image,
    category_ids = [],
    tag_ids = []
  } = body;

  if (!title || !content_raw) {
    return c.json({ error: "文章标题与内容不能为空" }, 400);
  }

  // Type-check before touching .length, otherwise a non-string payload throws a 500
  if (typeof title !== "string" || typeof content_raw !== "string") {
    return c.json({ error: "文章标题与内容必须为字符串" }, 400);
  }

  if (status !== "draft" && status !== "published") {
    return c.json({ error: "无效的文章状态，仅支持 draft 或 published" }, 400);
  }

  if (title.length > 200) {
    return c.json({ error: "文章标题超出 200 字限制" }, 400);
  }

  if (content_raw.length > 200000) {
    return c.json({ error: "文章内容超出 200KB 限制" }, 400);
  }

  const finalSlug = (slug ? String(slug) : title)
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

  const contentHtml = renderGutenbergHtml(content_raw);
  const blogDO = getBlogDOStub(c);

  // Check slug uniqueness
  const existing = await (blogDO as any).getPostBySlug(finalSlug);
  const uniqueSlug = existing ? `${finalSlug}-${Date.now().toString().slice(-4)}` : finalSlug;

  const post = await (blogDO as any).createPost({
    slug: uniqueSlug,
    title: title.slice(0, 200),
    content_html: contentHtml,
    content_raw,
    excerpt: (excerpt || contentHtml.replace(/<[^>]*>/g, "").slice(0, 150) + "...").slice(0, 300),
    status,
    author_id: user.id,
    featured_image: featured_image ? String(featured_image).slice(0, 300) : "",
    category_ids,
    tag_ids
  });

  if (c.env.CACHE_KV) {
    await invalidatePostAndFeeds(c.env.CACHE_KV, post.slug);
  }

  return c.json({ success: true, post });
});

// 4. Update Post
apiPostsRoutes.put("/:id", requireAuth, async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");
  const blogDO = getBlogDOStub(c);

  const existing = await (blogDO as any).getPostById(id);
  if (!existing) {
    return c.json({ error: "文章未找到" }, 404);
  }

  if (!canManagePost(user.role, existing.author_id, user.id)) {
    return c.json({ error: "您没有修改他人文章的权限" }, 403);
  }

  const body = await c.req.json();
  const {
    title,
    slug,
    content_raw,
    excerpt,
    status,
    featured_image,
    category_ids,
    tag_ids
  } = body;

  const updatePayload: any = {};
  if (title !== undefined) updatePayload.title = String(title).slice(0, 200);
  if (status !== undefined) {
    if (status !== "draft" && status !== "published") {
      return c.json({ error: "无效的文章状态，仅支持 draft 或 published" }, 400);
    }
    updatePayload.status = status;
  }
  if (featured_image !== undefined) updatePayload.featured_image = String(featured_image).slice(0, 300);
  if (category_ids !== undefined) updatePayload.category_ids = category_ids;
  if (tag_ids !== undefined) updatePayload.tag_ids = tag_ids;

  if (slug !== undefined) {
    // Same normalization as create: an unsanitized slug is injected into theme
    // href attributes and can also collide with an existing post's UNIQUE slug.
    const normalizedSlug = String(slug)
      .toLowerCase()
      .trim()
      .replace(/[^\w\u4e00-\u9fa5-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100);
    if (!normalizedSlug) {
      return c.json({ error: "文章别名 (slug) 不能为空" }, 400);
    }
    if (normalizedSlug !== existing.slug) {
      const slugOwner = await (blogDO as any).getPostBySlug(normalizedSlug);
      if (slugOwner && slugOwner.id !== id) {
        return c.json({ error: "该文章别名 (slug) 已被其他文章占用" }, 409);
      }
    }
    updatePayload.slug = normalizedSlug;
  }

  if (content_raw !== undefined) {
    if (typeof content_raw !== "string") {
      return c.json({ error: "文章内容必须为字符串" }, 400);
    }
    if (content_raw.length > 200000) {
      return c.json({ error: "文章内容超出 200KB 限制" }, 400);
    }
    updatePayload.content_raw = content_raw;
    updatePayload.content_html = renderGutenbergHtml(content_raw);
  }
  if (excerpt !== undefined) {
    updatePayload.excerpt = String(excerpt).slice(0, 300);
  }

  const updated = await (blogDO as any).updatePost(id, updatePayload);

  if (c.env.CACHE_KV) {
    await invalidatePostAndFeeds(c.env.CACHE_KV, updated.slug);
    if (existing.slug && existing.slug !== updated.slug) {
      await invalidatePostAndFeeds(c.env.CACHE_KV, existing.slug);
    }
  }

  return c.json({ success: true, post: updated });
});

// 5. Delete Post
apiPostsRoutes.delete("/:id", requireAuth, async (c) => {
  const user = c.get("user")!;
  const id = c.req.param("id");
  const blogDO = getBlogDOStub(c);

  const existing = await (blogDO as any).getPostById(id);
  if (!existing) {
    return c.json({ error: "文章未找到" }, 404);
  }

  if (!canManagePost(user.role, existing.author_id, user.id)) {
    return c.json({ error: "您没有删除该文章的权限" }, 403);
  }

  await (blogDO as any).deletePost(id);

  if (c.env.CACHE_KV) {
    await invalidatePostAndFeeds(c.env.CACHE_KV, existing.slug);
  }

  return c.json({ success: true, message: "文章已成功删除" });
});
