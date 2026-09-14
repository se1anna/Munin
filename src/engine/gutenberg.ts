import MarkdownIt from "markdown-it";
import { sanitizeActiveHtml } from "../utils/html-sanitizer";

export const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

export interface GutenbergBlock {
  blockName: string | null;
  attrs: Record<string, any>;
  innerBlocks: GutenbergBlock[];
  innerHTML: string;
}

/**
 * Render inline markdown formatting using markdown-it
 */
export function renderInlineMarkdown(text: string): string {
  if (!text) return "";
  return md.renderInline(text);
}

/**
 * Render full markdown document into semantic HTML
 */
export function renderFullMarkdown(markdown: string): string {
  if (!markdown) return "";
  return md.render(markdown);
}

export function renderTableMarkdown(tableLines: string[]): string {
  if (!tableLines || tableLines.length === 0) return "";
  const rows = tableLines.map((line) =>
    line.split("|").slice(1, -1).map((c) => c.trim())
  );
  if (rows.length === 0) return "";
  const hasHeader = rows.length > 1 && rows[1].every((c) => /^:?-+:?$/.test(c));
  const headerRow = rows[0];
  const bodyRows = hasHeader ? rows.slice(2) : rows;

  let html = '<figure class="wp-block-table"><table>';
  if (hasHeader) {
    html += "<thead><tr>";
    for (let h = 0; h < headerRow.length; h++) {
      html += `<th>${renderInlineMarkdown(headerRow[h])}</th>`;
    }
    html += "</tr></thead>";
  }
  html += "<tbody>";
  for (let r = 0; r < bodyRows.length; r++) {
    html += "<tr>";
    for (let c = 0; c < bodyRows[r].length; c++) {
      html += `<td>${renderInlineMarkdown(bodyRows[r][c])}</td>`;
    }
    html += "</tr>";
  }
  html += "</tbody></table></figure>";
  return html;
}

export interface ParsedMarkdownBlock {
  type: "heading" | "paragraph" | "code" | "quote" | "list" | "separator" | "image" | "html";
  level?: number;
  content?: string;
  code?: string;
  lang?: string;
  quote?: string;
  cite?: string;
  ordered?: boolean;
  items?: string[];
  url?: string;
  alt?: string;
  caption?: string;
}

/**
 * Parses raw Markdown text into structured blocks
 */

