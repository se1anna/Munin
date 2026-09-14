import { Hono } from "hono";
import { HonoEnv } from "../types/env";
import { requireAuth } from "../middleware/auth-guard";
import { rateLimit } from "../middleware/rate-limiter";
import { validateFileSignature } from "../utils/file-validator";

export const apiUploadRoutes = new Hono<HonoEnv>();

// Canonical extension per detected MIME type
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf"
};

function getBlogDOStub(c: any) {
  const id = c.env.BLOG_DO.idFromName("global-blog-instance");
  return c.env.BLOG_DO.get(id);
}

// 1. List Media (for authors and admins)
apiUploadRoutes.get("/", requireAuth, async (c) => {
  const user = c.get("user")!;
  if (user.role !== "administrator" && user.role !== "author") {
    return c.json({ error: "权限不足，仅作者或管理员可查看媒体库" }, 403);
  }
  const blogDO = getBlogDOStub(c);
  const media = await (blogDO as any).listMedia();
  return c.json({ media });
});

// 2. Media Upload to R2 Bucket (with per-user rate limiting and magic byte validation)
apiUploadRoutes.post(
  "/",
  requireAuth,
  rateLimit({
    keyPrefix: "upload_user",
    limit: 20,
    windowSeconds: 3600,
    getCustomKey: (c) => c.get("user")?.id || null,
    errorMessage: "每小时上传媒体文件次数已达上限 (20次)，请稍后再试"
  }),
  async (c) => {
    const user = c.get("user")!;
    if (user.role !== "administrator" && user.role !== "author") {
      return c.json({ error: "权限不足，仅作者或管理员可上传媒体文件" }, 403);
    }

    let formData: FormData;
    try {
      formData = await c.req.formData();
    } catch {
      return c.json({ error: "请求格式错误，请使用 multipart/form-data 上传文件" }, 400);
    }

    const fileEntry: any = formData.get("file");
    // A plain text field named "file" yields a string, which would throw later on.
    if (!fileEntry || typeof fileEntry === "string" || typeof fileEntry.arrayBuffer !== "function") {
      return c.json({ error: "请提供待上传的文件" }, 400);
    }

    const file = fileEntry as File;

    const rawFilename = file.name || "upload.bin";
    const declaredMimeType = file.type || "application/octet-stream";
    const size = file.size;

    // Strict 10MB limit
    if (size > 10 * 1024 * 1024) {
      return c.json({ error: "文件大小超出限制，单文件最大支持 10MB" }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();

    // Magic bytes and file signature validation
    const validation = validateFileSignature(arrayBuffer, declaredMimeType);
    if (!validation.valid) {
      return c.json({ error: validation.error || "文件安全校验未通过" }, 400);
    }

    const finalMimeType = validation.detectedMime || declaredMimeType;

    // Sanitize filename
    const safeFilename = rawFilename
      .replace(/[^\w\u4e00-\u9fa5.-]/g, "_")
      .slice(0, 100);

    // ⚠️ SECURITY: the stored extension follows the detected MIME type, so a caller
    // cannot name an image "x.html" and have it served as HTML from this origin.
    const ext = MIME_EXTENSIONS[finalMimeType] || "bin";

    const uuid = crypto.randomUUID();
    const r2Key = `uploads/${uuid}.${ext}`;

    // Store the sanitized payload when the validator rewrote it (SVG script stripping)
    const payload = validation.sanitizedBuffer || arrayBuffer;

    // Write to R2 Bucket
    await c.env.MY_BUCKET.put(r2Key, payload, {
      httpMetadata: {
        contentType: finalMimeType,
        cacheControl: "public, max-age=31536000, immutable"
      },
      customMetadata: {
        originalName: encodeURIComponent(safeFilename),
        uploaderId: user.id
      }
    });

    // Record metadata into BlogDO SQLite database
    const blogDO = getBlogDOStub(c);
    const mediaMeta = await (blogDO as any).recordMediaUpload({
      filename: safeFilename,
      mime_type: finalMimeType,
      // Sanitized payloads differ in size from the uploaded file
      size: payload.byteLength,
      r2_key: r2Key,
      uploader_id: user.id
    });

    const mediaUrl = `/media/${r2Key}`;

    return c.json({
      success: true,
      url: mediaUrl,
      media: mediaMeta
    });
  }
);
