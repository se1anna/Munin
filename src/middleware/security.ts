import { Context, Next } from "hono";
import { HonoEnv } from "../types/env";

export async function securityHeadersMiddleware(c: Context<HonoEnv>, next: Next): Promise<Response | void> {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "SAMEORIGIN");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "interest-cohort=(), camera=(), microphone=(), geolocation=()");
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // Content Security Policy for CDN block libraries, Turnstile, and self
  // ⚠️ SECURITY: 'unsafe-inline' is required for Turnstile widget and inline admin scripts.
  // For a stricter policy, move all inline scripts to external files and use nonces.
  c.header(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "frame-src https://challenges.cloudflare.com; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://challenges.cloudflare.com;"
  );
}

export async function adminCsrfGuard(c: Context<HonoEnv>, next: Next): Promise<Response | void> {
  const method = c.req.method.toUpperCase();
  // Safe methods skip CSRF origin checks
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return next();
  }

  // ⚠️ SECURITY: Verify Origin/Referer against Host for same-origin enforcement.
  // Custom headers like X-Requested-With are forgeable by any client-side script
  // and are only used as a secondary signal, not as the primary check.
  const origin = c.req.header("Origin");
  const referer = c.req.header("Referer");
  const host = c.req.header("Host");

  if (!host) {
    return c.json({ error: "跨站请求校验失败，请求被拒绝" }, 403);
  }

  // Check Origin
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) {
        return next();
      }
    } catch {
      // Invalid URL format
    }
  }

  // Check Referer as fallback
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === host) {
        return next();
      }
    } catch {
      // Invalid URL format
    }
  }

  return c.json({ error: "跨站请求校验失败，请求被拒绝" }, 403);
}
