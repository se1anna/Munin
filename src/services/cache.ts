import { KVNamespace } from "@cloudflare/workers-types";

export const CACHE_PREFIX = "v2:";

export function getHomeCacheKey(page = 1): string {
  return `${CACHE_PREFIX}index:home:page:${page}`;
}

export function getPostCacheKey(slug: string): string {
  return `${CACHE_PREFIX}post:${slug}`;
}

export function getPost404CacheKey(slug: string): string {
  return `${CACHE_PREFIX}404:post:${slug}`;
}

export function getCategoryCacheKey(slug: string, page = 1): string {
  return `${CACHE_PREFIX}archive:category:${slug}:page:${page}`;
}

export function getTagCacheKey(slug: string, page = 1): string {
  return `${CACHE_PREFIX}archive:tag:${slug}:page:${page}`;
}

export function getAllArchiveCacheKey(): string {
  return `${CACHE_PREFIX}archive:all`;
}

export function getFeedRssCacheKey(): string {
  return `${CACHE_PREFIX}feed:rss`;
}

export function getSitemapCacheKey(): string {
  return `${CACHE_PREFIX}sitemap:xml`;
}

export interface CacheEntry<T = string> {
  data: T;
  contentType?: string;
  cachedAt: number;
}

export async function getCachedResponse(
  kv: KVNamespace,
  key: string
): Promise<{ body: string; contentType: string } | null> {
  try {
    const raw = await kv.get(key);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as CacheEntry;
      if (parsed && typeof parsed.data === "string") {
        return {
          body: parsed.data,
          contentType: parsed.contentType || "text/html; charset=utf-8"
        };
      }
    } catch {
      // Direct string fallback
      return {
        body: raw,
        contentType: "text/html; charset=utf-8"
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setCachedResponse(
  kv: KVNamespace,
  key: string,
  body: string,
  contentType = "text/html; charset=utf-8",
  ttlSeconds = 3600
): Promise<void> {
  try {
    const entry: CacheEntry = {
      data: body,
      contentType,
      cachedAt: Date.now()
    };
    await kv.put(key, JSON.stringify(entry), {
      expirationTtl: ttlSeconds
    });
  } catch (err) {
    console.error("[Cache Write Failed]", err);
  }
}

export async function invalidateCacheKeys(kv: KVNamespace, keys: string[]): Promise<void> {
  try {
    await Promise.all(keys.map((k) => kv.delete(k)));
  } catch (err) {
    console.error("[Cache Invalidation Failed]", err);
  }
}

export async function invalidatePostAndFeeds(kv: KVNamespace, slug?: string): Promise<void> {
  const keys: string[] = [
    getFeedRssCacheKey(),
    getSitemapCacheKey(),
    getAllArchiveCacheKey()
  ];
  for (let i = 1; i <= 10; i++) {
    keys.push(getHomeCacheKey(i));
  }
  if (slug) {
    keys.push(getPostCacheKey(slug));
    keys.push(getPost404CacheKey(slug));
  }
  await invalidateCacheKeys(kv, keys);
}

export async function purgeAllKVCache(kv: KVNamespace): Promise<number> {
  let count = 0;
  try {
    let cursor: string | undefined = undefined;
    do {
      const res: { keys: Array<{ name: string }>; list_complete: boolean; cursor?: string } = await (kv as any).list({ prefix: CACHE_PREFIX, cursor });
      if (res && res.keys && res.keys.length > 0) {
        await Promise.all(res.keys.map((k: { name: string }) => kv.delete(k.name)));
        count += res.keys.length;
      }
      cursor = res.list_complete ? undefined : res.cursor;
    } while (cursor);
  } catch (err) {
    console.error("[Purge All Cache Failed]", err);
  }
  return count;
}

