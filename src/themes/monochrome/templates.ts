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
    <header class="mc-header">
      <div class="site-container mc-header-inner">
        <div>
          <a href="/" class="mc-brand-title">${escapeHtml(site.site_name)}</a>
          ${site.site_description ? `<span class="mc-brand-desc">${escapeHtml(site.site_description)}</span>` : ""}
        </div>
        <nav class="mc-nav">
          <a href="/" class="mc-nav-link">INDEX</a>
          <a href="/archives" class="mc-nav-link">ARCHIVES</a>
          <a href="/feed.xml" class="mc-nav-link" target="_blank">RSS</a>
          <a href="/admin" class="mc-nav-link">ADMIN</a>
        </nav>
      </div>
    </header>
  `;
}

export function renderPostCard(post: Post, index: number): string {
  const dateStr = post.created_at ? new Date(post.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }).toUpperCase() : "";
  const categoriesHtml = (post.categories || [])
    .map((c) => `<a href="/category/${encodeURIComponent(c.slug)}" style="color:var(--mc-fg); text-decoration:underline;">${escapeHtml(c.name)}</a>`)
    .join(", ");

  return `
    <article class="mc-post-card">
      <div class="mc-post-card-meta">
        <span>${dateStr}</span>
        ${categoriesHtml ? `<span>&mdash;</span><span>${categoriesHtml}</span>` : ""}
      </div>
      <h2 class="mc-post-card-title">
        <a href="/post/${encodeURIComponent(post.slug)}">${escapeHtml(post.title)}</a>
      </h2>
      ${post.excerpt ? `<p class="mc-post-card-excerpt">${escapeHtml(post.excerpt)}</p>` : ""}
      <div style="margin-top:8px;">
        <a href="/post/${encodeURIComponent(post.slug)}" class="mc-btn-primary">
          READ ESSAY &rarr;
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
    <nav class="mc-pagination">
      <div>
        ${
          prevPage
            ? `<a href="${buildUrl(prevPage)}" class="mc-page-link">&larr; PREVIOUS</a>`
            : `<span style="color:var(--mc-muted-fg); font-family:var(--font-mono); font-size:12px; letter-spacing:0.15em;">&larr; PREVIOUS</span>`
        }
      </div>
      <div style="font-family:var(--font-mono); font-size:12px; letter-spacing:0.15em;">
        FOLIO ${currentPage} OF ${totalPages}
      </div>
      <div>
        ${
          nextPage
            ? `<a href="${buildUrl(nextPage)}" class="mc-page-link">NEXT &rarr;</a>`
            : `<span style="color:var(--mc-muted-fg); font-family:var(--font-mono); font-size:12px; letter-spacing:0.15em;">NEXT &rarr;</span>`
        }
      </div>
    </nav>
  `;
}

export function renderCommentItem(comment: Comment): string {
  const dateStr = comment.created_at ? new Date(comment.created_at).toLocaleString("zh-CN") : "";
  const replies = (comment.replies || []).map(renderCommentItem).join("");

  return `
    <li style="padding:20px 0; border-bottom:1px solid var(--mc-border-light);" id="comment-${comment.id}">
      <div style="font-family:var(--font-mono); font-size:12px; text-transform:uppercase; letter-spacing:0.1em; color:var(--mc-muted-fg); margin-bottom:6px; display:flex; gap:12px;">
        <span style="font-weight:700; color:var(--mc-fg);">${escapeHtml(comment.author_name)}</span>
        <span>&middot;</span>
        <span>${dateStr}</span>
      </div>
      <div style="font-size:15px; color:#222222; line-height:1.6;">${escapeHtml(comment.content).replace(/\n/g, "<br/>")}</div>
      ${
        replies
          ? `<ul style="list-style:none; padding-left:24px; margin-top:16px; border-left:2px solid var(--mc-border); display:flex; flex-direction:column; gap:12px;">${replies}</ul>`
          : ""
      }
    </li>
  `;
}

export function renderSinglePost(ctx: SinglePostRenderContext): string {
  const { post, comments, site, turnstileSiteKey } = ctx;
  const dateStr = post.created_at ? new Date(post.created_at).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }) : "";
  const categoriesHtml = (post.categories || [])
    .map((c) => `<a href="/category/${encodeURIComponent(c.slug)}" style="color:var(--mc-fg); text-decoration:underline;">${escapeHtml(c.name)}</a>`)
    .join(", ");

  const tagsHtml = (post.tags || [])
    .map((t) => `<a href="/tag/${encodeURIComponent(t.slug)}" style="display:inline-block; font-family:var(--font-mono); font-size:11px; text-transform:uppercase; letter-spacing:0.1em; padding:4px 10px; border:1px solid var(--mc-border); color:var(--mc-fg); margin-right:8px; margin-bottom:8px;"># ${escapeHtml(t.name)}</a>`)
    .join("");

  const commentsList = (comments || []).map(renderCommentItem).join("\n");

  return `
    <main class="site-container">
      <article>
        <header class="mc-single-header">
          <div style="font-family:var(--font-mono); font-size:12px; text-transform:uppercase; letter-spacing:0.2em; color:var(--mc-muted-fg); margin-bottom:16px;">
            <span>ESSAY PUBLICATION</span>
            ${categoriesHtml ? `<span>&mdash;</span><span>${categoriesHtml}</span>` : ""}
          </div>
          <h1 class="mc-single-title">${escapeHtml(post.title)}</h1>
          <div style="font-family:var(--font-mono); font-size:13px; color:var(--mc-muted-fg); display:flex; flex-wrap:wrap; gap:16px;">
            <span>${dateStr}</span>
            <span>&middot;</span>
            <span>WRITTEN BY ${escapeHtml(post.author_name || site.site_name).toUpperCase()}</span>
          </div>
        </header>

        <div class="mc-post-content">
          ${post.content_html}
        </div>

        ${
          tagsHtml
            ? `<div style="margin-top:48px; padding-top:24px; border-top:2px solid var(--mc-border); display:flex; flex-wrap:wrap; align-items:center;">
                <span style="font-family:var(--font-mono); font-size:12px; text-transform:uppercase; letter-spacing:0.15em; color:var(--mc-muted-fg); margin-right:16px; margin-bottom:8px;">TAGS:</span>
                ${tagsHtml}
              </div>`
            : ""
        }
      </article>

      ${
        site.allow_comments !== false
          ? `
        <section class="mc-comments-section">
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:32px;">
            <h3 style="font-size:26px; margin:0;">DISCUSSION (${comments ? comments.length : 0})</h3>
            <span style="font-family:var(--font-mono); font-size:12px; letter-spacing:0.1em; color:var(--mc-muted-fg);">PUBLIC FORUM</span>
          </div>

          <form id="comment-form" onsubmit="return handleCommentSubmit(event)" style="margin-bottom:48px; border:2px solid var(--mc-border); padding:28px;">
            <h4 style="margin:0 0 16px 0; font-size:18px;">LEAVE A RESPONSE</h4>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              <div>
                <input type="text" id="comment-author" class="mc-form-input" required placeholder="NAME / PSEUDONYM *" />
              </div>
              <div>
                <input type="email" id="comment-email" class="mc-form-input" required placeholder="EMAIL (CONFIDENTIAL) *" />
              </div>
            </div>
            <div>
              <textarea id="comment-content" class="mc-form-textarea" rows="4" required placeholder="COMPOSE YOUR THOUGHTS..."></textarea>
            </div>
            ${
              turnstileSiteKey
                ? `<div style="margin-bottom:16px;"><div class="cf-turnstile" data-sitekey="${turnstileSiteKey}" data-theme="light" data-callback="tsCommentDone" data-expired-callback="tsCommentExpired" id="turnstile-comment"></div></div>`
                : ""
            }
            <button type="submit" class="mc-btn-primary" id="comment-submit-btn">
              SUBMIT RESPONSE &rarr;
            </button>
            <div id="comment-msg" style="margin-top:12px; font-family:var(--font-mono); font-size:13px;"></div>
          </form>

          <ul style="list-style:none; padding:0; margin:0;">
            ${
              commentsList ||
              `<li style="color:var(--mc-muted-fg); font-family:var(--font-mono); font-size:13px; padding:24px 0; letter-spacing:0.1em;">NO RESPONSES RECORDED.</li>`
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
            btn.innerText = 'SUBMITTING...';
            msg.innerText = '';

            try {
              const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: postId, author_name, author_email, content, turnstile_token })
              });
              const data = await res.json();
              if (res.ok) {
                msg.style.color = '#000000';
                msg.innerText = 'Response submitted successfully.';
                document.getElementById('comment-content').value = '';
              } else {
                msg.style.color = '#ef4444';
                msg.innerText = 'Error: ' + (data.error || 'Submission failed');
              }
            } catch {
              msg.style.color = '#ef4444';
              msg.innerText = 'Network error.';
            } finally {
              btn.disabled = false;
              btn.innerText = 'SUBMIT RESPONSE';
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
    <footer class="mc-footer">
      <div class="site-container mc-footer-inner">
        <div class="mc-footer-text">
          &copy; ${currentYear} ${escapeHtml(site.site_name)}. MONOCHROME EDITION.
        </div>
        ${
          site.footer_html
            ? `<div class="mc-footer-text">${site.footer_html}</div>`
            : `<div class="mc-footer-text">DESIGN AS DISCIPLINE</div>`
        }
      </div>
    </footer>
  `;
}
