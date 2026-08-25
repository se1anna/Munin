import { Hono } from "hono";
import { HonoEnv } from "./types/env";
import { BlogDO } from "./do/blog";
import { securityHeadersMiddleware } from "./middleware/security";
import { optionalAuthMiddleware } from "./middleware/auth-guard";

// Routes
import { ssrRoutes } from "./routes/ssr";
import { feedRoutes } from "./routes/feed";
import { apiAuthRoutes } from "./routes/api-auth";
import { apiPostsRoutes } from "./routes/api-posts";
import { apiCommentsRoutes } from "./routes/api-comments";
import { apiHotpRoutes } from "./routes/api-hotp";
import { apiUploadRoutes } from "./routes/api-upload";
import { apiAdminRoutes } from "./routes/api-admin";
import { mediaDistributionRoutes } from "./routes/media";
import { oauthRoutes, getOIDCDiscovery } from "./routes/oauth";
import { renderAdminPageHtml } from "./views/admin-view";
import { getFaviconBytes } from "./assets/favicon";

// Export Durable Object classes for Cloudflare Workers runtime
export { BlogDO };

const app = new Hono<HonoEnv>();

// Global Middlewares
app.use("/*", securityHeadersMiddleware);
app.use("/*", optionalAuthMiddleware);

// Favicon & Static Icon Routes
app.get("/favicon.ico", (c) => {
  const bytes = getFaviconBytes("head-32x32.ico") || getFaviconBytes("icon-32x32.ico");
  if (!bytes) return c.notFound();
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/x-icon",
      "Cache-Control": "public, max-age=604800, immutable"
    }
  });
});

app.get("/favicon/:filename", (c) => {
  const filename = c.req.param("filename");
  const bytes = getFaviconBytes(filename);
  if (!bytes) return c.notFound();
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/x-icon",
      "Cache-Control": "public, max-age=604800, immutable"
    }
  });
});

// OpenID Connect Discovery standard endpoint
app.get("/.well-known/openid-configuration", (c) => {
  const url = new URL(c.req.url);
  const proto = c.req.header("x-forwarded-proto") || url.protocol.replace(":", "");
  const host = c.req.header("host") || url.host;
  const baseUrl = `${proto}://${host}`;
  return c.json(getOIDCDiscovery(baseUrl));
});

// OAuth 2.0 & OIDC Endpoints
app.route("/oauth", oauthRoutes);

// Admin UI Route
app.get("/admin", async (c) => {
  const id = c.env.BLOG_DO.idFromName("global-blog-instance");
  const blogDO = c.env.BLOG_DO.get(id);
  const site = await (blogDO as any).getSiteOptions();

  const html = renderAdminPageHtml(site, c.env.TURNSTILE_SITE_KEY);
  c.header("Content-Type", "text/html; charset=utf-8");
  return c.body(html);
});

// Mount Media Distribution
app.route("/media", mediaDistributionRoutes);

// Mount SEO & Feeds
app.route("/", feedRoutes);

// Mount API Routes
app.route("/api/auth", apiAuthRoutes);
app.route("/api/posts", apiPostsRoutes);
app.route("/api/comments", apiCommentsRoutes);
app.route("/api", apiHotpRoutes);
app.route("/api/upload", apiUploadRoutes);
app.route("/api/admin", apiAdminRoutes);

// Mount Frontend SSR Routes (Home, Posts, Archive, Categories, Tags)
app.route("/", ssrRoutes);

// 404 Fallback for unmatched routes
app.notFound(async (c) => {
  const id = c.env.BLOG_DO.idFromName("global-blog-instance");
  const blogDO = c.env.BLOG_DO.get(id);
  const site = await (blogDO as any).getSiteOptions();

  const currentYear = new Date().getFullYear();
  const notFoundHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>404 未找到 - ${site.site_name}</title>
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  <style>
    body { background:#0d0f12; color:#e2e8f0; font-family:-apple-system,sans-serif; text-align:center; padding:80px 20px; margin:0; }
    a { color:#38bdf8; text-decoration:none; }
    .btn { display:inline-block; margin-top:20px; padding:10px 24px; background:#2563eb; color:#fff; border-radius:6px; }
  </style>
</head>
<body>
  <h1 style="font-size:72px; color:#38bdf8; margin:0;">404</h1>
  <h2>页面未找到</h2>
  <p style="color:#94a3b8;">抱歉，您请求的页面不存在或已被移除。</p>
  <a href="/" class="btn">返回首页</a>
</body>
</html>`;

  c.header("Content-Type", "text/html; charset=utf-8");
  return c.body(notFoundHtml, 404);
});

// Global Error Handler
app.onError((err, c) => {
  console.error("[Unhandled App Error]", err);
  // ⚠️ SECURITY: Do NOT expose internal error details to clients in production
  return c.json(
    {
      error: "服务器内部异常，请稍后重试"
    },
    500
  );
});

export default app;
