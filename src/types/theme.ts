import { Post, Comment, Category, Tag, SiteOptions } from "./blog";

export interface ThemeJsonColor {
  name: string;
  slug: string;
  color: string;
}

export interface ThemeJsonFontSize {
  name: string;
  slug: string;
  size: string;
}

export interface ThemeJsonSettings {
  color?: {
    palette?: ThemeJsonColor[];
    custom?: boolean;
    defaultPalette?: boolean;
  };
  typography?: {
    fontSizes?: ThemeJsonFontSize[];
    fontFamilies?: Array<{
      name: string;
      slug: string;
      fontFamily: string;
    }>;
  };
  layout?: {
    contentSize?: string;
    wideSize?: string;
  };
}

export interface ThemeJsonStyles {
  color?: {
    background?: string;
    text?: string;
  };
  typography?: {
    fontFamily?: string;
    fontSize?: string;
    lineHeight?: string;
  };
  elements?: {
    link?: {
      color?: { text?: string };
      ":hover"?: { color?: { text?: string } };
    };
    heading?: {
      color?: { text?: string };
      typography?: { fontWeight?: string };
    };
  };
}

export interface ThemeManifest {
  $schema?: string;
  version: number;
  title: string;
  description?: string;
  author?: string;
  settings?: ThemeJsonSettings;
  styles?: ThemeJsonStyles;
  customCSS?: string;
}

export interface PageRenderContext {
  site: SiteOptions;
  pageTitle: string;
  description?: string;
  ogImage?: string;
  canonicalUrl: string;
  contentHtml: string;
  currentYear: number;
  themeCSS: string;
  headExtra?: string;
}

export interface SinglePostRenderContext extends PageRenderContext {
  post: Post;
  comments: Comment[];
  turnstileSiteKey?: string;
}

export interface ArchiveRenderContext extends PageRenderContext {
  posts: Post[];
  archiveTitle: string;
  archiveDescription?: string;
  currentPage: number;
  totalPages: number;
}

export interface ThemePreview {
  accentColor: string;
  bgColor: string;
  textColor: string;
  cardBg: string;
  fontFamilySans: string;
  fontFamilyDisplay?: string;
  features: string[];
}

export interface ThemeMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  tags: string[];
  preview: ThemePreview;
}

export interface ThemeTemplates {
  renderHeader(site: SiteOptions): string;
  renderHeroStatement?(site: SiteOptions): string;
  renderPostCard(post: Post, index: number): string;
  renderPagination(currentPage: number, totalPages: number, basePath?: string): string;
  renderCommentItem(comment: Comment): string;
  renderSinglePost(ctx: SinglePostRenderContext): string;
  renderFooter(site: SiteOptions, currentYear: number): string;
}

export interface ThemePackage {
  meta: ThemeMetadata;
  manifest: ThemeManifest;
  css: string;
  templates: ThemeTemplates;
}
