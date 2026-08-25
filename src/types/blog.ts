export type UserRole = "administrator" | "author" | "subscriber" | "tester";

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  display_name: string;
  token_version?: number;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  display_name: string;
  token_version?: number;
  last_login_at?: string;
}

export type PostStatus = "published" | "draft";

export interface Post {
  id: string;
  slug: string;
  title: string;
  content_html: string;
  content_raw: string;
  excerpt: string;
  status: PostStatus;
  author_id: string;
  author_name?: string;
  featured_image?: string;
  categories?: Category[];
  tags?: Tag[];
  created_at: string;
  updated_at: string;
}

export type CommentStatus = "approved" | "pending" | "spam";

export interface Comment {
  id: string;
  post_id: string;
  parent_id?: string | null;
  author_name: string;
  author_email: string;
  content: string;
  status: CommentStatus;
  created_at: string;
  replies?: Comment[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  post_count?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  post_count?: number;
}

export interface PostTerm {
  post_id: string;
  term_type: "category" | "tag";
  term_id: string;
}

export interface MediaMeta {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  r2_key: string;
  uploader_id?: string;
  created_at: string;
}

export interface VerificationCode {
  id: string;
  email: string;
  code: string;
  purpose: "register" | "reset_password" | "sensitive_action";
  expires_at: number;
  created_at: number;
}

export interface SiteOptions {
  site_name: string;
  site_description: string;
  site_url: string;
  posts_per_page: number;
  allow_comments: boolean;
  active_theme: string;
  footer_html?: string;
}

export interface BlogBackupData {
  version: string;
  exported_at: string;
  site_options: Record<string, string>;
  users: Omit<User, "password_hash">[];
  posts: Post[];
  categories: Category[];
  tags: Tag[];
  post_terms: PostTerm[];
  comments: Comment[];
  media_metadata: MediaMeta[];
}

export interface OAuthLog {
  id: string;
  user_id: string;
  username: string;
  client_id: string;
  client_name: string;
  scope?: string;
  ip?: string;
  created_at: string;
}
