import { SiteOptions } from "../types/blog";
import { THEME_DARK_CSS } from "./block-styles";
import { getAllThemeMetas } from "../themes";

export function renderAdminPageHtml(site: SiteOptions, turnstileSiteKey?: string): string {
  const allThemes = getAllThemeMetas();
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>控制台 - ${site.site_name}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/markdown-it/13.0.2/markdown-it.min.js"></script>
  <style>
${THEME_DARK_CSS}

/* Admin Dashboard Specific Styles */
.admin-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}

.admin-sidebar {
  background: #111419;
  border-right: 1px solid #222834;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-brand {
  font-size: 18px;
  font-weight: 700;
  color: #38bdf8;
  padding: 0 12px 20px 12px;
  border-bottom: 1px solid #222834;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.admin-nav-item:hover, .admin-nav-item.active {
  background: #1e2530;
  color: #f8fafc;
  text-decoration: none;
}

.admin-content {
  padding: 32px 40px;
  max-width: 1080px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: 1px solid #222834;
}

.admin-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #f8fafc;
}

/* Stats Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--wp--preset--color--surface);
  border: 1px solid var(--wp--preset--color--border);
  border-radius: 10px;
  padding: 20px;
}

.stat-val {
  font-size: 28px;
  font-weight: 700;
  color: #38bdf8;
  margin: 6px 0 0 0;
}

.stat-label {
  font-size: 13px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Data Table with clear borders and column dividers */
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--wp--preset--color--surface);
  border: 1px solid var(--wp--preset--color--border);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 24px;
}

.data-table th {
  background: #141820;
  color: #94a3b8;
  font-weight: 600;
  font-size: 13px;
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid var(--wp--preset--color--border);
  border-right: 1px solid #1f2735;
  white-space: nowrap;
}

.data-table th:last-child {
  border-right: none;
}

.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--wp--preset--color--border);
  border-right: 1px solid #1a202c;
  font-size: 13px;
  color: #e2e8f0;
  vertical-align: middle;
}

.data-table td:last-child {
  border-right: none;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: #19202b;
}

/* Gutenberg Visual Block Editor & Toolbar */
.editor-mode-switcher {
  display: inline-flex;
  background: #141922;
  padding: 3px;
  border-radius: 6px;
  border: 1px solid #232d3d;
}

.mode-tab-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mode-tab-btn:hover {
  color: #f8fafc;
}

.mode-tab-btn.active {
  background: #202938;
  color: #38bdf8;
  font-weight: 600;
}

.guten-quick-btn {
  background: #19202c;
  color: #cbd5e1;
  border: 1px solid #293447;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.guten-quick-btn:hover {
  background: #263345;
  color: #38bdf8;
  border-color: #38bdf8;
}

.visual-block-card {
  background: #11151c;
  border: 1px solid #1f2735;
  border-radius: 8px;
  padding: 16px 18px;
  transition: border-color 0.15s, box-shadow 0.15s;
  position: relative;
}

.visual-block-card:hover, .visual-block-card:focus-within {
  border-color: #38bdf8;
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.25);
}

.visual-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #1a222e;
}

.visual-block-type {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.visual-block-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.block-action-btn {
  background: #171d27;
  color: #94a3b8;
  border: 1px solid #242f40;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.block-action-btn:hover {
  background: #273446;
  color: #f8fafc;
}

.block-action-btn.delete:hover {
  background: #7f1d1d;
  color: #fca5a5;
  border-color: #ef4444;
}

.block-heading-input {
  width: 100%;
  background: #090c10;
  border: 1px solid #1f2735;
  border-radius: 6px;
  color: #f8fafc;
  font-size: 20px;
  font-weight: 700;
  padding: 12px 14px;
  outline: none;
}

.block-heading-input:focus {
  border-color: #38bdf8;
}

.block-paragraph-input {
  width: 100%;
  background: #090c10;
  border: 1px solid #1f2735;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 15px;
  line-height: 1.65;
  padding: 12px 14px;
  outline: none;
  resize: vertical;
  min-height: 80px;
}

.block-paragraph-input:focus {
  border-color: #38bdf8;
}

.block-code-input {
  width: 100%;
  background: #06080b;
  border: 1px solid #1f2735;
  border-radius: 6px;
  color: #38bdf8;
  font-family: var(--wp--custom--font-family--mono);
  font-size: 13px;
  line-height: 1.5;
  padding: 12px 14px;
  outline: none;
  resize: vertical;
  min-height: 100px;
}

.block-code-input:focus {
  border-color: #38bdf8;
}

.level-badge-btn {
  background: #171d27;
  color: #94a3b8;
  border: 1px solid #242f40;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.level-badge-btn.active {
  background: #38bdf8;
  color: #0b1120;
  border-color: #38bdf8;
}

/* Gutenberg Editor Panel */
.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  background: #161a20;
  padding: 12px;
  border: 1px solid #262c36;
  border-radius: 8px 8px 0 0;
}

.editor-tool-btn {
  background: #202630;
  color: #e2e8f0;
  border: 1px solid #2e3644;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.editor-tool-btn:hover {
  background: #2b3342;
}

.editor-textarea {
  width: 100%;
  min-height: 420px;
  background: #0d0f12;
  border: 1px solid #262c36;
  border-top: none;
  border-radius: 0 0 8px 8px;
  color: #f8fafc;
  padding: 18px;
  font-family: var(--wp--custom--font-family--mono);
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
}

