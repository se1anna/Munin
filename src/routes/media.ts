import { Hono } from "hono";
import { HonoEnv } from "../types/env";

export const mediaDistributionRoutes = new Hono<HonoEnv>();

// GET /media/* (Stream from R2 with edge immutable caching and anti-hotlinking)
mediaDistributionRoutes.get("/*", async (c) => {
  const fullPath = c.req.path;
  const key = fullPath.replace(/^\/media\//, "");

  if (!key) {
    return c.text("Media file not found", 404);
  }

  // Anti-hotlinking check
  const referer = c.req.header("Referer");
  const host = c.req.header("Host");
  if (referer && host) {
    try {
      const refererHost = new URL(referer).host;
      // Allow self domain, localhost, and direct navigation
      if (refererHost !== host && !refererHost.includes("localhost") && !refererHost.includes("127.0.0.1")) {
        // Block external unauthorized leeching
        return c.text("Forbidden: Unauthorized hotlinking", 403);
      }
    } catch {
      // Invalid referer URL format, ignore
    }
  }

  const object = await c.env.MY_BUCKET.get(key);
  if (!object) {
    return c.text("Media file not found", 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  // Explicit immutable strong caching header to leverage Cloudflare edge cache
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  if (!headers.get("Content-Type")) {
    headers.set("Content-Type", "application/octet-stream");
  }

  return new Response(object.body as any, {
    headers,
    status: 200
  });
});
