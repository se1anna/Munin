import { KVNamespace } from "@cloudflare/workers-types";
import { BlogDO } from "../do/blog";
import { Env } from "../types/env";
import { getCachedResponse, setCachedResponse } from "../services/cache";
import {
  renderHomePageHtml,
  renderSinglePostPageHtml,
  renderArchivePageHtml,
  renderNotFoundPageHtml
} from "./theme";

export class SSREngine {
  constructor(
    private env: Env,
    private blogDO: BlogDO
  ) {}

  public async renderHome(page = 1): Promise<{ html: string; fromCache: boolean }> {
    const cacheKey = `v2:index:home:page:${page}`;

    // 1. Check KV Cache
    const cached = await getCachedResponse(this.env.CACHE_KV, cacheKey);
    if (cached) {
      return { html: cached.body, fromCache: true };
    }

    // 2. Cache Miss: Fetch from DO (Properly awaited RPC)
    const site = await this.blogDO.getSiteOptions();
    const { posts, totalPages } = await this.blogDO.listPosts({
      status: "published",
      page,
      limit: site.posts_per_page
    });

    const currentYear = new Date().getFullYear();
    const canonicalUrl = `${site.site_url}${page > 1 ? `?page=${page}` : ""}`;

    const html = renderHomePageHtml({
      site,
      pageTitle: page > 1 ? `第 ${page} 页` : "",
      canonicalUrl,
      posts,
      currentPage: page,
      totalPages,
      archiveTitle: "最新文章",
      currentYear,
      themeCSS: "",
      contentHtml: ""
    });

    // 3. Write to KV Cache (1 hour TTL)
    await setCachedResponse(this.env.CACHE_KV, cacheKey, html, "text/html; charset=utf-8", 3600);

    return { html, fromCache: false };
  }

  public async renderSinglePost(slug: string): Promise<{ html: string; fromCache: boolean; notFound?: boolean }> {
    const cacheKey = `v2:post:${slug}`;
    const notFoundCacheKey = `v2:404:post:${slug}`;

    // 1. Check Positive KV Cache
    const cached = await getCachedResponse(this.env.CACHE_KV, cacheKey);
    if (cached) {
      return { html: cached.body, fromCache: true };
    }

    // 2. Check Negative (404) Cache to prevent repeated DO wakeups on invalid slugs
    const cached404 = await getCachedResponse(this.env.CACHE_KV, notFoundCacheKey);
    if (cached404) {
      return { html: cached404.body, fromCache: true, notFound: true };
    }

    // 3. Cache Miss: Fetch from DO
    const site = await this.blogDO.getSiteOptions();
    const post = await this.blogDO.getPostBySlug(slug);

    if (!post || post.status !== "published") {
      const currentYear = new Date().getFullYear();
      const notFoundHtml = renderNotFoundPageHtml({
        site,
        pageTitle: "文章未找到",
        canonicalUrl: `${site.site_url}/post/${slug}`,
        currentYear,
        themeCSS: "",
        contentHtml: ""
      });

      // Negative cache for 120 seconds to protect DO from abusive 404 flooding
      await setCachedResponse(this.env.CACHE_KV, notFoundCacheKey, notFoundHtml, "text/html; charset=utf-8", 120);

      return { html: notFoundHtml, fromCache: false, notFound: true };
    }

    const comments = await this.blogDO.getCommentsByPostId(post.id, true);
    const currentYear = new Date().getFullYear();
    const canonicalUrl = `${site.site_url}/post/${slug}`;

    const html = renderSinglePostPageHtml({
      site,
      pageTitle: post.title,
      description: post.excerpt,
      canonicalUrl,
      post,
      comments,
      currentYear,
      themeCSS: "",
      turnstileSiteKey: this.env.TURNSTILE_SITE_KEY,
      contentHtml: ""
    });

    // Write to KV Cache (1 hour TTL)
    await setCachedResponse(this.env.CACHE_KV, cacheKey, html, "text/html; charset=utf-8", 3600);

    return { html, fromCache: false };
  }

