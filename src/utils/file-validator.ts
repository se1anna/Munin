export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedMime?: string;
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf"
]);

export function validateFileSignature(
  buffer: ArrayBuffer,
  declaredMimeType: string
): FileValidationResult {
  if (buffer.byteLength === 0) {
    return { valid: false, error: "文件内容为空" };
  }

  // Max 10MB
  if (buffer.byteLength > 10 * 1024 * 1024) {
    return { valid: false, error: "文件体积超出 10MB 上限" };
  }

  const uint8 = new Uint8Array(buffer.slice(0, 16));

  // 1. JPEG: FF D8 FF
  if (uint8[0] === 0xff && uint8[1] === 0xd8 && uint8[2] === 0xff) {
    return { valid: true, detectedMime: "image/jpeg" };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    uint8[0] === 0x89 &&
    uint8[1] === 0x50 &&
    uint8[2] === 0x4e &&
    uint8[3] === 0x47
  ) {
    return { valid: true, detectedMime: "image/png" };
  }

  // 3. GIF: 47 49 46 38 (GIF87a or GIF89a)
  if (
    uint8[0] === 0x47 &&
    uint8[1] === 0x49 &&
    uint8[2] === 0x46 &&
    uint8[3] === 0x38
  ) {
    return { valid: true, detectedMime: "image/gif" };
  }

  // 4. WebP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
  if (
    uint8[0] === 0x52 &&
    uint8[1] === 0x49 &&
    uint8[2] === 0x46 &&
    uint8[3] === 0x46
  ) {
    const webpTag = new Uint8Array(buffer.slice(8, 12));
    if (
      webpTag[0] === 0x57 &&
      webpTag[1] === 0x45 &&
      webpTag[2] === 0x42 &&
      webpTag[3] === 0x50
    ) {
      return { valid: true, detectedMime: "image/webp" };
    }
  }

  // 5. PDF: 25 50 44 46 (%PDF)
  if (
    uint8[0] === 0x25 &&
    uint8[1] === 0x50 &&
    uint8[2] === 0x44 &&
    uint8[3] === 0x46
  ) {
    return { valid: true, detectedMime: "application/pdf" };
  }

  // 6. SVG check: text xml containing <svg and not containing script tags
  if (declaredMimeType === "image/svg+xml") {
    try {
      const text = new TextDecoder().decode(buffer.slice(0, Math.min(buffer.byteLength, 4096)));
      if (text.includes("<svg") || text.includes("<?xml")) {
        // XSS defense in SVG: block embedded scripts and dangerous handlers
        const lower = text.toLowerCase();
        if (
          lower.includes("<script") ||
          lower.includes("javascript:") ||
          lower.includes("onload=") ||
          lower.includes("onerror=")
        ) {
          return { valid: false, error: "SVG 文件包含潜在危险的脚本内容，已被安全拦截" };
        }
        return { valid: true, detectedMime: "image/svg+xml" };
      }
    } catch {
      // Decode failed
    }
  }

  return {
    valid: false,
    error: "不支持的文件类型或文件头魔数校验失败，仅支持 JPG/PNG/GIF/WebP/PDF/安全SVG"
  };
}
