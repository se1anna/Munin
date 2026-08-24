import { Post, Comment, Category, Tag, SiteOptions } from "../../types/blog";
import { SinglePostRenderContext, ArchiveRenderContext, PageRenderContext } from "../../types/theme";

export function renderHeader(site: SiteOptions): string {
  return `
    <header class="site-header">
      <div class="site-container site-header-inner">
        <h1 class="site-title"><a href="/">${escapeHtml(site.site_name)}</a></h1>
        <nav class="site-nav">
          <a href="/">首页</a>
          <a href="/archive">归档</a>
          <a href="/feed.xml" target="_blank" rel="noopener">订阅</a>
          <a href="/admin">管理</a>
        </nav>
      </div>
    </header>
  `;
}

export function renderFooter(site: SiteOptions, currentYear: number): string {
  const customFooter = site.footer_html ? `<div class="footer-custom">${site.footer_html}</div>` : "";
  return `
    <footer class="site-footer">
      <div class="site-container">
        <p>${escapeHtml(site.site_description)}</p>
        ${customFooter}
        <p>&copy; ${currentYear} ${escapeHtml(site.site_name)} &middot; 由 Cloudflare Serverless 与 Hono 驱动 &middot; <a href="/sitemap.xml">站点地图</a> &middot; <a href="/feed.xml">RSS 订阅</a></p>
      </div>
    </footer>
  `;
}

export function renderPostCard(post: Post): string {
  const dateStr = post.created_at ? new Date(post.created_at).toLocaleDateString("zh-CN") : "";
  const cats = (post.categories || [])
    .map((c) => `<a href="/category/${c.slug}" class="badge">${escapeHtml(c.name)}</a>`)
    .join(" ");

  return `
    <article class="post-card">
      <h2 class="post-card-title">
        <a href="/post/${post.slug}">${escapeHtml(post.title)}</a>
      </h2>
      <div class="post-card-meta">
        <span>${dateStr}</span>
        ${post.author_name ? `<span>&middot;</span><span>${escapeHtml(post.author_name)}</span>` : ""}
      </div>
      <p class="post-card-excerpt">${escapeHtml(post.excerpt || "")}</p>
      ${cats ? `<div class="post-card-tags">${cats}</div>` : ""}
    </article>
  `;
}

export function renderPagination(currentPage: number, totalPages: number, basePath = ""): string {
  if (totalPages <= 1) return "";

  let html = `<div style="display:flex; justify-content:center; gap:12px; margin-top:40px;">`;
  if (currentPage > 1) {
    const prevUrl = currentPage === 2 ? `${basePath || "/"}` : `${basePath}?page=${currentPage - 1}`;
    html += `<a href="${prevUrl}" class="btn" style="background:#1e293b; color:#e2e8f0;">上一页</a>`;
  }

  html += `<span style="display:flex; align-items:center; font-size:14px; color:#94a3b8;">第 ${currentPage} / ${totalPages} 页</span>`;

  if (currentPage < totalPages) {
    const nextUrl = `${basePath}?page=${currentPage + 1}`;
    html += `<a href="${nextUrl}" class="btn" style="background:#1e293b; color:#e2e8f0;">下一页</a>`;
  }
  html += `</div>`;
  return html;
}

export function renderCommentItem(comment: Comment): string {
  const dateStr = comment.created_at ? new Date(comment.created_at).toLocaleString("zh-CN") : "";
  const replies = (comment.replies || []).map(renderCommentItem).join("");

  return `
    <li class="comment-item" id="comment-${comment.id}">
      <div class="comment-header">
        <span class="comment-author">${escapeHtml(comment.author_name)}</span>
        <span class="comment-date">${dateStr}</span>
      </div>
      <div class="comment-body">${escapeHtml(comment.content).replace(/\n/g, "<br/>")}</div>
      ${
        replies
          ? `<ul style="list-style:none; padding-left:20px; margin-top:16px; display:flex; flex-direction:column; gap:14px;">${replies}</ul>`
          : ""
      }
    </li>
  `;
}

