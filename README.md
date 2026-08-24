# Munin 极简边缘博客系统

基于 Cloudflare 全托管 Serverless 架构构建的高性能、现代化极简博客系统。全栈运行于 Cloudflare 边缘计算网络，结合 Durable Objects 内置 SQLite 数据库、边缘 KV 缓存、R2 对象存储以及原生邮件发送能力，提供毫秒级响应、零运维成本与高可用性。

---

## 核心架构与技术选型

- **边缘计算运行时**：Cloudflare Workers + TypeScript + Hono Web 框架
- **持久化数据存储**：Cloudflare Durable Objects 原生 SQLite 引擎（存储用户、文章、分类、标签、评论、站点配置与 OAuth 客户端信息）
- **高速边缘缓存**：Cloudflare KV（提供全站页面服务端渲染缓存、404 负向缓存、HOTP 一次性密钥池及访问限流计数器）
- **对象存储**：Cloudflare R2（存储文章插图与媒体附件，内置文件魔数检测防御）
- **事务邮件通知**：Cloudflare 原生 Email Sending Worker 绑定（提供登录验证码与评论互动邮件提醒）
- **内容排版引擎**：WordPress Gutenberg 区块兼容规范 + 全功能 markdown-it 解析器

---

## 关键特性

1. **边缘服务端渲染（SSR）与即时首屏**
   - 页面由边缘节点就近生成，配合 KV 边缘缓存，全球平均首屏时间低至数十毫秒。
   - 完备的 OpenGraph 与 Twitter Card 社交分享元标签注入。

2. **现代化双模式内容编辑器**
   - **可视化区块模式**：支持段落、多级标题、图片、代码高亮、引用、有序/无序列表、分割线及自定义 HTML 区块。
   - **源码与 Markdown 模式**：全量支持标准 Markdown 语法，支持一键将 Markdown 解析为可视化区块。
   - **实时排版预览**：所见即所得的渲染预览，适配移动端浮动操作工具栏。
   - **安全防护**：原始 HTML 标签默认过滤，阻止通过 Markdown 内容注入恶意脚本。

3. **解耦式视觉主题系统**
   - 主题完全解耦存放于 `src/themes/` 目录下，系统自动扫描并识别主题包。
   - 后台提供左右双卡片对比预览，支持一键切换主题并即时清空边缘缓存、预热全站。

4. **内置 OAuth 认证中心与单点登录**
   - 支持将博客作为统一身份认证中心，为外部系统、论坛、知识库提供登录与鉴权服务。
   - 支持受信任应用免确认授权、授权码防重放机制与 PKCE S256 算法。

5. **一次性密钥池鉴权体系（HOTP）**
   - 后台可生成 1000 个随机一次性 Token 并存入 KV。
   - 供外部自动化脚本、CI/CD 流程调用发文与管理 API，验证通过后即时核销销毁，杜绝静态密钥泄露风险。

6. **防账单消耗与全方位安全防御**
   - **404 负向缓存**：恶意遍历不存在文章时由边缘层直接响应，避免频繁唤醒 Durable Objects 产生额外费用。
   - **撞库与爆破防御**：登录连续失败 5 次自动锁定 15 分钟。
   - **密码强度强制**：注册与修改密码要求 8 位以上，包含大小写字母、数字及特殊字符；采用 OWASP 2023 推荐的 PBKDF2-SHA256 (600,000 迭代) 哈希。
   - **邮件防轰炸**：同邮箱验证码 60 秒冷却，同文章评论提醒 5 分钟冷却。
   - **媒体上传防护**：严格校验文件头魔数与 SVG 脚本过滤，防止恶意代码伪装与存储滥用。
   - **存储型 XSS 多层防御**：Markdown 渲染禁用原始 HTML 直通；评论内容与用户输入全量转义过滤；页脚自定义 HTML 自动剥离危险标签与事件处理器。
   - **CSRF 防护**：管理后台所有写操作强制校验 Origin/Referer 头，拒绝跨站请求。
   - **JWT 令牌失效联动**：密码修改后自动递增令牌版本号，所有历史会话与 OAuth 访问令牌即刻失效。
   - **Turnstile 人机验证**：注册、登录、评论、密码重置等公开端点强制 Cloudflare Turnstile 验证。

7. **数据备份与导出**
   - 一键将 SQLite 数据库中的全量数据导出为结构化 JSON 备份文件。

---

## 快速开始

### 1. 环境准备
确保本地安装了 Node.js 18+ 及 npm：
```bash
node -v
npm -v
```

### 2. 安装依赖
```bash
npm install
```

