import { DurableObject } from "cloudflare:workers";
import { Env } from "../types/env";
import {
  User,
  UserRole,
  Post,
  Comment,
  Category,
  Tag,
  MediaMeta,
  VerificationCode,
  BlogBackupData,
  SiteOptions,
  PostStatus,
  CommentStatus,
  OAuthLog
} from "../types/blog";
import { OAuthClient } from "../types/oauth";
import { hashPassword } from "../auth/session";
import { invalidatePostAndFeeds } from "../services/cache";

export class BlogDO extends DurableObject<Env> {
  private initialized = false;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  private queryRows<T>(query: string, ...params: any[]): T[] {
    return [...this.ctx.storage.sql.exec(query, ...params)] as unknown as T[];
  }

  private ensureSchema(): void {
    if (this.initialized) return;

    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'subscriber',
        display_name TEXT NOT NULL,
        token_version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        content_html TEXT NOT NULL,
        content_raw TEXT NOT NULL,
        excerpt TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft',
        author_id TEXT NOT NULL,
        featured_image TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        slug TEXT UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS post_terms (
        post_id TEXT NOT NULL,
        term_type TEXT NOT NULL,
        term_id TEXT NOT NULL,
        PRIMARY KEY (post_id, term_type, term_id)
      );

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        parent_id TEXT,
        author_name TEXT NOT NULL,
        author_email TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS media_metadata (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        r2_key TEXT NOT NULL,
        uploader_id TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS verification_codes (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        purpose TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS site_options (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS oauth_clients (
        id TEXT PRIMARY KEY,
        client_secret_hash TEXT NOT NULL,
        client_name TEXT NOT NULL,
        redirect_uris TEXT NOT NULL,
        scopes TEXT NOT NULL DEFAULT 'openid profile email role',
        is_trusted INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS oauth_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        client_id TEXT NOT NULL,
        client_name TEXT NOT NULL,
        scope TEXT,
        ip TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_oauth_logs_user ON oauth_logs (user_id);
      CREATE INDEX IF NOT EXISTS idx_oauth_logs_client ON oauth_logs (client_id);
      CREATE INDEX IF NOT EXISTS idx_oauth_logs_time ON oauth_logs (created_at);
    `);

    // Schema Migrations for existing SQLite database instances
    try {
      const userColumns = this.queryRows<{ name: string }>("PRAGMA table_info(users)");
      const hasTokenVersion = userColumns.some((c) => c.name === "token_version");
      if (!hasTokenVersion) {
        this.ctx.storage.sql.exec("ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 1");
      }
      const hasLastLogin = userColumns.some((c) => c.name === "last_login_at");
      if (!hasLastLogin) {
        this.ctx.storage.sql.exec("ALTER TABLE users ADD COLUMN last_login_at TEXT");
      }
    } catch (e) {
      console.warn("[Schema Migration] users columns check:", e);
    }

    // Initialize default site options if absent
    this.initDefaultOptions();

    this.initialized = true;
  }

  private initDefaultOptions(): void {
    const defaults: Record<string, string> = {
      site_name: this.env.SITE_NAME || "极简边缘博客",
      site_description: this.env.SITE_DESCRIPTION || "基于 Cloudflare Serverless 构建的高性能动态博客",
      site_url: this.env.SITE_URL || "https://example.com",
      posts_per_page: "10",
      allow_comments: "true",
      active_theme: "bold-typography",
      footer_html: ""
    };

    for (const [key, value] of Object.entries(defaults)) {
      this.ctx.storage.sql.exec(
        `INSERT OR IGNORE INTO site_options (key, value) VALUES (?, ?)`,
        key,
        value
      );
    }
  }

  // --- KV Invalidation Helpers ---
  private async invalidateCache(slugs: string[] = []): Promise<void> {
    try {
      if (slugs.length === 0) {
        await invalidatePostAndFeeds(this.env.CACHE_KV);
      } else {
        for (const slug of slugs) {
          await invalidatePostAndFeeds(this.env.CACHE_KV, slug);
        }
      }
    } catch {
      // Ignore cache deletion errors
    }
  }

  // --- Site Options Methods ---
  public async getSiteOptions(): Promise<SiteOptions> {
    this.ensureSchema();
    const rows = this.queryRows<{ key: string; value: string }>("SELECT key, value FROM site_options");
    const map: Record<string, string> = {};
    for (const r of rows) {
      map[r.key] = r.value;
    }

    return {
      site_name: map.site_name || this.env.SITE_NAME || "极简边缘博客",
      site_description: map.site_description || this.env.SITE_DESCRIPTION || "",
      site_url: map.site_url || this.env.SITE_URL || "https://example.com",
      posts_per_page: parseInt(map.posts_per_page || "10", 10),
      allow_comments: map.allow_comments !== "false",
      active_theme: map.active_theme || "bold-typography",
      footer_html: map.footer_html || ""
    };
  }

  public async updateSiteOptions(options: Partial<SiteOptions>): Promise<void> {
    this.ensureSchema();
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined) {
        let sanitizedValue = String(value);
        // ⚠️ SECURITY: Sanitize footer_html to prevent stored XSS
        if (key === "footer_html" && typeof value === "string") {
          sanitizedValue = sanitizeFooterHtml(value);
        }
        this.ctx.storage.sql.exec(
          `INSERT INTO site_options (key, value) VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
          key,
          sanitizedValue
        );
      }
    }
    await this.invalidateCache();
  }

  // --- User Management Methods ---
  public async createUser(user: {
    username: string;
    email: string;
    password_hash: string;
    role?: "administrator" | "author" | "subscriber";
    display_name?: string;
  }): Promise<User> {
    this.ensureSchema();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const role = user.role || "subscriber";
    const displayName = user.display_name || user.username;

    this.ctx.storage.sql.exec(
      `INSERT INTO users (id, username, email, password_hash, role, display_name, token_version, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      id,
      user.username.toLowerCase(),
      user.email.toLowerCase(),
      user.password_hash,
      role,
      displayName,
      now,
      now
    );

    return {
      id,
      username: user.username.toLowerCase(),
      email: user.email.toLowerCase(),
      password_hash: user.password_hash,
      role,
      display_name: displayName,
      token_version: 1,
      created_at: now,
      updated_at: now
    };
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    this.ensureSchema();
    const rows = this.queryRows<User>("SELECT * FROM users WHERE email = ?", email.toLowerCase());
    return rows.length > 0 ? rows[0] : null;
  }

  public async getUserByUsername(username: string): Promise<User | null> {
    this.ensureSchema();
    const rows = this.queryRows<User>("SELECT * FROM users WHERE username = ?", username.toLowerCase());
    return rows.length > 0 ? rows[0] : null;
  }

  public async getUserById(id: string): Promise<User | null> {
    this.ensureSchema();
    const rows = this.queryRows<User>("SELECT * FROM users WHERE id = ?", id);
    return rows.length > 0 ? rows[0] : null;
  }

  public async getUserTokenVersion(userId: string): Promise<number> {
    this.ensureSchema();
    try {
      const rows = this.queryRows<{ token_version: number }>("SELECT token_version FROM users WHERE id = ?", userId);
      return rows[0]?.token_version ?? 1;
    } catch {
      return 1;
    }
  }

  public async countUsers(): Promise<number> {
    this.ensureSchema();
    const rows = this.queryRows<{ count: number }>("SELECT COUNT(*) as count FROM users");
    return rows[0]?.count || 0;
  }

  public async updateUserPassword(userId: string, newPasswordHash: string): Promise<number> {
    this.ensureSchema();
    const now = new Date().toISOString();
    const rows = this.queryRows<User>("SELECT id, token_version FROM users WHERE id = ?", userId);
    if (rows.length === 0) return 0;
    const newVersion = (rows[0].token_version || 1) + 1;
    this.ctx.storage.sql.exec(
      "UPDATE users SET password_hash = ?, token_version = ?, updated_at = ? WHERE id = ?",
      newPasswordHash,
      newVersion,
      now,
      userId
    );
    return newVersion;
  }

  public async updateUserPasswordByEmail(email: string, newPasswordHash: string): Promise<{ userId: string; newVersion: number } | null> {
    this.ensureSchema();
    const now = new Date().toISOString();
    const rows = this.queryRows<User>("SELECT id, token_version FROM users WHERE email = ?", email.toLowerCase());
    if (rows.length === 0) return null;
    const newVersion = (rows[0].token_version || 1) + 1;
    this.ctx.storage.sql.exec(
      "UPDATE users SET password_hash = ?, token_version = ?, updated_at = ? WHERE email = ?",
      newPasswordHash,
      newVersion,
      now,
      email.toLowerCase()
    );
    return { userId: rows[0].id, newVersion };
  }

  public async listUsers(): Promise<User[]> {
    this.ensureSchema();
    return this.queryRows<User>("SELECT * FROM users ORDER BY created_at DESC");
  }

  public async updateUserLastLogin(userId: string): Promise<void> {
    this.ensureSchema();
    const now = new Date().toISOString();
    this.ctx.storage.sql.exec("UPDATE users SET last_login_at = ? WHERE id = ?", now, userId);
  }

  public async updateUserProfile(userId: string, data: { display_name?: string }): Promise<User | null> {
    this.ensureSchema();
    const now = new Date().toISOString();
    if (data.display_name !== undefined) {
      const displayName = String(data.display_name).trim().slice(0, 100);
      this.ctx.storage.sql.exec(
        "UPDATE users SET display_name = ?, updated_at = ? WHERE id = ?",
        displayName,
        now,
        userId
      );
    }
    return this.getUserById(userId);
  }

  public async searchUsers(query?: string): Promise<Omit<User, "password_hash">[]> {
    this.ensureSchema();
    if (!query || !query.trim()) {
      return this.queryRows<User>(
        "SELECT id, username, email, role, display_name, token_version, last_login_at, created_at, updated_at FROM users ORDER BY created_at DESC"
      );
    }
    const cleanQ = `%${query.trim().toLowerCase()}%`;
    return this.queryRows<User>(
      `SELECT id, username, email, role, display_name, token_version, last_login_at, created_at, updated_at 
       FROM users 
       WHERE LOWER(username) LIKE ? OR LOWER(email) LIKE ? OR LOWER(display_name) LIKE ?
       ORDER BY created_at DESC`,
      cleanQ,
      cleanQ,
      cleanQ
    );
  }

  public async updateUserRole(userId: string, newRole: UserRole, currentAdminId?: string): Promise<{ success: boolean; newVersion?: number; error?: string }> {
    this.ensureSchema();
    if (currentAdminId && userId === currentAdminId && newRole !== "administrator") {
      return { success: false, error: "无法修改当前登录管理员自身的角色，防止后台锁定" };
    }
    const user = await this.getUserById(userId);
    if (!user) {
      return { success: false, error: "用户不存在" };
    }
    const now = new Date().toISOString();
    const newVersion = (user.token_version || 1) + 1;
    this.ctx.storage.sql.exec(
      "UPDATE users SET role = ?, token_version = ?, updated_at = ? WHERE id = ?",
      newRole,
      newVersion,
      now,
      userId
    );
    return { success: true, newVersion };
  }

  public async deleteUser(userId: string, currentAdminId?: string): Promise<{ success: boolean; error?: string }> {
    this.ensureSchema();
    if (currentAdminId && userId === currentAdminId) {
      return { success: false, error: "无法删除当前登录的管理员账户" };
    }
    const user = await this.getUserById(userId);
    if (!user) {
      return { success: false, error: "用户不存在" };
    }
    if (user.role === "administrator") {
      const adminCountRows = this.queryRows<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE role = 'administrator'");
      if ((adminCountRows[0]?.count || 0) <= 1) {
        return { success: false, error: "系统至少需要保留一名超级管理员，无法删除最后一名管理员" };
      }
    }
    this.ctx.storage.sql.exec("DELETE FROM users WHERE id = ?", userId);
    this.ctx.storage.sql.exec("DELETE FROM oauth_logs WHERE user_id = ?", userId);
    return { success: true };
  }

  // --- OAuth Client Management ---
  public async createOAuthClient(data: {
    client_name: string;
    redirect_uris: string[];
    scopes?: string;
    is_trusted?: boolean;
  }): Promise<{ client: OAuthClient; plainSecret: string }> {
    this.ensureSchema();
    const id = `client_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const plainSecret = `sec_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
    const clientSecretHash = await hashPassword(plainSecret);
    const now = new Date().toISOString();
    const scopes = data.scopes || "openid profile email role";
    const isTrusted = data.is_trusted !== false ? 1 : 0;
    const urisJson = JSON.stringify(data.redirect_uris || []);

    this.ctx.storage.sql.exec(
      `INSERT INTO oauth_clients (id, client_secret_hash, client_name, redirect_uris, scopes, is_trusted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      clientSecretHash,
      data.client_name,
      urisJson,
      scopes,
      isTrusted,
      now,
      now
    );

    return {
      client: {
        id,
        client_secret_hash: clientSecretHash,
        client_name: data.client_name,
        redirect_uris: data.redirect_uris,
        scopes,
        is_trusted: isTrusted === 1,
        created_at: now,
        updated_at: now
      },
      plainSecret
    };
  }

  public async getOAuthClientById(id: string): Promise<OAuthClient | null> {
    this.ensureSchema();
    const rows = this.queryRows<any>("SELECT * FROM oauth_clients WHERE id = ?", id);
    if (rows.length === 0) return null;
    const r = rows[0];
    let uris: string[] = [];
    try {
      uris = JSON.parse(r.redirect_uris);
    } catch {
      uris = [r.redirect_uris];
    }
    return {
      id: r.id,
      client_secret_hash: r.client_secret_hash,
      client_name: r.client_name,
      redirect_uris: uris,
      scopes: r.scopes,
      is_trusted: r.is_trusted === 1,
      created_at: r.created_at,
      updated_at: r.updated_at
    };
  }

  public async listOAuthClients(): Promise<OAuthClient[]> {
    this.ensureSchema();
    const rows = this.queryRows<any>("SELECT * FROM oauth_clients ORDER BY created_at DESC");
    return rows.map((r) => {
      let uris: string[] = [];
      try {
        uris = JSON.parse(r.redirect_uris);
      } catch {
        uris = [r.redirect_uris];
      }
      return {
        id: r.id,
        client_secret_hash: r.client_secret_hash,
        client_name: r.client_name,
        redirect_uris: uris,
        scopes: r.scopes,
        is_trusted: r.is_trusted === 1,
        created_at: r.created_at,
        updated_at: r.updated_at
      };
    });
  }

  public async deleteOAuthClient(id: string): Promise<boolean> {
    this.ensureSchema();
    this.ctx.storage.sql.exec("DELETE FROM oauth_clients WHERE id = ?", id);
    return true;
  }

  public async resetOAuthClientSecret(id: string): Promise<string | null> {
    this.ensureSchema();
    const rows = this.queryRows<any>("SELECT id FROM oauth_clients WHERE id = ?", id);
    if (rows.length === 0) return null;
    const plainSecret = `sec_${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
    const clientSecretHash = await hashPassword(plainSecret);
    const now = new Date().toISOString();
    this.ctx.storage.sql.exec(
      "UPDATE oauth_clients SET client_secret_hash = ?, updated_at = ? WHERE id = ?",
      clientSecretHash,
      now,
      id
    );
    return plainSecret;
  }

  // --- OAuth Log & Audit Methods ---
  public async recordOAuthLog(data: {
    userId: string;
    username: string;
    clientId: string;
    clientName: string;
    scope?: string;
    ip?: string;
  }): Promise<void> {
    this.ensureSchema();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.ctx.storage.sql.exec(
      `INSERT INTO oauth_logs (id, user_id, username, client_id, client_name, scope, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.userId,
      data.username,
      data.clientId,
      data.clientName || data.clientId,
      data.scope || "",
      data.ip || "",
      now
    );
  }

  public async queryOAuthLogs(filters: {
    userId?: string;
    username?: string;
    clientId?: string;
    startDate?: string;
    endDate?: string;
    period?: string;
    limit?: number;
  } = {}): Promise<OAuthLog[]> {
    this.ensureSchema();
    let sql = "SELECT * FROM oauth_logs WHERE 1=1";
    const params: any[] = [];

    if (filters.userId) {
      sql += " AND user_id = ?";
      params.push(filters.userId);
    }
    if (filters.username && filters.username.trim()) {
      sql += " AND LOWER(username) LIKE ?";
      params.push(`%${filters.username.trim().toLowerCase()}%`);
    }
    if (filters.clientId && filters.clientId.trim()) {
      sql += " AND client_id = ?";
      params.push(filters.clientId.trim());
    }
    if (filters.startDate && filters.startDate.trim()) {
      sql += " AND created_at >= ?";
      params.push(filters.startDate.trim());
    }
    if (filters.endDate && filters.endDate.trim()) {
      sql += " AND created_at <= ?";
      params.push(filters.endDate.trim());
    }
    if (filters.period && filters.period.trim()) {
      const nowMs = Date.now();
      let cutoffMs = 0;
      if (filters.period === "today") cutoffMs = nowMs - 86400000;
      else if (filters.period === "3d") cutoffMs = nowMs - 86400000 * 3;
      else if (filters.period === "7d") cutoffMs = nowMs - 86400000 * 7;
      else if (filters.period === "30d") cutoffMs = nowMs - 86400000 * 30;
      if (cutoffMs > 0) {
        sql += " AND created_at >= ?";
        params.push(new Date(cutoffMs).toISOString());
      }
    }

    sql += " ORDER BY created_at DESC LIMIT ?";
    params.push(filters.limit || 500);

    return this.queryRows<OAuthLog>(sql, ...params);
  }

  public async purgeOAuthLogs(retention: "all" | "1d" | "3d" | "7d" | "30d"): Promise<{ deletedCount: number }> {
    this.ensureSchema();
    if (retention === "all") {
      const countRow = this.queryRows<{ count: number }>("SELECT COUNT(*) as count FROM oauth_logs");
      const deletedCount = countRow[0]?.count || 0;
      this.ctx.storage.sql.exec("DELETE FROM oauth_logs");
      return { deletedCount };
    }

    const nowMs = Date.now();
    let days = 30;
    if (retention === "1d") days = 1;
    else if (retention === "3d") days = 3;
    else if (retention === "7d") days = 7;
    else if (retention === "30d") days = 30;

    const cutoff = new Date(nowMs - days * 86400000).toISOString();
    const countRow = this.queryRows<{ count: number }>("SELECT COUNT(*) as count FROM oauth_logs WHERE created_at < ?", cutoff);
    const deletedCount = countRow[0]?.count || 0;
    this.ctx.storage.sql.exec("DELETE FROM oauth_logs WHERE created_at < ?", cutoff);
    return { deletedCount };
  }

  // --- Verification Code Methods ---
  public async saveVerificationCode(email: string, code: string, purpose: string, ttlSeconds = 300): Promise<void> {
    this.ensureSchema();
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + ttlSeconds;

    // Remove older codes for this email and purpose
    this.ctx.storage.sql.exec("DELETE FROM verification_codes WHERE email = ? AND purpose = ?", email.toLowerCase(), purpose);

    this.ctx.storage.sql.exec(
      `INSERT INTO verification_codes (id, email, code, purpose, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      email.toLowerCase(),
      code,
      purpose,
      expiresAt,
      now
    );
  }

  public async verifyAndConsumeCode(email: string, code: string, purpose: string): Promise<boolean> {
    this.ensureSchema();
    const now = Math.floor(Date.now() / 1000);
    const rows = this.queryRows<{ id: string }>(
      "SELECT id FROM verification_codes WHERE email = ? AND code = ? AND purpose = ? AND expires_at > ?",
      email.toLowerCase(),
      code,
      purpose,
      now
    );

    if (rows.length > 0) {
      this.ctx.storage.sql.exec("DELETE FROM verification_codes WHERE id = ?", rows[0].id);
      return true;
    }
    return false;
  }

  public async verifyCodeWithoutConsuming(email: string, code: string, purpose: string): Promise<boolean> {
    this.ensureSchema();
    const now = Math.floor(Date.now() / 1000);
    const rows = this.queryRows<{ id: string }>(
      "SELECT id FROM verification_codes WHERE email = ? AND code = ? AND purpose = ? AND expires_at > ?",
      email.toLowerCase(),
      code,
      purpose,
      now
    );
    return rows.length > 0;
  }

  public async consumeCode(email: string, purpose: string): Promise<void> {
    this.ensureSchema();
    this.ctx.storage.sql.exec("DELETE FROM verification_codes WHERE email = ? AND purpose = ?", email.toLowerCase(), purpose);
  }

  // --- Taxonomy Methods ---
  public async getOrCreateCategory(name: string, slug?: string): Promise<Category> {
    this.ensureSchema();
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const existing = this.queryRows<Category>("SELECT * FROM categories WHERE slug = ? OR name = ?", finalSlug, name);
    if (existing.length > 0) return existing[0];

    const id = crypto.randomUUID();
    this.ctx.storage.sql.exec("INSERT INTO categories (id, name, slug, description) VALUES (?, ?, ?, '')", id, name, finalSlug);
    return { id, name, slug: finalSlug, description: "" };
  }

  public async getOrCreateTag(name: string, slug?: string): Promise<Tag> {
    this.ensureSchema();
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const existing = this.queryRows<Tag>("SELECT * FROM tags WHERE slug = ? OR name = ?", finalSlug, name);
    if (existing.length > 0) return existing[0];

    const id = crypto.randomUUID();
    this.ctx.storage.sql.exec("INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)", id, name, finalSlug);
    return { id, name, slug: finalSlug };
  }

  public async listCategories(): Promise<Category[]> {
    this.ensureSchema();
    return this.queryRows<Category>(`
      SELECT c.*, COUNT(pt.post_id) as post_count
      FROM categories c
      LEFT JOIN post_terms pt ON c.id = pt.term_id AND pt.term_type = 'category'
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
  }

  public async listTags(): Promise<Tag[]> {
    this.ensureSchema();
    return this.queryRows<Tag>(`
      SELECT t.*, COUNT(pt.post_id) as post_count
      FROM tags t
      LEFT JOIN post_terms pt ON t.id = pt.term_id AND pt.term_type = 'tag'
      GROUP BY t.id
      ORDER BY t.name ASC
    `);
  }

  private setPostTerms(postId: string, categoryIds: string[], tagIds: string[]): void {
    this.ctx.storage.sql.exec("DELETE FROM post_terms WHERE post_id = ?", postId);
    for (const catId of categoryIds) {
      if (catId) {
        this.ctx.storage.sql.exec("INSERT INTO post_terms (post_id, term_type, term_id) VALUES (?, 'category', ?)", postId, catId);
      }
    }
    for (const tagId of tagIds) {
      if (tagId) {
        this.ctx.storage.sql.exec("INSERT INTO post_terms (post_id, term_type, term_id) VALUES (?, 'tag', ?)", postId, tagId);
      }
    }
  }

  private getPostTerms(postId: string): { categories: Category[]; tags: Tag[] } {
    const categories = this.queryRows<Category>(`
      SELECT c.* FROM categories c
      JOIN post_terms pt ON c.id = pt.term_id AND pt.term_type = 'category'
      WHERE pt.post_id = ?
    `, postId);

    const tags = this.queryRows<Tag>(`
      SELECT t.* FROM tags t
      JOIN post_terms pt ON t.id = pt.term_id AND pt.term_type = 'tag'
      WHERE pt.post_id = ?
    `, postId);

    return { categories, tags };
  }

  // --- Post Management Methods ---
  public async createPost(data: {
    slug: string;
    title: string;
    content_html: string;
    content_raw: string;
    excerpt?: string;
    status?: PostStatus;
    author_id: string;
    featured_image?: string;
    category_ids?: string[];
    tag_ids?: string[];
  }): Promise<Post> {
    this.ensureSchema();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const status = data.status || "draft";
    const excerpt = data.excerpt || data.content_html.replace(/<[^>]*>/g, "").slice(0, 150) + "...";
    const featuredImage = data.featured_image || "";

    this.ctx.storage.sql.exec(
      `INSERT INTO posts (id, slug, title, content_html, content_raw, excerpt, status, author_id, featured_image, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.slug,
      data.title,
      data.content_html,
      data.content_raw,
      excerpt,
      status,
      data.author_id,
      featuredImage,
      now,
      now
    );

    if (data.category_ids || data.tag_ids) {
      this.setPostTerms(id, data.category_ids || [], data.tag_ids || []);
    }

    await this.invalidateCache([data.slug]);

    return (await this.getPostById(id))!;
  }

  public async updatePost(
    id: string,
    data: Partial<{
      slug: string;
      title: string;
      content_html: string;
      content_raw: string;
      excerpt: string;
      status: PostStatus;
      featured_image: string;
      category_ids: string[];
      tag_ids: string[];
    }>
  ): Promise<Post | null> {
    this.ensureSchema();
    const existing = await this.getPostById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const oldSlug = existing.slug;
    const newSlug = data.slug !== undefined ? data.slug : existing.slug;
    const title = data.title !== undefined ? data.title : existing.title;
    const contentHtml = data.content_html !== undefined ? data.content_html : existing.content_html;
    const contentRaw = data.content_raw !== undefined ? data.content_raw : existing.content_raw;
    const excerpt = data.excerpt !== undefined ? data.excerpt : existing.excerpt;
    const status = data.status !== undefined ? data.status : existing.status;
    const featuredImage = data.featured_image !== undefined ? data.featured_image : (existing.featured_image || "");

    this.ctx.storage.sql.exec(
      `UPDATE posts SET slug = ?, title = ?, content_html = ?, content_raw = ?, excerpt = ?, status = ?, featured_image = ?, updated_at = ?
       WHERE id = ?`,
      newSlug,
      title,
      contentHtml,
      contentRaw,
      excerpt,
      status,
      featuredImage,
      now,
      id
    );

    if (data.category_ids !== undefined || data.tag_ids !== undefined) {
      const currentTerms = this.getPostTerms(id);
      const catIds = data.category_ids !== undefined ? data.category_ids : currentTerms.categories.map((c) => c.id);
      const tagIds = data.tag_ids !== undefined ? data.tag_ids : currentTerms.tags.map((t) => t.id);
      this.setPostTerms(id, catIds, tagIds);
    }

    await this.invalidateCache([oldSlug, newSlug]);

    return this.getPostById(id);
  }

  public async deletePost(id: string): Promise<boolean> {
    this.ensureSchema();
    const post = await this.getPostById(id);
    if (!post) return false;

    this.ctx.storage.sql.exec("DELETE FROM posts WHERE id = ?", id);
    this.ctx.storage.sql.exec("DELETE FROM post_terms WHERE post_id = ?", id);
    this.ctx.storage.sql.exec("DELETE FROM comments WHERE post_id = ?", id);

    await this.invalidateCache([post.slug]);
    return true;
  }

  public async getPostBySlug(slug: string): Promise<Post | null> {
    this.ensureSchema();
    const rows = this.queryRows<Post>(`
      SELECT p.*, u.display_name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.slug = ?
    `, slug);

    if (rows.length === 0) return null;
    const post = rows[0];
    const terms = this.getPostTerms(post.id);
    post.categories = terms.categories;
    post.tags = terms.tags;
    return post;
  }

  public async getPostById(id: string): Promise<Post | null> {
    this.ensureSchema();
    const rows = this.queryRows<Post>(`
      SELECT p.*, u.display_name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `, id);

    if (rows.length === 0) return null;
    const post = rows[0];
    const terms = this.getPostTerms(post.id);
    post.categories = terms.categories;
    post.tags = terms.tags;
    return post;
  }

  public async listPosts(options?: {
    status?: PostStatus;
    page?: number;
    limit?: number;
    categorySlug?: string;
    tagSlug?: string;
    search?: string;
  }): Promise<{ posts: Post[]; total: number; page: number; totalPages: number }> {
    this.ensureSchema();
    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, options?.limit || 10);
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params: (string | number)[] = [];

    if (options?.status) {
      whereClause += " AND p.status = ?";
      params.push(options.status);
    }

    if (options?.categorySlug) {
      whereClause += ` AND p.id IN (
        SELECT pt.post_id FROM post_terms pt
        JOIN categories c ON pt.term_id = c.id
        WHERE pt.term_type = 'category' AND c.slug = ?
      )`;
      params.push(options.categorySlug);
    }

    if (options?.tagSlug) {
      whereClause += ` AND p.id IN (
        SELECT pt.post_id FROM post_terms pt
        JOIN tags t ON pt.term_id = t.id
        WHERE pt.term_type = 'tag' AND t.slug = ?
      )`;
      params.push(options.tagSlug);
    }

    if (options?.search) {
      whereClause += " AND (p.title LIKE ? OR p.content_html LIKE ?)";
      const pattern = `%${options.search}%`;
      params.push(pattern, pattern);
    }

    // Count total
    const countSql = `SELECT COUNT(*) as count FROM posts p ${whereClause}`;
    const countRows = this.queryRows<{ count: number }>(countSql, ...params);
    const total = countRows[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // Fetch page items
    const querySql = `
      SELECT p.*, u.display_name as author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const queryParams = [...params, limit, offset];
    const posts = this.queryRows<Post>(querySql, ...queryParams);

    for (const post of posts) {
      const terms = this.getPostTerms(post.id);
      post.categories = terms.categories;
      post.tags = terms.tags;
    }

    return { posts, total, page, totalPages };
  }

  // --- Comment Management Methods ---
  public async createComment(data: {
    post_id: string;
    parent_id?: string | null;
    author_name: string;
    author_email: string;
    content: string;
    status?: CommentStatus;
  }): Promise<Comment> {
    this.ensureSchema();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const status = data.status || "approved";

    this.ctx.storage.sql.exec(
      `INSERT INTO comments (id, post_id, parent_id, author_name, author_email, content, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.post_id,
      data.parent_id || null,
      data.author_name,
      data.author_email.toLowerCase(),
      data.content,
      status,
      now
    );

    const post = await this.getPostById(data.post_id);
    if (post) {
      await this.invalidateCache([post.slug]);
    }

    return {
      id,
      post_id: data.post_id,
      parent_id: data.parent_id || null,
      author_name: data.author_name,
      author_email: data.author_email.toLowerCase(),
      content: data.content,
      status,
      created_at: now
    };
  }

  public async getCommentsByPostId(postId: string, approvedOnly = true): Promise<Comment[]> {
    this.ensureSchema();
    const sql = approvedOnly
      ? "SELECT * FROM comments WHERE post_id = ? AND status = 'approved' ORDER BY created_at ASC"
      : "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC";

    const flatComments = this.queryRows<Comment>(sql, postId);

    // Structure into comment tree
    const map = new Map<string, Comment>();
    const roots: Comment[] = [];

    for (const c of flatComments) {
      c.replies = [];
      map.set(c.id, c);
    }

    for (const c of flatComments) {
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.replies!.push(c);
      } else {
        roots.push(c);
      }
    }

    return roots;
  }

  public async updateCommentStatus(id: string, status: CommentStatus): Promise<boolean> {
    this.ensureSchema();
    const rows = this.queryRows<{ post_id: string }>("SELECT post_id FROM comments WHERE id = ?", id);
    if (rows.length === 0) return false;

    this.ctx.storage.sql.exec("UPDATE comments SET status = ? WHERE id = ?", status, id);
    const post = await this.getPostById(rows[0].post_id);
    if (post) {
      await this.invalidateCache([post.slug]);
    }
    return true;
  }

  public async deleteComment(id: string): Promise<boolean> {
    this.ensureSchema();
    const rows = this.queryRows<{ post_id: string }>("SELECT post_id FROM comments WHERE id = ?", id);
    if (rows.length === 0) return false;

    this.ctx.storage.sql.exec("DELETE FROM comments WHERE id = ? OR parent_id = ?", id, id);
    const post = await this.getPostById(rows[0].post_id);
    if (post) {
      await this.invalidateCache([post.slug]);
    }
    return true;
  }

  public async listAllComments(): Promise<Comment[]> {
    this.ensureSchema();
    return this.queryRows<Comment>("SELECT * FROM comments ORDER BY created_at DESC");
  }

  // --- Media Metadata Methods ---
  public async recordMediaUpload(data: {
    filename: string;
    mime_type: string;
    size: number;
    r2_key: string;
    uploader_id?: string;
  }): Promise<MediaMeta> {
    this.ensureSchema();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.ctx.storage.sql.exec(
      `INSERT INTO media_metadata (id, filename, mime_type, size, r2_key, uploader_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      data.filename,
      data.mime_type,
      data.size,
      data.r2_key,
      data.uploader_id || null,
      now
    );

    return {
      id,
      filename: data.filename,
      mime_type: data.mime_type,
      size: data.size,
      r2_key: data.r2_key,
      uploader_id: data.uploader_id,
      created_at: now
    };
  }

  public async listMedia(): Promise<MediaMeta[]> {
    this.ensureSchema();
    return this.queryRows<MediaMeta>("SELECT * FROM media_metadata ORDER BY created_at DESC");
  }

  public async getMediaByR2Key(key: string): Promise<MediaMeta | null> {
    this.ensureSchema();
    const rows = this.queryRows<MediaMeta>("SELECT * FROM media_metadata WHERE r2_key = ?", key);
    return rows.length > 0 ? rows[0] : null;
  }

  public async deleteMediaMeta(id: string): Promise<MediaMeta | null> {
    this.ensureSchema();
    const rows = this.queryRows<MediaMeta>("SELECT * FROM media_metadata WHERE id = ?", id);
    if (rows.length === 0) return null;

    this.ctx.storage.sql.exec("DELETE FROM media_metadata WHERE id = ?", id);
    return rows[0];
  }

  // --- Full Backup Export & Import ---
  public async exportFullBackup(): Promise<BlogBackupData> {
    this.ensureSchema();
    const optionsRows = this.queryRows<{ key: string; value: string }>("SELECT key, value FROM site_options");
    const siteOptions: Record<string, string> = {};
    for (const r of optionsRows) {
      siteOptions[r.key] = r.value;
    }

    const users = this.queryRows<Omit<User, "password_hash">>("SELECT id, username, email, role, display_name, created_at, updated_at FROM users");
    const posts = this.queryRows<Post>("SELECT * FROM posts");
    const categories = this.queryRows<Category>("SELECT * FROM categories");
    const tags = this.queryRows<Tag>("SELECT * FROM tags");
    const postTerms = this.queryRows<any>("SELECT * FROM post_terms");
    const comments = this.queryRows<Comment>("SELECT * FROM comments");
    const mediaMetadata = this.queryRows<MediaMeta>("SELECT * FROM media_metadata");

    return {
      version: "1.0.0",
      exported_at: new Date().toISOString(),
      site_options: siteOptions,
      users,
      posts,
      categories,
      tags,
      post_terms: postTerms,
      comments,
      media_metadata: mediaMetadata
    };
  }
}

// ⚠️ SECURITY: Sanitize footer HTML to prevent stored XSS while allowing basic formatting
function sanitizeFooterHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/on\w+\s*=\s*\S+/gi, "")
    .replace(/javascript\s*:/gi, "blocked:")
    .replace(/<link[\s\S]*?>/gi, "");
}
