import { Hono } from "hono";
import { HonoEnv } from "../types/env";
import { hashPassword, verifyPassword, signJWT } from "../auth/session";
import { verifyTurnstileToken, verifyTurnstileDetailed } from "../auth/turnstile";
import { sendVerificationCodeEmail } from "../services/email";
import { requireAuth } from "../middleware/auth-guard";
import { rateLimit, checkRateLimit } from "../middleware/rate-limiter";

export const apiAuthRoutes = new Hono<HonoEnv>();

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function getBlogDOStub(c: any) {
  const id = c.env.BLOG_DO.idFromName("global-blog-instance");
  return c.env.BLOG_DO.get(id);
}

// 1. Send Email Verification Code (Multi-tier Rate Limiting & Cooldown Protection)
apiAuthRoutes.post(
  "/send-code",
  rateLimit({
    keyPrefix: "send_code_ip",
    limit: 5,
    windowSeconds: 600,
    errorMessage: "该 IP 请求验证码过于频繁，请 10 分钟后再试"
  }),
  async (c) => {
    const body = await c.req.json();
    const { email, turnstile_token, purpose = "register" } = body;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim()) || email.length > 100) {
      return c.json({ error: "请输入格式正确的电子邮箱地址" }, 400);
    }

    const cleanEmail = email.trim().toLowerCase();

    // Turnstile verification
    const tsResult = await verifyTurnstileDetailed(
      turnstile_token,
      c.env.TURNSTILE_SECRET_KEY,
      c.req.header("CF-Connecting-IP")
    );
    if (!tsResult.success) {
      if (tsResult.error === "TURNSTILE_SECRET_KEY_NOT_CONFIGURED") {
        return c.json({
          error: "服务端配置缺失：未配置 TURNSTILE_SECRET_KEY 环境变量，请在 Cloudflare 后台设置私钥"
        }, 500);
      }
      if (tsResult.error?.includes("invalid-input-secret")) {
        return c.json({
          error: "服务端配置错误：TURNSTILE_SECRET_KEY 私钥无效或与当前 Site Key 不匹配"
        }, 500);
      }
      return c.json({ error: `人机验证未通过 (${tsResult.error || "请重试"})，请刷新后重试` }, 400);
    }

    // Email address 60-second cooldown check
    const emailCooldown = await checkRateLimit(c, {
      keyPrefix: `email_cooldown`,
      limit: 1,
      windowSeconds: 60,
      getCustomKey: () => cleanEmail
    });

    if (!emailCooldown.allowed) {
      return c.json(
        {
          error: `验证码发送过于频繁，请等待 ${emailCooldown.resetIn} 秒后再请求`,
          reset_in_seconds: emailCooldown.resetIn
        },
        429
      );
    }

    // Generate 6-digit numeric verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const blogDO = getBlogDOStub(c);
    await (blogDO as any).saveVerificationCode(cleanEmail, code, purpose, 300);

    // Send email
    const emailRes = await sendVerificationCodeEmail(
      c.env,
      cleanEmail,
      code,
      purpose === "register" ? "注册账号" : "身份验证"
    );

    if (!emailRes.success) {
      return c.json({
        error: `邮件投递失败: ${emailRes.error || "请检查 Cloudflare 域名 Email Routing 授权"}`
      }, 500);
    }

    return c.json({ success: true, message: "验证码已发送至您的邮箱，5分钟内有效" });
  }
);

