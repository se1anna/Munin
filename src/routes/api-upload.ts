import { Hono } from "hono";
import { HonoEnv } from "../types/env";
import { requireAuth } from "../middleware/auth-guard";
import { rateLimit } from "../middleware/rate-limiter";
import { validateFileSignature } from "../utils/file-validator";

export const apiUploadRoutes = new Hono<HonoEnv>();

function getBlogDOStub(c: any) {
  const id = c.env.BLOG_DO.idFromName("global-blog-instance");
  return c.env.BLOG_DO.get(id);
}

// Media Upload to R2 Bucket (with per-user rate limiting and magic byte validation)
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

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return c.json({ error: "请提供待上传的文件" }, 400);
    }

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

    const ext = safeFilename.includes(".")
      ? safeFilename.split(".").pop()!.toLowerCase()
      : "bin";

    const uuid = crypto.randomUUID();
    const r2Key = `uploads/${uuid}.${ext}`;

    // Write to R2 Bucket
    await c.env.MY_BUCKET.put(r2Key, arrayBuffer, {
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
      size,
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
