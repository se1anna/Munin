/**
 * Bold Typography Design System Stylesheet
 * Poster-style editorial typography translated to the web.
 * - Massive display headlines with tight letter-spacing
 * - Zero border-radius (sharp geometric edges throughout)
 * - Vermillion (#FF3D00) accent with warm white (#FAFAFA) on deep black (#0A0A0A)
 * - Text-only buttons with animated underlines
 * - Playfair Display serif pullquotes
 * - JetBrains Mono data & meta tags
 */

export const BOLD_TYPOGRAPHY_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400;1,600&display=swap');

:root {
  --bt-bg: #0A0A0A;
  --bt-fg: #FAFAFA;
  --bt-muted: #1A1A1A;
  --bt-muted-fg: #737373;
  --bt-accent: #FF3D00;
  --bt-accent-hover: #E03500;
  --bt-accent-fg: #0A0A0A;
  --bt-border: #262626;
  --bt-border-hover: #404040;
  --bt-card: #0F0F0F;
  --bt-input: #141414;

  --wp--preset--color--primary: var(--bt-accent);
  --wp--preset--color--secondary: #FAFAFA;
  --wp--preset--color--background: var(--bt-bg);
  --wp--preset--color--surface: var(--bt-card);
  --wp--preset--color--border: var(--bt-border);
  --wp--preset--color--text: var(--bt-fg);
  --wp--preset--color--text-muted: var(--bt-muted-fg);

  --font-sans: "Inter Tight", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-display: "Playfair Display", Georgia, "Times New Roman", serif;
  --font-mono: "JetBrains Mono", "Fira Code", Menlo, monospace;

  --wp--custom--layout--content-size: 860px;
  --wp--custom--layout--wide-size: 1200px;
}

*, *::before, *::after {
  box-sizing: border-box;
  border-radius: 0 !important; /* Zero radius everywhere: sharp edges match sharp typography */
}

html {
  background-color: var(--bt-bg);
  color: var(--bt-fg);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  scroll-behavior: smooth;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--bt-bg);
  color: var(--bt-fg);
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Subtle fractal tactile noise texture overlay (1.5% opacity) */
body::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

/* Containers */
.site-container {
  max-width: var(--wp--custom--layout--content-size);
  margin: 0 auto;
  padding: 0 24px;
  width: 100%;
}

.site-container-wide {
  max-width: var(--wp--custom--layout--wide-size);
  margin: 0 auto;
  padding: 0 24px;
  width: 100%;
}

/* Typography Base */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-sans);
  font-weight: 800;
  color: var(--bt-fg);
  line-height: 1.1;
  letter-spacing: -0.04em;
  margin-top: 2em;
  margin-bottom: 0.6em;
}

h1 {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 1.05;
}

h2 {
  font-size: clamp(2rem, 4.5vw, 3rem);
  letter-spacing: -0.04em;
}

h3 {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  letter-spacing: -0.03em;
}

p {
  margin-top: 0;
  margin-bottom: 1.5em;
  color: #D4D4D4;
}

a {
  color: inherit;
  text-decoration: none;
  transition: color 150ms ease;
}

/* Header */
.bt-header {
  border-bottom: 1px solid var(--bt-border);
  padding: 32px 0;
  background-color: var(--bt-bg);
  position: sticky;
  top: 0;
  z-index: 100;
}

.bt-header-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bt-brand {
  display: flex;
  flex-direction: column;
}

.bt-brand-title {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.05em;
  text-transform: uppercase;
  color: var(--bt-fg);
  margin: 0;
}

.bt-brand-desc {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--bt-muted-fg);
  margin-top: 4px;
}

.bt-nav {
  display: flex;
  align-items: center;
  gap: 28px;
}

.bt-nav-link {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--bt-muted-fg);
  position: relative;
  padding: 4px 0;
  transition: color 150ms ease;
}

.bt-nav-link:hover, .bt-nav-link.active {
  color: var(--bt-fg);
}

.bt-nav-link::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--bt-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 150ms cubic-bezier(0.25, 0, 0, 1);
}

.bt-nav-link:hover::after, .bt-nav-link.active::after {
  transform: scaleX(1);
}

/* Post Hero Statement (Home) */
.bt-hero-statement {
  padding: 80px 0 60px 0;
  border-bottom: 1px solid var(--bt-border);
  margin-bottom: 60px;
}

.bt-hero-label {
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--bt-accent);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.bt-hero-label::before {
  content: "";
  display: inline-block;
  width: 24px;
  height: 2px;
  background-color: var(--bt-accent);
}

.bt-hero-title {
  font-size: clamp(2.5rem, 7vw, 5.5rem);
  font-weight: 900;
  letter-spacing: -0.06em;
  line-height: 1.02;
  margin: 0 0 24px 0;
  color: var(--bt-fg);
}

.bt-hero-sub {
  font-size: clamp(1.125rem, 2vw, 1.35rem);
  color: var(--bt-muted-fg);
  max-width: 680px;
  line-height: 1.5;
  margin: 0;
}

/* Post List & Cards */
.bt-post-list {
  display: flex;
  flex-direction: column;
}

.bt-post-card {
  padding: 48px 0;
  border-bottom: 1px solid var(--bt-border);
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 32px;
  transition: border-color 150ms ease;
  position: relative;
}

.bt-post-card:hover {
  border-color: var(--bt-border-hover);
}

.bt-post-card-index {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 700;
  color: var(--bt-accent);
  letter-spacing: 0.05em;
  padding-top: 6px;
}

.bt-post-card-body {
  display: flex;
  flex-direction: column;
}

