import { PageRenderContext, SinglePostRenderContext, ArchiveRenderContext } from "../types/theme";
import { GUTENBERG_CDN_CSS } from "./gutenberg";
import { getThemePackage } from "../themes";
import { escapeHtml } from "../themes/default-dark/templates";

export { escapeHtml };

export function renderFullHtmlPage(ctx: PageRenderContext): string {
  const themePkg = getThemePackage(ctx.site.active_theme);
  const themeCss = ctx.themeCSS || themePkg.css;
  const title = ctx.pageTitle
    ? `${escapeHtml(ctx.pageTitle)} - ${escapeHtml(ctx.site.site_name)}`
    : escapeHtml(ctx.site.site_name);
  const description = ctx.description || ctx.site.site_description || "";
  const ogImage = ctx.ogImage || "";

  const cdnLinks = GUTENBERG_CDN_CSS.map(
    (url) => `<link rel="stylesheet" href="${url}" />`
  ).join("\n  ");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(ctx.canonicalUrl)}" />

  <!-- OpenGraph & Twitter Cards -->
  <meta property="og:site_name" content="${escapeHtml(ctx.site.site_name)}" />
  <meta property="og:title" content="${escapeHtml(ctx.pageTitle || ctx.site.site_name)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(ctx.canonicalUrl)}" />
  <meta property="og:type" content="article" />
  ${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : ""}
  <meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}" />
  <meta name="twitter:title" content="${escapeHtml(ctx.pageTitle || ctx.site.site_name)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />

  <!-- Favicons & Touch Icons -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  <link rel="icon" type="image/x-icon" sizes="16x16" href="/favicon/head-16x16.ico" />
  <link rel="icon" type="image/x-icon" sizes="32x32" href="/favicon/head-32x32.ico" />
  <link rel="icon" type="image/x-icon" sizes="48x48" href="/favicon/head-48x48.ico" />
  <link rel="icon" type="image/x-icon" sizes="64x64" href="/favicon/head-64x64.ico" />
  <link rel="apple-touch-icon" sizes="128x128" href="/favicon/head-128x128.ico" />

  <!-- RSS & Feed -->
  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(ctx.site.site_name)}" href="/feed.xml" />
  <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml" />

  <!-- Gutenberg Base Styles via High-Availability CDN -->
  ${cdnLinks}

  <!-- Theme Stylesheet -->
  <style>
${themeCss}
  </style>

  ${ctx.headExtra || ""}
</head>
<body>
  ${themePkg.templates.renderHeader(ctx.site)}
  ${ctx.contentHtml}
  ${themePkg.templates.renderFooter(ctx.site, ctx.currentYear)}
