/**
 * Minimalist Monochrome (Light) Theme Stylesheet
 * Strict black & white editorial design system with Playfair Display serif.
 */

export const MONOCHROME_CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,400;1,600;1,700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap');

:root {
  --mc-bg: #FFFFFF;
  --mc-fg: #000000;
  --mc-muted: #F5F5F5;
  --mc-muted-fg: #525252;
  --mc-border: #000000;
  --mc-border-light: #E5E5E5;
  --mc-card: #FFFFFF;

  --wp--preset--color--primary: #000000;
  --wp--preset--color--secondary: #525252;
  --wp--preset--color--background: #FFFFFF;
  --wp--preset--color--surface: #F5F5F5;
  --wp--preset--color--border: #000000;
  --wp--preset--color--text: #000000;
  --wp--preset--color--text-muted: #525252;

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
  background-color: var(--mc-bg);
  color: var(--mc-fg);
  font-family: var(--font-serif);
  font-size: 17px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--mc-bg);
  color: var(--mc-fg);
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
  opacity: 0.02;
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
  color: var(--mc-fg);
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
  color: #1a1a1a;
}

a {
  color: inherit;
  text-decoration: none;
  transition: all 100ms ease;
}

/* Header */
.mc-header {
  border-bottom: 3px solid var(--mc-border);
  padding: 32px 0;
  background-color: var(--mc-bg);
  position: sticky;
  top: 0;
  z-index: 100;
}

.mc-header-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.mc-brand-title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 900;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  color: var(--mc-fg);
  margin: 0;
}

.mc-brand-desc {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--mc-muted-fg);
  margin-top: 4px;
  display: block;
}

.mc-nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

.mc-nav-link {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--mc-fg);
  padding: 4px 0;
  position: relative;
}

.mc-nav-link:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

/* Hero Section */
.mc-hero {
  padding: 72px 0 56px 0;
  border-bottom: 4px solid var(--mc-border);
  margin-bottom: 56px;
}

.mc-hero-meta {
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.mc-hero-meta::before {
  content: "";
  display: inline-block;
  width: 12px;
  height: 12px;
  background-color: var(--mc-fg);
}

.mc-hero-title {
  font-size: clamp(2.5rem, 7vw, 5.5rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.02;
  margin: 0 0 20px 0;
}

.mc-hero-sub {
  font-size: clamp(1.15rem, 2vw, 1.35rem);
  color: var(--mc-muted-fg);
  max-width: 680px;
  line-height: 1.5;
  margin: 0;
}

/* Post Cards */
.mc-post-card {
  padding: 40px 0;
  border-bottom: 1px solid var(--mc-border);
  display: flex;
  flex-direction: column;
  transition: all 100ms ease;
}

.mc-post-card-meta {
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--mc-muted-fg);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.mc-post-card-title {
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin: 0 0 14px 0;
}

.mc-post-card-title a {
  color: var(--mc-fg);
}

.mc-post-card-title a:hover {
  text-decoration: underline;
  text-underline-offset: 6px;
}

.mc-post-card-excerpt {
  font-size: 16px;
  color: #333333;
  line-height: 1.6;
  margin: 0 0 20px 0;
  max-width: 720px;
}

/* Buttons */
.mc-btn-primary {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  background-color: var(--mc-fg);
  color: var(--mc-bg);
  border: 1px solid var(--mc-fg);
  padding: 12px 24px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 100ms ease;
}

.mc-btn-primary:hover {
  background-color: var(--mc-bg);
  color: var(--mc-fg);
}

.mc-btn-outline {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  background-color: transparent;
  color: var(--mc-fg);
  border: 2px solid var(--mc-fg);
  padding: 10px 20px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 100ms ease;
}

.mc-btn-outline:hover {
  background-color: var(--mc-fg);
  color: var(--mc-bg);
}

/* Single Post */
.mc-single-header {
  padding: 56px 0 36px 0;
  border-bottom: 3px solid var(--mc-border);
  margin-bottom: 48px;
}

.mc-single-title {
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1.05;
  margin: 0 0 24px 0;
}

.mc-post-content {
  font-size: 19px;
  line-height: 1.75;
  color: #111111;
}

.mc-post-content h2 {
  font-size: clamp(1.75rem, 3vw, 2.35rem);
  border-bottom: 2px solid var(--mc-border);
  padding-bottom: 8px;
  margin-top: 2em;
}

blockquote, .wp-block-quote, .wp-block-pullquote {
  font-family: var(--font-display);
  font-size: clamp(1.3rem, 2.5vw, 1.75rem);
  font-style: italic;
  line-height: 1.4;
  color: var(--mc-fg);
  border-left: 4px solid var(--mc-border);
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
  color: var(--mc-muted-fg);
  margin-top: 12px;
  display: block;
}

pre, code, .wp-block-code {
  font-family: var(--font-mono) !important;
}

pre, .wp-block-code {
  background: var(--mc-muted) !important;
  border: 1px solid var(--mc-border) !important;
  padding: 24px !important;
  overflow-x: auto;
  font-size: 14px !important;
  line-height: 1.6 !important;
  color: #000000;
  margin: 32px 0;
}

/* Comments Section */
.mc-comments-section {
  margin-top: 80px;
  padding-top: 48px;
  border-top: 4px solid var(--mc-border);
}

.mc-form-input, .mc-form-textarea {
  width: 100%;
  background: #FFFFFF;
  border: 2px solid var(--mc-border);
  padding: 14px 16px;
  color: var(--mc-fg);
  font-family: var(--font-serif);
  font-size: 16px;
  outline: none;
  margin-bottom: 16px;
}

.mc-form-input:focus, .mc-form-textarea:focus {
  border-color: #000000;
  border-width: 3px;
}

/* Pagination */
.mc-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40px 0;
  border-top: 2px solid var(--mc-border);
  margin-top: 40px;
}

.mc-page-link {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--mc-fg);
}

.mc-page-link:hover {
  text-decoration: underline;
}

/* Footer */
.mc-footer {
  margin-top: auto;
  border-top: 3px solid var(--mc-border);
  padding: 48px 0;
  background-color: var(--mc-bg);
}

.mc-footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.mc-footer-text {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mc-muted-fg);
}
`;
