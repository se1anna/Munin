import { Hono } from "hono";
import { HonoEnv } from "../types/env";
import { OAuthCodeData, OIDCDiscoveryConfig } from "../types/oauth";
import { extractToken, isTokenVersionValid } from "../middleware/auth-guard";
import { verifyJWT, signJWT, verifyPassword } from "../auth/session";
import { rateLimit } from "../middleware/rate-limiter";

export const oauthRoutes = new Hono<HonoEnv>();

function getBlogDOStub(c: any) {
  const id = c.env.BLOG_DO.idFromName("global-blog-instance");
  return c.env.BLOG_DO.get(id);
}

function getBaseUrl(c: any): string {
  const url = new URL(c.req.url);
  const forwardedProto = c.req.header("x-forwarded-proto") || url.protocol.replace(":", "");
  const host = c.req.header("host") || url.host;
  return `${forwardedProto}://${host}`;
}

async function verifyS256CodeChallenge(codeVerifier: string, expectedChallenge: string): Promise<boolean> {
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(codeVerifier));
  const hashBytes = new Uint8Array(hashBuffer);
  let binary = "";
  for (let i = 0; i < hashBytes.length; i++) {
    binary += String.fromCharCode(hashBytes[i]);
  }
  const computed = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return computed === expectedChallenge;
}

