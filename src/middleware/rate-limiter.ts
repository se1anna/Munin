import { Context, Next } from "hono";
import { HonoEnv } from "../types/env";

export interface RateLimitOptions {
  keyPrefix: string;
  limit: number;
  windowSeconds: number;
  getCustomKey?: (c: Context<HonoEnv>) => string | null;
  errorMessage?: string;
}

// In-memory fallback sliding window cache for local/fast edge hits
const memoryWindowCache = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(c: Context<HonoEnv>): string {
  return (
    c.req.header("CF-Connecting-IP") ||
    c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}

export async function checkRateLimit(
  c: Context<HonoEnv>,
  options: RateLimitOptions
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const { keyPrefix, limit, windowSeconds, getCustomKey } = options;
  const identifier = getCustomKey ? getCustomKey(c) : getClientIp(c);

  if (!identifier) {
    return { allowed: true, remaining: limit, resetIn: windowSeconds };
  }

  const now = Math.floor(Date.now() / 1000);
  const cacheKey = `ratelimit:${keyPrefix}:${identifier}`;

  // Check KV if available
  if (c.env.CACHE_KV) {
    try {
      const raw = await c.env.CACHE_KV.get(cacheKey);
      let currentCount = 0;
      let expiry = now + windowSeconds;

      if (raw) {
        const parsed = JSON.parse(raw);
        currentCount = parsed.count || 0;
        expiry = parsed.expiry || expiry;
      }

      if (currentCount >= limit) {
        return {
          allowed: false,
          remaining: 0,
          resetIn: Math.max(1, expiry - now)
        };
      }

      const newCount = currentCount + 1;
      await c.env.CACHE_KV.put(
        cacheKey,
        JSON.stringify({ count: newCount, expiry }),
        { expirationTtl: windowSeconds }
      );

      return {
        allowed: true,
        remaining: Math.max(0, limit - newCount),
        resetIn: Math.max(1, expiry - now)
      };
    } catch {
      // Fallback to in-memory on KV error
    }
  }

  // In-memory sliding window
  const record = memoryWindowCache.get(cacheKey);
  if (record && record.resetAt > now) {
    if (record.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: record.resetAt - now
      };
    }
    record.count++;
    return {
      allowed: true,
      remaining: Math.max(0, limit - record.count),
      resetIn: record.resetAt - now
    };
  }

  memoryWindowCache.set(cacheKey, {
    count: 1,
    resetAt: now + windowSeconds
  });

  return {
    allowed: true,
    remaining: limit - 1,
    resetIn: windowSeconds
  };
}

export function rateLimit(options: RateLimitOptions) {
  return async (c: Context<HonoEnv>, next: Next): Promise<Response | void> => {
    const { allowed, remaining, resetIn } = await checkRateLimit(c, options);

    c.header("X-RateLimit-Limit", String(options.limit));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(resetIn));

    if (!allowed) {
      return c.json(
        {
          error: options.errorMessage || "请求过于频繁，请稍后重试",
          reset_in_seconds: resetIn
        },
        429
      );
    }

    await next();
  };
}
