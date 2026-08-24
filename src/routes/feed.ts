import { Hono } from "hono";
import { HonoEnv } from "../types/env";
import { getCachedResponse, setCachedResponse, getFeedRssCacheKey, getSitemapCacheKey } from "../services/cache";
import { escapeHtml } from "../themes/default-dark/templates";

export const feedRoutes = new Hono<HonoEnv>();

function getBlogDOStub(c: any) {
  const id = c.env.BLOG_DO.idFromName("global-blog-instance");
  return c.env.BLOG_DO.get(id);
}

// RSS 2.0 Feed
feedRoutes.get("/feed.xml", async (c) => {
  const cacheKey = getFeedRssCacheKey();
  const cached = await getCachedResponse(c.env.CACHE_KV, cacheKey);
  if (cached) {
    c.header("Content-Type", "application/xml; charset=utf-8");
    c.header("X-Edge-Cache", "HIT");
    return c.body(cached.body);
  }

  const blogDO = getBlogDOStub(c);
  const site = await (blogDO as any).getSiteOptions();
  const { posts } = await (blogDO as any).listPosts({
    status: "published",
    page: 1,
    limit: 20
  });

  const nowRfc822 = new Date().toUTCString();
  const itemsXml = posts
    .map((p: any) => {
      const pubDate = p.created_at ? new Date(p.created_at).toUTCString() : nowRfc822;
      const postUrl = `${site.site_url}/post/${p.slug}`;
      return `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${p.excerpt || ""}]]></description>
      ${p.author_name ? `<dc:creator><![CDATA[${p.author_name}]]></dc:creator>` : ""}
    </item>`;
    })
    .join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${site.site_name}]]></title>
    <link>${site.site_url}</link>
    <description><![CDATA[${site.site_description}]]></description>
    <language>zh-CN</language>
    <lastBuildDate>${nowRfc822}</lastBuildDate>
    <atom:link href="${site.site_url}/feed.xml" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;

  await setCachedResponse(c.env.CACHE_KV, cacheKey, rssXml, "application/xml; charset=utf-8", 7200);

  c.header("Content-Type", "application/xml; charset=utf-8");
  c.header("X-Edge-Cache", "MISS");
  return c.body(rssXml);
});

// Sitemap XML
feedRoutes.get("/sitemap.xml", async (c) => {
  const cacheKey = getSitemapCacheKey();
  const cached = await getCachedResponse(c.env.CACHE_KV, cacheKey);
  if (cached) {
    c.header("Content-Type", "application/xml; charset=utf-8");
    c.header("X-Edge-Cache", "HIT");
    return c.body(cached.body);
  }

  const blogDO = getBlogDOStub(c);
  const site = await (blogDO as any).getSiteOptions();
  const { posts } = await (blogDO as any).listPosts({
    status: "published",
    page: 1,
    limit: 1000
  });
  const categories = await (blogDO as any).listCategories();
  const tags = await (blogDO as any).listTags();

  let urls = `
  <url>
    <loc>${site.site_url}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${site.site_url}/archive</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

  for (const p of posts) {
    const lastMod = p.updated_at ? p.updated_at.split("T")[0] : "";
    urls += `
  <url>
    <loc>${site.site_url}/post/${p.slug}</loc>
    ${lastMod ? `<lastmod>${lastMod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
  }

  for (const cat of categories) {
    urls += `
  <url>
    <loc>${site.site_url}/category/${cat.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }

  for (const tag of tags) {
    urls += `
  <url>
    <loc>${site.site_url}/tag/${tag.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;

  await setCachedResponse(c.env.CACHE_KV, cacheKey, sitemapXml, "application/xml; charset=utf-8", 7200);

  c.header("Content-Type", "application/xml; charset=utf-8");
  c.header("X-Edge-Cache", "MISS");
  return c.body(sitemapXml);
});
