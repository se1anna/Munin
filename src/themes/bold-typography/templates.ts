import { Post, Comment, SiteOptions } from "../../types/blog";
import { SinglePostRenderContext } from "../../types/theme";

export function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderHeader(site: SiteOptions): string {
  return `
    <header class="bt-header">
      <div class="site-container bt-header-inner">
        <div class="bt-brand">
          <a href="/" class="bt-brand-title">${escapeHtml(site.site_name)}</a>
          ${site.site_description ? `<span class="bt-brand-desc">${escapeHtml(site.site_description)}</span>` : ""}
        </div>
        <nav class="bt-nav">
          <a href="/" class="bt-nav-link">文章列表</a>
          <a href="/archives" class="bt-nav-link">归档时间线</a>
          <a href="/feed.xml" class="bt-nav-link" target="_blank">RSS 订阅</a>
          <a href="/admin" class="bt-nav-link">控制台</a>
        </nav>
      </div>
    </header>
  `;
}

export function renderPostCard(post: Post, index: number): string {
  const dateStr = post.created_at ? new Date(post.created_at).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }) : "";
  const padIndex = String(index + 1).padStart(2, "0");
  const categoriesHtml = (post.categories || [])
    .map((c) => `<a href="/category/${encodeURIComponent(c.slug)}" style="color:var(--bt-accent);">${escapeHtml(c.name)}</a>`)
    .join(" &middot; ");

  return `
    <article class="bt-post-card">
      <div class="bt-post-card-index">${padIndex} /</div>
      <div class="bt-post-card-body">
        <div class="bt-post-card-meta">
          <span>${dateStr}</span>
          ${categoriesHtml ? `<span>&middot;</span><span>${categoriesHtml}</span>` : ""}
        </div>
        <h2 class="bt-post-card-title">
          <a href="/post/${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a>
        </h2>
        ${post.excerpt ? `<p class="bt-post-card-excerpt">${escapeHtml(post.excerpt)}</p>` : ""}
        <a href="/post/${encodeURIComponent(post.slug)}" class="bt-btn-text">
          阅读全文 <span>&rarr;</span>
        </a>
      </div>
    </article>
  `;
}

export function renderPagination(currentPage: number, totalPages: number, basePath = ""): string {
  if (totalPages <= 1) return "";

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  const buildUrl = (p: number) => {
    if (basePath) {
      return p === 1 ? basePath : `${basePath}?page=${p}`;
    }
    return p === 1 ? "/" : `/?page=${p}`;
  };

  return `
    <nav class="bt-pagination">
      <div>
        ${
          prevPage
            ? `<a href="${buildUrl(prevPage)}" class="bt-page-link">&larr; 上一页</a>`
            : `<span style="color:var(--bt-border); font-family:var(--font-mono); font-size:13px; text-transform:uppercase; letter-spacing:0.15em;">&larr; 上一页</span>`
        }
      </div>
      <div class="bt-page-current">
        PAGE ${currentPage} OF ${totalPages}
      </div>
      <div>
        ${
          nextPage
            ? `<a href="${buildUrl(nextPage)}" class="bt-page-link">下一页 &rarr;</a>`
            : `<span style="color:var(--bt-border); font-family:var(--font-mono); font-size:13px; text-transform:uppercase; letter-spacing:0.15em;">下一页 &rarr;</span>`
        }
      </div>
    </nav>
  `;
}

export function renderCommentItem(comment: Comment): string {
  const dateStr = comment.created_at ? new Date(comment.created_at).toLocaleString("zh-CN") : "";
  const replies = (comment.replies || []).map(renderCommentItem).join("");

  return `
    <li class="bt-comment-item" id="comment-${comment.id}">
      <div class="bt-comment-meta">
        <span class="bt-comment-author">${escapeHtml(comment.author_name)}</span>
        <span>&middot;</span>
        <span>${dateStr}</span>
      </div>
      <div class="bt-comment-body">${escapeHtml(comment.content).replace(/\n/g, "<br/>")}</div>
      ${
        replies
          ? `<ul style="list-style:none; padding-left:24px; margin-top:20px; border-left:1px solid var(--bt-border); display:flex; flex-direction:column; gap:16px;">${replies}</ul>`
          : ""
      }
    </li>
  `;
}