// 2. User Registration
apiAuthRoutes.post(
  "/register",
  rateLimit({
    keyPrefix: "register_ip",
    limit: 5,
    windowSeconds: 3600,
    errorMessage: "注册过于频繁，请稍后再试"
  }),
  async (c) => {
    const body = await c.req.json();
    const { username, email, password, code, display_name, turnstile_token } = body;

    if (!username || !email || !password || !code) {
      return c.json({ error: "请填写完整的注册信息" }, 400);
    }

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return c.json({ error: "邮箱格式不正确" }, 400);
    }

    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(cleanUsername)) {
      return c.json({ error: "用户名仅支持 3 至 30 位的英文字母、数字、下划线及减号" }, 400);
    }

    if (password.length < 8 || password.length > 100) {
      return c.json({ error: "密码长度需在 8 至 100 位之间" }, 400);
    }

    // ⚠️ SECURITY: Enforce password complexity
    if (!/[A-Z]/.test(password)) {
      return c.json({ error: "密码需包含至少一个大写字母" }, 400);
    }
    if (!/[a-z]/.test(password)) {
      return c.json({ error: "密码需包含至少一个小写字母" }, 400);
    }
    if (!/[0-9]/.test(password)) {
      return c.json({ error: "密码需包含至少一个数字" }, 400);
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return c.json({ error: "密码需包含至少一个特殊字符（如 !@#$% 等）" }, 400);
    }

    const blogDO = getBlogDOStub(c);

    // Verify email verification code (6-digit OTP sent after passing Turnstile)
    const codeValid = await (blogDO as any).verifyCodeWithoutConsuming(cleanEmail, cleanCode, "register");
    if (!codeValid) {
      return c.json({ error: "邮箱验证码错误或已过期" }, 400);
    }

    // Check existing user
    const existingEmail = await (blogDO as any).getUserByEmail(cleanEmail);
    if (existingEmail) {
      return c.json({ error: "该邮箱已被注册" }, 400);
    }

    const existingUsername = await (blogDO as any).getUserByUsername(cleanUsername);
    if (existingUsername) {
      return c.json({ error: "该用户名已被占用" }, 400);
    }

    // If first user, make administrator
    const userCount = await (blogDO as any).countUsers();
    const role = userCount === 0 ? "administrator" : "subscriber";

    const passwordHash = await hashPassword(password);
    const newUser = await (blogDO as any).createUser({
      username: cleanUsername,
      email: cleanEmail,
      password_hash: passwordHash,
      role,
      display_name: display_name ? String(display_name).slice(0, 50) : cleanUsername
    });

    // Consume verification code only after successful user creation
    await (blogDO as any).consumeCode(cleanEmail, "register");

    const authUser = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      display_name: newUser.display_name
    };

    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) {
      return c.json({ error: "服务器配置错误：JWT_SECRET 未在 wrangler.jsonc 中设置" }, 500);
    }
    const token = await signJWT(authUser, jwtSecret);

    c.header(
      "Set-Cookie",
      `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${86400 * 7}; Secure`
    );

    return c.json({
      success: true,
      user: authUser,
      token
    });
  }
);

