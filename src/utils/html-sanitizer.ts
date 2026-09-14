// Shared removal of active content from HTML that is rendered raw into pages.
// Formatting markup is preserved; only script-bearing constructs are dropped.

const DANGEROUS_PAIRED_TAGS = /<(script|style|iframe|object|embed|applet|form|svg|math|link|meta|base|template)\b[\s\S]*?<\/\1\s*>/gi;
const DANGEROUS_VOID_TAGS = /<\/?(script|style|iframe|object|embed|applet|form|svg|math|link|meta|base|template)\b[^>]*>/gi;
const EVENT_HANDLER_ATTR = /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const SCRIPT_URL = /(?:javascript|vbscript|data)\s*:/gi;

export interface SanitizeOptions {
  /** Also neutralise javascript:/vbscript:/data: URLs (footer content). */
  stripScriptUrls?: boolean;
}

export function sanitizeActiveHtml(html: string, options: SanitizeOptions = {}): string {
  if (!html) return "";
  const stripScriptUrls = options.stripScriptUrls !== false;

  let out = html
    .replace(DANGEROUS_PAIRED_TAGS, "")
    .replace(DANGEROUS_VOID_TAGS, "")
    .replace(EVENT_HANDLER_ATTR, "");

  if (stripScriptUrls) {
    out = out.replace(SCRIPT_URL, "blocked:");
  }
  return out;
}
