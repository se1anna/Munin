/**
 * Minimalist Monochrome (Dark) Theme Stylesheet
 * Strict inverted black & white editorial design system with Playfair Display serif.
 */

export const MONOCHROME_DARK_CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,400;1,600;1,700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap');

:root {
  --mcd-bg: #000000;
  --mcd-fg: #FFFFFF;
  --mcd-muted: #121212;
  --mcd-muted-fg: #A3A3A3;
  --mcd-border: #FFFFFF;
  --mcd-border-light: #262626;
  --mcd-card: #000000;

  --wp--preset--color--primary: #FFFFFF;
  --wp--preset--color--secondary: #A3A3A3;
  --wp--preset--color--background: #000000;
  --wp--preset--color--surface: #121212;
  --wp--preset--color--border: #FFFFFF;
  --wp--preset--color--text: #FFFFFF;
  --wp--preset--color--text-muted: #A3A3A3;

  --font-display: "Playfair Display", Georgia, "Times New Roman", serif;
  --font-serif: "Source Serif 4", Georgia, "Times New Roman", serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  --wp--custom--layout--content-size: 860px;
  --wp--custom--layout--wide-size: 1180px;
}

*, *::before, *::after {
  box-sizing: border-box;
  border-radius: 0 !important; /* Absolute zero radius */
}

html {
  background-color: var(--mcd-bg);
  color: var(--mcd-fg);
  font-family: var(--font-serif);
  font-size: 17px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--mcd-bg);
  color: var(--mcd-fg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Subtle paper texture */
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
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--mcd-fg);
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-top: 1.8em;
  margin-bottom: 0.6em;
}

h1 {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.05;
}

h2 {
  font-size: clamp(1.85rem, 4vw, 2.75rem);
}

h3 {
  font-size: clamp(1.4rem, 2.5vw, 2rem);
}

p {
  margin-top: 0;
  margin-bottom: 1.5em;
  color: #E0E0E0;
}

a {
  color: inherit;
  text-decoration: none;
  transition: all 100ms ease;
}

/* Header */
.mcd-header {
  border-bottom: 3px solid var(--mcd-border);
  padding: 32px 0;
  background-color: var(--mcd-bg);
  position: sticky;
  top: 0;
  z-index: 100;
}

.mcd-header-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.mcd-brand-title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 900;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  color: var(--mcd-fg);
  margin: 0;
}

.mcd-brand-desc {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--mcd-muted-fg);
  margin-top: 4px;
  display: block;
}

.mcd-nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

.mcd-nav-link {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--mcd-fg);
  padding: 4px 0;
  position: relative;
}

.mcd-nav-link:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

/* Hero Section */
.mcd-hero {
  padding: 72px 0 56px 0;
  border-bottom: 4px solid var(--mcd-border);
  margin-bottom: 56px;
}