// 3. User Login with Brute-force Account Lockout Protection
apiAuthRoutes.post(
  "/login",
  rateLimit({
    keyPrefix: "login_ip",
    limit: 15,
    windowSeconds: 600,
    errorMessage: "登录尝试过多，请 10 分钟后再试"
  }),
  async (c) => {
    const body = await c.req.json();
    const { account, password, turnstile_token } = body;

    if (!account || !password) {
      return c.json({ error: "请输入账号与密码" }, 400);
    }

    const cleanAccount = String(account).trim().toLowerCase();

    // Check Account Lockout: 5 failed attempts = 15 minutes lockout
    const lockCheck = await checkRateLimit(c, {
      keyPrefix: "account_lockout",
      limit: 5,
      windowSeconds: 900,
      getCustomKey: () => cleanAccount
    });

    if (!lockCheck.allowed) {
      return c.json(
        {
          error: `该账户已连续多次登录失败，已被安全锁定，请在 ${lockCheck.resetIn} 秒后再试`,
          reset_in_seconds: lockCheck.resetIn
        },
        429
      );
    }

    // Turnstile verification
    const tsResult = await verifyTurnstileDetailed(
      turnstile_token,
      c.env.TURNSTILE_SECRET_KEY,
      c.req.header("CF-Connecting-IP")
    );
    if (!tsResult.success) {
      if (tsResult.error === "TURNSTILE_SECRET_KEY_NOT_CONFIGURED") {
        return c.json({
          error: "服务端配置缺失：未配置 TURNSTILE_SECRET_KEY 环境变量，请在 Cloudflare 后台设置私钥"
        }, 500);
      }
      if (tsResult.error?.includes("invalid-input-secret")) {
        return c.json({
          error: "服务端配置错误：TURNSTILE_SECRET_KEY 私钥无效或与当前 Site Key 不匹配"
        }, 500);
      }
      return c.json({ error: `人机验证未通过 (${tsResult.error || "请重试"})，请重试` }, 400);
    }

    const blogDO = getBlogDOStub(c);
    let user = await (blogDO as any).getUserByUsername(cleanAccount);
    if (!user && cleanAccount.includes("@")) {
      user = await (blogDO as any).getUserByEmail(cleanAccount);
    }

    if (!user) {
      return c.json({ error: "账号或密码错误" }, 401);
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return c.json({ error: "账号或密码错误" }, 401);
    }

    // Clear failed login attempts in KV if successful
    if (c.env.CACHE_KV) {
      c.executionCtx.waitUntil(
        c.env.CACHE_KV.delete(`ratelimit:account_lockout:${cleanAccount}`).catch(() => {})
      );
    }

    const authUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      display_name: user.display_name,
      token_version: user.token_version || 1
    };

    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) {
      return c.json({ error: "服务器配置错误：JWT_SECRET 未设置" }, 500);
    }
    const token = await signJWT(authUser, jwtSecret);

    c.header(
      "Set-Cookie",
      `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${86400 * 7}; Secure`
    );

    return c.json({
      success: true,
      user: authUser,
      token
    });
  }
);

// 4. Current User Info
apiAuthRoutes.get("/me", requireAuth, async (c) => {
  const user = c.get("user");
  return c.json({ user });
});

// 5. Change Password (Authenticated User - Automatically Revokes All Other Sessions)
apiAuthRoutes.post("/change-password", requireAuth, async (c) => {
  const body = await c.req.json();
  const { old_password, new_password } = body;
  const authUser = c.get("user");
  if (!authUser) {
    return c.json({ error: "未授权访问" }, 401);
  }

  if (!old_password || !new_password) {
    return c.json({ error: "请填写原密码与新密码" }, 400);
  }

  if (new_password.length < 8 || new_password.length > 100) {
    return c.json({ error: "新密码长度需在 8 至 100 位之间" }, 400);
  }

  // ⚠️ SECURITY: Enforce password complexity
  if (!/[A-Z]/.test(new_password)) {
    return c.json({ error: "新密码需包含至少一个大写字母" }, 400);
  }
  if (!/[a-z]/.test(new_password)) {
    return c.json({ error: "新密码需包含至少一个小写字母" }, 400);
  }
  if (!/[0-9]/.test(new_password)) {
    return c.json({ error: "新密码需包含至少一个数字" }, 400);
  }
  if (!/[^A-Za-z0-9]/.test(new_password)) {
    return c.json({ error: "新密码需包含至少一个特殊字符（如 !@#$% 等）" }, 400);
  }

  const blogDO = getBlogDOStub(c);
  const user = await (blogDO as any).getUserById(authUser.id);
  if (!user) {
    return c.json({ error: "用户不存在" }, 404);
  }

  const isOldValid = await verifyPassword(old_password, user.password_hash);
  if (!isOldValid) {
    return c.json({ error: "原密码不正确" }, 400);
  }

  const newHash = await hashPassword(new_password);
  const newVersion = await (blogDO as any).updateUserPassword(user.id, newHash);

  // Invalidate older session versions across Edge KV
  if (c.env.CACHE_KV) {
    await c.env.CACHE_KV.put(`user_token_ver:${user.id}`, String(newVersion), { expirationTtl: 86400 * 7 });
  }

  // Issue updated token for current active session
  const updatedAuthUser = { ...authUser, token_version: newVersion };
  const jwtSecret2 = c.env.JWT_SECRET;
  if (!jwtSecret2) {
    return c.json({ error: "服务器配置错误：JWT_SECRET 未设置" }, 500);
  }
  const newToken = await signJWT(updatedAuthUser, jwtSecret2);
  c.header(
    "Set-Cookie",
    `auth_token=${newToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${86400 * 7}; Secure`
  );

  return c.json({
    success: true,
    message: "密码修改成功，其他设备的历史会话已全部失效",
    token: newToken
  });
});