  public async renderCategoryArchive(slug: string, page = 1): Promise<{ html: string; fromCache: boolean }> {
    const cacheKey = `v2:archive:category:${slug}:page:${page}`;

    const cached = await getCachedResponse(this.env.CACHE_KV, cacheKey);
    if (cached) {
      return { html: cached.body, fromCache: true };
    }

    const site = await this.blogDO.getSiteOptions();
    const { posts, totalPages } = await this.blogDO.listPosts({
      status: "published",
      categorySlug: slug,
      page,
      limit: site.posts_per_page
    });

    const currentYear = new Date().getFullYear();
    const canonicalUrl = `${site.site_url}/category/${slug}${page > 1 ? `?page=${page}` : ""}`;

    const html = renderArchivePageHtml(
      {
        site,
        pageTitle: `分类: ${slug}`,
        canonicalUrl,
        posts,
        currentPage: page,
        totalPages,
        archiveTitle: `分类归档: ${slug}`,
        archiveDescription: `关于 ${slug} 分类的精选文章`,
        currentYear,
        themeCSS: "",
        contentHtml: ""
      },
      `/category/${slug}`
    );

    await setCachedResponse(this.env.CACHE_KV, cacheKey, html, "text/html; charset=utf-8", 3600);
    return { html, fromCache: false };
  }

  public async renderTagArchive(slug: string, page = 1): Promise<{ html: string; fromCache: boolean }> {
    const cacheKey = `v2:archive:tag:${slug}:page:${page}`;

    const cached = await getCachedResponse(this.env.CACHE_KV, cacheKey);
    if (cached) {
      return { html: cached.body, fromCache: true };
    }

    const site = await this.blogDO.getSiteOptions();
    const { posts, totalPages } = await this.blogDO.listPosts({
      status: "published",
      tagSlug: slug,
      page,
      limit: site.posts_per_page
    });

    const currentYear = new Date().getFullYear();
    const canonicalUrl = `${site.site_url}/tag/${slug}${page > 1 ? `?page=${page}` : ""}`;

    const html = renderArchivePageHtml(
      {
        site,
        pageTitle: `标签: #${slug}`,
        canonicalUrl,
        posts,
        currentPage: page,
        totalPages,
        archiveTitle: `标签: #${slug}`,
        archiveDescription: `带有 #${slug} 标签的所有文章`,
        currentYear,
        themeCSS: "",
        contentHtml: ""
      },
      `/tag/${slug}`
    );

    await setCachedResponse(this.env.CACHE_KV, cacheKey, html, "text/html; charset=utf-8", 3600);
    return { html, fromCache: false };
  }

  public async renderAllArchive(): Promise<{ html: string; fromCache: boolean }> {
    const cacheKey = "v2:archive:all";
    const cached = await getCachedResponse(this.env.CACHE_KV, cacheKey);
    if (cached) {
      return { html: cached.body, fromCache: true };
    }

    const site = await this.blogDO.getSiteOptions();
    const { posts } = await this.blogDO.listPosts({
      status: "published",
      page: 1,
      limit: 100
    });

    const currentYear = new Date().getFullYear();
    const canonicalUrl = `${site.site_url}/archive`;

    const html = renderArchivePageHtml(
      {
        site,
        pageTitle: "全站归档",
        canonicalUrl,
        posts,
        currentPage: 1,
        totalPages: 1,
        archiveTitle: "全站归档",
        archiveDescription: `共 ${posts.length} 篇已发布文章`,
        currentYear,
        themeCSS: "",
        contentHtml: ""
      },
      "/archive"
    );

    await setCachedResponse(this.env.CACHE_KV, cacheKey, html, "text/html; charset=utf-8", 3600);
    return { html, fromCache: false };
  }
}
