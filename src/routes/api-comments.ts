import { Hono } from "hono";
import { HonoEnv } from "../types/env";
import { verifyTurnstileToken } from "../auth/turnstile";
import { requireAuth, requireRole } from "../middleware/auth-guard";
import { rateLimit } from "../middleware/rate-limiter";
import { sendCommentNotificationEmail } from "../services/email";

export const apiCommentsRoutes = new Hono<HonoEnv>();

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function getBlogDOStub(c: any) {
  const id = c.env.BLOG_DO.idFromName("global-blog-instance");
  return c.env.BLOG_DO.get(id);
}

// 1. Submit New Comment (Public + Turnstile Guard + IP Rate Limiting)
apiCommentsRoutes.post(
  "/",
  rateLimit({
    keyPrefix: "comment_submit",
    limit: 3,
    windowSeconds: 300,
    errorMessage: "评论发表过于频繁，请 5 分钟后再试"
  }),
  async (c) => {
    const body = await c.req.json();
    const { post_id, parent_id, author_name, author_email, content, turnstile_token } = body;

    if (!post_id || !author_name || !author_email || !content) {
      return c.json({ error: "请填写完整的评论信息（昵称、邮箱、内容）" }, 400);
    }

    const cleanAuthor = String(author_name).trim().slice(0, 50);
    const cleanEmail = String(author_email).trim().toLowerCase().slice(0, 100);
    const cleanContent = String(content).trim();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return c.json({ error: "请输入有效的邮箱地址" }, 400);
    }

    if (cleanContent.length === 0 || cleanContent.length > 1000) {
      return c.json({ error: "评论内容长度需在 1 至 1000 字之间" }, 400);
    }

    // Turnstile verification
    const isHuman = await verifyTurnstileToken(
      turnstile_token,
      c.env.TURNSTILE_SECRET_KEY,
      c.req.header("CF-Connecting-IP")
    );
    if (!isHuman) {
      return c.json({ error: "人机验证未通过，请刷新后重试" }, 400);
    }

    const blogDO = getBlogDOStub(c);
    const post = await (blogDO as any).getPostById(post_id);
    if (!post) {
      return c.json({ error: "关联文章不存在" }, 404);
    }

    const comment = await (blogDO as any).createComment({
      post_id,
      parent_id: parent_id || null,
      author_name: cleanAuthor,
      author_email: cleanEmail,
      content: cleanContent,
      status: "approved"
    });

    // Asynchronous Throttled Email Notification Loop
    const site = await (blogDO as any).getSiteOptions();
    const postUrl = `${site.site_url}/post/${post.slug}#comment-${comment.id}`;

    // Notify Admin or Author
    const authorUser = await (blogDO as any).getUserById(post.author_id);
    const notifyEmail = authorUser?.email || c.env.ADMIN_EMAIL;
    if (notifyEmail && notifyEmail !== cleanEmail) {
      c.executionCtx.waitUntil(
        sendCommentNotificationEmail(c.env, {
          postId: post.id,
          recipientEmail: notifyEmail,
          postTitle: post.title,
          postUrl,
          commenterName: cleanAuthor,
          commentContent: cleanContent,
          isReply: false
        })
      );
    }

    return c.json({ success: true, comment });
  }
);

// 2. List All Comments (Admin)
apiCommentsRoutes.get("/", requireAuth, requireRole(["administrator"]), async (c) => {
  const blogDO = getBlogDOStub(c);
  const comments = await (blogDO as any).listAllComments();
  return c.json({ comments });
});

// 3. Update Comment Status (Admin)
apiCommentsRoutes.put("/:id/status", requireAuth, requireRole(["administrator"]), async (c) => {
  const id = c.req.param("id");
  const { status } = await c.req.json();
  if (!["approved", "pending", "spam"].includes(status)) {
    return c.json({ error: "无效的评论状态" }, 400);
  }

  const blogDO = getBlogDOStub(c);
  const ok = await (blogDO as any).updateCommentStatus(id, status);
  if (!ok) {
    return c.json({ error: "评论未找到" }, 404);
  }
  return c.json({ success: true, message: "评论状态已更新" });
});

// 4. Delete Comment (Admin)
apiCommentsRoutes.delete("/:id", requireAuth, requireRole(["administrator"]), async (c) => {
  const id = c.req.param("id");
  const blogDO = getBlogDOStub(c);
  const ok = await (blogDO as any).deleteComment(id);
  if (!ok) {
    return c.json({ error: "评论未找到" }, 404);
  }
  return c.json({ success: true, message: "评论已成功删除" });
});
