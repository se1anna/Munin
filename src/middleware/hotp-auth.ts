import { Context, Next } from "hono";
import { HonoEnv } from "../types/env";
import { verifyAndConsumeHotp } from "../auth/hotp";

export async function hotpAuthMiddleware(c: Context<HonoEnv>, next: Next): Promise<Response | void> {
  const headerName = c.env.HOTP_HEADER_KEY || "X-HOTP-Key";
  let token = c.req.header(headerName) || c.req.header("x-hotp-key");

  if (!token) {
    const authHeader = c.req.header("Authorization");
    if (authHeader && authHeader.startsWith("HOTP ")) {
      token = authHeader.substring(5).trim();
    }
  }

  if (!token) {
    return c.json({ error: "缺少 HOTP 鉴权令牌，请在请求头中提供 " + headerName }, 401);
  }

  const isValid = await verifyAndConsumeHotp(c.env.HOTP_KV, token);
  if (!isValid) {
    return c.json({ error: "HOTP 令牌无效或已被核销消耗" }, 403);
  }

  c.set("isHotpAuthenticated", true);
  await next();
}
