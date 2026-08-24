/**
 * Minimalist Dark Mode Styles & Custom Block Library Overrides
 * Lightweight bundle keeping Worker size minimal.
 */

export const THEME_DARK_CSS = `
:root {
  --wp--preset--color--primary: #38bdf8;
  --wp--preset--color--secondary: #818cf8;
  --wp--preset--color--background: #0d0f12;
  --wp--preset--color--surface: #161a20;
  --wp--preset--color--surface-hover: #202630;
  --wp--preset--color--border: #262c36;
  --wp--preset--color--text: #e2e8f0;
  --wp--preset--color--text-muted: #94a3b8;
  --wp--preset--color--text-dim: #64748b;
  --wp--preset--color--accent: #10b981;
  --wp--preset--color--danger: #ef4444;

  --wp--custom--layout--content-size: 780px;
  --wp--custom--layout--wide-size: 1100px;
  --wp--custom--font-family--sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --wp--custom--font-family--mono: "JetBrains Mono", "Fira Code", Consolas, Monaco, monospace;
}

*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  background-color: var(--wp--preset--color--background);
  color: var(--wp--preset--color--text);
  font-family: var(--wp--custom--font-family--sans);
  font-size: 16px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  color: var(--wp--preset--color--primary);
  text-decoration: none;
  transition: color 0.15s ease;
}

a:hover {
  color: #7dd3fc;
  text-decoration: underline;
}

.site-container {
  max-width: var(--wp--custom--layout--content-size);
  margin: 0 auto;
  padding: 0 20px;
}

.site-container-wide {
  max-width: var(--wp--custom--layout--wide-size);
  margin: 0 auto;
  padding: 0 20px;
}

/* Site Header */
.site-header {
  border-bottom: 1px solid var(--wp--preset--color--border);
  padding: 24px 0;
  margin-bottom: 40px;
  background: rgba(13, 15, 18, 0.85);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 50;
}

.site-header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.site-title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #f8fafc;
  margin: 0;
}

.site-title a {
  color: inherit;
  text-decoration: none;
}

.site-nav {
  display: flex;
  gap: 20px;
  align-items: center;
}

.site-nav a {
  color: var(--wp--preset--color--text-muted);
  font-size: 14px;
  font-weight: 500;
}

.site-nav a:hover {
  color: var(--wp--preset--color--text);
  text-decoration: none;
}

/* Post Cards in List */
.post-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.post-card {
  padding: 28px;
  background: var(--wp--preset--color--surface);
  border: 1px solid var(--wp--preset--color--border);
  border-radius: 12px;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.post-card:hover {
  border-color: #3b4252;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.post-card-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 12px 0;
  line-height: 1.35;
}

.post-card-title a {
  color: #f8fafc;
  text-decoration: none;
}

.post-card-title a:hover {
  color: var(--wp--preset--color--primary);
}

.post-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  font-size: 13px;
  color: var(--wp--preset--color--text-dim);
  margin-bottom: 14px;
}

.post-card-excerpt {
  color: var(--wp--preset--color--text-muted);
  font-size: 15px;
  margin: 0 0 16px 0;
}

.post-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge {
  display: inline-block;
  padding: 3px 10px;
  background: rgba(56, 189, 248, 0.1);
  color: var(--wp--preset--color--primary);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

/* Single Post */
.entry-header {
  margin-bottom: 32px;
}

.entry-title {
  font-size: 32px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: -0.03em;
  color: #f8fafc;
  margin: 0 0 16px 0;
}

.entry-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 14px;
  color: var(--wp--preset--color--text-dim);
  padding-bottom: 24px;
  border-bottom: 1px solid var(--wp--preset--color--border);
}

.entry-featured-image {
  margin: 24px 0;
  border-radius: 12px;
  overflow: hidden;
}

.entry-featured-image img {
  width: 100%;
  height: auto;
  display: block;
}

/* Gutenberg Block Content & Overrides */
.entry-content {
  font-size: 17px;
  line-height: 1.8;
  color: #cbd5e1;
}

.entry-content h1,
.entry-content h2,
.entry-content h3,
.entry-content h4 {
  color: #f8fafc;
  font-weight: 700;
  margin-top: 40px;
  margin-bottom: 16px;
  line-height: 1.3;
}

.entry-content h2 { font-size: 24px; }
.entry-content h3 { font-size: 20px; }

.entry-content p {
  margin: 0 0 24px 0;
}

.entry-content blockquote,
.wp-block-quote {
  border-left: 4px solid var(--wp--preset--color--primary);
  padding: 12px 20px;
  margin: 28px 0;
  background: var(--wp--preset--color--surface);
  border-radius: 0 8px 8px 0;
  color: #e2e8f0;
  font-style: normal;
}

.entry-content pre,
.wp-block-code {
  background: #14171d;
  border: 1px solid var(--wp--preset--color--border);
  border-radius: 8px;
  padding: 20px;
  overflow-x: auto;
  font-family: var(--wp--custom--font-family--mono);
  font-size: 14px;
  line-height: 1.6;
  margin: 28px 0;
}

.entry-content code {
  font-family: var(--wp--custom--font-family--mono);
  font-size: 0.9em;
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  color: #f1f5f9;
}

.entry-content pre code {
  background: transparent;
  padding: 0;
}

.entry-content img,
.wp-block-image img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.entry-content ul,
.entry-content ol {
  padding-left: 24px;
  margin-bottom: 24px;
}

.entry-content li {
  margin-bottom: 8px;
}

.entry-content table,
.wp-block-table table {
  width: 100%;
  border-collapse: collapse;
  margin: 28px 0;
  font-size: 15px;
}

.entry-content th,
.entry-content td,
.wp-block-table th,
.wp-block-table td {
  border: 1px solid var(--wp--preset--color--border);
  padding: 12px 16px;
  text-align: left;
}

.entry-content th,
.wp-block-table th {
  background: var(--wp--preset--color--surface);
  color: var(--wp--preset--color--text);
  font-weight: 600;
}

/* Comments Section */
.comments-section {
  margin-top: 60px;
  padding-top: 40px;
  border-top: 1px solid var(--wp--preset--color--border);
}

.comments-title {
  font-size: 22px;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 24px;
}

.comment-list {
  list-style: none;
  padding: 0;
  margin: 0 0 40px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  background: var(--wp--preset--color--surface);
  border: 1px solid var(--wp--preset--color--border);
  border-radius: 8px;
  padding: 20px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
}

.comment-author {
  font-weight: 600;
  color: #f1f5f9;
}

.comment-date {
  color: var(--wp--preset--color--text-dim);
  font-size: 12px;
}

.comment-body {
  font-size: 15px;
  color: var(--wp--preset--color--text);
}

.comment-form {
  background: var(--wp--preset--color--surface);
  border: 1px solid var(--wp--preset--color--border);
  border-radius: 12px;
  padding: 28px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--wp--preset--color--text-muted);
  margin-bottom: 6px;
}

.form-control {
  width: 100%;
  padding: 12px 14px;
  background: #0d0f12;
  border: 1px solid var(--wp--preset--color--border);
  border-radius: 6px;
  color: #f8fafc;
  font-family: inherit;
  font-size: 14px;
  transition: border-color 0.15s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--wp--preset--color--primary);
}

textarea.form-control {
  min-height: 100px;
  resize: vertical;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.btn-primary {
  background: #2563eb;
  color: #ffffff;
}

.btn-primary:hover {
  background: #1d4ed8;
  text-decoration: none;
}

/* Site Footer */
.site-footer {
  border-top: 1px solid var(--wp--preset--color--border);
  padding: 40px 0;
  margin-top: 80px;
  text-align: center;
  font-size: 13px;
  color: var(--wp--preset--color--text-dim);
}

.site-footer a {
  color: var(--wp--preset--color--text-muted);
}

.footer-custom {
  margin: 10px 0;
  line-height: 1.6;
}

.footer-custom a {
  color: var(--wp--preset--color--text-muted);
  margin: 0 4px;
}

.footer-custom a:hover {
  color: var(--wp--preset--color--primary);
  text-decoration: underline;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .site-header { padding: 16px 0; margin-bottom: 24px; }
  .entry-title { font-size: 26px; }
  .post-card { padding: 20px; }
  .comment-form { padding: 20px; }
}
`;