/* Block Inserter Modal */
.block-picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.block-picker-item {
  background: #161c26;
  border: 1px solid #232d3d;
  border-radius: 8px;
  padding: 14px 10px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.block-picker-item:hover {
  background: #202a3a;
  border-color: #38bdf8;
  transform: translateY(-2px);
}

.block-picker-icon {
  font-size: 24px;
  margin-bottom: 6px;
  display: block;
}

.block-picker-title {
  font-size: 13px;
  font-weight: 600;
  color: #f8fafc;
  display: block;
}

.block-picker-desc {
  font-size: 11px;
  color: #64748b;
  margin-top: 2px;
  display: block;
}

/* Mobile Adaptive Layout */
.mobile-editor-bar {
  display: none;
}

@media (max-width: 768px) {
  .admin-layout {
    grid-template-columns: 1fr !important;
  }
  .admin-sidebar {
    display: flex !important;
    flex-direction: row !important;
    overflow-x: auto;
    white-space: nowrap;
    padding: 10px 12px !important;
    border-right: none !important;
    border-bottom: 1px solid #222834;
    gap: 6px;
    background: #0f1217;
    position: sticky;
    top: 0;
    z-index: 90;
  }
  .admin-sidebar > div:last-child, .admin-brand {
    display: none !important;
  }
  .admin-nav-item {
    padding: 6px 12px !important;
    font-size: 13px !important;
    flex-shrink: 0;
  }
  .admin-content {
    padding: 16px 12px 90px 12px !important;
  }
  .mobile-editor-bar {
    display: flex !important;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #11161f;
    border-top: 1px solid #252f40;
    padding: 10px 14px;
    z-index: 1000;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    box-shadow: 0 -6px 20px rgba(0,0,0,0.5);
  }
  .mobile-editor-bar button {
    flex: 1;
    text-align: center;
    padding: 10px 6px !important;
    min-height: 42px;
  }
}

/* Auth Modal */
.auth-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.auth-card {
  background: #161a20;
  border: 1px solid #262c36;
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  padding: 32px;
}

.entry-content table, .wp-block-table table {
  width: 100%;
  border-collapse: collapse;
  margin: 24px 0;
  font-size: 14px;
}

.entry-content th, .entry-content td, .wp-block-table th, .wp-block-table td {
  border: 1px solid #262c36;
  padding: 10px 14px;
  text-align: left;
}

.entry-content th, .wp-block-table th {
  background: #161a20;
  color: #f8fafc;
  font-weight: 600;
}
  </style>
  ${turnstileSiteKey ? `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" defer></script>` : ""}
</head>
<body>

<div id="auth-modal" class="auth-modal-overlay" style="display: none;">
  <div class="auth-card">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
      <h3 id="auth-title" style="margin:0; font-size: 20px; color: #f8fafc;">登录控制台</h3>
      <div style="font-size:13px; display:flex; gap:10px;">
        <span style="color:#38bdf8; cursor:pointer;" onclick="switchAuthMode('login')" id="auth-tab-login" style="font-weight:700;">登录</span>
        <span style="color:#94a3b8;">|</span>
        <span style="color:#94a3b8; cursor:pointer;" onclick="switchAuthMode('register')" id="auth-tab-register">注册</span>
        <span style="color:#94a3b8;">|</span>
        <span style="color:#94a3b8; cursor:pointer;" onclick="switchAuthMode('reset')" id="auth-tab-reset">找回密码</span>
      </div>
    </div>

    <!-- Login Form -->
    <form id="login-form" onsubmit="return handleLogin(event)">
      <div class="form-group">
        <label>账号 / 邮箱</label>
        <input type="text" id="login-account" class="form-control" required placeholder="用户名或邮箱" />
      </div>
      <div class="form-group">
        <label>密码</label>
        <input type="password" id="login-password" class="form-control" required placeholder="账户密码" />
      </div>
      <div id="turnstile-shared-box" style="margin-bottom:14px;">
        ${turnstileSiteKey ? `<div class="cf-turnstile" data-sitekey="${turnstileSiteKey}" data-theme="dark" data-callback="tsSharedDone" data-expired-callback="tsSharedExpired" id="turnstile-shared-widget"></div>` : ""}
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%;" id="login-btn">立即登录</button>
      <div id="login-msg" style="margin-top:12px; font-size:13px; text-align:center;"></div>
    </form>

    <!-- Register Form -->
    <form id="register-form" style="display:none;" onsubmit="return handleRegister(event)">
      <div class="form-group">
        <label>用户名</label>
        <input type="text" id="reg-username" class="form-control" required placeholder="3-30位英文字符" />
      </div>
      <div class="form-group">
        <label>电子邮箱</label>
        <div style="display:flex; gap:8px;">
          <input type="email" id="reg-email" class="form-control" required placeholder="your@email.com" />
          <button type="button" class="btn" style="background:#202630; color:#e2e8f0; white-space:nowrap;" onclick="sendEmailCode('register')" id="send-code-btn">发送验证码</button>
        </div>
      </div>
      <div class="form-group">
        <label>邮箱 6 位验证码</label>
        <input type="text" id="reg-code" class="form-control" required placeholder="6位数字" />
      </div>
      <div class="form-group">
        <label>设置密码</label>
        <input type="password" id="reg-password" class="form-control" required placeholder="不少于6位" />
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%;" id="reg-btn">完成注册并登录</button>
      <div id="reg-msg" style="margin-top:12px; font-size:13px; text-align:center;"></div>
    </form>

    <!-- Reset Password Form (Forgot Password) -->
    <form id="reset-form" style="display:none;" onsubmit="return handleResetPassword(event)">
      <div class="form-group">
        <label>注册电子邮箱</label>
        <div style="display:flex; gap:8px;">
          <input type="email" id="reset-email" class="form-control" required placeholder="your@email.com" />
          <button type="button" class="btn" style="background:#202630; color:#e2e8f0; white-space:nowrap;" onclick="sendEmailCode('reset')" id="send-reset-code-btn">发送验证码</button>
        </div>
      </div>
      <div class="form-group">
        <label>邮箱 6 位验证码</label>
        <input type="text" id="reset-code" class="form-control" required placeholder="6位数字" />
      </div>
      <div class="form-group">
        <label>设置新密码</label>
        <input type="password" id="reset-password" class="form-control" required placeholder="不少于6位新密码" />
      </div>
      <button type="submit" class="btn btn-primary" style="width:100%;" id="reset-btn">重置密码并前往登录</button>
      <div id="reset-msg" style="margin-top:12px; font-size:13px; text-align:center;"></div>
    </form>
  </div>
</div>

<!-- Block Inserter Modal (Gutenberg Block Library) -->
<div id="block-inserter-modal" class="auth-modal-overlay" style="display: none;" onclick="if(event.target===this)closeBlockInserterModal()">
  <div class="auth-card" style="max-width:540px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px; border-bottom:1px solid #222834; padding-bottom:12px;">
      <div>
        <h3 style="margin:0; font-size: 18px; color: #f8fafc;">添加区块</h3>
        <p style="margin:4px 0 0 0; font-size:12px; color:#94a3b8;">选择要插入的排版区块组件</p>
      </div>
      <button type="button" class="btn" style="padding:4px 8px; font-size:12px; background:#202630; color:#94a3b8;" onclick="closeBlockInserterModal()">关闭</button>
    </div>

    <div class="block-picker-grid">
      <div class="block-picker-item" onclick="selectBlockFromModal('paragraph')">
        <span class="block-picker-icon">P</span>
        <span class="block-picker-title">段落</span>
        <span class="block-picker-desc">正文排版段落</span>
      </div>
      <div class="block-picker-item" onclick="selectBlockFromModal('heading')">
        <span class="block-picker-icon">H</span>
        <span class="block-picker-title">标题</span>
        <span class="block-picker-desc">H2 / H3 / H4 章节</span>
      </div>
      <div class="block-picker-item" onclick="selectBlockFromModal('image')">
        <span class="block-picker-icon">IMG</span>
        <span class="block-picker-title">图像</span>
        <span class="block-picker-desc">展示图片与图注</span>
      </div>
      <div class="block-picker-item" onclick="selectBlockFromModal('code')">
        <span class="block-picker-icon">&lt;/&gt;</span>
        <span class="block-picker-title">代码块</span>
        <span class="block-picker-desc">等宽高亮代码</span>
      </div>
      <div class="block-picker-item" onclick="selectBlockFromModal('quote')">
        <span class="block-picker-icon">&ldquo;</span>
        <span class="block-picker-title">引用</span>
        <span class="block-picker-desc">引语与署名作者</span>
      </div>
      <div class="block-picker-item" onclick="selectBlockFromModal('list')">
        <span class="block-picker-icon">•</span>
        <span class="block-picker-title">列表</span>
        <span class="block-picker-desc">无序 / 有序要点</span>
      </div>
      <div class="block-picker-item" onclick="selectBlockFromModal('separator')">
        <span class="block-picker-icon">—</span>
        <span class="block-picker-title">分割线</span>
        <span class="block-picker-desc">水平分界线</span>
      </div>
      <div class="block-picker-item" onclick="selectBlockFromModal('html')">
        <span class="block-picker-icon">&lt;HTML&gt;</span>
        <span class="block-picker-title">自定义 HTML</span>
        <span class="block-picker-desc">嵌入任意代码</span>
      </div>
    </div>
  </div>
</div>

<div class="admin-layout" id="admin-main">
  <!-- Sidebar -->
  <aside class="admin-sidebar">
    <div class="admin-brand">
      <span>控制台</span>
      <a href="/" target="_blank" style="font-size:12px; color:#94a3b8;">查看博客 &nearr;</a>
    </div>
    <div class="admin-nav-item active" onclick="showTab('overview')" id="nav-overview">概览数据</div>
    <div class="admin-nav-item" onclick="showTab('posts')" id="nav-posts">文章管理</div>
    <div class="admin-nav-item" onclick="showTab('editor')" id="nav-editor">新建文章</div>
    <div class="admin-nav-item" onclick="showTab('comments')" id="nav-comments">评论审核</div>
    <div class="admin-nav-item" onclick="showTab('media')" id="nav-media">媒体库</div>
    <div class="admin-nav-item" onclick="showTab('hotp')" id="nav-hotp">HOTP 密钥池</div>
    <div class="admin-nav-item" onclick="showTab('oauth')" id="nav-oauth">OAuth 应用</div>
    <div class="admin-nav-item" onclick="showTab('backup')" id="nav-backup">数据备份</div>
    <div class="admin-nav-item" onclick="showTab('options')" id="nav-options">系统设置</div>

    <div style="margin-top: auto; padding-top: 20px; border-top: 1px solid #222834;">
      <div style="font-size:13px; color:#94a3b8; margin-bottom:8px;" id="current-user-info">加载中...</div>
      <button onclick="handleLogout()" class="btn" style="width:100%; background:#202630; color:#ef4444; font-size:13px; padding:6px 0;">安全登出</button>
    </div>
  </aside>

  <!-- Main Content Area -->
  <main class="admin-content">
    <!-- 1. Overview Tab -->
    <section id="tab-overview">
      <div class="admin-header">
        <h2>系统总览</h2>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">已发布文章</div>
          <div class="stat-val" id="stat-posts">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">媒体附件数</div>
          <div class="stat-val" id="stat-media">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">评论总数</div>
          <div class="stat-val" id="stat-comments">0</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">注册用户数</div>
          <div class="stat-val" id="stat-users">0</div>
        </div>
      </div>
    </section>

    <!-- 2. Posts Tab -->
    <section id="tab-posts" style="display:none;">
      <div class="admin-header">
        <h2>文章列表</h2>
        <button class="btn btn-primary" onclick="showTab('editor'); resetEditor();">新建文章</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>标题</th>
            <th>状态</th>
            <th>作者</th>
            <th>发布时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="posts-table-body">
          <tr><td colspan="5" style="text-align:center; color:#64748b;">加载文章列表中...</td></tr>
        </tbody>
      </table>
    </section>

    <!-- 3. Editor Tab (Gutenberg Visual Block Editor) -->
    <section id="tab-editor" style="display:none; padding-bottom:80px;">
      <div class="admin-header" style="flex-wrap:wrap; gap:12px;">
        <div>
          <h2 id="editor-heading" style="margin:0;">撰写新文章</h2>
          <span style="font-size:12px; color:#64748b;" id="editor-status-text">可视化区块排版模式</span>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
          <!-- Editor Mode Tabs -->
          <div class="editor-mode-switcher">
            <button type="button" class="mode-tab-btn active" id="btn-mode-visual" onclick="switchEditorMode('visual')">可视化区块</button>
            <button type="button" class="mode-tab-btn" id="btn-mode-code" onclick="switchEditorMode('code')">源码与 Markdown</button>
            <button type="button" class="mode-tab-btn" id="btn-mode-preview" onclick="switchEditorMode('preview')">实时排版预览</button>
          </div>
          <button class="btn" style="background:#202630; color:#e2e8f0;" onclick="savePost('draft')">存为草稿</button>
          <button class="btn btn-primary" onclick="savePost('published')">立即发布</button>
        </div>
      </div>

      <input type="hidden" id="edit-post-id" value="" />
      
      <!-- Article Title Input -->
      <div class="form-group" style="margin-bottom:20px;">
        <input type="text" id="post-title" class="form-control" style="font-size:22px; font-weight:700; padding:14px 18px; border-color:#2a3442;" placeholder="输入文章标题..." />
      </div>

      <!-- Collapsible Metadata Box -->
      <details style="background:#13171e; border:1px solid #222834; border-radius:8px; padding:14px 18px; margin-bottom:24px;">
        <summary style="font-size:13px; font-weight:600; color:#94a3b8; cursor:pointer; user-select:none;">
          文章高级设置
        </summary>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-top:16px;">
          <div class="form-group">
            <label>自定义别名 (选填)</label>
            <input type="text" id="post-slug" class="form-control" placeholder="例如 my-first-post，留空自动生成" />
          </div>
          <div class="form-group">
            <label>特色封面图链接 (选填)</label>
            <div style="display:flex; gap:8px;">
              <input type="text" id="post-featured-image" class="form-control" placeholder="https://... 或 /media/..." />
              <button type="button" class="btn" style="background:#202630; color:#cbd5e1; white-space:nowrap; font-size:12px;" onclick="showTab('media')">媒体库</button>
            </div>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label>文章摘要 (选填)</label>
          <textarea id="post-excerpt" class="form-control" rows="2" placeholder="文章简短摘要，留空将自动从正文中截取..."></textarea>
        </div>
      </details>

      <!-- 1. Visual Block Canvas Container -->
      <div id="editor-visual-container">
        <!-- Floating Quick Inserter Bar -->
        <div class="block-quick-toolbar" style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; background:#161a22; padding:10px 14px; border:1px solid #262e3b; border-radius:8px; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="font-size:12px; font-weight:600; color:#64748b; margin-right:4px;">快捷添加区块:</span>
            <button type="button" class="guten-quick-btn" onclick="addVisualBlock('paragraph')">段落</button>
            <button type="button" class="guten-quick-btn" onclick="addVisualBlock('heading', {level: 2})">标题</button>
            <button type="button" class="guten-quick-btn" onclick="addVisualBlock('image')">图片</button>
            <button type="button" class="guten-quick-btn" onclick="addVisualBlock('code')">代码</button>
            <button type="button" class="guten-quick-btn" onclick="addVisualBlock('quote')">引用</button>
            <button type="button" class="guten-quick-btn" onclick="addVisualBlock('list')">列表</button>
            <button type="button" class="guten-quick-btn" onclick="addVisualBlock('separator')">分割线</button>
          </div>
          <div>
            <button type="button" class="btn" style="background:#1e293b; color:#38bdf8; font-size:12px; padding:5px 10px;" onclick="openBlockInserterModal()">+ 全部区块库</button>
          </div>
        </div>

        <!-- The Interactive Block List Canvas -->
        <div id="visual-block-list" class="visual-block-list" style="display:flex; flex-direction:column; gap:16px;">
          <!-- Blocks dynamically rendered here -->
        </div>

        <!-- Big Bottom Add Block Button -->
        <div style="margin-top:20px; text-align:center;">
          <button type="button" class="btn" style="background:#151b24; color:#94a3b8; border:2px dashed #2a3545; width:100%; padding:14px; font-size:14px; font-weight:600; border-radius:8px;" onclick="openBlockInserterModal()">
            + 点击添加新区块
          </button>
        </div>
      </div>

      <!-- 2. Code / Markdown Container -->
      <div id="editor-code-container" style="display:none;">
        <div class="editor-toolbar" style="justify-content:space-between; align-items:center;">
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="editor-tool-btn" onclick="insertRawBlock('paragraph')">+ 段落区块</button>
            <button type="button" class="editor-tool-btn" onclick="insertRawBlock('heading')">+ 标题区块</button>
            <button type="button" class="editor-tool-btn" onclick="insertRawBlock('image')">+ 图片区块</button>
            <button type="button" class="editor-tool-btn" onclick="insertRawBlock('code')">+ 代码区块</button>
            <button type="button" class="editor-tool-btn" onclick="insertRawBlock('quote')">+ 引用区块</button>
            <button type="button" class="editor-tool-btn" onclick="insertRawBlock('list')">+ 列表区块</button>
            <button type="button" class="editor-tool-btn" onclick="insertRawBlock('separator')">+ 分割线</button>
          </div>
          <div>
            <button type="button" class="btn" style="background:#1e293b; color:#38bdf8; font-size:12px; padding:6px 12px; border:1px solid #38bdf8;" onclick="convertMarkdownTextareaToBlocks()">将 Markdown 转换为可视化区块</button>
          </div>
        </div>
        <textarea id="post-content-raw" class="editor-textarea" placeholder="在此输入或粘贴 Markdown 文本或 Gutenberg 代码..."></textarea>
      </div>

      <!-- 3. Live Preview Container -->
      <div id="editor-preview-container" style="display:none; background:#0e1218; border:1px solid #222834; border-radius:8px; padding:32px; min-height:400px;">
        <div id="editor-preview-title" style="font-size:28px; font-weight:800; color:#f8fafc; margin-bottom:20px; border-bottom:1px solid #262c36; padding-bottom:16px;"></div>
        <div id="editor-preview-content" class="entry-content" style="font-size:16px; line-height:1.7;"></div>
      </div>

      <!-- Mobile Floating Sticky Bottom Action Bar -->
      <div class="mobile-editor-bar">
        <button type="button" class="btn" style="background:#1c232f; color:#38bdf8; font-size:12px;" onclick="openBlockInserterModal()">+ 区块</button>
        <button type="button" class="btn" style="background:#1c232f; color:#e2e8f0; font-size:12px;" onclick="toggleMobilePreview()">预览</button>
        <button type="button" class="btn" style="background:#202630; color:#e2e8f0; font-size:12px;" onclick="savePost('draft')">存草稿</button>
        <button type="button" class="btn btn-primary" style="font-size:12px; padding:8px 14px;" onclick="savePost('published')">发布</button>
      </div>
    </section>

    <!-- 4. Comments Tab -->
    <section id="tab-comments" style="display:none;">
      <div class="admin-header">
        <h2>评论审核管理</h2>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>评论者</th>
            <th>内容</th>
            <th>状态</th>
            <th>时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="comments-table-body">
          <tr><td colspan="5" style="text-align:center; color:#64748b;">加载评论中...</td></tr>
        </tbody>
      </table>
    </section>

    <!-- 5. Media Tab -->
    <section id="tab-media" style="display:none;">
      <div class="admin-header">
        <h2>媒体文件库 (Cloudflare R2)</h2>
        <div>
          <input type="file" id="media-file-input" style="display:none;" onchange="uploadMediaFile(event)" />
          <button class="btn btn-primary" onclick="document.getElementById('media-file-input').click()">上传新媒体文件</button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>文件名</th>
            <th>类型</th>
            <th>大小</th>
            <th>CDN 访问地址</th>
            <th>上传时间</th>
          </tr>
        </thead>
        <tbody id="media-table-body">
          <tr><td colspan="5" style="text-align:center; color:#64748b;">加载媒体文件中...</td></tr>
        </tbody>
      </table>
    </section>

    <!-- 6. HOTP Tab -->
    <section id="tab-hotp" style="display:none;">
      <div class="admin-header">
        <h2>客制化 HOTP API 鉴权管理</h2>
      </div>
      <div class="post-card">
        <h3 style="margin-top:0; color:#f8fafc;">生成一次性 HOTP 密钥池</h3>
        <p style="color:#94a3b8; font-size:14px; line-height:1.6;">
          点击下方按钮将一次性生成 <strong>1000 个 10 位随机一次性鉴权密钥</strong> 并异步并发存入 Cloudflare KV。生成完成后将<strong>立即触发 .txt 文本文件流下载</strong>。<br/>
          <span style="color:#ef4444;">注意：服务端不保留任何下载副本，此后不再提供二次下载。每个密钥在调用开放 API 校验成功后将被即时核销销毁。</span>
        </p>
        <button class="btn btn-primary" onclick="generateHotpPool()" id="hotp-gen-btn">生成 HOTP 密钥池并下载</button>
        <span id="hotp-status" style="margin-left:14px; font-size:14px; color:#10b981;"></span>
      </div>
    </section>

    <!-- 7. Backup Tab -->
    <section id="tab-backup" style="display:none;">
      <div class="admin-header">
        <h2>全站数据一键备份</h2>
      </div>
      <div class="post-card">
        <h3 style="margin-top:0; color:#f8fafc;">Durable Objects 结构化数据库导出</h3>
        <p style="color:#94a3b8; font-size:14px; line-height:1.6;">
          将数据库中的所有用户、文章、分类、标签、评论、媒体元数据及站点设置打包为 JSON 文件下载到本地。
        </p>
        <a href="/api/admin/backup" class="btn btn-primary" download>下载数据备份</a>
      </div>
    </section>

    <!-- 8. OAuth Applications Tab -->
    <section id="tab-oauth" style="display:none;">
      <div class="admin-header" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 style="margin:0;">OAuth 客户端应用</h2>
          <p style="color:#94a3b8; font-size:13px; margin-top:4px;">将博客账号作为统一认证中心，为其他外部系统提供单点登录与鉴权</p>
        </div>
        <button class="btn btn-primary" onclick="toggleOAuthCreateModal()">+ 创建应用</button>
      </div>

      <div class="post-card" style="margin-bottom:20px; background:#111827;">
        <div style="font-size:13px; color:#38bdf8; font-weight:600; margin-bottom:6px;">配置地址</div>
        <div style="display:flex; align-items:center; gap:8px;">
          <input type="text" class="form-control" style="font-family:monospace; font-size:13px;" readonly id="oidc-discovery-url" />
          <button class="btn" style="white-space:nowrap; padding:6px 12px; font-size:12px; background:#1e293b; color:#38bdf8;" onclick="copyOidcUrl()">复制</button>
        </div>
      </div>

      <div class="post-card" id="oauth-create-card" style="display:none; margin-bottom:24px; border-color:#38bdf8;">
        <h3 style="margin-top:0; color:#f8fafc; font-size:18px;">注册新的接入系统</h3>
        <form onsubmit="return handleCreateOAuthApp(event)">
          <div class="form-group">
            <label>应用名称 *</label>
            <input type="text" id="oauth-name" class="form-control" required placeholder="例如: 知识库系统、论坛、运维面板" />
          </div>
          <div class="form-group">
            <label>回调地址 * (一行一个)</label>
            <textarea id="oauth-redirects" class="form-control" rows="3" required placeholder="https://app.example.com/api/auth/callback&#10;http://localhost:3000/api/auth/callback"></textarea>
          </div>
          <div class="form-group">
            <label>权限范围</label>
            <input type="text" id="oauth-scopes" class="form-control" value="openid profile email role" />
          </div>
          <div class="form-group" style="display:flex; align-items:center; gap:8px;">
            <input type="checkbox" id="oauth-trusted" checked style="width:auto;" />
            <label for="oauth-trusted" style="margin:0; cursor:pointer;">设为受信任应用，免二次授权确认</label>
          </div>
          <div style="display:flex; gap:10px;">
            <button type="submit" class="btn btn-primary" id="oauth-save-btn">确认创建应用</button>
            <button type="button" class="btn" style="background:#1e293b; color:#94a3b8;" onclick="toggleOAuthCreateModal()">取消</button>
          </div>
        </form>
      </div>

      <div id="oauth-new-secret-banner" style="display:none; margin-bottom:20px; padding:16px; background:#064e3b; border:1px solid #059669; border-radius:8px;">
        <h4 style="margin:0 0 6px 0; color:#34d399;">应用创建成功，请立即复制并保存客户端密钥</h4>
        <p style="font-size:13px; color:#e2e8f0; margin-bottom:8px;">客户端密钥仅在此处显示一次，离开页面后将无法再次查看。</p>
        <div style="display:flex; gap:8px; align-items:center;">
          <input type="text" id="new-secret-display" class="form-control" readonly style="font-family:monospace; color:#34d399; font-weight:700;" />
          <button class="btn" style="white-space:nowrap; padding:6px 12px; font-size:12px; background:#047857; color:#fff;" onclick="copyNewSecret()">复制密钥</button>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>应用名称</th>
            <th>Client ID</th>
            <th>回调地址</th>
            <th>属性</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="oauth-table-body">
          <tr><td colspan="6" style="text-align:center; padding:24px 16px; color:#64748b;">加载中...</td></tr>
        </tbody>
      </table>
    </section>

    <!-- 9. Options Tab -->
    <section id="tab-options" style="display:none;">
      <div class="admin-header">
        <h2>系统站点设置</h2>
      </div>

      <!-- Theme & Cache Management Card -->
      <div class="post-card" style="max-width:860px; margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:20px; padding-bottom:16px; border-bottom:1px solid #222834;">
          <div>
            <h3 style="margin:0; color:#f8fafc; font-size:18px;">视觉主题管理与全站缓存重建</h3>
            <p style="color:#94a3b8; font-size:13px; margin:4px 0 0 0;">自识别目录主题包。选择要切换的主题并对比预览，清空缓存并重构预热</p>
          </div>
          <button class="btn" style="background:#1e293b; color:#38bdf8; border:1px solid #38bdf8; font-size:13px; padding:8px 14px;" id="purge-cache-btn" onclick="handlePurgeCache()">
            清空全站缓存并重建
          </button>
        </div>

        <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap;">
          <label style="font-size:14px; font-weight:600; color:#f8fafc; white-space:nowrap; margin:0;">选择目标主题：</label>
          <select id="theme-selector" class="form-control" style="background:#141414; color:#fff; max-width:360px;" onchange="onThemeSelectChange(this.value)">
            ${allThemes.map(t => `<option value="${t.id}" ${(site.active_theme === t.id || (!site.active_theme && t.id === 'bold-typography')) ? 'selected' : ''}>${t.name} - ${t.author}</option>`).join('')}
          </select>
        </div>

        <!-- Side-by-Side Comparison Container ("现在" vs "更换后") -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
          <!-- Left Card: Current Active Theme 【现在】 -->
          <div id="card-current-theme" style="background:#0e1217; border:1px solid #222834; padding:20px; position:relative; display:flex; flex-direction:column;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <span style="font-size:12px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">当前线上生效</span>
              <span style="font-size:11px; font-family:monospace; background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3); font-weight:700; padding:2px 8px; border-radius:3px;">运行中</span>
            </div>
            <h4 id="cur-theme-name" style="margin:0 0 4px 0; color:#f8fafc; font-size:18px; font-weight:800;"></h4>
            <div id="cur-theme-meta" style="font-size:12px; color:#64748b; margin-bottom:12px;"></div>
            <div id="cur-theme-tags" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px;"></div>
            
            <div style="font-size:12px; color:#94a3b8; margin-bottom:6px; font-weight:600;">调色板与材质预览：</div>
            <div id="cur-theme-colors" style="display:flex; gap:8px; margin-bottom:14px;"></div>

            <div style="font-size:12px; color:#94a3b8; margin-bottom:6px; font-weight:600;">主要字型规范：</div>
            <div id="cur-theme-font" style="font-size:12px; font-family:monospace; color:#cbd5e1; background:#161c24; padding:6px 10px; border-radius:4px; margin-bottom:14px;"></div>

            <div style="font-size:12px; color:#94a3b8; margin-bottom:6px; font-weight:600;">核心设计亮点：</div>
            <ul id="cur-theme-features" style="font-size:12px; color:#94a3b8; line-height:1.6; margin:0 0 16px 0; padding-left:18px;"></ul>
          </div>

          <!-- Right Card: Selected New Theme 【更换后】 -->
          <div id="card-new-theme" style="background:#0e1217; border:2px solid #38bdf8; padding:20px; position:relative; display:flex; flex-direction:column;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <span style="font-size:12px; font-weight:700; color:#38bdf8; text-transform:uppercase; letter-spacing:0.05em;">【更换后】目标效果预览</span>
              <span id="new-theme-badge" style="font-size:11px; font-family:monospace; background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); font-weight:700; padding:2px 8px; border-radius:3px;">即将应用</span>
            </div>
            <h4 id="new-theme-name" style="margin:0 0 4px 0; color:#f8fafc; font-size:18px; font-weight:800;"></h4>
            <div id="new-theme-meta" style="font-size:12px; color:#64748b; margin-bottom:12px;"></div>
            <div id="new-theme-tags" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px;"></div>
            
            <div style="font-size:12px; color:#94a3b8; margin-bottom:6px; font-weight:600;">调色板与材质预览：</div>
            <div id="new-theme-colors" style="display:flex; gap:8px; margin-bottom:14px;"></div>

            <div style="font-size:12px; color:#94a3b8; margin-bottom:6px; font-weight:600;">主要字型规范：</div>
            <div id="new-theme-font" style="font-size:12px; font-family:monospace; color:#cbd5e1; background:#161c24; padding:6px 10px; border-radius:4px; margin-bottom:14px;"></div>

            <div style="font-size:12px; color:#94a3b8; margin-bottom:6px; font-weight:600;">核心设计亮点：</div>
            <ul id="new-theme-features" style="font-size:12px; color:#94a3b8; line-height:1.6; margin:0 0 16px 0; padding-left:18px;"></ul>

            <div style="margin-top:auto; padding-top:12px; border-top:1px solid #222834;">
              <button class="btn btn-primary" id="confirm-apply-theme-btn" style="width:100%; font-weight:700; padding:10px;" onclick="handleConfirmThemeSwitch()">
                确认更换为该主题并清空缓存重建 &rarr;
              </button>
            </div>
          </div>
        </div>

        <div id="theme-status-msg" style="margin-top:16px; font-size:13px; font-weight:600;"></div>
      </div>

      <div class="post-card" style="max-width:860px;">
        <form onsubmit="return saveOptions(event)">
          <div class="form-group">
            <label>博客名称</label>
            <input type="text" id="opt-site-name" class="form-control" value="${site.site_name}" />
          </div>
          <div class="form-group">
            <label>副标题 / 描述</label>
            <textarea id="opt-site-desc" class="form-control" rows="3">${site.site_description}</textarea>
          </div>
          <div class="form-group">
            <label>每页显示文章数</label>
            <input type="number" id="opt-posts-per-page" class="form-control" value="${site.posts_per_page}" />
          </div>
          <div class="form-group">
            <label>前台博客主题</label>
            <select id="opt-active-theme" class="form-control" style="background:#141414; color:#fff;">
              ${allThemes.map(t => `<option value="${t.id}" ${(site.active_theme === t.id || (!site.active_theme && t.id === 'bold-typography')) ? 'selected' : ''}>${t.name} (v${t.version})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>页脚自定义 HTML / 备案信息 (选填，支持 &lt;a href="..."&gt; 链接)</label>
            <textarea id="opt-footer-html" class="form-control" rows="2" placeholder="例如: &lt;a href='https://beian.miit.gov.cn/' target='_blank' rel='noopener'&gt;京ICP备xxxxxx号&lt;/a&gt; &middot; &lt;a href='#' target='_blank'&gt;公网安备 xxxx 号&lt;/a&gt;">${site.footer_html || ""}</textarea>
          </div>
          <button type="submit" class="btn btn-primary" id="save-opt-btn">保存设置</button>
          <span id="opt-msg" style="margin-left:12px; font-size:13px; color:#10b981;"></span>
        </form>
      </div>

      <div class="post-card" style="max-width:600px; margin-top:24px;">
        <h3 style="margin-top:0; color:#f8fafc; font-size:18px;">修改当前账户登录密码</h3>
        <form onsubmit="return handleChangePassword(event)">
          <div class="form-group">
            <label>原密码 *</label>
            <input type="password" id="pwd-old" class="form-control" required placeholder="输入当前使用的密码" />
          </div>
          <div class="form-group">
            <label>新密码 * (不少于 6 位)</label>
            <input type="password" id="pwd-new" class="form-control" required placeholder="输入新密码" />
          </div>
          <div class="form-group">
            <label>确认新密码 *</label>
            <input type="password" id="pwd-confirm" class="form-control" required placeholder="再次输入新密码" />
          </div>
          <button type="submit" class="btn btn-primary" id="change-pwd-btn">确认修改密码</button>
          <span id="pwd-msg" style="margin-left:12px; font-size:13px;"></span>
        </form>
      </div>
    </section>
  </main>
</div>

<script>
let currentUser = null;
let isRegisterMode = false;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialize
window.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
});

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me', { headers: { 'X-Admin-Action': 'true' } });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      document.getElementById('current-user-info').innerText = '当前用户: ' + currentUser.display_name + ' (' + currentUser.role + ')';
      document.getElementById('auth-modal').style.display = 'none';
      loadOverview();
    } else {
      document.getElementById('auth-modal').style.display = 'flex';
    }
  } catch (err) {
    document.getElementById('auth-modal').style.display = 'flex';
  }
}

function switchAuthMode(mode) {
  const titleMap = { login: '登录控制台', register: '注册新账号', reset: '找回并重置密码' };
  document.getElementById('auth-title').innerText = titleMap[mode] || '登录控制台';
  
  document.getElementById('login-form').style.display = mode === 'login' ? 'block' : 'none';
  document.getElementById('register-form').style.display = mode === 'register' ? 'block' : 'none';
  document.getElementById('reset-form').style.display = mode === 'reset' ? 'block' : 'none';

  // Move the shared Turnstile box into the active form before its submit button
  const activeForm = document.getElementById(mode + '-form');
  const tsBox = document.getElementById('turnstile-shared-box');
  const submitBtn = document.getElementById(mode === 'login' ? 'login-btn' : (mode === 'register' ? 'reg-btn' : 'reset-btn'));
  if (activeForm && tsBox && submitBtn) {
    activeForm.insertBefore(tsBox, submitBtn);
  }

  const tabs = ['login', 'register', 'reset'];
  tabs.forEach(t => {
    const el = document.getElementById('auth-tab-' + t);
    if (el) {
      el.style.color = t === mode ? '#38bdf8' : '#94a3b8';
      el.style.fontWeight = t === mode ? '700' : 'normal';
    }
  });
}

// Turnstile token store
window.__sharedTsToken = '';
function tsSharedDone(token) { window.__sharedTsToken = token; }
function tsSharedExpired()   { window.__sharedTsToken = ''; }

function resetTurnstile() {
  window.__sharedTsToken = '';
  if (window.turnstile && typeof window.turnstile.reset === 'function') {
    try { window.turnstile.reset(); } catch(e) {}
  }
}

function getTurnstileToken() {
  if (window.__sharedTsToken) return window.__sharedTsToken;
  const input = document.querySelector('[name="cf-turnstile-response"]');
  if (input && input.value) return input.value;
  if (window.turnstile && typeof window.turnstile.getResponse === 'function') {
    try { return window.turnstile.getResponse() || ''; } catch(e) {}
  }
  return '';
}

async function handleLogin(e) {
  e.preventDefault();
  const account = document.getElementById('login-account').value;
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  const msg = document.getElementById('login-msg');
  btn.disabled = true;
  btn.innerText = '登录中...';
  msg.innerText = '';

  const turnstile_token = getTurnstileToken();

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account, password, turnstile_token })
    });
    const data = await res.json();
    if (res.ok) {
      msg.style.color = '#10b981';
      msg.innerText = '登录成功，正在进入控制台...';
      setTimeout(() => location.reload(), 800);
    } else {
      resetTurnstile();
      msg.style.color = '#ef4444';
      msg.innerText = data.error || '登录失败';
      btn.disabled = false;
      btn.innerText = '立即登录';
    }
  } catch {
    resetTurnstile();
    msg.style.color = '#ef4444';
    msg.innerText = '网络连接错误';
    btn.disabled = false;
    btn.innerText = '立即登录';
  }
  return false;
}

async function sendEmailCode(purpose) {
  const emailInputId = purpose === 'reset' ? 'reset-email' : 'reg-email';
  const btnId = purpose === 'reset' ? 'send-reset-code-btn' : 'send-code-btn';
  const email = document.getElementById(emailInputId).value;
  const btn = document.getElementById(btnId);

  if (!email || !email.includes('@')) {
    alert('请先输入有效的电子邮箱');
    return;
  }
  btn.disabled = true;
  btn.innerText = '发送中...';

  const turnstile_token = getTurnstileToken();

  try {
    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, turnstile_token, purpose })
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message || '验证码已发送');
      let count = 60;
      const timer = setInterval(() => {
        btn.innerText = count + '秒后可重发';
        count--;
        if (count < 0) {
          clearInterval(timer);
          btn.disabled = false;
          btn.innerText = '发送验证码';
        }
      }, 1000);
    } else {
      alert(data.error || '发送失败');
      btn.disabled = false;
      btn.innerText = '发送验证码';
    }
  } catch {
    alert('网络错误');
    btn.disabled = false;
    btn.innerText = '发送验证码';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const code = document.getElementById('reg-code').value;
  const password = document.getElementById('reg-password').value;
  const btn = document.getElementById('reg-btn');
  const msg = document.getElementById('reg-msg');
  btn.disabled = true;
  btn.innerText = '注册中...';

  const turnstile_token = getTurnstileToken();

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, code, password, turnstile_token })
    });
    const data = await res.json();
    if (res.ok) {
      msg.style.color = '#10b981';
      msg.innerText = '注册成功，正在进入系统...';
      setTimeout(() => location.reload(), 800);
    } else {
      msg.style.color = '#ef4444';
      msg.innerText = data.error || '注册失败';
      btn.disabled = false;
      btn.innerText = '完成注册并登录';
    }
  } catch {
    msg.style.color = '#ef4444';
    msg.innerText = '网络连接错误';
    btn.disabled = false;
    btn.innerText = '完成注册并登录';
  }
  return false;
}

async function handleResetPassword(e) {
  e.preventDefault();
  const email = document.getElementById('reset-email').value;
  const code = document.getElementById('reset-code').value;
  const new_password = document.getElementById('reset-password').value;
  const btn = document.getElementById('reset-btn');
  const msg = document.getElementById('reset-msg');

  btn.disabled = true;
  btn.innerText = '正在重置...';

  const turnstile_token = getTurnstileToken();

  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, new_password, turnstile_token })
    });
    const data = await res.json();
    if (res.ok) {
      msg.style.color = '#10b981';
      msg.innerText = '密码重置成功！3 秒后切换到登录界面...';
      setTimeout(() => switchAuthMode('login'), 2500);
    } else {
      resetTurnstile();
      msg.style.color = '#ef4444';
      msg.innerText = data.error || '重置密码失败';
      btn.disabled = false;
      btn.innerText = '重置密码并前往登录';
    }
  } catch {
    resetTurnstile();
    msg.style.color = '#ef4444';
    msg.innerText = '网络连接错误';
    btn.disabled = false;
    btn.innerText = '重置密码并前往登录';
  }
  return false;
}

async function handleChangePassword(e) {
  e.preventDefault();
  const old_password = document.getElementById('pwd-old').value;
  const new_password = document.getElementById('pwd-new').value;
  const confirm_password = document.getElementById('pwd-confirm').value;
  const btn = document.getElementById('change-pwd-btn');
  const msg = document.getElementById('pwd-msg');

  if (new_password !== confirm_password) {
    msg.style.color = '#ef4444';
    msg.innerText = '两次输入的新密码不一致';
    return false;
  }

  btn.disabled = true;
  btn.innerText = '正在修改...';
  msg.innerText = '';

  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Action': 'true' },
      body: JSON.stringify({ old_password, new_password })
    });
    const data = await res.json();
    if (res.ok) {
      msg.style.color = '#10b981';
      msg.innerText = '密码修改成功，请牢记新密码。';
      document.getElementById('pwd-old').value = '';
      document.getElementById('pwd-new').value = '';
      document.getElementById('pwd-confirm').value = '';
    } else {
      msg.style.color = '#ef4444';
      msg.innerText = data.error || '修改密码失败';
    }
  } catch {
    msg.style.color = '#ef4444';
    msg.innerText = '网络连接错误';
  } finally {
    btn.disabled = false;
    btn.innerText = '确认修改密码';
  }
  return false;
}

async function handleLogout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  location.reload();
}

function showTab(name) {
  const tabs = ['overview', 'posts', 'editor', 'comments', 'media', 'hotp', 'oauth', 'backup', 'options'];
  tabs.forEach(t => {
    const el = document.getElementById('tab-' + t);
    const nav = document.getElementById('nav-' + t);
    if (el) el.style.display = t === name ? 'block' : 'none';
    if (nav) nav.classList.toggle('active', t === name);
  });

  if (name === 'overview') loadOverview();
  if (name === 'posts') loadPosts();
  if (name === 'comments') loadComments();
  if (name === 'media') loadMedia();
  if (name === 'oauth') loadOAuthClients();
  if (name === 'options') initThemeComparison();
}

async function loadOverview() {
  const res = await fetch('/api/admin/stats', { headers: { 'X-Admin-Action': 'true' } });
  if (res.ok) {
    const data = await res.json();
    document.getElementById('stat-posts').innerText = data.posts_count;
    document.getElementById('stat-media').innerText = data.media_count;
    document.getElementById('stat-comments').innerText = data.comments_count;
    document.getElementById('stat-users').innerText = data.users_count;
  }
}

async function loadPosts() {
  const res = await fetch('/api/posts?limit=100');
  const data = await res.json();
  const tbody = document.getElementById('posts-table-body');
  if (!data.posts || data.posts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:36px 16px; color:#64748b; background:#10141c;">暂无文章</td></tr>';
    return;
  }
  tbody.innerHTML = data.posts.map(p => \`
    <tr>
      <td><strong>\${p.title}</strong><br/><span style="font-size:12px; color:#64748b;">/post/\${p.slug}</span></td>
      <td><span class="badge" style="\${p.status === 'published' ? 'background:rgba(16,185,129,0.1); color:#10b981; border-color:rgba(16,185,129,0.2);' : ''}">\${p.status === 'published' ? '已发布' : '草稿'}</span></td>
      <td>\${p.author_name || '管理员'}</td>
      <td>\${p.created_at ? p.created_at.slice(0, 10) : ''}</td>
      <td>
        <button class="btn" style="padding:4px 8px; font-size:12px; background:#1e293b; color:#38bdf8;" onclick="editPost('\${p.id}')">编辑</button>
        <button class="btn" style="padding:4px 8px; font-size:12px; background:#1e293b; color:#ef4444; margin-left:6px;" onclick="deletePost('\${p.id}')">删除</button>
      </td>
    </tr>
  \`).join('');
}

let editorBlocks = [{ type: 'paragraph', content: '' }];
let currentEditorMode = 'visual';
let insertBlockTargetIndex = -1;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(new RegExp('&', 'g'), '&amp;')
    .replace(new RegExp('<', 'g'), '&lt;')
    .replace(new RegExp('>', 'g'), '&gt;')
    .replace(new RegExp('"', 'g'), '&quot;')
    .replace(new RegExp('\\x27', 'g'), '&#039;');
}

var mdParser = (typeof window !== 'undefined' && window.markdownit) ? window.markdownit({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
}) : null;

function renderInlineMarkdown(text) {
  if (!text) return '';
  if (mdParser) {
    return mdParser.renderInline(text);
  }
  return text
    .replace(/!\\[([^\\]]*)\\]\\(([^)"\\s\\x27]+)(?:\\s+["\\x27]([^"\\x27]*)["\\x27])?\\)/g, '<img src="$2" alt="$1" />')
    .replace(/\\[([^\\]]+)\\]\\(([^)"\\s\\x27]+)(?:\\s+["\\x27]([^"\\x27]*)["\\x27])?\\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\\x60([^\\x60]+)\\x60/g, '<code>$1</code>')
    .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\\*([^*]+)\\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');
}

function renderFullMarkdown(text) {
  if (!text) return '';
  if (mdParser) {
    return mdParser.render(text)
      .replace(/<h([1-6])>/g, '<h$1 class="wp-block-heading">')
      .replace(/<hr\\s*\\/?>/g, '<hr class="wp-block-separator" />')
      .replace(/<ul>/g, '<ul class="wp-block-list">')
      .replace(/<ol>/g, '<ol class="wp-block-list">')
      .replace(/<blockquote>/g, '<blockquote class="wp-block-quote">')
      .replace(/<pre><code(?:\\s+class="language-([^"]+)")?>/g, '<pre class="wp-block-code"><code class="language-$1">');
  }
  return renderInlineMarkdown(escapeHtml(text));
}

function renderTableMarkdown(tableLines) {
  if (!tableLines || tableLines.length === 0) return '';
  var rows = tableLines.map(function(line) {
    return line.split('|').slice(1, -1).map(function(c) { return c.trim(); });
  });
  if (rows.length === 0) return '';
  var hasHeader = rows.length > 1 && rows[1].every(function(c) { return /^:?-+:?$/.test(c); });
  var headerRow = rows[0];
  var bodyRows = hasHeader ? rows.slice(2) : rows;

  var html = '<figure class="wp-block-table"><table>';
  if (hasHeader) {
    html += '<thead><tr>';
    for (var h = 0; h < headerRow.length; h++) {
      html += '<th>' + renderInlineMarkdown(escapeHtml(headerRow[h])) + '</th>';
    }
    html += '</tr></thead>';
  }
  html += '<tbody>';
  for (var r = 0; r < bodyRows.length; r++) {
    html += '<tr>';
    for (var c = 0; c < bodyRows[r].length; c++) {
      html += '<td>' + renderInlineMarkdown(escapeHtml(bodyRows[r][c])) + '</td>';
    }
    html += '</tr>';
  }
  html += '</tbody></table></figure>';
  return html;
}

function parseMarkdownToBlocks(markdown) {
  if (!markdown || !markdown.trim()) {
    return [{ type: 'paragraph', content: '' }];
  }
  var lines = markdown.replace(/\\r\\n/g, '\\n').split('\\n');
  var blocks = [];
  var i = 0;

  var isSeparator = function(str) { return /^([-]{3,}|[*]{3,}|_{3,})$/.test(str); };
  var isHeading = function(str) { return /^(#{1,6})\\s+(.+)$/.test(str); };
  var isUList = function(str) { return /^[-*+]\\s+/.test(str); };
  var isOList = function(str) { return /^\\d+\\.\\s+/.test(str); };
  var isTable = function(str) { return str.startsWith('|') && str.endsWith('|'); };
  var isImage = function(str) { return /^!\\[([^\\]]*)\\]\\(([^)"\\s\\x27]+)(?:\\s+["\\x27]([^"\\x27]*)["\\x27])?\\)$/.test(str); };

  while (i < lines.length) {
    var line = lines[i];
    var trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Code fence
    if (trimmed.startsWith('\x60\x60\x60') || trimmed.startsWith('~~~')) {
      var fence = trimmed.substring(0, 3);
      var lang = trimmed.substring(3).trim();
      var codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence)) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ type: 'code', code: codeLines.join('\\n'), lang: lang || '' });
      continue;
    }

    // 2. Headings
    var headingMatch = trimmed.match(/^(#{1,6})\\s+(.+)$/);
    if (headingMatch) {
      var level = headingMatch[1].length;
      blocks.push({ type: 'heading', level: level, content: headingMatch[2].trim() });
      i++;
      continue;
    }

    // 3. Separator
    if (isSeparator(trimmed)) {
      blocks.push({ type: 'separator' });
      i++;
      continue;
    }

    // 4. Blockquote
    if (trimmed.startsWith('>')) {
      var quoteLines = [];
      var cite = '';
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        var qLine = lines[i].trim().replace(/^>\\s?/, '');
        if (qLine.startsWith('——') || qLine.startsWith('--') || qLine.startsWith('- ')) {
          cite = qLine.replace(/^([—\\-]{1,2}\\s?)/, '').trim();
        } else {
          quoteLines.push(qLine);
        }
        i++;
      }
      blocks.push({ type: 'quote', quote: quoteLines.join('\\n'), cite: cite });
      continue;
    }

    // 5. Table
    if (isTable(trimmed)) {
      var tableLines = [];
      while (i < lines.length && isTable(lines[i].trim())) {
        tableLines.push(lines[i].trim());
        i++;
      }
      var tableHtml = renderTableMarkdown(tableLines);
      blocks.push({ type: 'html', content: tableHtml });
      continue;
    }

    // 6. Unordered List
    if (isUList(trimmed)) {
      var uItems = [];
      while (i < lines.length && isUList(lines[i].trim())) {
        uItems.push(lines[i].trim().replace(/^[-*+]\\s+/, ''));
        i++;
      }
      blocks.push({ type: 'list', ordered: false, items: uItems });
      continue;
    }

    // 7. Ordered List
    if (isOList(trimmed)) {
      var oItems = [];
      while (i < lines.length && isOList(lines[i].trim())) {
        oItems.push(lines[i].trim().replace(/^\\d+\\.\\s+/, ''));
        i++;
      }
      blocks.push({ type: 'list', ordered: true, items: oItems });
      continue;
    }

    // 8. Standalone image
    var imgMatch = trimmed.match(/^!\\[([^\\]]*)\\]\\(([^)"\\s\\x27]+)(?:\\s+["\\x27]([^"\\x27]*)["\\x27])?\\)$/);
    if (imgMatch) {
      blocks.push({ type: 'image', alt: imgMatch[1], url: imgMatch[2], caption: imgMatch[3] || '' });
      i++;
      continue;
    }

    // 9. Regular paragraph
    var pLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('\\x60\\x60\\x60') &&
      !lines[i].trim().startsWith('~~~') &&
      !isHeading(lines[i].trim()) &&
      !lines[i].trim().startsWith('>') &&
      !isTable(lines[i].trim()) &&
      !isUList(lines[i].trim()) &&
      !isOList(lines[i].trim()) &&
      !isSeparator(lines[i].trim()) &&
      !isImage(lines[i].trim())
    ) {
      pLines.push(lines[i]);
      i++;
    }

    if (pLines.length > 0) {
      blocks.push({ type: 'paragraph', content: pLines.join('\\n') });
    }
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'paragraph', content: markdown });
  }

  return blocks;
}

function convertMarkdownTextareaToBlocks() {
  const raw = document.getElementById('post-content-raw').value;
  if (!raw || !raw.trim()) {
    alert('请先在输入框中输入或粘贴 Markdown 文本');
    return;
  }
  editorBlocks = parseMarkdownToBlocks(raw);
  document.getElementById('post-content-raw').value = blockListToRawGutenberg(editorBlocks);

  currentEditorMode = 'visual';
  ['visual', 'code', 'preview'].forEach(function(m) {
    const tabBtn = document.getElementById('btn-mode-' + m);
    const container = document.getElementById('editor-' + m + '-container');
    if (tabBtn) tabBtn.classList.toggle('active', m === 'visual');
    if (container) container.style.display = m === 'visual' ? 'block' : 'none';
  });

  const statusText = document.getElementById('editor-status-text');
  if (statusText) statusText.innerText = 'Gutenberg 可视化区块排版模式';

  renderVisualBlocks();
  alert('已将 Markdown 文本解析并转换为 ' + editorBlocks.length + ' 个可视化区块');
}

function rawGutenbergToBlockList(raw) {
  if (!raw || !raw.trim()) {
    return [{ type: 'paragraph', content: '' }];
  }
  if (!raw.includes('<!-- wp:')) {
    return parseMarkdownToBlocks(raw);
  }
  var regex = /<!--\\s+wp:([a-z0-9\\/-]+)(?:\\s+(\\{[\\s\\S]*?\\}))?\\s+(?:\\/-->|-->([\\s\\S]*?)<!--\\s+\\/wp:[a-z0-9\\/-]+\\s+-->)/g;
  var blocks = [];
  var lastIdx = 0;
  var match;

  var handleFreeText = function(free) {
    if (!free) return;
    if (free.startsWith('<figure') || free.startsWith('<table') || free.startsWith('<div')) {
      blocks.push({ type: 'html', content: free });
    } else if (free.startsWith('|') && free.endsWith('|')) {
      var tableLines = free.split('\\n').map(function(l) { return l.trim(); }).filter(Boolean);
      blocks.push({ type: 'html', content: renderTableMarkdown(tableLines) });
    } else {
      var parsed = parseMarkdownToBlocks(free);
      for (var p = 0; p < parsed.length; p++) {
        blocks.push(parsed[p]);
      }
    }
  };

  while ((match = regex.exec(raw)) !== null) {
    if (match.index > lastIdx) {
      var free = raw.substring(lastIdx, match.index).trim();
      handleFreeText(free);
    }
    var name = match[1].replace('core/', '');
    var attrs = {};
    if (match[2]) {
      try { attrs = JSON.parse(match[2]); } catch (e) {}
    }
    var inner = (match[3] || '').trim();

    if (name === 'heading') {
      var level = attrs.level || 2;
      var text = inner.replace(/<h[1-6][^>]*>/gi, '').replace(/<\\/h[1-6]>/gi, '').trim();
      blocks.push({ type: 'heading', level: level, content: text });
    } else if (name === 'paragraph') {
      var pText = inner.replace(/<p[^>]*>/gi, '').replace(/<\\/p>/gi, '').trim();
      if (pText.startsWith('<figure') || pText.startsWith('<table') || pText.startsWith('<div')) {
        blocks.push({ type: 'html', content: pText });
      } else {
        blocks.push({ type: 'paragraph', content: pText });
      }
    } else if (name === 'image') {
      var srcMatch = inner.match(/src=["']([^"']+)["']/i);
      var altMatch = inner.match(/alt=["']([^"']+)["']/i);
      var capMatch = inner.match(/<figcaption[^>]*>([\\s\\S]*?)<\\/figcaption>/i);
      blocks.push({
        type: 'image',
        url: srcMatch ? srcMatch[1] : '',
        alt: altMatch ? altMatch[1] : '',
        caption: capMatch ? capMatch[1] : ''
      });
    } else if (name === 'code') {
      var codeText = inner.replace(/<pre[^>]*><code[^>]*>/gi, '').replace(/<\\/code><\\/pre>/gi, '').trim();
      blocks.push({ type: 'code', code: codeText, lang: attrs.language || '' });
    } else if (name === 'quote') {
      var qMatch = inner.match(/<p[^>]*>([\\s\\S]*?)<\\/p>/i);
      var citeMatch = inner.match(/<cite[^>]*>([\\s\\S]*?)<\\/cite>/i);
      blocks.push({
        type: 'quote',
        quote: qMatch ? qMatch[1] : inner,
        cite: citeMatch ? citeMatch[1] : ''
      });
    } else if (name === 'list') {
      var isOrdered = attrs.ordered || /<ol/i.test(inner);
      var liMatches = [];
      var liRegex = /<li[^>]*>([\\s\\S]*?)<\\/li>/gi;
      var m;
      while ((m = liRegex.exec(inner)) !== null) {
        liMatches.push(m[1]);
      }
      blocks.push({
        type: 'list',
        ordered: isOrdered,
        items: liMatches.length > 0 ? liMatches : ['']
      });
    } else if (name === 'separator') {
      blocks.push({ type: 'separator' });
    } else {
      blocks.push({ type: 'html', content: inner || match[0] });
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < raw.length) {
    var trailing = raw.substring(lastIdx).trim();
    handleFreeText(trailing);
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'paragraph', content: raw });
  }

  return blocks;
}

function blockListToRawGutenberg(blocks) {
  if (!blocks || blocks.length === 0) return '';
  return blocks.map(function(b) {
    if (b.type === 'heading') {
      var lvl = b.level || 2;
      return '<!-- wp:heading {"level":' + lvl + '} -->\\n<h' + lvl + ' class="wp-block-heading">' + escapeHtml(b.content || '') + '</h' + lvl + '>\\n<!-- /wp:heading -->';
    }
    if (b.type === 'paragraph') {
      return '<!-- wp:paragraph -->\\n<p>' + (b.content || '').replace(/\\n/g, '<br/>') + '</p>\\n<!-- /wp:paragraph -->';
    }
    if (b.type === 'image') {
      var fig = b.caption ? '<figcaption>' + escapeHtml(b.caption) + '</figcaption>' : '';
      return '<!-- wp:image -->\\n<figure class="wp-block-image"><img src="' + escapeHtml(b.url || '') + '" alt="' + escapeHtml(b.alt || '') + '" />' + fig + '</figure>\\n<!-- /wp:image -->';
    }
    if (b.type === 'code') {
      var langAttr = b.lang ? ' {"language":"' + escapeHtml(b.lang) + '"}' : '';
      return '<!-- wp:code' + langAttr + ' -->\\n<pre class="wp-block-code"><code>' + escapeHtml(b.code || '') + '</code></pre>\\n<!-- /wp:code -->';
    }
    if (b.type === 'quote') {
      var citeHtml = b.cite ? '<cite>' + escapeHtml(b.cite) + '</cite>' : '';
      return '<!-- wp:quote -->\\n<blockquote class="wp-block-quote"><p>' + escapeHtml(b.quote || '') + '</p>' + citeHtml + '</blockquote>\\n<!-- /wp:quote -->';
    }
    if (b.type === 'list') {
      var tag = b.ordered ? 'ol' : 'ul';
      var lis = (b.items || ['']).map(function(item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('\\n');
      return '<!-- wp:list {"ordered":' + (b.ordered ? 'true' : 'false') + '} -->\\n<' + tag + ' class="wp-block-list">\\n' + lis + '\\n</' + tag + '>\\n<!-- /wp:list -->';
    }
    if (b.type === 'separator') {
      return '<!-- wp:separator -->\\n<hr class="wp-block-separator" />\\n<!-- /wp:separator -->';
    }
    if (b.type === 'html') {
      return '<!-- wp:html -->\\n' + (b.content || '') + '\\n<!-- /wp:html -->';
    }
    return '<!-- wp:paragraph -->\\n<p>' + escapeHtml(b.content || '') + '</p>\\n<!-- /wp:paragraph -->';
  }).join('\\n\\n');
}

function openBlockInserterModal(targetIndex = -1) {
  insertBlockTargetIndex = targetIndex;
  document.getElementById('block-inserter-modal').style.display = 'flex';
}

function closeBlockInserterModal() {
  document.getElementById('block-inserter-modal').style.display = 'none';
}

function selectBlockFromModal(type) {
  closeBlockInserterModal();
  addVisualBlock(type, {}, insertBlockTargetIndex);
}

function addVisualBlock(type, initialData = {}, atIndex = -1) {
  const newBlock = { type, ...initialData };
  if (type === 'heading' && !newBlock.level) newBlock.level = 2;
  if (type === 'list' && !newBlock.items) newBlock.items = [''];
  if (type === 'paragraph' && newBlock.content === undefined) newBlock.content = '';

  if (atIndex >= 0 && atIndex < editorBlocks.length) {
    editorBlocks.splice(atIndex + 1, 0, newBlock);
  } else {
    editorBlocks.push(newBlock);
  }
  renderVisualBlocks();
}

function updateBlockData(index, field, value) {
  if (editorBlocks[index]) {
    editorBlocks[index][field] = value;
  }
}

function moveBlock(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= editorBlocks.length) return;
  const temp = editorBlocks[index];
  editorBlocks[index] = editorBlocks[target];
  editorBlocks[target] = temp;
  renderVisualBlocks();
}

function deleteBlock(index) {
  editorBlocks.splice(index, 1);
  if (editorBlocks.length === 0) {
    editorBlocks.push({ type: 'paragraph', content: '' });
  }
  renderVisualBlocks();
}

function addListItem(blockIndex) {
  if (editorBlocks[blockIndex]) {
    if (!editorBlocks[blockIndex].items) editorBlocks[blockIndex].items = [];
    editorBlocks[blockIndex].items.push('');
    renderVisualBlocks();
  }
}

function updateListItem(blockIndex, itemIndex, val) {
  if (editorBlocks[blockIndex] && editorBlocks[blockIndex].items) {
    editorBlocks[blockIndex].items[itemIndex] = val;
  }
}

function removeListItem(blockIndex, itemIndex) {
  if (editorBlocks[blockIndex] && editorBlocks[blockIndex].items) {
    editorBlocks[blockIndex].items.splice(itemIndex, 1);
    if (editorBlocks[blockIndex].items.length === 0) {
      editorBlocks[blockIndex].items.push('');
    }
    renderVisualBlocks();
  }
}

function renderVisualBlocks() {
  var container = document.getElementById('visual-block-list');
  if (!container) return;

  container.innerHTML = editorBlocks.map(function(b, idx) {
    var blockBody = '';
    var typeLabel = '段落区块';
    var typeIcon = '¶';

    if (b.type === 'heading') {
      typeLabel = '标题区块';
      typeIcon = 'H';
      var lvl = b.level || 2;
      blockBody = '<div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">' +
        '<span style="font-size:12px; color:#64748b;">级别:</span>' +
        '<button type="button" class="level-badge-btn ' + (lvl === 2 ? 'active' : '') + '" onclick="editorBlocks[' + idx + '].level = 2; renderVisualBlocks();">H2 二级</button>' +
        '<button type="button" class="level-badge-btn ' + (lvl === 3 ? 'active' : '') + '" onclick="editorBlocks[' + idx + '].level = 3; renderVisualBlocks();">H3 三级</button>' +
        '<button type="button" class="level-badge-btn ' + (lvl === 4 ? 'active' : '') + '" onclick="editorBlocks[' + idx + '].level = 4; renderVisualBlocks();">H4 四级</button>' +
        '</div>' +
        '<input type="text" class="block-heading-input" value="' + escapeHtml(b.content || '') + '" placeholder="输入章节标题文字..." oninput="updateBlockData(' + idx + ', &quot;content&quot;, this.value)" />';
    } else if (b.type === 'paragraph') {
      typeLabel = '段落区块';
      typeIcon = 'P';
      blockBody = '<textarea class="block-paragraph-input" placeholder="输入段落正文内容...支持 Markdown 粗体 **文字**、斜体 *文字*、链接 [描述](url)" oninput="updateBlockData(' + idx + ', &quot;content&quot;, this.value)">' + escapeHtml(b.content || '') + '</textarea>';
    } else if (b.type === 'image') {
      typeLabel = '图像区块';
      typeIcon = 'IMG';
      blockBody = '<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px;">' +
        '<div><label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:4px;">图片链接 *</label>' +
        '<input type="text" class="form-control" value="' + escapeHtml(b.url || '') + '" placeholder="https://... 或 /media/..." oninput="updateBlockData(' + idx + ', &quot;url&quot;, this.value); renderVisualBlocks();" /></div>' +
        '<div><label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:4px;">说明文字 (选填)</label>' +
        '<input type="text" class="form-control" value="' + escapeHtml(b.caption || '') + '" placeholder="图片下方说明文字" oninput="updateBlockData(' + idx + ', &quot;caption&quot;, this.value)" /></div>' +
        '</div>' +
        (b.url ? '<div style="background:#090c10; padding:8px; border-radius:6px; text-align:center; max-height:220px; overflow:hidden;"><img src="' + escapeHtml(b.url) + '" style="max-height:200px; max-width:100%; border-radius:4px; object-fit:contain;" alt="预览" /></div>' : '');
    } else if (b.type === 'code') {
      typeLabel = '代码区块';
      typeIcon = 'CODE';
      blockBody = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
        '<input type="text" style="background:#090c10; border:1px solid #1f2735; color:#94a3b8; font-size:11px; padding:4px 8px; border-radius:4px; max-width:160px;" value="' + escapeHtml(b.lang || '') + '" placeholder="语言 (例如 js, ts, rust)" oninput="updateBlockData(' + idx + ', &quot;lang&quot;, this.value)" />' +
        '<span style="font-size:11px; color:#64748b; font-family:monospace;">代码高亮</span>' +
        '</div>' +
        '<textarea class="block-code-input" placeholder="// 在此键入代码段..." oninput="updateBlockData(' + idx + ', &quot;code&quot;, this.value)">' + escapeHtml(b.code || '') + '</textarea>';
    } else if (b.type === 'quote') {
      typeLabel = '引用区块';
      typeIcon = 'QUOTE';
      blockBody = '<textarea class="block-paragraph-input" style="font-style:italic; border-left:3px solid #38bdf8;" placeholder="输入引言或摘录..." oninput="updateBlockData(' + idx + ', &quot;quote&quot;, this.value)">' + escapeHtml(b.quote || '') + '</textarea>' +
        '<div style="margin-top:8px;">' +
        '<input type="text" class="form-control" style="font-size:12px; padding:8px 12px;" value="' + escapeHtml(b.cite || '') + '" placeholder="署名作者或出处" oninput="updateBlockData(' + idx + ', &quot;cite&quot;, this.value)" />' +
        '</div>';
    } else if (b.type === 'list') {
      typeLabel = '列表区块';
      typeIcon = 'LIST';
      var items = b.items || [''];
      blockBody = '<div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">' +
        '<button type="button" class="level-badge-btn ' + (!b.ordered ? 'active' : '') + '" onclick="editorBlocks[' + idx + '].ordered = false; renderVisualBlocks();">无序要点</button>' +
        '<button type="button" class="level-badge-btn ' + (b.ordered ? 'active' : '') + '" onclick="editorBlocks[' + idx + '].ordered = true; renderVisualBlocks();">有序编号</button>' +
        '</div>' +
        '<div style="display:flex; flex-direction:column; gap:8px;">' +
        items.map(function(item, itemIdx) {
          return '<div style="display:flex; gap:6px; align-items:center;">' +
            '<span style="color:#64748b; font-size:12px; font-family:monospace;">' + (b.ordered ? (itemIdx + 1) + '.' : '-') + '</span>' +
            '<input type="text" class="form-control" style="flex:1; padding:8px 12px; font-size:14px;" value="' + escapeHtml(item) + '" placeholder="列表条目内容..." oninput="updateListItem(' + idx + ', ' + itemIdx + ', this.value)" />' +
            '<button type="button" class="block-action-btn" title="删除此项" onclick="removeListItem(' + idx + ', ' + itemIdx + ')">删除</button>' +
            '</div>';
        }).join('') +
        '</div>' +
        '<button type="button" class="btn" style="margin-top:8px; font-size:12px; padding:4px 10px; background:#161c26; color:#38bdf8;" onclick="addListItem(' + idx + ')">+ 添加条目</button>';
    } else if (b.type === 'separator') {
      typeLabel = '分割线';
      typeIcon = 'HR';
      blockBody = '<div style="padding:14px 0; text-align:center;"><hr style="border:none; border-top:2px solid #283344; margin:0;" /></div>';
    } else {
      typeLabel = '自定义 HTML';
      typeIcon = 'HTML';
      blockBody = '<textarea class="block-code-input" placeholder="输入 HTML 或嵌入代码..." oninput="updateBlockData(' + idx + ', &quot;content&quot;, this.value)">' + escapeHtml(b.content || '') + '</textarea>';
    }

    return '<div class="visual-block-card" id="block-card-' + idx + '">' +
      '<div class="visual-block-header">' +
      '<div class="visual-block-type"><span>' + typeIcon + '</span><span>' + typeLabel + '</span></div>' +
      '<div class="visual-block-actions">' +
      '<button type="button" class="block-action-btn" title="向上移动" onclick="moveBlock(' + idx + ', -1)">上移</button>' +
      '<button type="button" class="block-action-btn" title="向下移动" onclick="moveBlock(' + idx + ', 1)">下移</button>' +
      '<button type="button" class="block-action-btn" title="在下方插入区块" onclick="openBlockInserterModal(' + idx + ')">插入</button>' +
      '<button type="button" class="block-action-btn delete" title="删除区块" onclick="deleteBlock(' + idx + ')">删除</button>' +
      '</div></div>' +
      '<div class="visual-block-body">' + blockBody + '</div>' +
      '</div>';
  }).join('');
}

function switchEditorMode(mode) {
  if (currentEditorMode === mode) return;

  // Sync state between modes
  if (currentEditorMode === 'visual') {
    document.getElementById('post-content-raw').value = blockListToRawGutenberg(editorBlocks);
  } else if (currentEditorMode === 'code') {
    const rawVal = document.getElementById('post-content-raw').value;
    editorBlocks = rawGutenbergToBlockList(rawVal);
  }

  currentEditorMode = mode;
  ['visual', 'code', 'preview'].forEach(m => {
    const tabBtn = document.getElementById('btn-mode-' + m);
    const container = document.getElementById('editor-' + m + '-container');
    if (tabBtn) tabBtn.classList.toggle('active', m === mode);
    if (container) container.style.display = m === mode ? 'block' : 'none';
  });

  const statusText = document.getElementById('editor-status-text');
  if (mode === 'visual') {
    renderVisualBlocks();
    if (statusText) statusText.innerText = 'Gutenberg 可视化区块排版模式';
  } else if (mode === 'code') {
    if (statusText) statusText.innerText = 'Markdown / Gutenberg 源码模式';
  } else if (mode === 'preview') {
    if (statusText) statusText.innerText = '文章实时渲染排版预览';
    updateLivePreview();
  }
}

function renderBlocksToPreviewHtml(blocks) {
  if (!blocks || blocks.length === 0) {
    return '<p style="color:#64748b; font-style:italic;">暂无正文内容，请在左上角切换回「可视化区块」开始创作。</p>';
  }

  var htmls = blocks.map(function(b) {
    if (b.type === 'heading') {
      var lvl = b.level || 2;
      var headingText = renderInlineMarkdown(b.content || '');
      if (!headingText) return '';
      return '<h' + lvl + ' class="wp-block-heading" style="color:#f8fafc; font-weight:700; margin:1.2em 0 0.6em;">' + headingText + '</h' + lvl + '>';
    }
    if (b.type === 'paragraph') {
      var content = (b.content || '').trim();
      if (content.startsWith('<figure') || content.startsWith('<table') || content.startsWith('<div')) {
        return content;
      }
      var pText = renderInlineMarkdown(b.content || '').replace(new RegExp('\\n', 'g'), '<br/>');
      if (!pText) return '';
      return '<p class="wp-block-paragraph" style="color:#e2e8f0; line-height:1.8; margin:1em 0;">' + pText + '</p>';
    }
    if (b.type === 'image') {
      if (!b.url) return '';
      var fig = b.caption ? '<figcaption style="text-align:center; color:#94a3b8; font-size:13px; margin-top:6px;">' + renderInlineMarkdown(b.caption) + '</figcaption>' : '';
      return '<figure class="wp-block-image" style="margin:24px 0; text-align:center;"><img src="' + escapeHtml(b.url) + '" alt="' + escapeHtml(b.alt || '') + '" style="max-width:100%; border-radius:6px;" />' + fig + '</figure>';
    }
    if (b.type === 'code') {
      if (!b.code) return '';
      var langClass = b.lang ? ' class="language-' + escapeHtml(b.lang) + '"' : '';
      return '<pre class="wp-block-code" style="background:#090d14; border:1px solid #1f2735; padding:16px; border-radius:6px; overflow-x:auto; color:#38bdf8; font-family:monospace;"><code' + langClass + '>' + escapeHtml(b.code) + '</code></pre>';
    }
    if (b.type === 'quote') {
      var qText = renderInlineMarkdown(b.quote || '').replace(new RegExp('\\n', 'g'), '<br/>');
      var cite = b.cite ? '<cite style="display:block; margin-top:8px; color:#94a3b8; font-size:13px; font-style:normal;">' + renderInlineMarkdown(b.cite) + '</cite>' : '';
      if (!qText && !cite) return '';
      return '<blockquote class="wp-block-quote" style="border-left:3px solid #38bdf8; padding-left:16px; margin:20px 0; font-style:italic; color:#cbd5e1;"><p style="margin:0;">' + qText + '</p>' + cite + '</blockquote>';
    }
    if (b.type === 'list') {
      var tag = b.ordered ? 'ol' : 'ul';
      var items = (b.items || []).filter(function(it) { return it && it.trim(); });
      if (items.length === 0) return '';
      var lis = items.map(function(item) { return '<li style="margin-bottom:6px;">' + renderInlineMarkdown(item) + '</li>'; }).join('');
      return '<' + tag + ' class="wp-block-list" style="padding-left:24px; margin:16px 0; color:#e2e8f0; line-height:1.7;">' + lis + '</' + tag + '>';
    }
    if (b.type === 'separator') {
      return '<hr class="wp-block-separator" style="border:none; border-top:1px solid #283344; margin:32px 0;" />';
    }
    if (b.type === 'html') {
      return b.content || '';
    }
    return '';
  }).filter(Boolean);

  if (htmls.length === 0) {
    return '<p style="color:#64748b; font-style:italic;">暂无正文内容，请在左上角切换回「可视化区块」开始创作。</p>';
  }

  return htmls.join('\\n\\n');
}

function updateLivePreview() {
  const titleInput = document.getElementById('post-title');
  const title = (titleInput && titleInput.value ? titleInput.value.trim() : '') || '无标题文章';
  let previewHtml = '';

  if (currentEditorMode === 'visual') {
    previewHtml = renderBlocksToPreviewHtml(editorBlocks);
  } else if (currentEditorMode === 'code') {
    const rawVal = document.getElementById('post-content-raw')?.value || '';
    if (rawVal.includes('<!-- wp:')) {
      const blocks = rawGutenbergToBlockList(rawVal);
      previewHtml = renderBlocksToPreviewHtml(blocks);
    } else {
      previewHtml = renderFullMarkdown(rawVal);
    }
  } else {
    if (editorBlocks && editorBlocks.length > 0 && editorBlocks.some(function(b) {
      return b.content || b.code || b.quote || b.url || (b.items && b.items.length);
    })) {
      previewHtml = renderBlocksToPreviewHtml(editorBlocks);
    } else {
      const rawVal = document.getElementById('post-content-raw')?.value || '';
      if (rawVal.includes('<!-- wp:')) {
        const blocks = rawGutenbergToBlockList(rawVal);
        previewHtml = renderBlocksToPreviewHtml(blocks);
      } else {
        previewHtml = renderFullMarkdown(rawVal);
      }
    }
  }

  const titleEl = document.getElementById('editor-preview-title');
  if (titleEl) titleEl.innerText = title;

  const contentEl = document.getElementById('editor-preview-content');
  if (contentEl) {
    contentEl.innerHTML = previewHtml || '<p style="color:#64748b; font-style:italic;">暂无正文内容，请在左上角切换回「可视化区块」开始创作。</p>';
  }
}

function toggleMobilePreview() {
  if (currentEditorMode === 'preview') {
    switchEditorMode('visual');
  } else {
    switchEditorMode('preview');
  }
}

function insertRawBlock(type) {
  const textarea = document.getElementById('post-content-raw');
  let blockTemplate = '';
  switch (type) {
    case 'paragraph':
      blockTemplate = '<!-- wp:paragraph -->\\n<p>输入段落文本内容...</p>\\n<!-- /wp:paragraph -->\\n\\n';
      break;
    case 'heading':
      blockTemplate = '<!-- wp:heading {"level":2} -->\\n<h2 class="wp-block-heading">输入二级标题</h2>\\n<!-- /wp:heading -->\\n\\n';
      break;
    case 'image':
      blockTemplate = '<!-- wp:image -->\\n<figure class="wp-block-image"><img src="/media/uploads/example.jpg" alt="图片描述" /><figcaption>图片说明</figcaption></figure>\\n<!-- /wp:image -->\\n\\n';
      break;
    case 'code':
      blockTemplate = '<!-- wp:code -->\\n<pre class="wp-block-code"><code>// 在此键入代码\\nconsole.log("Hello Cloudflare");</code></pre>\\n<!-- /wp:code -->\\n\\n';
      break;
    case 'quote':
      blockTemplate = '<!-- wp:quote -->\\n<blockquote class="wp-block-quote"><p>这里是引言内容</p><cite>—— 某某</cite></blockquote>\\n<!-- /wp:quote -->\\n\\n';
      break;
    case 'list':
      blockTemplate = '<!-- wp:list -->\\n<ul class="wp-block-list">\\n<li>第一项</li>\\n<li>第二项</li>\\n</ul>\\n<!-- /wp:list -->\\n\\n';
      break;
    case 'separator':
      blockTemplate = '<!-- wp:separator -->\\n<hr class="wp-block-separator" />\\n<!-- /wp:separator -->\\n\\n';
      break;
  }
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  textarea.value = text.substring(0, start) + blockTemplate + text.substring(end);
  textarea.focus();
}

function resetEditor() {
  document.getElementById('edit-post-id').value = '';
  document.getElementById('post-title').value = '';
  document.getElementById('post-slug').value = '';
  document.getElementById('post-featured-image').value = '';
  document.getElementById('post-content-raw').value = '';
  document.getElementById('post-excerpt').value = '';
  document.getElementById('editor-heading').innerText = '撰写新文章';
  editorBlocks = [{ type: 'paragraph', content: '' }];
  switchEditorMode('visual');
  renderVisualBlocks();
}

async function editPost(id) {
  const res = await fetch('/api/posts/' + id);
  const data = await res.json();
  if (data.post) {
    const p = data.post;
    document.getElementById('edit-post-id').value = p.id;
    document.getElementById('post-title').value = p.title;
    document.getElementById('post-slug').value = p.slug;
    document.getElementById('post-featured-image').value = p.featured_image || '';
    const raw = p.content_raw || p.content_html;
    document.getElementById('post-content-raw').value = raw;
    document.getElementById('post-excerpt').value = p.excerpt || '';
    document.getElementById('editor-heading').innerText = '编辑文章: ' + p.title;
    
    // Parse into visual blocks
    editorBlocks = rawGutenbergToBlockList(raw);
    switchEditorMode('visual');
    renderVisualBlocks();
    showTab('editor');
  }
}

async function savePost(status) {
  const id = document.getElementById('edit-post-id').value;
  const title = document.getElementById('post-title').value;
  const slug = document.getElementById('post-slug').value;
  const featured_image = document.getElementById('post-featured-image').value;
  const excerpt = document.getElementById('post-excerpt').value;

  let content_raw = '';
  if (currentEditorMode === 'visual') {
    content_raw = blockListToRawGutenberg(editorBlocks);
    document.getElementById('post-content-raw').value = content_raw;
  } else {
    content_raw = document.getElementById('post-content-raw').value;
  }

  if (!title || !content_raw) {
    alert('文章标题与内容不能为空');
    return;
  }

  const payload = { title, slug, featured_image, content_raw, excerpt, status };
  const method = id ? 'PUT' : 'POST';
  const url = id ? '/api/posts/' + id : '/api/posts';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Admin-Action': 'true' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (res.ok) {
    alert(status === 'published' ? '文章发布成功' : '已保存为草稿');
    showTab('posts');
  } else {
    alert(data.error || '保存失败');
  }
}

async function deletePost(id) {
  if (!confirm('确定要删除该文章吗？此操作不可恢复。')) return;
  const res = await fetch('/api/posts/' + id, {
    method: 'DELETE',
    headers: { 'X-Admin-Action': 'true' }
  });
  if (res.ok) {
    loadPosts();
  } else {
    alert('删除失败');
  }
}

async function loadComments() {
  const res = await fetch('/api/comments', { headers: { 'X-Admin-Action': 'true' } });
  const data = await res.json();
  const tbody = document.getElementById('comments-table-body');
  if (!data.comments || data.comments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:36px 16px; color:#64748b; background:#10141c;">暂无评论记录</td></tr>';
    return;
  }
  tbody.innerHTML = data.comments.map(c => {
    let badge = '<span class="badge" style="background:#78350f; color:#fbbf24; border:1px solid #d97706;">待审核</span>';
    if (c.status === 'approved') {
      badge = '<span class="badge" style="background:#064e3b; color:#34d399; border:1px solid #059669;">已通过</span>';
    } else if (c.status === 'spam') {
      badge = '<span class="badge" style="background:#7f1d1d; color:#f87171; border:1px solid #dc2626;">垃圾</span>';
    }
    const passBtn = c.status !== 'approved' ? ('<button class="btn" style="padding:4px 8px; font-size:12px; background:#064e3b; color:#34d399;" onclick="setCommentStatus(&quot;' + escapeHtml(c.id) + '&quot;, &quot;approved&quot;)">通过</button>') : '';
    const pendBtn = c.status !== 'pending' ? ('<button class="btn" style="padding:4px 8px; font-size:12px; background:#78350f; color:#fbbf24;" onclick="setCommentStatus(&quot;' + escapeHtml(c.id) + '&quot;, &quot;pending&quot;)">待审</button>') : '';
    const spamBtn = c.status !== 'spam' ? ('<button class="btn" style="padding:4px 8px; font-size:12px; background:#451a03; color:#f97316;" onclick="setCommentStatus(&quot;' + escapeHtml(c.id) + '&quot;, &quot;spam&quot;)">垃圾</button>') : '';
    const delBtn = '<button class="btn" style="padding:4px 8px; font-size:12px; background:#1e293b; color:#ef4444;" onclick="deleteComment(&quot;' + escapeHtml(c.id) + '&quot;)">删除</button>';

    return '<tr>' +
      '<td><strong>' + escapeHtml(c.author_name) + '</strong><br/><span style="font-size:12px; color:#64748b;">' + escapeHtml(c.author_email) + '</span></td>' +
      '<td style="max-width:360px; word-break:break-word;">' + escapeHtml(c.content).replace(/\\n/g, '<br/>') + '</td>' +
      '<td>' + badge + '</td>' +
      '<td>' + (c.created_at ? c.created_at.slice(0, 16).replace('T', ' ') : '') + '</td>' +
      '<td><div style="display:flex; gap:6px; flex-wrap:wrap;">' + passBtn + pendBtn + spamBtn + delBtn + '</div></td>' +
      '</tr>';
  }).join('');
}

async function setCommentStatus(id, status) {
  const res = await fetch('/api/comments/' + id + '/status', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Action': 'true' },
    body: JSON.stringify({ status })
  });
  if (res.ok) {
    loadComments();
  } else {
    const data = await res.json();
    alert(data.error || '更新评论状态失败');
  }
}

async function deleteComment(id) {
  if (!confirm('确定删除该评论吗？此操作不可恢复。')) return;
  const res = await fetch('/api/comments/' + id, {
    method: 'DELETE',
    headers: { 'X-Admin-Action': 'true' }
  });
  if (res.ok) loadComments();
}

async function loadMedia() {
  const res = await fetch('/api/admin/media', { headers: { 'X-Admin-Action': 'true' } });
  const data = await res.json();
  const tbody = document.getElementById('media-table-body');
  if (!data.media || data.media.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:36px 16px; color:#64748b; background:#10141c;">暂无媒体文件</td></tr>';
    return;
  }
  tbody.innerHTML = data.media.map(m => \`
    <tr>
      <td><strong>\${escapeHtml(m.filename)}</strong></td>
      <td>\${escapeHtml(m.mime_type)}</td>
      <td>\${(m.size / 1024).toFixed(1)} KB</td>
      <td><a href="/media/\${encodeURIComponent(m.r2_key)}" target="_blank" style="font-family:monospace; font-size:12px;">/media/\${escapeHtml(m.r2_key)}</a></td>
      <td>\${m.created_at ? m.created_at.slice(0, 10) : ''}</td>
    </tr>
  \`).join('');
}

async function uploadMediaFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'X-Admin-Action': 'true' },
    body: formData
  });

  const data = await res.json();
  if (res.ok) {
    alert('上传成功！CDN URL: ' + data.url);
    loadMedia();
  } else {
    alert(data.error || '上传失败');
  }
}

async function generateHotpPool() {
  const btn = document.getElementById('hotp-gen-btn');
  const status = document.getElementById('hotp-status');
  btn.disabled = true;
  btn.innerText = '正在生成并下载...';
  status.innerText = '正在生成 1000 个密钥并流式下载...';

  try {
    const res = await fetch('/api/admin/hotp/generate', {
      method: 'POST',
      headers: { 'X-Admin-Action': 'true' }
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hotp-keys.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      status.innerText = '1000 个密钥已生成并下载，后台正在写入数据。';
    } else {
      const err = await res.json();
      status.innerText = '生成失败: ' + (err.error || '未知错误');
    }
  } catch {
    status.innerText = '网络连接错误';
  } finally {
    btn.disabled = false;
    btn.innerText = '生成 HOTP 密钥池并下载';
  }
}

function copyOidcUrl() {
  const input = document.getElementById('oidc-discovery-url');
  input.select();
  navigator.clipboard.writeText(input.value);
  alert('已复制 OpenID Connect 发现配置 URL 到剪贴板！');
}

function copyNewSecret() {
  const input = document.getElementById('new-secret-display');
  input.select();
  navigator.clipboard.writeText(input.value);
  alert('已复制 Client Secret 密钥！');
}

function toggleOAuthCreateModal() {
  const card = document.getElementById('oauth-create-card');
  card.style.display = card.style.display === 'none' ? 'block' : 'none';
}

async function loadOAuthClients() {
  const discoveryInput = document.getElementById('oidc-discovery-url');
  if (discoveryInput) {
    discoveryInput.value = window.location.origin + '/.well-known/openid-configuration';
  }

  const res = await fetch('/api/admin/oauth/clients', { headers: { 'X-Admin-Action': 'true' } });
  const data = await res.json();
  const tbody = document.getElementById('oauth-table-body');
  if (!data.clients || data.clients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:36px 16px; color:#64748b; background:#10141c;">暂无已接入的 OAuth 客户端应用</td></tr>';
    return;
  }
  tbody.innerHTML = data.clients.map(c => \`
    <tr>
      <td><strong>\${escapeHtml(c.client_name)}</strong></td>
      <td><code style="background:#0f172a; padding:3px 6px; border-radius:4px; font-size:12px; color:#38bdf8;">\${escapeHtml(c.id)}</code></td>
      <td style="font-size:12px; max-width:280px; word-break:break-all;">\${(c.redirect_uris || []).map(u => escapeHtml(u)).join('<br/>')}</td>
      <td>
        <span class="badge" style="\${c.is_trusted ? 'background:rgba(16,185,129,0.1); color:#10b981;' : ''}">
          \${c.is_trusted ? '第一方受信任' : '第三方授权'}
        </span>
      </td>
      <td>\${c.created_at ? c.created_at.slice(0, 10) : ''}</td>
      <td style="display:flex; gap:6px;">
        <button class="btn" style="padding:4px 8px; font-size:12px; background:#1e293b; color:#38bdf8;" onclick="resetOAuthAppSecret('\${escapeHtml(c.id)}')">重置密钥</button>
        <button class="btn" style="padding:4px 8px; font-size:12px; background:#1e293b; color:#ef4444;" onclick="deleteOAuthApp('\${escapeHtml(c.id)}')">删除</button>
      </td>
    </tr>
  \`).join('');
}

async function handleCreateOAuthApp(e) {
  e.preventDefault();
  const client_name = document.getElementById('oauth-name').value;
  const redirect_uris = document.getElementById('oauth-redirects').value;
  const scopes = document.getElementById('oauth-scopes').value;
  const is_trusted = document.getElementById('oauth-trusted').checked;
  const btn = document.getElementById('oauth-save-btn');

  btn.disabled = true;
  btn.innerText = '正在创建...';

  try {
    const res = await fetch('/api/admin/oauth/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Action': 'true' },
      body: JSON.stringify({ client_name, redirect_uris, scopes, is_trusted })
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById('oauth-create-card').style.display = 'none';
      document.getElementById('oauth-name').value = '';
      document.getElementById('oauth-redirects').value = '';

      const banner = document.getElementById('oauth-new-secret-banner');
      const secretInput = document.getElementById('new-secret-display');
      secretInput.value = data.plain_secret;
      banner.style.display = 'block';

      loadOAuthClients();
    } else {
      alert(data.error || '创建失败');
    }
  } catch {
    alert('网络错误');
  } finally {
    btn.disabled = false;
    btn.innerText = '确认创建应用';
  }
  return false;
}

async function resetOAuthAppSecret(id) {
  if (!confirm('确定要重置该应用的 Client Secret 吗？重置后原密钥将立即失效，接入系统需更新密钥。')) return;
  const res = await fetch('/api/admin/oauth/clients/' + id + '/reset-secret', {
    method: 'POST',
    headers: { 'X-Admin-Action': 'true' }
  });
  const data = await res.json();
  if (res.ok) {
    const banner = document.getElementById('oauth-new-secret-banner');
    const secretInput = document.getElementById('new-secret-display');
    secretInput.value = data.plain_secret;
    banner.style.display = 'block';
    alert('密钥已重置！请查看页面顶部的绿色密钥提示框复制新密钥。');
  } else {
    alert(data.error || '重置失败');
  }
}

async function deleteOAuthApp(id) {
  if (!confirm('确定要删除该 OAuth 应用吗？已接入该系统的用户将无法通过此应用登录。')) return;
  const res = await fetch('/api/admin/oauth/clients/' + id, {
    method: 'DELETE',
    headers: { 'X-Admin-Action': 'true' }
  });
  if (res.ok) {
    loadOAuthClients();
  } else {
    alert('删除失败');
  }
}

const installedThemes = ${JSON.stringify(allThemes)};
let activeThemeId = ${JSON.stringify(site.active_theme || 'bold-typography')};

function renderThemeCardContent(targetPrefix, theme) {
  if (!theme) return;
  const nameEl = document.getElementById(targetPrefix + '-name');
  const metaEl = document.getElementById(targetPrefix + '-meta');
  if (nameEl) nameEl.innerText = theme.name;
  if (metaEl) metaEl.innerText = '版本: v' + theme.version + ' · 作者: ' + theme.author;

  const tagsEl = document.getElementById(targetPrefix + '-tags');
  if (tagsEl) {
    tagsEl.innerHTML = (theme.tags || []).map(t => '<span class="badge" style="background:#1e293b; color:#cbd5e1; border-color:#334155; font-size:11px;">' + escapeHtml(t) + '</span>').join('');
  }

  const colorsEl = document.getElementById(targetPrefix + '-colors');
  const prev = theme.preview || {};
  if (colorsEl) {
    colorsEl.innerHTML = '<div style="display:flex; align-items:center; gap:5px; font-size:11px; color:#94a3b8;"><span style="display:inline-block; width:14px; height:14px; border-radius:2px; border:1px solid #334155; background:' + (prev.bgColor || '#000') + '"></span>背景</div>' +
      '<div style="display:flex; align-items:center; gap:5px; font-size:11px; color:#94a3b8;"><span style="display:inline-block; width:14px; height:14px; border-radius:2px; border:1px solid #334155; background:' + (prev.cardBg || '#111') + '"></span>表面</div>' +
      '<div style="display:flex; align-items:center; gap:5px; font-size:11px; color:#94a3b8;"><span style="display:inline-block; width:14px; height:14px; border-radius:2px; border:1px solid #334155; background:' + (prev.textColor || '#fff') + '"></span>正文</div>' +
      '<div style="display:flex; align-items:center; gap:5px; font-size:11px; color:#94a3b8;"><span style="display:inline-block; width:14px; height:14px; border-radius:2px; border:1px solid #334155; background:' + (prev.accentColor || '#38bdf8') + '"></span>点睛</div>';
  }

  const fontEl = document.getElementById(targetPrefix + '-font');
  if (fontEl) {
    fontEl.innerText = prev.fontFamilySans || 'Sans-Serif';
  }

  const featsEl = document.getElementById(targetPrefix + '-features');
  if (featsEl) {
    featsEl.innerHTML = (prev.features || []).map(f => '<li>' + escapeHtml(f) + '</li>').join('');
  }
}

function onThemeSelectChange(selectedId) {
  const selectedTheme = installedThemes.find(t => t.id === selectedId) || installedThemes[0];
  renderThemeCardContent('new-theme', selectedTheme);

  const newCard = document.getElementById('card-new-theme');
  const badgeEl = document.getElementById('new-theme-badge');
  const btnEl = document.getElementById('confirm-apply-theme-btn');

  if (!newCard || !badgeEl || !btnEl) return;

  if (selectedId === activeThemeId) {
    newCard.style.borderColor = '#222834';
    badgeEl.innerText = '当前正在使用';
    badgeEl.style.color = '#10b981';
    badgeEl.style.background = 'rgba(16,185,129,0.15)';
    badgeEl.style.borderColor = 'rgba(16,185,129,0.3)';
    btnEl.innerText = '重构当前主题缓存';
  } else {
    newCard.style.borderColor = selectedTheme.preview?.accentColor || '#38bdf8';
    badgeEl.innerText = '准备切换';
    badgeEl.style.color = selectedTheme.preview?.accentColor || '#38bdf8';
    badgeEl.style.background = 'rgba(56,189,248,0.15)';
    badgeEl.style.borderColor = 'rgba(56,189,248,0.3)';
    btnEl.innerText = '确认更换为「' + selectedTheme.name + '」并清空缓存重建';
  }
}

function initThemeComparison() {
  const currentTheme = installedThemes.find(t => t.id === activeThemeId) || installedThemes[0];
  renderThemeCardContent('cur-theme', currentTheme);

  const selector = document.getElementById('theme-selector');
  const initialSelectedId = selector ? selector.value : activeThemeId;
  onThemeSelectChange(initialSelectedId);
}

async function handleConfirmThemeSwitch() {
  const selector = document.getElementById('theme-selector');
  const themeName = selector ? selector.value : activeThemeId;
  const statusEl = document.getElementById('theme-status-msg');
  const btn = document.getElementById('confirm-apply-theme-btn');

  btn.disabled = true;
  statusEl.style.color = '#38bdf8';
  statusEl.innerText = '正在切换主题、清空边缘 KV 缓存并预热全站 SSR...';

  try {
    const res = await fetch('/api/admin/theme/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Action': 'true' },
      body: JSON.stringify({ theme: themeName })
    });
    const data = await res.json();
    if (res.ok) {
      statusEl.style.color = '#10b981';
      statusEl.innerText = data.message;
      activeThemeId = themeName;
      initThemeComparison();
      const optSelect = document.getElementById('opt-active-theme');
      if (optSelect) optSelect.value = themeName;
      alert(data.message);
    } else {
      statusEl.style.color = '#ef4444';
      statusEl.innerText = '切换失败: ' + (data.error || '未知错误');
    }
  } catch {
    statusEl.style.color = '#ef4444';
    statusEl.innerText = '网络连接错误';
  } finally {
    btn.disabled = false;
  }
}

async function handlePurgeCache() {
  const btn = document.getElementById('purge-cache-btn');
  const statusEl = document.getElementById('theme-status-msg');
  btn.disabled = true;
  statusEl.style.color = '#38bdf8';
  statusEl.innerText = '正在清空全站边缘 KV 缓存并重建首页...';

  try {
    const res = await fetch('/api/admin/cache/purge-rebuild', {
      method: 'POST',
      headers: { 'X-Admin-Action': 'true' }
    });
    const data = await res.json();
    if (res.ok) {
      statusEl.style.color = '#10b981';
      statusEl.innerText = data.message;
      alert(data.message);
    } else {
      statusEl.style.color = '#ef4444';
      statusEl.innerText = '清空失败: ' + (data.error || '未知错误');
    }
  } catch {
    statusEl.style.color = '#ef4444';
    statusEl.innerText = '网络连接错误';
  } finally {
    btn.disabled = false;
  }
}

async function saveOptions(e) {
  e.preventDefault();
  const site_name = document.getElementById('opt-site-name').value;
  const site_description = document.getElementById('opt-site-desc').value;
  const posts_per_page = parseInt(document.getElementById('opt-posts-per-page').value, 10);
  const active_theme = document.getElementById('opt-active-theme').value;
  const footer_html = document.getElementById('opt-footer-html').value;
  const msg = document.getElementById('opt-msg');

  const res = await fetch('/api/admin/options', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Action': 'true' },
    body: JSON.stringify({ site_name, site_description, posts_per_page, active_theme, footer_html })
  });

  if (res.ok) {
    msg.innerText = '设置已保存';
    setTimeout(() => msg.innerText = '', 2000);
  } else {
    alert('保存设置失败');
  }
  return false;
}

initThemeComparison();
renderVisualBlocks();
</script>
</body>
</html>`;
}
