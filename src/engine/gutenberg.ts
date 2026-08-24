import MarkdownIt from "markdown-it";

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
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "separator" });
      i++;
      continue;
    }

    // 4. Blockquote: > quote
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      let cite = "";
      while (i < lines.length && lines[i].trim().startsWith(">")) {
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
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
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
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
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
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
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
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("~~~") &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("|") &&
      !/^[-*+]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !/^(\-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim()) &&
      !/^!\[([^\]]*)\]\(([^)"'\s]+)(?:\s+["']([^"']*)["'])?\)$/.test(lines[i].trim())
    ) {
      pLines.push(lines[i]);
      i++;
    }

    if (pLines.length > 0) {
      blocks.push({
        type: "paragraph",
        content: pLines.join("\n")
      });
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
        const langAttr = b.lang ? ` {"language":"${escapeAttr(b.lang)}"}` : "";
        const langClass = b.lang ? ` class="language-${escapeAttr(b.lang)}"` : "";
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

  // Matches either self-closing <!-- wp:name {attrs} /--> or paired <!-- wp:name {attrs} -->...<!-- /wp:name -->
  const blockRegex = /<!--\s+wp:([a-z0-9\/-]+)(?:\s+(\{[\s\S]*?\}))?\s+(?:\/-->|-->([\s\S]*?)<!--\s+\/wp:\1\s+-->)/g;
  const blocks: GutenbergBlock[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(content)) !== null) {
    // Check for raw text before this block
    if (match.index > lastIndex) {
      const freeHtml = content.substring(lastIndex, match.index).trim();
      if (freeHtml) {
        blocks.push({
          blockName: null,
          attrs: {},
          innerBlocks: [],
          innerHTML: renderInlineMarkdown(freeHtml)
        });
      }
    }

    const blockName = match[1];
    let attrs: Record<string, any> = {};
    if (match[2]) {
      try {
        attrs = JSON.parse(match[2]);
      } catch {
        attrs = {};
      }
    }

    let innerContent = (match[3] || "").trim();

    // Render inline markdown for paragraph, quote, heading, list, code blocks if present
    if (blockName === "paragraph" || blockName === "core/paragraph") {
      innerContent = innerContent.replace(/<p>([\s\S]*?)<\/p>/gi, (_, pInner) => `<p>${renderInlineMarkdown(pInner)}</p>`);
    } else if (blockName === "heading" || blockName === "core/heading") {
      innerContent = innerContent.replace(/<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_, lvl, attrs, hInner) => `<h${lvl}${attrs}>${renderInlineMarkdown(hInner)}</h${lvl}>`);
    } else if (blockName === "quote" || blockName === "core/quote") {
      innerContent = innerContent.replace(/<p>([\s\S]*?)<\/p>/gi, (_, pInner) => `<p>${renderInlineMarkdown(pInner)}</p>`);
    } else if (blockName === "list" || blockName === "core/list") {
      innerContent = innerContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, liInner) => `<li>${renderInlineMarkdown(liInner)}</li>`);
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

    lastIndex = blockRegex.lastIndex;
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
  return blocks
    .map((b) => {
      if (!b.blockName || b.blockName === "core/freeform") {
        return `<div class="wp-block-freeform entry-content-block">${b.innerHTML}</div>`;
      }
      return b.innerHTML;
    })
    .join("\n");
}

function unescapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'");
}

function escapeHtml(str: string): string {
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
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/**
 * High-Availability CDN URLs for WordPress block-library CSS
 */
export const GUTENBERG_CDN_CSS = [
  "https://cdnjs.cloudflare.com/ajax/libs/wordpress-block-library/6.7.1/style.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/wordpress-block-library/6.7.1/theme.min.css"
];