export function renderSinglePost(ctx: SinglePostRenderContext): string {
  const { post, comments, site, turnstileSiteKey } = ctx;
  const dateStr = post.created_at ? new Date(post.created_at).toLocaleDateString("zh-CN") : "";
  const cats = (post.categories || [])
    .map((c) => `<a href="/category/${c.slug}" class="badge">${escapeHtml(c.name)}</a>`)
    .join(" ");
  const tags = (post.tags || [])
    .map((t) => `<a href="/tag/${t.slug}" class="badge" style="background:rgba(129,140,248,0.1); color:#818cf8; border-color:rgba(129,140,248,0.2);">#${escapeHtml(t.name)}</a>`)
    .join(" ");

  const commentsListHtml =
    comments && comments.length > 0
      ? `<ul class="comment-list">${comments.map(renderCommentItem).join("")}</ul>`
      : `<p style="color:#64748b; font-size:14px; margin-bottom:30px;">暂无评论，快来抢沙发吧。</p>`;

  const turnstileWidget = turnstileSiteKey
    ? `<div style="margin-bottom: 16px;"><div class="cf-turnstile" data-sitekey="${turnstileSiteKey}" data-theme="dark" data-callback="tsCommentDone" data-expired-callback="tsCommentExpired" id="turnstile-comment"></div></div>`
    : "";

  return `
    <main class="site-container">
      <article>
        <header class="entry-header">
          <h1 class="entry-title">${escapeHtml(post.title)}</h1>
          <div class="entry-meta">
            <span>发布于 ${dateStr}</span>
            ${post.author_name ? `<span>&middot;</span><span>作者: ${escapeHtml(post.author_name)}</span>` : ""}
          </div>
          ${cats || tags ? `<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:14px;">${cats} ${tags}</div>` : ""}
        </header>

        ${
          post.featured_image
            ? `<div class="entry-featured-image"><img src="${escapeHtml(post.featured_image)}" alt="${escapeHtml(post.title)}" loading="lazy" /></div>`
            : ""
        }

        <div class="entry-content">
          ${post.content_html}
        </div>
      </article>

      <section class="comments-section" id="comments">
        <h3 class="comments-title">评论互动 (${comments ? comments.length : 0})</h3>
        ${commentsListHtml}

        <div class="comment-form">
          <h4 style="margin-top:0; margin-bottom:18px; color:#f8fafc; font-size:18px;">发表评论</h4>
          <form id="comment-form" onsubmit="return submitComment(event)">
            <input type="hidden" name="post_id" value="${post.id}" />
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
              <div class="form-group">
                <label for="author_name">昵称 *</label>
                <input type="text" id="author_name" name="author_name" class="form-control" required placeholder="您的称呼" />
              </div>
              <div class="form-group">
                <label for="author_email">邮箱 * (保密)</label>
                <input type="email" id="author_email" name="author_email" class="form-control" required placeholder="用于接收回复通知" />
              </div>
            </div>
            <div class="form-group">
              <label for="comment_content">内容 *</label>
              <textarea id="comment_content" name="content" class="form-control" required placeholder="友善交流，支持换行..."></textarea>
            </div>
            ${turnstileWidget}
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <button type="submit" class="btn btn-primary" id="submit-comment-btn">提交评论</button>
              <span id="comment-msg" style="font-size:13px; color:#10b981; margin-left:12px;"></span>
            </div>
          </form>
        </div>
      </section>
    </main>

    <script>
      window.__tsTokens = window.__tsTokens || {};
      function tsCommentDone(token)    { window.__tsTokens.comment = token; }
      function tsCommentExpired()      { window.__tsTokens.comment = ''; }

      async function submitComment(e) {
        e.preventDefault();
        const form = e.target;
        const btn = document.getElementById('submit-comment-btn');
        const msg = document.getElementById('comment-msg');
        btn.disabled = true;
        btn.innerText = '提交中...';
        msg.innerText = '';

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        // Get turnstile token via callback (token is inside cross-origin iframe)
        data.turnstile_token = (window.__tsTokens && window.__tsTokens.comment) || '';

        try {
          const res = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          const result = await res.json();
          if (res.ok) {
            msg.style.color = '#10b981';
            msg.innerText = '评论发表成功，页面即将刷新';
            form.reset();
            setTimeout(() => location.reload(), 1200);
          } else {
            msg.style.color = '#ef4444';
            msg.innerText = result.error || '提交失败，请重试';
            btn.disabled = false;
            btn.innerText = '提交评论';
          }
        } catch (err) {
          msg.style.color = '#ef4444';
          msg.innerText = '网络错误，请稍后再试';
          btn.disabled = false;
          btn.innerText = '提交评论';
        }
        return false;
      }
    </script>
  `;
}

export function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