.mcd-hero-meta {
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.mcd-hero-meta::before {
  content: "";
  display: inline-block;
  width: 12px;
  height: 12px;
  background-color: var(--mcd-fg);
}

.mcd-hero-title {
  font-size: clamp(2.5rem, 7vw, 5.5rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.02;
  margin: 0 0 20px 0;
}

.mcd-hero-sub {
  font-size: clamp(1.15rem, 2vw, 1.35rem);
  color: var(--mcd-muted-fg);
  max-width: 680px;
  line-height: 1.5;
  margin: 0;
}

/* Post Cards */
.mcd-post-card {
  padding: 40px 0;
  border-bottom: 1px solid var(--mcd-border-light);
  display: flex;
  flex-direction: column;
  transition: all 100ms ease;
}

.mcd-post-card-meta {
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--mcd-muted-fg);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.mcd-post-card-title {
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin: 0 0 14px 0;
}

.mcd-post-card-title a {
  color: var(--mcd-fg);
}

.mcd-post-card-title a:hover {
  text-decoration: underline;
  text-underline-offset: 6px;
}

.mcd-post-card-excerpt {
  font-size: 16px;
  color: #B0B0B0;
  line-height: 1.6;
  margin: 0 0 20px 0;
  max-width: 720px;
}

/* Buttons */
.mcd-btn-primary {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  background-color: var(--mcd-fg);
  color: var(--mcd-bg);
  border: 1px solid var(--mcd-fg);
  padding: 12px 24px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 100ms ease;
}

.mcd-btn-primary:hover {
  background-color: var(--mcd-bg);
  color: var(--mcd-fg);
}

.mcd-btn-outline {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  background-color: transparent;
  color: var(--mcd-fg);
  border: 2px solid var(--mcd-fg);
  padding: 10px 20px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 100ms ease;
}

.mcd-btn-outline:hover {
  background-color: var(--mcd-fg);
  color: var(--mcd-bg);
}

/* Single Post */
.mcd-single-header {
  padding: 56px 0 36px 0;
  border-bottom: 3px solid var(--mcd-border);
  margin-bottom: 48px;
}

.mcd-single-title {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.05;
  margin: 0 0 24px 0;
}

.mcd-post-content {
  font-size: 19px;
  line-height: 1.75;
  color: #ECECEC;
}

.mcd-post-content h2 {
  font-size: clamp(1.75rem, 3vw, 2.35rem);
  border-bottom: 2px solid var(--mcd-border);
  padding-bottom: 8px;
  margin-top: 2em;
}

blockquote, .wp-block-quote, .wp-block-pullquote {
  font-family: var(--font-display);
  font-size: clamp(1.3rem, 2.5vw, 1.75rem);
  font-style: italic;
  line-height: 1.4;
  color: var(--mcd-fg);
  border-left: 4px solid var(--mcd-border);
  padding: 16px 0 16px 28px;
  margin: 40px 0;
  background: transparent;
}

blockquote cite, .wp-block-quote cite {
  font-family: var(--font-mono);
  font-size: 12px;
  font-style: normal;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--mcd-muted-fg);
  margin-top: 12px;
  display: block;
}

pre, code, .wp-block-code {
  font-family: var(--font-mono) !important;
}

pre, .wp-block-code {
  background: var(--mcd-muted) !important;
  border: 1px solid var(--mcd-border-light) !important;
  padding: 24px !important;
  overflow-x: auto;
  font-size: 14px !important;
  line-height: 1.6 !important;
  color: #FFFFFF;
  margin: 32px 0;
}

.mcd-post-content table, .wp-block-table table {
  width: 100%;
  border-collapse: collapse;
  margin: 32px 0;
  font-size: 15px;
}

.mcd-post-content th, .mcd-post-content td, .wp-block-table th, .wp-block-table td {
  border: 1px solid var(--mcd-border-light);
  padding: 12px 16px;
  text-align: left;
}

.mcd-post-content th, .wp-block-table th {
  background: var(--mcd-card);
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Comments Section */
.mcd-comments-section {
  margin-top: 80px;
  padding-top: 48px;
  border-top: 4px solid var(--mcd-border);
}

.mcd-form-input, .mcd-form-textarea {
  width: 100%;
  background: #000000;
  border: 2px solid var(--mcd-border);
  padding: 14px 16px;
  color: var(--mcd-fg);
  font-family: var(--font-serif);
  font-size: 16px;
  outline: none;
  margin-bottom: 16px;
}

.mcd-form-input:focus, .mcd-form-textarea:focus {
  border-color: #FFFFFF;
  border-width: 3px;
}

/* Pagination */
.mcd-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40px 0;
  border-top: 2px solid var(--mcd-border);
  margin-top: 40px;
}

.mcd-page-link {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--mcd-fg);
}

.mcd-page-link:hover {
  text-decoration: underline;
}

/* Footer */
.mcd-footer {
  margin-top: auto;
  border-top: 3px solid var(--mcd-border);
  padding: 48px 0;
  background-color: var(--mcd-bg);
}

.mcd-footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.mcd-footer-text {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mcd-muted-fg);
}
`;