</body>
</html>`;
}

export function renderHomePageHtml(ctx: ArchiveRenderContext): string {
  const themePkg = getThemePackage(ctx.site.active_theme);

  const postCards =
    ctx.posts.length > 0
      ? ctx.posts.map((post, idx) => themePkg.templates.renderPostCard(post, idx)).join("\n")
      : `<div class="post-card" style="padding:48px 0; border-bottom:1px solid #262626;"><p style="color:#737373; margin:0; font-family:var(--font-mono); text-transform:uppercase; letter-spacing:0.1em;">暂无发布的文章。</p></div>`;

  const paginationHtml = themePkg.templates.renderPagination(ctx.currentPage, ctx.totalPages, "");

  const contentHtml = `
    <main class="site-container" style="padding-top: 20px; padding-bottom: 60px;">
      <div class="bt-post-list post-list">
        ${postCards}
      </div>
      ${paginationHtml}
    </main>
  `;

  return renderFullHtmlPage({
    ...ctx,
    contentHtml
  });
}

export function renderArchivePageHtml(ctx: ArchiveRenderContext, basePath: string): string {
  const themePkg = getThemePackage(ctx.site.active_theme);
  const isBoldTypography = themePkg.meta.id === "bold-typography";

  const postCards =
    ctx.posts.length > 0
      ? ctx.posts.map((post, idx) => themePkg.templates.renderPostCard(post, idx)).join("\n")
      : `<div class="post-card" style="padding:48px 0;"><p style="color:#737373; margin:0; font-family:var(--font-mono);">暂无相关文章。</p></div>`;

  const paginationHtml = themePkg.templates.renderPagination(ctx.currentPage, ctx.totalPages, basePath);

  const headerHtml = isBoldTypography
    ? `
      <header style="padding: 60px 0 36px 0; border-bottom: 1px solid var(--bt-border); margin-bottom: 40px;">
        <div style="font-family:var(--font-mono); font-size:12px; text-transform:uppercase; letter-spacing:0.2em; color:var(--bt-accent); margin-bottom:12px;">ARCHIVE COLLECTION</div>
        <h1 style="font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 900; letter-spacing: -0.05em; margin: 0 0 8px 0; color: #FAFAFA;">${escapeHtml(ctx.archiveTitle)}</h1>
        ${ctx.archiveDescription ? `<p style="color:#737373; margin:0; font-size:15px; max-width:600px;">${escapeHtml(ctx.archiveDescription)}</p>` : ""}
      </header>
    `
    : `
      <header style="margin-bottom: 36px; padding-bottom: 20px; border-bottom: 1px solid var(--wp--preset--color--border);">
        <h1 style="font-size: 26px; font-weight: 700; margin: 0 0 8px 0; color: #f8fafc;">${escapeHtml(ctx.archiveTitle)}</h1>
        ${ctx.archiveDescription ? `<p style="color:#94a3b8; margin:0; font-size:14px;">${escapeHtml(ctx.archiveDescription)}</p>` : ""}
      </header>
    `;

  const contentHtml = `
    <main class="site-container">
      ${headerHtml}
      <div class="bt-post-list post-list">
        ${postCards}
      </div>
      ${paginationHtml}
    </main>
  `;

  return renderFullHtmlPage({
    ...ctx,
    contentHtml
  });
}

export function renderSinglePostPageHtml(ctx: SinglePostRenderContext): string {
  const themePkg = getThemePackage(ctx.site.active_theme);
  const turnstileScript = ctx.turnstileSiteKey
    ? `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" defer></script>`
    : "";

  const contentHtml = themePkg.templates.renderSinglePost(ctx);

  return renderFullHtmlPage({
    ...ctx,
    ogImage: ctx.post.featured_image || ctx.ogImage,
    headExtra: turnstileScript,
    contentHtml
  });
}

export function renderNotFoundPageHtml(ctx: PageRenderContext): string {
  const themePkg = getThemePackage(ctx.site.active_theme);
  const isBoldTypography = themePkg.meta.id === "bold-typography";

  const contentHtml = isBoldTypography
    ? `
      <main class="site-container" style="text-align: center; padding: 120px 24px;">
        <div style="font-family:var(--font-mono); font-size:13px; text-transform:uppercase; letter-spacing:0.2em; color:var(--bt-accent); margin-bottom:16px;">ERROR 404 &middot; PAGE NOT FOUND</div>
        <h1 style="font-size: clamp(3.5rem, 10vw, 8rem); font-weight: 900; letter-spacing: -0.06em; margin: 0 0 24px 0; color: #FAFAFA; line-height: 0.95;">OUT OF BOUNDS.</h1>
        <p style="color: #737373; max-width: 480px; margin: 0 auto 36px auto; font-size: 16px;">抱歉，您访问的页面不存在或已被移除。</p>
        <a href="/" class="bt-btn-outline">返回首页 &rarr;</a>
      </main>
    `
    : `
      <main class="site-container" style="text-align: center; padding: 80px 20px;">
        <h1 style="font-size: 72px; font-weight: 900; margin: 0; color: #38bdf8; line-height: 1;">404</h1>
        <h2 style="font-size: 24px; margin: 20px 0; color: #f8fafc;">页面未找到</h2>
        <p style="color: #94a3b8; max-width: 460px; margin: 0 auto 30px auto;">抱歉，您访问的页面可能已被移动、删除或链接输入有误。</p>
        <a href="/" class="btn btn-primary">返回首页</a>
      </main>
    `;

  return renderFullHtmlPage({
    ...ctx,
    contentHtml
  });
}
