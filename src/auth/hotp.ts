import { KVNamespace } from "@cloudflare/workers-types";

const CHARS = "0123456789abcdefghijklmnopqrstuvwxyz";
const HOTP_REGEX = /^[0-9a-z]{10}$/;

export function generateRandomHotpString(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS[bytes[i] % CHARS.length];
  }
  return result;
}

export function generateHotpPool(count = 1000, length = 10): string[] {
  const set = new Set<string>();
  while (set.size < count) {
    set.add(generateRandomHotpString(length));
  }
  return Array.from(set);
}

/**
 * Checks if generation cooldown is active (10 minutes)
 */
export async function checkHotpGenerationCooldown(
  kv: KVNamespace,
  cooldownSeconds = 600
): Promise<{ canGenerate: boolean; resetInSeconds: number }> {
  const lockKey = "lock:hotp:last_generated";
  const lastGenerated = await kv.get(lockKey);
  const now = Math.floor(Date.now() / 1000);

  if (lastGenerated) {
    const lastTimestamp = parseInt(lastGenerated, 10);
    const elapsed = now - lastTimestamp;
    if (elapsed < cooldownSeconds) {
      return { canGenerate: false, resetInSeconds: cooldownSeconds - elapsed };
    }
  }

  // Set new lock
  await kv.put(lockKey, String(now), { expirationTtl: cooldownSeconds });
  return { canGenerate: true, resetInSeconds: 0 };
}

/**
 * Asynchronously batches HOTP writes to KV using chunked concurrent promises
 * to avoid edge timeouts and KV rate limit throttles.
 */
export async function batchWriteHotpToKV(
  kv: KVNamespace,
  keys: string[],
  chunkSize = 50
): Promise<void> {
  const now = new Date().toISOString();
  const value = JSON.stringify({ created_at: now, status: "active" });

  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map((key) =>
        kv.put(key, value, {
          expirationTtl: 86400 * 90
        })
      )
    );
  }
}

/**
 * Validates a HOTP key against KV and immediately deletes it on success
 * ensuring single-use consumption.
 * Includes regex pre-validation to avoid arbitrary KV read cost.
 */
export async function verifyAndConsumeHotp(
  kv: KVNamespace,
  hotpKey: string
): Promise<boolean> {
  if (!hotpKey || typeof hotpKey !== "string") {
    return false;
  }

  const trimmed = hotpKey.trim();
  // Regex pre-validation blocks invalid format without calling KV
  if (!HOTP_REGEX.test(trimmed)) {
    return false;
  }

  const val = await kv.get(trimmed);
  if (!val) {
    return false;
  }

  // Single-use: Destroy immediately
  await kv.delete(trimmed);
  return true;
}
