import { Env } from "../types/env";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(env: Env, options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  let fromEmail = env.FROM_EMAIL;
  if (!fromEmail) {
    if (env.ADMIN_EMAIL && !env.ADMIN_EMAIL.includes("@gmail.com") && !env.ADMIN_EMAIL.includes("@qq.com") && !env.ADMIN_EMAIL.includes("@163.com") && !env.ADMIN_EMAIL.includes("@outlook.com")) {
      fromEmail = env.ADMIN_EMAIL;
    } else if (env.SITE_URL) {
      try {
        const domain = new URL(env.SITE_URL).hostname.replace(/^www\./, "");
        fromEmail = `noreply@${domain}`;
      } catch {
        fromEmail = env.ADMIN_EMAIL || "noreply@example.com";
      }
    } else {
      fromEmail = env.ADMIN_EMAIL || "noreply@example.com";
    }
  }

  if (!env.EMAIL) {
    console.log(`[Email Service Simulation] From: ${fromEmail}, To: ${options.to}, Subject: ${options.subject}`);
    return { success: true };
  }

  try {
    const res = await env.EMAIL.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, "")
    });
    return { success: true };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.error(`[Email Sending Failed] From: ${fromEmail}, To: ${options.to}, Error:`, err);
    return { success: false, error: errMsg };
  }
}

export async function sendVerificationCodeEmail(
  env: Env,
  targetEmail: string,
  code: string,
  purposeTitle = "身份验证"
): Promise<{ success: boolean; error?: string }> {
  const siteName = env.SITE_NAME || "极简边缘博客";
  const subject = `【${siteName}】您的${purposeTitle}验证码: ${code}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background: #121212; color: #e5e7eb; border-radius: 8px; border: 1px solid #27272a;">
      <h2 style="margin-top: 0; color: #f9fafb; font-size: 20px; border-bottom: 1px solid #27272a; padding-bottom: 14px;">${siteName}</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #d1d5db;">您好，您正在进行 ${purposeTitle} 操作。您的 6 位数字验证码为：</p>
      <div style="background: #18181b; border: 1px dashed #3f3f46; border-radius: 6px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #38bdf8;">${code}</span>
      </div>
      <p style="font-size: 13px; color: #9ca3af; line-height: 1.5;">该验证码在 5 分钟内有效。如非本人操作，请忽略此邮件。</p>
      <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">此邮件由系统自动发出，请勿直接回复。</p>
    </div>
  `;

  return sendEmail(env, {
    to: targetEmail,
    subject,
    html
  });
}

/**
 * Sends comment notification with a 5-minute per-post cooldown throttle to prevent email flooding
 */
export async function sendCommentNotificationEmail(
  env: Env,
  data: {
    postId: string;
    recipientEmail: string;
    postTitle: string;
    postUrl: string;
    commenterName: string;
    commentContent: string;
    isReply?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  // Check throttle in KV if available
  if (env.CACHE_KV && data.postId) {
    try {
      const throttleKey = `throttle:comment_email:${data.postId}`;
      const isThrottled = await env.CACHE_KV.get(throttleKey);
      if (isThrottled) {
        console.log(`[Email Throttled] Post ${data.postId} notification throttled to save email budget.`);
        return { success: true };
      }
      // Set 5-minute cooldown for this post
      await env.CACHE_KV.put(throttleKey, "1", { expirationTtl: 300 });
    } catch {
      // Ignore KV throttle check errors
    }
  }

  const siteName = env.SITE_NAME || "极简边缘博客";
  const actionType = data.isReply ? "回复了您的评论" : "发表了新评论";
  const subject = `【${siteName}】文章《${data.postTitle}》收到了新互动`;
  const sanitizedContent = data.commentContent.slice(0, 500).replace(/\n/g, "<br/>");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background: #121212; color: #e5e7eb; border-radius: 8px; border: 1px solid #27272a;">
      <h2 style="margin-top: 0; color: #f9fafb; font-size: 20px; border-bottom: 1px solid #27272a; padding-bottom: 14px;">${siteName} 互动提醒</h2>
      <p style="font-size: 15px; color: #d1d5db; line-height: 1.6;">
        访客 <strong>${data.commenterName}</strong> 在文章 <strong>《${data.postTitle}》</strong> 下${actionType}：
      </p>
      <div style="background: #18181b; border-left: 3px solid #38bdf8; border-radius: 4px; padding: 14px 16px; margin: 18px 0; color: #e5e7eb; font-size: 14px; line-height: 1.6;">
        ${sanitizedContent}
      </div>
      <p style="margin: 24px 0;">
        <a href="${data.postUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">查看文章详情</a>
      </p>
      <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">此邮件由 ${siteName} 自动通知系统发送。</p>
    </div>
  `;

  return sendEmail(env, {
    to: data.recipientEmail,
    subject,
    html
  });
}
