import { Hono } from "hono";
import { HonoEnv } from "../types/env";

export const mediaDistributionRoutes = new Hono<HonoEnv>();

// GET /media/* (Stream from R2 with edge immutable caching and anti-hotlinking)
mediaDistributionRoutes.get("/*", async (c) => {
  const fullPath = c.req.path;
  const rawKey = fullPath.replace(/^\/media\//, "");

  if (!rawKey) {
    return c.text("Media file not found", 404);
  }

  let key = rawKey;
  try {
    key = decodeURIComponent(rawKey);
  } catch {}

  // Anti-hotlinking check
  const referer = c.req.header("Referer");
  const host = c.req.header("Host");
  if (referer && host) {
    try {
      const refererHost = new URL(referer).hostname;
      // Allow self domain, localhost, and direct navigation
      const isLocal = refererHost === "localhost" || refererHost === "127.0.0.1" || refererHost === "[::1]";
      if (refererHost !== host.split(":")[0] && !isLocal) {
        // Block external unauthorized leeching
        return c.text("Forbidden: Unauthorized hotlinking", 403);
      }
    } catch {
      // Invalid referer URL format, ignore
    }
  }

  let object = await c.env.MY_BUCKET.get(key);
  if (!object && key !== rawKey) {
    object = await c.env.MY_BUCKET.get(rawKey);
  }
  if (!object) {
    return c.text("Media file not found", 404);
  }

  const headers = new Headers();
  if (typeof object.writeHttpMetadata === "function") {
    object.writeHttpMetadata(headers);
  }
  headers.set("etag", object.httpEtag);
  // Explicit immutable strong caching header to leverage Cloudflare edge cache
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options", "nosniff");

  if (!headers.get("Content-Type")) {
    headers.set("Content-Type", "application/octet-stream");
  }

  // ⚠️ SECURITY: user-uploaded SVG is active XML. A sandboxed CSP without
  // allow-scripts stops any surviving script from running on this origin.
  if ((headers.get("Content-Type") || "").toLowerCase().includes("svg")) {
    headers.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  }

  return new Response(object.body as any, {
    headers,
    status: 200
  });
});