// 6. Reset Password via Email Code (Forgot Password - Revokes All Existing Sessions)
apiAuthRoutes.post(
  "/reset-password",
  rateLimit({
    keyPrefix: "reset_pwd_ip",
    limit: 5,
    windowSeconds: 3600,
    errorMessage: "密码重置尝试过多，请稍后再试"
  }),
  async (c) => {
    const body = await c.req.json();
    const { email, code, new_password, turnstile_token } = body;

    if (!email || !code || !new_password) {
      return c.json({ error: "请填写邮箱、验证码与新密码" }, 400);
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return c.json({ error: "邮箱格式不正确" }, 400);
    }

    if (new_password.length < 8 || new_password.length > 100) {
      return c.json({ error: "新密码长度需在 8 至 100 位之间" }, 400);
    }

    // ⚠️ SECURITY: Enforce password complexity
    if (!/[A-Z]/.test(new_password)) {
      return c.json({ error: "新密码需包含至少一个大写字母" }, 400);
    }
    if (!/[a-z]/.test(new_password)) {
      return c.json({ error: "新密码需包含至少一个小写字母" }, 400);
    }
    if (!/[0-9]/.test(new_password)) {
      return c.json({ error: "新密码需包含至少一个数字" }, 400);
    }
    if (!/[^A-Za-z0-9]/.test(new_password)) {
      return c.json({ error: "新密码需包含至少一个特殊字符（如 !@#$% 等）" }, 400);
    }

    const blogDO = getBlogDOStub(c);

    // Verify email verification code for reset_password purpose (6-digit OTP sent after passing Turnstile)
    const codeValid = await (blogDO as any).verifyCodeWithoutConsuming(cleanEmail, cleanCode, "reset_password");
    if (!codeValid) {
      return c.json({ error: "邮箱验证码错误或已过期" }, 400);
    }

    // Check if user exists
    const user = await (blogDO as any).getUserByEmail(cleanEmail);
    if (!user) {
      return c.json({ error: "该邮箱未注册任何账号" }, 404);
    }

    const newHash = await hashPassword(new_password);
    const updateRes = await (blogDO as any).updateUserPasswordByEmail(cleanEmail, newHash);

    // Consume verification code only after successful password update
    await (blogDO as any).consumeCode(cleanEmail, "reset_password");

    // Invalidate all existing token versions for this user in KV
    if (updateRes && c.env.CACHE_KV) {
      await c.env.CACHE_KV.put(`user_token_ver:${updateRes.userId}`, String(updateRes.newVersion), { expirationTtl: 86400 * 7 });
    }

    // Reset lockout in KV if any
    if (c.env.CACHE_KV) {
      c.executionCtx.waitUntil(
        Promise.all([
          c.env.CACHE_KV.delete(`ratelimit:account_lockout:${cleanEmail}`).catch(() => {}),
          c.env.CACHE_KV.delete(`ratelimit:account_lockout:${user.username}`).catch(() => {})
        ])
      );
    }

    // Clear current cookie to force re-login
    c.header(
      "Set-Cookie",
      "auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure"
    );

    return c.json({ success: true, message: "密码已成功重置，所有历史登录会话已全部失效，请重新登录" });
  }
);

// 7. Logout
apiAuthRoutes.post("/logout", async (c) => {
  c.header(
    "Set-Cookie",
    "auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure"
  );
  return c.json({ success: true, message: "已安全登出" });
});
