export interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export interface TurnstileVerifyResult {
  success: boolean;
  error?: string;
}

export async function verifyTurnstileDetailed(
  token: string,
  secretKey?: string,
  remoteIp?: string
): Promise<TurnstileVerifyResult> {
  // Only allow bypass when explicitly configured for development
  if (secretKey === "SKIP_TURNSTILE_DEV_ONLY") {
    return { success: true };
  }

  const cleanSecret = (secretKey || "").trim().replace(/^["']|["']$/g, "");
  const cleanToken = (token || "").trim().replace(/^["']|["']$/g, "");

  // In production, Turnstile secret key is REQUIRED for security
  if (!cleanSecret) {
    console.error("[Security] Turnstile secret key is not configured — all verification rejected.");
    return { success: false, error: "TURNSTILE_SECRET_KEY_NOT_CONFIGURED" };
  }

  if (!cleanToken) {
    return { success: false, error: "MISSING_TOKEN" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", cleanSecret);
    formData.append("response", cleanToken);
    if (remoteIp && remoteIp !== "127.0.0.1" && !remoteIp.includes("::1")) {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData.toString()
    });

    const data = (await res.json()) as TurnstileVerifyResponse;
    if (!data.success) {
      const errList = data["error-codes"] || [];
      console.error("[Turnstile Verification Failed]", errList);
      return {
        success: false,
        error: errList.join(", ") || "VERIFICATION_FAILED"
      };
    }
    return { success: true };
  } catch (err) {
    console.error("[Turnstile Request Error]", err);
    return { success: false, error: "NETWORK_ERROR" };
  }
}

export async function verifyTurnstileToken(
  token: string,
  secretKey?: string,
  remoteIp?: string
): Promise<boolean> {
  const result = await verifyTurnstileDetailed(token, secretKey, remoteIp);
  return result.success;
}