### 3. 本地开发调试
启动本地模拟环境：
```bash
npm run dev
```
本地服务启动后，访问 `http://localhost:8787` 查看前台博客，访问 `http://localhost:8787/admin` 进入管理后台。

### 4. 执行自动化测试
项目包含针对服务端渲染、安全攻防、OAuth 认证的 132 项自动化测试：
```bash
npm test
```

---

## 生产环境部署

### 1. 登录 Cloudflare 账号
```bash
npx wrangler login
```

### 2. 创建 Cloudflare 资源

#### 创建 KV 命名空间
```bash
# 创建全站缓存 KV
npx wrangler kv:namespace create CACHE_KV
# 创建一次性密钥池 KV
npx wrangler kv:namespace create HOTP_KV
```
执行后终端会输出类似 `id = "abcd1234..."` 的信息，**将这两个 id 分别替换 `wrangler.jsonc` 中 `kv_namespaces` 里的 `"blog_cache_kv_id"` 和 `"blog_hotp_kv_id"` 占位符**。

#### 创建 R2 存储桶
```bash
npx wrangler r2 bucket create blog-media
```

### 3. 配置安全密钥

```bash
# JWT 签名密钥（必须配置，否则服务拒绝启动）
# 用 openssl 生成一个 64 位随机字符串：
npx wrangler secret put JWT_SECRET
# 提示输入时粘贴: openssl rand -base64 64 的输出结果

# Turnstile 人机验证密钥（必须配置，否则所有公开表单验证失败）
npx wrangler secret put TURNSTILE_SECRET_KEY
# 从 Cloudflare Turnstile 控制台获取站点对应的 Secret Key 并粘贴
```

> **如何获取 Turnstile 密钥对？**
> 1. 打开 [Cloudflare Dashboard → Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) → **Add Site**
> 2. 域名填你的博客域名，模式选 Managed
> 3. 创建后会得到一对密钥：**Site Key**（公开）和 **Secret Key**（私密）
> 4. Site Key 填入下方 `wrangler.jsonc` 的 `vars.TURNSTILE_SITE_KEY`
> 5. Secret Key 通过 `wrangler secret put TURNSTILE_SECRET_KEY` 加密存储

> **本地开发**：若需跳过 Turnstile 验证，可将 `TURNSTILE_SECRET_KEY` 设为 `SKIP_TURNSTILE_DEV_ONLY`。

### 4. 修改 wrangler.jsonc 中的站点配置

将 `wrangler.jsonc` 的 `vars` 中以下占位符替换为你的实际值：
- `SITE_URL`：`"https://your-domain.com"`（你的博客域名）
- `TURNSTILE_SITE_KEY`：从 Cloudflare Turnstile 控制台获取的 **Site Key**（⚠️ 这是公开密钥，以 `0x4AAAAA` 开头）
- `ADMIN_EMAIL`：你的管理员邮箱

### 5. 部署到 Cloudflare Workers
```bash
npm run deploy
```

---

## 项目目录结构

```
.
├── src/
│   ├── auth/              # 身份认证、会话处理、HOTP 密钥生成与 Turnstile 验证
│   ├── do/                # Durable Objects SQLite 数据库模型与存储逻辑
│   ├── engine/            # 主题编译、Gutenberg 区块解析与 SSR 渲染引擎
│   ├── middleware/        # 权限校验、速率限制、安全过滤与 HOTP 拦截中间件
│   ├── routes/            # REST API、前台 SSR、OAuth 认证与媒体分发路由
│   ├── services/          # KV 缓存管理、邮件发送服务
│   ├── themes/            # 自解耦视觉主题包目录
│   │   ├── bold-typography/  # 醒目排版主题
│   │   ├── default-dark/     # 经典暗色主题
│   │   ├── monochrome/       # 极简黑白主题
│   │   └── monochrome-dark/  # 深邃黑白主题
│   ├── types/             # 全局 TypeScript 类型定义
│   ├── utils/             # 文件魔数校验等辅助工具
│   ├── views/             # 管理后台界面与样式定义
│   └── index.ts           # Workers 主入口与 Hono 应用路由挂载
├── test/                  # 单元测试与攻防测试套件
├── wrangler.jsonc         # Cloudflare Workers 资源与环境配置文件
├── package.json
└── tsconfig.json
```

---

## 详细使用文档

关于后台操作、内容撰写、主题开发、OAuth 接入及 HOTP 自动化的详细示例，请参阅 [USAGE.md](./USAGE.md)。

---

## 开源协议

本项目采用 MIT 协议开源。