.bt-post-card-meta {
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--bt-muted-fg);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.bt-post-card-title {
  font-size: clamp(1.75rem, 3.5vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.15;
  margin: 0 0 16px 0;
}

.bt-post-card-title a {
  color: var(--bt-fg);
  transition: color 150ms ease;
}

.bt-post-card-title a:hover {
  color: var(--bt-accent);
}

.bt-post-card-excerpt {
  font-size: 16px;
  color: var(--bt-muted-fg);
  line-height: 1.6;
  margin: 0 0 20px 0;
  max-width: 720px;
}

/* Button: Text-only with animated vermillion underline */
.bt-btn-text {
  align-self: flex-start;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--bt-accent);
  position: relative;
  padding-bottom: 4px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  background: none;
  border: none;
}

.bt-btn-text::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--bt-accent);
  transform: scaleX(1);
  transform-origin: left;
  transition: transform 150ms cubic-bezier(0.25, 0, 0, 1);
}

.bt-btn-text:hover::after {
  transform: scaleX(1.15);
}

.bt-btn-outline {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 12px 24px;
  border: 1px solid var(--bt-fg);
  background: transparent;
  color: var(--bt-fg);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease;
}

.bt-btn-outline:hover {
  background: var(--bt-fg);
  color: var(--bt-bg);
}

/* Single Post View */
.bt-single-header {
  padding: 60px 0 40px 0;
  border-bottom: 1px solid var(--bt-border);
  margin-bottom: 48px;
}

.bt-single-meta-top {
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--bt-accent);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.bt-single-title {
  font-size: clamp(2.5rem, 6vw, 4.75rem);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 1.05;
  margin: 0 0 28px 0;
  color: var(--bt-fg);
}

.bt-single-meta-bottom {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--bt-muted-fg);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
}

.bt-post-content {
  font-size: 18px;
  line-height: 1.75;
  color: #E5E5E5;
}

.bt-post-content h2 {
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  margin-top: 2.2em;
  margin-bottom: 0.6em;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--bt-border);
}

.bt-post-content h3 {
  font-size: clamp(1.35rem, 2.5vw, 1.85rem);
  margin-top: 1.8em;
}

/* Gutenberg Quotes with Playfair Serif */
blockquote, .wp-block-quote, .wp-block-pullquote {
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 2.5vw, 1.65rem);
  font-style: italic;
  line-height: 1.45;
  color: var(--bt-fg);
  border-left: 3px solid var(--bt-accent);
  padding: 16px 0 16px 28px;
  margin: 40px 0;
  background: transparent;
}

blockquote cite, .wp-block-quote cite {
  display: block;
  font-family: var(--font-mono);
  font-size: 12px;
  font-style: normal;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--bt-muted-fg);
  margin-top: 14px;
}

/* Code Blocks */
pre, code, .wp-block-code {
  font-family: var(--font-mono) !important;
}

pre, .wp-block-code {
  background: var(--bt-card) !important;
  border: 1px solid var(--bt-border) !important;
  padding: 24px !important;
  overflow-x: auto;
  font-size: 14px !important;
  line-height: 1.6 !important;
  color: #E2E8F0;
  margin: 32px 0;
}

p code, li code {
  background: var(--bt-muted);
  border: 1px solid var(--bt-border);
  padding: 2px 6px;
  font-size: 0.88em;
  color: var(--bt-accent);
}

/* Tables */
table, .wp-block-table {
  width: 100%;
  border-collapse: collapse;
  margin: 36px 0;
  font-size: 15px;
}

th, td {
  border: 1px solid var(--bt-border);
  padding: 14px 18px;
  text-align: left;
}

th {
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: var(--bt-muted);
  color: var(--bt-fg);
}

/* Comments Section */
.bt-comments-section {
  margin-top: 80px;
  padding-top: 48px;
  border-top: 1px solid var(--bt-border);
}

.bt-comments-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 36px;
}

.bt-comments-title {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.04em;
  margin: 0;
}

.bt-comment-item {
  padding: 24px 0;
  border-bottom: 1px solid var(--bt-border);
}

.bt-comment-meta {
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--bt-muted-fg);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.bt-comment-author {
  font-weight: 700;
  color: var(--bt-fg);
}

.bt-comment-body {
  font-size: 15px;
  color: #D4D4D4;
  line-height: 1.6;
}

/* Comment Form */
.bt-form-input, .bt-form-textarea {
  width: 100%;
  background: var(--bt-input);
  border: 1px solid var(--bt-border);
  padding: 14px 16px;
  color: var(--bt-fg);
  font-family: var(--font-sans);
  font-size: 15px;
  outline: none;
  transition: border-color 150ms ease;
  margin-bottom: 16px;
}

.bt-form-input:focus, .bt-form-textarea:focus {
  border-color: var(--bt-accent);
}

/* Pagination */
.bt-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 48px 0;
  border-top: 1px solid var(--bt-border);
  margin-top: 40px;
}

.bt-page-link {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--bt-fg);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.bt-page-link:hover {
  color: var(--bt-accent);
}

.bt-page-current {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--bt-muted-fg);
  letter-spacing: 0.1em;
}

/* Footer */
.bt-footer {
  margin-top: auto;
  border-top: 1px solid var(--bt-border);
  padding: 48px 0;
  background-color: var(--bt-bg);
}

.bt-footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.bt-footer-text {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--bt-muted-fg);
}

.bt-footer-text a {
  color: var(--bt-fg);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.bt-footer-text a:hover {
  color: var(--bt-accent);
}

/* Responsive Overrides */
@media (max-width: 640px) {
  .bt-post-card {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .bt-post-card-index {
    display: none;
  }
  .bt-header-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .bt-hero-statement {
    padding: 48px 0 36px 0;
  }
}
`;