export function renderSinglePost(ctx: SinglePostRenderContext): string {
  const { post, comments, site, turnstileSiteKey } = ctx;
  const dateStr = post.created_at ? new Date(post.created_at).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }) : "";
  const categoriesHtml = (post.categories || [])
    .map((c) => `<a href="/category/${encodeURIComponent(c.slug)}" style="color:var(--bt-accent);">${escapeHtml(c.name)}</a>`)
    .join(" &middot; ");

  const tagsHtml = (post.tags || [])
    .map((t) => `<a href="/tag/${encodeURIComponent(t.slug)}" style="display:inline-block; font-family:var(--font-mono); font-size:12px; text-transform:uppercase; letter-spacing:0.1em; padding:6px 12px; border:1px solid var(--bt-border); color:var(--bt-muted-fg); margin-right:8px; margin-bottom:8px;"># ${escapeHtml(t.name)}</a>`)
    .join("");

  const commentsList = (comments || []).map(renderCommentItem).join("\n");

  return `
    <main class="site-container">
      <article>
        <header class="bt-single-header">
          <div class="bt-single-meta-top">
            <span>POST ESSAY</span>
            ${categoriesHtml ? `<span>&middot;</span><span>${categoriesHtml}</span>` : ""}
          </div>
          <h1 class="bt-single-title">${escapeHtml(post.title)}</h1>
          <div class="bt-single-meta-bottom">
            <span>发布于 ${dateStr}</span>
            <span>&middot;</span>
            <span>作者: ${escapeHtml(post.author_name || site.site_name)}</span>
          </div>
        </header>

        <div class="bt-post-content">
          ${post.content_html}
        </div>

        ${
          tagsHtml
            ? `<div style="margin-top:48px; padding-top:24px; border-top:1px solid var(--bt-border); display:flex; flex-wrap:wrap; align-items:center;">
                <span style="font-family:var(--font-mono); font-size:12px; text-transform:uppercase; letter-spacing:0.15em; color:var(--bt-muted-fg); margin-right:16px; margin-bottom:8px;">标签:</span>
                ${tagsHtml}
              </div>`
            : ""
        }
      </article>

      ${
        site.allow_comments !== false
          ? `
        <section class="bt-comments-section">
          <div class="bt-comments-header">
            <h3 class="bt-comments-title">COMMENTS (${comments ? comments.length : 0})</h3>
            <span style="font-family:var(--font-mono); font-size:12px; letter-spacing:0.1em; color:var(--bt-muted-fg); text-transform:uppercase;">公开讨论区</span>
          </div>

          <form id="comment-form" onsubmit="return handleCommentSubmit(event)" style="margin-bottom:48px; background:var(--bt-card); padding:32px; border:1px solid var(--bt-border);">
            <h4 style="margin:0 0 20px 0; font-size:18px; font-weight:800; letter-spacing:-0.03em;">发表评论</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              <div>
                <input type="text" id="comment-author" class="bt-form-input" required placeholder="您的称呼 / 昵称 *" />
              </div>
              <div>
                <input type="email" id="comment-email" class="bt-form-input" required placeholder="电子邮箱 (严格保密) *" />
              </div>
            </div>
            <div>
              <textarea id="comment-content" class="bt-form-textarea" rows="4" required placeholder="撰写您的见解与评论 (支持换行)..."></textarea>
            </div>
            ${
              turnstileSiteKey
                ? `<div style="margin-bottom:16px;"><div class="cf-turnstile" data-sitekey="${turnstileSiteKey}" data-theme="dark" data-callback="tsCommentDone" data-expired-callback="tsCommentExpired" id="turnstile-comment"></div></div>`
                : ""
            }
            <button type="submit" class="bt-btn-outline" id="comment-submit-btn">
              提交评论 &rarr;
            </button>
            <div id="comment-msg" style="margin-top:12px; font-family:var(--font-mono); font-size:13px;"></div>
          </form>

          <ul style="list-style:none; padding:0; margin:0;">
            ${
              commentsList ||
              `<li style="color:var(--bt-muted-fg); font-family:var(--font-mono); font-size:14px; padding:24px 0; text-transform:uppercase; letter-spacing:0.1em;">暂无评论，欢迎发表首条见解。</li>`
            }
          </ul>
        </section>

        <script>
          window.__tsTokens = window.__tsTokens || {};
          function tsCommentDone(token)    { window.__tsTokens.comment = token; }
          function tsCommentExpired()      { window.__tsTokens.comment = ''; }

          async function handleCommentSubmit(e) {
            e.preventDefault();
            const btn = document.getElementById('comment-submit-btn');
            const msg = document.getElementById('comment-msg');
            const author_name = document.getElementById('comment-author').value.trim();
            const author_email = document.getElementById('comment-email').value.trim();
            const content = document.getElementById('comment-content').value.trim();
            const postId = ${JSON.stringify(post.id)};

            const turnstile_token = (window.__tsTokens && window.__tsTokens.comment) || '';

            btn.disabled = true;
            btn.innerText = '正在提交...';
            msg.innerText = '';

            try {
              const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: postId, author_name, author_email, content, turnstile_token })
              });
              const data = await res.json();
              if (res.ok) {
                msg.style.color = '#10b981';
                msg.innerText = '评论提交成功，审核通过后将公开展示。';
                document.getElementById('comment-content').value = '';
              } else {
                msg.style.color = '#FF3D00';
                msg.innerText = '提交失败: ' + (data.error || '未知错误');
              }
            } catch {
              msg.style.color = '#FF3D00';
              msg.innerText = '网络连接错误，请稍后重试';
            } finally {
              btn.disabled = false;
              btn.innerText = '提交评论';
            }
            return false;
          }
        </script>
      `
          : ""
      }
    </main>
  `;
}

export function renderFooter(site: SiteOptions, currentYear: number): string {
  return `
    <footer class="bt-footer">
      <div class="site-container bt-footer-inner">
        <div class="bt-footer-text">
          &copy; ${currentYear} ${escapeHtml(site.site_name)}. ALL RIGHTS RESERVED.
        </div>
        ${
          site.footer_html
            ? `<div class="bt-footer-text">${site.footer_html}</div>`
            : `<div class="bt-footer-text">POWERED BY CLOUDFLARE SERVERLESS</div>`
        }
      </div>
    </footer>
  `;
}
