import { Hono } from "hono";
import { HonoEnv } from "../types/env";
import { SSREngine } from "../engine/ssr";
import { rateLimit } from "../middleware/rate-limiter";

export const ssrRoutes = new Hono<HonoEnv>();

function getBlogDOStub(c: any) {
  const id = c.env.BLOG_DO.idFromName("global-blog-instance");
  return c.env.BLOG_DO.get(id);
}

// 1. Home Page with pagination & edge rate limit
ssrRoutes.get(
  "/",
  rateLimit({ keyPrefix: "ssr_home", limit: 60, windowSeconds: 60 }),
  async (c) => {
    const pageStr = c.req.query("page");
    const page = pageStr ? Math.max(1, Math.min(1000, parseInt(pageStr, 10) || 1)) : 1;
    const blogDO = getBlogDOStub(c);
    const ssr = new SSREngine(c.env, blogDO as any);

    const { html, fromCache } = await ssr.renderHome(page);

    c.header("Content-Type", "text/html; charset=utf-8");
    c.header("X-Edge-Cache", fromCache ? "HIT" : "MISS");
    c.header("Cache-Control", "no-cache, s-maxage=3600");
    return c.body(html);
  }
);

// 2. All Posts Archive Page (/archive & /archives)
const handleArchive = async (c: any) => {
  const blogDO = getBlogDOStub(c);
  const ssr = new SSREngine(c.env, blogDO as any);

  const { html, fromCache } = await ssr.renderAllArchive();

  c.header("Content-Type", "text/html; charset=utf-8");
  c.header("X-Edge-Cache", fromCache ? "HIT" : "MISS");
  c.header("Cache-Control", "no-cache, s-maxage=3600");
  return c.body(html);
};

ssrRoutes.get("/archive", rateLimit({ keyPrefix: "ssr_archive", limit: 60, windowSeconds: 60 }), handleArchive);
ssrRoutes.get("/archives", rateLimit({ keyPrefix: "ssr_archive", limit: 60, windowSeconds: 60 }), handleArchive);

// 3. Single Post Page with slug sanity check
ssrRoutes.get(
  "/post/:slug",
  rateLimit({ keyPrefix: "ssr_post", limit: 120, windowSeconds: 60 }),
  async (c) => {
    const slug = c.req.param("slug");

    // Slug validation: reject excessively long or malformed slugs before calling DO
    if (!slug || slug.length > 100 || /[\x00-\x1f\x7f]/.test(slug)) {
      return c.text("Bad Request: Invalid slug format", 400);
    }

    const blogDO = getBlogDOStub(c);
    const ssr = new SSREngine(c.env, blogDO as any);

    const { html, fromCache, notFound } = await ssr.renderSinglePost(slug);

    c.header("Content-Type", "text/html; charset=utf-8");
    c.header("X-Edge-Cache", fromCache ? "HIT" : "MISS");
    c.header("Cache-Control", notFound ? "no-cache" : "no-cache, s-maxage=3600");
    return c.body(html, notFound ? 404 : 200);
  }
);

// 4. Category Archive Page
ssrRoutes.get(
  "/category/:slug",
  rateLimit({ keyPrefix: "ssr_category", limit: 60, windowSeconds: 60 }),
  async (c) => {
    const slug = c.req.param("slug");
    if (!slug || slug.length > 100) {
      return c.text("Bad Request: Invalid category slug", 400);
    }

    const pageStr = c.req.query("page");
    const page = pageStr ? Math.max(1, Math.min(1000, parseInt(pageStr, 10) || 1)) : 1;
    const blogDO = getBlogDOStub(c);
    const ssr = new SSREngine(c.env, blogDO as any);

    const { html, fromCache } = await ssr.renderCategoryArchive(slug, page);

    c.header("Content-Type", "text/html; charset=utf-8");
    c.header("X-Edge-Cache", fromCache ? "HIT" : "MISS");
    c.header("Cache-Control", "no-cache, s-maxage=3600");
    return c.body(html);
  }
);

// 5. Tag Archive Page
ssrRoutes.get(
  "/tag/:slug",
  rateLimit({ keyPrefix: "ssr_tag", limit: 60, windowSeconds: 60 }),
  async (c) => {
    const slug = c.req.param("slug");
    if (!slug || slug.length > 100) {
      return c.text("Bad Request: Invalid tag slug", 400);
    }

    const pageStr = c.req.query("page");
    const page = pageStr ? Math.max(1, Math.min(1000, parseInt(pageStr, 10) || 1)) : 1;
    const blogDO = getBlogDOStub(c);
    const ssr = new SSREngine(c.env, blogDO as any);

    const { html, fromCache } = await ssr.renderTagArchive(slug, page);

    c.header("Content-Type", "text/html; charset=utf-8");
    c.header("X-Edge-Cache", fromCache ? "HIT" : "MISS");
    c.header("Cache-Control", "no-cache, s-maxage=3600");
    return c.body(html);
  }
);
