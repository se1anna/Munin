import { Context, Next } from "hono";
import { HonoEnv } from "../types/env";
import { verifyJWT } from "../auth/session";
import { hasPermission, Permission } from "../auth/rbac";
import { UserRole } from "../types/blog";

export function extractToken(c: Context<HonoEnv>): string | null {
  const authHeader = c.req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  // Check cookie
  const cookieHeader = c.req.header("Cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((s) => s.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith("auth_token=")) {
        return cookie.substring("auth_token=".length);
      }
    }
  }

  return null;
}

export async function isTokenVersionValid(c: Context<HonoEnv>, userId: string, tokenVersion?: number): Promise<boolean> {
  const tokenVer = tokenVersion || 1;
  const kvKey = `user_token_ver:${userId}`;

  // 1. Fast Edge KV Lookup
  if (c.env.CACHE_KV) {
    try {
      const cachedVerStr = await c.env.CACHE_KV.get(kvKey);
      if (cachedVerStr !== null) {
        const cachedVer = parseInt(cachedVerStr, 10);
        return tokenVer >= cachedVer;
      }
    } catch {
      // ignore
    }
  }

  // 2. Fallback to DO SQLite & populate KV cache
  if (c.env.BLOG_DO) {
    try {
      const id = c.env.BLOG_DO.idFromName("global-blog-instance");
      const blogDO = c.env.BLOG_DO.get(id);
      const dbVer = await (blogDO as any).getUserTokenVersion(userId);
      if (c.env.CACHE_KV && dbVer !== undefined) {
        let hasExecCtx = false;
        try {
          if (c.executionCtx) hasExecCtx = true;
        } catch {
          hasExecCtx = false;
        }
        if (hasExecCtx) {
          c.executionCtx.waitUntil(
            c.env.CACHE_KV.put(kvKey, String(dbVer), { expirationTtl: 86400 * 7 }).catch(() => {})
          );
        } else {
          c.env.CACHE_KV.put(kvKey, String(dbVer), { expirationTtl: 86400 * 7 }).catch(() => {});
        }
      }
      return tokenVer >= (dbVer || 1);
    } catch {
      return false; // ⚠️ SECURITY: Fail-closed: if DO is unreachable, reject token
    }
  }

  return false; // ⚠️ SECURITY: Fail-closed: if no verification possible, reject
}

export async function optionalAuthMiddleware(c: Context<HonoEnv>, next: Next): Promise<Response | void> {
  const token = extractToken(c);
  if (token) {
    const secret = c.env.JWT_SECRET;
    if (!secret) {
      await next();
      return;
    }
    const user = await verifyJWT(token, secret);
    if (user) {
      const isValid = await isTokenVersionValid(c, user.id, user.token_version);
      if (isValid) {
        c.set("user", user);
      }
    }
  }
  await next();
}

export async function requireAuth(c: Context<HonoEnv>, next: Next): Promise<Response | void> {
  const token = extractToken(c);
  if (!token) {
    return c.json({ error: "未登录或登录凭证已过期" }, 401);
  }

  const secret = c.env.JWT_SECRET;
  if (!secret) {
    return c.json({ error: "服务器配置错误：JWT_SECRET 未设置" }, 500);
  }
  const user = await verifyJWT(token, secret);
  if (!user) {
    return c.json({ error: "登录凭证无效或已过期" }, 401);
  }

  const isValid = await isTokenVersionValid(c, user.id, user.token_version);
  if (!isValid) {
    return c.json({ error: "账户密码已更改，原登录会话已失效，请重新登录" }, 401);
  }

  c.set("user", user);
  await next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return async (c: Context<HonoEnv>, next: Next): Promise<Response | void> => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "需要登录才能访问" }, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: "权限不足，当前角色无权执行此操作" }, 403);
    }

    await next();
  };
}

export function requirePermission(permission: Permission) {
  return async (c: Context<HonoEnv>, next: Next): Promise<Response | void> => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "需要登录才能访问" }, 401);
    }

    if (!hasPermission(user.role, permission)) {
      return c.json({ error: "权限不足，当前角色无权执行此操作" }, 403);
    }

    await next();
  };
}