// 1. OpenID Connect Discovery Configuration
export function getOIDCDiscovery(baseUrl: string): OIDCDiscoveryConfig {
  return {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    userinfo_endpoint: `${baseUrl}/oauth/userinfo`,
    jwks_uri: `${baseUrl}/oauth/jwks.json`,
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["HS256"],
    scopes_supported: ["openid", "profile", "email", "role"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic", "none"],
    claims_supported: ["sub", "id", "name", "preferred_username", "email", "email_verified", "role"],
    code_challenge_methods_supported: ["S256", "plain"]
  };
}

oauthRoutes.get("/.well-known/openid-configuration", (c) => {
  const baseUrl = getBaseUrl(c);
  return c.json(getOIDCDiscovery(baseUrl));
});

// 2. OAuth 2.0 / OIDC Authorization Endpoint
oauthRoutes.get("/authorize", async (c) => {
  const clientId = c.req.query("client_id");
  const redirectUri = c.req.query("redirect_uri");
  const responseType = c.req.query("response_type");
  const scope = c.req.query("scope") || "openid profile email";
  const state = c.req.query("state");
  const codeChallenge = c.req.query("code_challenge");
  const codeChallengeMethod = (c.req.query("code_challenge_method") || "plain") as "S256" | "plain";

  if (!clientId || !redirectUri) {
    return c.text("缺少 client_id 或 redirect_uri 参数", 400);
  }

  if (responseType !== "code") {
    return c.text("不支持的 response_type，仅支持 authorization_code (code)", 400);
  }

  const blogDO = getBlogDOStub(c);
  const client = await (blogDO as any).getOAuthClientById(clientId);
  if (!client) {
    return c.text(`无效的 OAuth 客户端 ID: ${clientId}`, 400);
  }

  // Validate redirect_uri against client allowed whitelist
  // ⚠️ SECURITY: Exact match required — origin, pathname, query, and hash must all match
  const isRedirectAllowed = client.redirect_uris.some((allowed: string) => {
    if (allowed === redirectUri) return true;
    try {
      const allowedUrl = new URL(allowed);
      const reqUrl = new URL(redirectUri);
      // Require exact match on origin, pathname, and search (query string)
      return allowedUrl.origin === reqUrl.origin
        && allowedUrl.pathname === reqUrl.pathname
        && allowedUrl.search === reqUrl.search;
    } catch {
      return false;
    }
  });

  if (!isRedirectAllowed) {
    return c.text("回调地址 (redirect_uri) 未在应用白名单配置中", 400);
  }

  // Check user session
  const token = extractToken(c);
  let loggedInUser = null;
  if (token) {
    const secret = c.env.JWT_SECRET;
    if (secret) {
      const user = await verifyJWT(token, secret);
      if (user) {
        const isValid = await isTokenVersionValid(c, user.id, user.token_version);
        if (isValid) {
          loggedInUser = user;
        }
      }
    }
  }

  // If user is not logged in, redirect to SSO Login screen
  if (!loggedInUser) {
    const returnTo = encodeURIComponent(c.req.url);
    return c.redirect(`/oauth/login?return_to=${returnTo}`);
  }

  // Generate 32-byte secure random authorization code
  const code = `${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
  const codeData: OAuthCodeData = {
    code,
    client_id: clientId,
    user_id: loggedInUser.id,
    redirect_uri: redirectUri,
    scope,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
    created_at: Math.floor(Date.now() / 1000)
  };

  // Save Code to KV with 10 minutes (600s) TTL
  if (c.env.CACHE_KV) {
    await c.env.CACHE_KV.put(`oauth_code:${code}`, JSON.stringify(codeData), { expirationTtl: 600 });
  }

  // Redirect to client callback URL with code and state
  const targetUrl = new URL(redirectUri);
  targetUrl.searchParams.set("code", code);
  if (state) {
    targetUrl.searchParams.set("state", state);
  }

  return c.redirect(targetUrl.toString(), 302);
});

// 3. OAuth 2.0 / OIDC Token Endpoint
oauthRoutes.post(
  "/token",
  rateLimit({
    keyPrefix: "oauth_token_ip",
    limit: 60,
    windowSeconds: 60,
    errorMessage: "请求 Token 过于频繁，请稍后再试"
  }),
  async (c) => {
    let body: any = {};
    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        body = await c.req.json();
      } catch {
        body = {};
      }
    } else {
      try {
        body = await c.req.parseBody();
      } catch {
        body = {};
      }
    }

    // Extract client_id & client_secret from Basic Auth header or body
    let clientId = body.client_id;
    let clientSecret = body.client_secret;

    const authHeader = c.req.header("authorization");
    if (authHeader && authHeader.startsWith("Basic ")) {
      try {
        const decoded = atob(authHeader.substring(6).trim());
        const [hClient, hSecret] = decoded.split(":");
        if (hClient) clientId = hClient;
        if (hSecret) clientSecret = hSecret;
      } catch {
        // ignore
      }
    }

    const grantType = body.grant_type;
    const code = body.code;
    const redirectUri = body.redirect_uri;
    const codeVerifier = body.code_verifier;

    if (grantType !== "authorization_code") {
      return c.json({ error: "unsupported_grant_type", error_description: "仅支持 authorization_code 授权模式" }, 400);
    }

    if (!code || !clientId) {
      return c.json({ error: "invalid_request", error_description: "缺少 code 或 client_id 参数" }, 400);
    }

    // Retrieve authorization code from KV
    let codeData: OAuthCodeData | null = null;
    if (c.env.CACHE_KV) {
      const stored = await c.env.CACHE_KV.get(`oauth_code:${code}`);
      if (stored) {
        try {
          codeData = JSON.parse(stored);
        } catch {
          codeData = null;
        }
        // Single-use guarantee: immediately revoke code from KV to prevent replay
        await c.env.CACHE_KV.delete(`oauth_code:${code}`);
      }
    }

    if (!codeData) {
      return c.json({ error: "invalid_grant", error_description: "授权码无效、已过期或已被使用" }, 400);
    }

    if (codeData.client_id !== clientId) {
      return c.json({ error: "invalid_grant", error_description: "客户端 ID 与授权码不匹配" }, 400);
    }

    if (redirectUri && codeData.redirect_uri !== redirectUri) {
      return c.json({ error: "invalid_grant", error_description: "回调地址与授权时登记的不匹配" }, 400);
    }

    const blogDO = getBlogDOStub(c);
    const client = await (blogDO as any).getOAuthClientById(clientId);
    if (!client) {
      return c.json({ error: "invalid_client", error_description: "客户端未找到" }, 400);
    }

    // Verify confidential client secret or public PKCE verifier
    if (clientSecret) {
      const isSecretValid = await verifyPassword(clientSecret, client.client_secret_hash);
      if (!isSecretValid) {
        return c.json({ error: "invalid_client", error_description: "客户端密钥错误" }, 401);
      }
    } else if (codeData.code_challenge) {
      // PKCE Verification
      if (!codeVerifier) {
        return c.json({ error: "invalid_request", error_description: "缺少 PKCE code_verifier" }, 400);
      }
      if (codeData.code_challenge_method === "S256") {
        const isPkceValid = await verifyS256CodeChallenge(codeVerifier, codeData.code_challenge);
        if (!isPkceValid) {
          return c.json({ error: "invalid_grant", error_description: "PKCE code_verifier SHA-256 校验未通过" }, 400);
        }
      } else {
        if (codeVerifier !== codeData.code_challenge) {
          return c.json({ error: "invalid_grant", error_description: "PKCE code_verifier 校验未通过" }, 400);
        }
      }
    } else if (!client.is_trusted) {
      return c.json({ error: "invalid_client", error_description: "该客户端需要提供 client_secret" }, 401);
    }

    // Fetch user from DB
    const user = await (blogDO as any).getUserById(codeData.user_id);
    if (!user) {
      return c.json({ error: "invalid_grant", error_description: "用户账号不存在" }, 400);
    }

    const baseUrl = getBaseUrl(c);
    const secret = c.env.JWT_SECRET;
    if (!secret) {
      return c.json({ error: "server_error", error_description: "JWT 签名密钥未配置" }, 500);
    }
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 3600; // 1 hour

    // Sign access_token
    const authUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      display_name: user.display_name,
      token_version: user.token_version || 1
    };
    const accessToken = await signJWT(authUser, secret, expiresIn);

    // Sign OIDC id_token (OpenID Connect specification)
    const idTokenPayload: any = {
      iss: baseUrl,
      sub: user.id,
      aud: clientId,
      name: user.display_name,
      preferred_username: user.username,
      email: user.email,
      email_verified: true,
      role: user.role,
      token_version: user.token_version || 1,
      iat: now,
      exp: now + expiresIn
    };

    // ID Token uses the same signature mechanism
    const idToken = await signJWT(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        display_name: user.display_name,
        token_version: user.token_version || 1
      },
      secret,
      expiresIn
    );

    return c.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: expiresIn,
      id_token: idToken,
      scope: codeData.scope
    });
  }
);

// 4. OIDC UserInfo Endpoint
oauthRoutes.get("/userinfo", async (c) => {
  const token = extractToken(c);
  if (!token) {
    return c.json({ error: "invalid_token", error_description: "缺少 Bearer 访问令牌" }, 401);
  }

  const secret = c.env.JWT_SECRET;
  if (!secret) {
    return c.json({ error: "invalid_token", error_description: "JWT 签名密钥未配置" }, 500);
  }
  const authUser = await verifyJWT(token, secret);
  if (!authUser) {
    return c.json({ error: "invalid_token", error_description: "访问令牌无效或已过期" }, 401);
  }

  const isValid = await isTokenVersionValid(c, authUser.id, authUser.token_version);
  if (!isValid) {
    return c.json({ error: "invalid_token", error_description: "该用户的会话已被注销，请重新授权" }, 401);
  }

  const blogDO = getBlogDOStub(c);
  const user = await (blogDO as any).getUserById(authUser.id);
  if (!user) {
    return c.json({ error: "invalid_token", error_description: "用户不存在" }, 404);
  }

  return c.json({
    sub: user.id,
    id: user.id,
    name: user.display_name,
    preferred_username: user.username,
    email: user.email,
    email_verified: true,
    role: user.role,
    display_name: user.display_name
  });
});

oauthRoutes.post("/userinfo", async (c) => {
  const token = extractToken(c);
  if (!token) {
    return c.json({ error: "invalid_token", error_description: "缺少 Bearer 访问令牌" }, 401);
  }

  const secret = c.env.JWT_SECRET;
  if (!secret) {
    return c.json({ error: "invalid_token", error_description: "JWT 签名密钥未配置" }, 500);
  }
  const authUser = await verifyJWT(token, secret);
  if (!authUser) {
    return c.json({ error: "invalid_token", error_description: "访问令牌无效或已过期" }, 401);
  }

  const isValid = await isTokenVersionValid(c, authUser.id, authUser.token_version);
  if (!isValid) {
    return c.json({ error: "invalid_token", error_description: "该用户的会话已被注销，请重新授权" }, 401);
  }

  const blogDO = getBlogDOStub(c);
  const user = await (blogDO as any).getUserById(authUser.id);
  if (!user) {
    return c.json({ error: "invalid_token", error_description: "用户不存在" }, 404);
  }

  return c.json({
    sub: user.id,
    id: user.id,
    name: user.display_name,
    preferred_username: user.username,
    email: user.email,
    email_verified: true,
    role: user.role,
    display_name: user.display_name
  });
});

// 5. Unified SSO Login Interface
oauthRoutes.get("/login", (c) => {
  const rawReturnTo = c.req.query("return_to") || "/";
  // ⚠️ SECURITY: Validate returnTo to prevent open redirect phishing
  let returnTo = "/";
  try {
    // Allow relative paths (starting with /)
    if (rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//")) {
      returnTo = rawReturnTo;
    } else {
      // Allow only same-origin absolute URLs
      const host = c.req.header("host") || "";
      const returnUrl = new URL(rawReturnTo);
      if (returnUrl.host === host) {
        returnTo = rawReturnTo;
      }
    }
  } catch {
    // Invalid URL, default to "/"
  }
  const turnstileSiteKey = c.env.TURNSTILE_SITE_KEY || "";

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>统一身份单点登录</title>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" defer></script>
  <style>
    :root {
      --bg: #0b0f19;
      --card: #151d2f;
      --border: #1e293b;
      --text: #f8fafc;
      --subtext: #94a3b8;
      --primary: #38bdf8;
      --primary-hover: #0284c7;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif;
      background-color: var(--bg);
      color: var(--text);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .sso-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 32px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .sso-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 8px;
      text-align: center;
    }
    .sso-desc {
      color: var(--subtext);
      font-size: 13px;
      text-align: center;
      margin-bottom: 24px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 6px;
      color: #cbd5e1;
    }
    input {
      width: 100%;
      padding: 10px 14px;
      background: #0f172a;
      border: 1px solid var(--border);
      border-radius: 6px;
      color: #fff;
      font-size: 14px;
      outline: none;
    }
    input:focus {
      border-color: var(--primary);
    }
    .btn {
      width: 100%;
      padding: 11px;
      background: var(--primary);
      color: #0f172a;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      margin-top: 8px;
    }
    .btn:hover {
      background: var(--primary-hover);
    }
    .msg {
      margin-top: 14px;
      font-size: 13px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="sso-card">
    <h2 class="sso-title">统一身份单点登录</h2>
    <p class="sso-desc">登录您的通行证账号以继续访问接入系统</p>

    <form onsubmit="return handleSsoLogin(event)">
      <div class="form-group">
        <label>账号 / 电子邮箱</label>
        <input type="text" id="account" required placeholder="输入您的用户名或邮箱" />
      </div>
      <div class="form-group">
        <label>账户密码</label>
        <input type="password" id="password" required placeholder="输入密码" />
      </div>
      ${turnstileSiteKey ? `<div style="margin-bottom:16px;"><div class="cf-turnstile" data-sitekey="${turnstileSiteKey}" data-theme="dark" data-callback="tsSsoDone" data-expired-callback="tsSsoExpired" id="turnstile-sso"></div></div>` : ""}
      <button type="submit" class="btn" id="sso-btn">登录并授权访问</button>
      <div class="msg" id="sso-msg"></div>
    </form>
  </div>

  <script>
    window.__tsTokens = window.__tsTokens || {};
    function tsSsoDone(token)    { window.__tsTokens.sso = token; window.__tsTokens['turnstile-sso'] = token; }
    function tsSsoExpired()      { window.__tsTokens.sso = ''; window.__tsTokens['turnstile-sso'] = ''; }

    async function handleSsoLogin(e) {
      e.preventDefault();
      const account = document.getElementById('account').value;
      const password = document.getElementById('password').value;
      const btn = document.getElementById('sso-btn');
      const msg = document.getElementById('sso-msg');
      btn.disabled = true;
      btn.innerText = '登录中...';
      msg.innerText = '';

      let turnstile_token = (window.__tsTokens && (window.__tsTokens.sso || window.__tsTokens['turnstile-sso'])) || '';
      if (!turnstile_token) {
        const input = document.querySelector('[name="cf-turnstile-response"]');
        if (input && input.value) turnstile_token = input.value;
      }
      if (!turnstile_token && window.turnstile && typeof window.turnstile.getResponse === 'function') {
        try { turnstile_token = window.turnstile.getResponse(); } catch(e) {}
      }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account, password, turnstile_token })
        });
        const data = await res.json();
        if (res.ok) {
          msg.style.color = '#10b981';
          msg.innerText = '登录成功，正在跳转...';
          const returnTo = ${JSON.stringify(returnTo)};
          window.location.href = returnTo;
        } else {
          msg.style.color = '#ef4444';
          msg.innerText = data.error || '登录失败';
          btn.disabled = false;
          btn.innerText = '登录并授权访问';
        }
      } catch {
        msg.style.color = '#ef4444';
        msg.innerText = '网络连接错误';
        btn.disabled = false;
        btn.innerText = '登录并授权访问';
      }
      return false;
    }
  </script>
</body>
</html>`;

  return c.html(html);
});