// These predicates are shared by the branch dispatch AND the paragraph collector.
// Keeping one definition prevents the two from diverging, which previously left
// lines such as "#include <x.h>" matching no branch at all.
const isHeadingLine = (s: string): boolean => /^#{1,6}\s+(.+)$/.test(s);
const isTableLine = (s: string): boolean => s.startsWith("|") && s.endsWith("|");
const isSeparatorLine = (s: string): boolean => /^(-{3,}|\*{3,}|_{3,})$/.test(s);
const isUnorderedItem = (s: string): boolean => /^[-*+]\s+/.test(s);
const isOrderedItem = (s: string): boolean => /^\d+\.\s+/.test(s);
const isFenceLine = (s: string): boolean => s.startsWith("```") || s.startsWith("~~~");
const isBlockquoteLine = (s: string): boolean => s.startsWith(">");
const isImageLine = (s: string): boolean =>
  /^!\[([^\]]*)\]\(([^)"'\s]+)(?:\s+["']([^"']*)["'])?\)$/.test(s);

export function parseMarkdownToBlocks(markdown: string): ParsedMarkdownBlock[] {
  if (!markdown || !markdown.trim()) {
    return [{ type: "paragraph", content: "" }];
  }

  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: ParsedMarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Code Fence: ```lang
    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      const fence = trimmed.substring(0, 3);
      const lang = trimmed.substring(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence)) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // consume closing fence
      blocks.push({
        type: "code",
        code: codeLines.join("\n"),
        lang: lang || ""
      });
      continue;
    }

    // 2. Headings: # H1 to ###### H6
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      blocks.push({
        type: "heading",
        level,
        content: headingMatch[2].trim()
      });
      i++;
      continue;
    }

    // 3. Separator: ---, ***, ___
    if (isSeparatorLine(trimmed)) {
      blocks.push({ type: "separator" });
      i++;
      continue;
    }

    // 4. Blockquote: > quote
    if (isBlockquoteLine(trimmed)) {
      const quoteLines: string[] = [];
      let cite = "";
      while (i < lines.length && isBlockquoteLine(lines[i].trim())) {
        const qLine = lines[i].trim().replace(/^>\s?/, "");
        if (qLine.startsWith("——") || qLine.startsWith("--") || qLine.startsWith("- ")) {
          cite = qLine.replace(/^([—\-]{1,2}\s?)/, "").trim();
        } else {
          quoteLines.push(qLine);
        }
        i++;
      }
      blocks.push({
        type: "quote",
        quote: quoteLines.join("\n"),
        cite
      });
      continue;
    }

    // 5. Table: | col1 | col2 |
    if (isTableLine(trimmed)) {
      const tableLines: string[] = [];
      while (i < lines.length && isTableLine(lines[i].trim())) {
        tableLines.push(lines[i].trim());
        i++;
      }
      blocks.push({
        type: "html",
        content: renderTableMarkdown(tableLines)
      });
      continue;
    }

    // 6. Unordered List: - item, * item, + item
    if (isUnorderedItem(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && isUnorderedItem(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*+]\s+/, ""));
        i++;
      }
      blocks.push({
        type: "list",
        ordered: false,
        items
      });
      continue;
    }

    // 7. Ordered List: 1. item
    if (isOrderedItem(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && isOrderedItem(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({
        type: "list",
        ordered: true,
        items
      });
      continue;
    }

    // 8. Standalone Image: ![alt](url)
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)"'\s]+)(?:\s+["']([^"']*)["'])?\)$/);
    if (imgMatch) {
      blocks.push({
        type: "image",
        alt: imgMatch[1],
        url: imgMatch[2],
        caption: imgMatch[3] || ""
      });
      i++;
      continue;
    }

    // 9. Regular Paragraph
    const pLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !isFenceLine(lines[i].trim()) &&
      !isHeadingLine(lines[i].trim()) &&
      !isBlockquoteLine(lines[i].trim()) &&
      !isTableLine(lines[i].trim()) &&
      !isUnorderedItem(lines[i].trim()) &&
      !isOrderedItem(lines[i].trim()) &&
      !isSeparatorLine(lines[i].trim()) &&
      !isImageLine(lines[i].trim())
    ) {
      pLines.push(lines[i]);
      i++;
    }

    if (pLines.length > 0) {
      blocks.push({
        type: "paragraph",
        content: pLines.join("\n")
      });
    } else {
      // Safety net: emit the unmatched line so the outer loop always advances.
      blocks.push({ type: "paragraph", content: trimmed });
    }
  }

  if (blocks.length === 0) {
    blocks.push({ type: "paragraph", content: markdown });
  }

  return blocks;
}

/**
 * Converts Markdown text into WordPress Gutenberg HTML comment format
 */
export function markdownToGutenberg(markdown: string): string {
  const blocks = parseMarkdownToBlocks(markdown);
  return blocks
    .map((b) => {
      if (b.type === "heading") {
        const lvl = b.level || 2;
        const inlineHtml = renderInlineMarkdown(b.content || "");
        return `<!-- wp:heading {"level":${lvl}} -->\n<h${lvl} class="wp-block-heading">${inlineHtml}</h${lvl}>\n<!-- /wp:heading -->`;
      }
      if (b.type === "paragraph") {
        const inlineHtml = renderInlineMarkdown((b.content || "").replace(/\n/g, "<br/>"));
        return `<!-- wp:paragraph -->\n<p>${inlineHtml}</p>\n<!-- /wp:paragraph -->`;
      }
      if (b.type === "image") {
        const fig = b.caption ? `<figcaption>${renderInlineMarkdown(b.caption)}</figcaption>` : "";
        return `<!-- wp:image -->\n<figure class="wp-block-image"><img src="${escapeAttr(b.url || "")}" alt="${escapeAttr(b.alt || "")}" />${fig}</figure>\n<!-- /wp:image -->`;
      }
      if (b.type === "code") {
        const lang = sanitizeFenceLang(b.lang || "");
        const langAttr = lang ? ` {"language":"${lang}"}` : "";
        const langClass = lang ? ` class="language-${lang}"` : "";
        return `<!-- wp:code${langAttr} -->\n<pre class="wp-block-code"><code${langClass}>${escapeHtml(b.code || "")}</code></pre>\n<!-- /wp:code -->`;
      }
      if (b.type === "quote") {
        const quoteHtml = renderInlineMarkdown((b.quote || "").replace(/\n/g, "<br/>"));
        const citeHtml = b.cite ? `<cite>${renderInlineMarkdown(b.cite)}</cite>` : "";
        return `<!-- wp:quote -->\n<blockquote class="wp-block-quote"><p>${quoteHtml}</p>${citeHtml}</blockquote>\n<!-- /wp:quote -->`;
      }
      if (b.type === "list") {
        const tag = b.ordered ? "ol" : "ul";
        const lis = (b.items || [])
          .map((item) => `<li>${renderInlineMarkdown(item)}</li>`)
          .join("\n");
        return `<!-- wp:list {"ordered":${!!b.ordered}} -->\n<${tag} class="wp-block-list">\n${lis}\n</${tag}>\n<!-- /wp:list -->`;
      }
      if (b.type === "separator") {
        return `<!-- wp:separator -->\n<hr class="wp-block-separator" />\n<!-- /wp:separator -->`;
      }
      if (b.type === "html") {
        return `<!-- wp:html -->\n${b.content || ""}\n<!-- /wp:html -->`;
      }
      return `<!-- wp:paragraph -->\n<p>${renderInlineMarkdown(b.content || "")}</p>\n<!-- /wp:paragraph -->`;
    })
    .join("\n\n");
}

export function parseGutenbergBlocks(content: string): GutenbergBlock[] {
  if (!content) return [];

  // If content is pure Markdown (no Gutenberg comment blocks), convert it first
  if (!content.includes("<!-- wp:")) {
    const gutenbergFormatted = markdownToGutenberg(content);
    return parseGutenbergBlocks(gutenbergFormatted);
  }

  const blocks: GutenbergBlock[] = [];
  let lastIndex = 0;

  // Locate every real block start in one linear pass. The previous single global regex
  // paired a lazy inner scan with a backreference, so an opening marker with no closer
  // made the engine rescan the whole document from each position (quadratic).
  const ANCHORED_BLOCK_REGEX = /^<!--\s+wp:([a-z0-9\/-]+)(?:\s+(\{[\s\S]*?\}))?\s+(?:\/-->|-->([\s\S]*?)<!--\s+\/wp:\1\s+-->)/;
  const startPositions = new Set<number>();
  const anchorScanRegex = /<!--\s+wp:/g;
  let anchorMatch: RegExpExecArray | null;
  while ((anchorMatch = anchorScanRegex.exec(content)) !== null) {
    // The anchored match is bounded: the inner scan can only run to the matching
    // closer, so an unclosed opener costs a failing scan instead of a full rescan.
    if (ANCHORED_BLOCK_REGEX.test(content.slice(anchorMatch.index))) {
      startPositions.add(anchorMatch.index);
    }
  }

  for (const start of Array.from(startPositions).sort((a, b) => a - b)) {
    const anchored = ANCHORED_BLOCK_REGEX.exec(content.slice(start));
    if (!anchored) continue;

    const blockName = anchored[1];

    // Check for raw text before this block
    if (start > lastIndex) {
      const freeHtml = content.substring(lastIndex, start).trim();
      if (freeHtml) {
        blocks.push({
          blockName: null,
          attrs: {},
          innerBlocks: [],
          innerHTML: renderInlineMarkdown(freeHtml)
        });
      }
    }

    let attrs: Record<string, any> = {};
    if (anchored[2]) {
      try {
        attrs = JSON.parse(anchored[2]);
      } catch {
        attrs = {};
      }
    }

    let innerContent = (anchored[3] || "").trim();

    // Render inline markdown for paragraph, quote, heading, list, code blocks if present
    if (blockName === "paragraph" || blockName === "core/paragraph") {
      innerContent = innerContent.replace(/<p>([\s\S]*?)<\/p>/gi, (_, pInner) => `<p>${renderInlineMarkdown(unescapeQuotes(pInner))}</p>`);
    } else if (blockName === "heading" || blockName === "core/heading") {
      innerContent = innerContent.replace(/<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_, lvl, attrs, hInner) => `<h${lvl}${attrs}>${renderInlineMarkdown(unescapeQuotes(hInner))}</h${lvl}>`);
    } else if (blockName === "quote" || blockName === "core/quote") {
      innerContent = innerContent.replace(/<p>([\s\S]*?)<\/p>/gi, (_, pInner) => `<p>${renderInlineMarkdown(unescapeQuotes(pInner))}</p>`);
    } else if (blockName === "list" || blockName === "core/list") {
      innerContent = innerContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, liInner) => `<li>${renderInlineMarkdown(unescapeQuotes(liInner))}</li>`);
    } else if (blockName === "code" || blockName === "core/code") {
      innerContent = innerContent.replace(/<pre[^>]*><code([^>]*)>([\s\S]*?)<\/code><\/pre>/gi, (_, codeAttrs, rawCode) => {
        const cleanCode = unescapeHtml(rawCode);
        return `<pre class="wp-block-code"><code${codeAttrs}>${escapeHtml(cleanCode)}</code></pre>`;
      });
    }

    blocks.push({
      blockName,
      attrs,
      innerBlocks: [],
      innerHTML: innerContent
    });

    lastIndex = start + anchored[0].length;
  }

  if (lastIndex < content.length) {
    const trailing = content.substring(lastIndex).trim();
    if (trailing) {
      blocks.push({
        blockName: null,
        attrs: {},
        innerBlocks: [],
        innerHTML: renderInlineMarkdown(trailing)
      });
    }
  }

  // If no wp blocks found, return raw content wrapped as classic block
  if (blocks.length === 0 && content.trim()) {
    blocks.push({
      blockName: "core/freeform",
      attrs: {},
      innerBlocks: [],
      innerHTML: renderInlineMarkdown(content)
    });
  }

  return blocks;
}

export function renderGutenbergHtml(content: string): string {
  if (!content) return "";
  if (!content.includes("<!-- wp:")) {
    return renderGutenbergHtml(markdownToGutenberg(content));
  }

  const blocks = parseGutenbergBlocks(content);
  const html = blocks
    .map((b) => {
      if (!b.blockName || b.blockName === "core/freeform") {
        return `<div class="wp-block-freeform entry-content-block">${b.innerHTML}</div>`;
      }
      return b.innerHTML;
    })
    .join("\n");

  // ⚠️ SECURITY: this HTML is persisted and echoed raw by every theme. Authors may
  // submit raw HTML, so script-bearing markup is stripped before it is stored.
  // Inline scripts are left alone here; they carry the generated block data.
  return sanitizeActiveHtml(html, { stripScriptUrls: false });
}

export function unescapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'");
}

export function unescapeQuotes(str: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;quot;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'");
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

function escapeAttr(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// The fence info string lands inside a Gutenberg comment (`<!-- wp:code {...} -->`),
// so it must not be able to close that comment or inject markup.
function sanitizeFenceLang(lang: string): string {
  return (lang || "").replace(/-->/g, "").replace(/[<>"']/g, "").trim();
}

/**
 * High-Availability CDN URLs for WordPress block-library CSS
 */
export const GUTENBERG_CDN_CSS = [
  "https://cdnjs.cloudflare.com/ajax/libs/wordpress-block-library/6.7.1/style.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/wordpress-block-library/6.7.1/theme.min.css"
];
