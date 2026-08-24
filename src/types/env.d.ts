import { DurableObjectNamespace, KVNamespace, R2Bucket } from "@cloudflare/workers-types";
import { BlogDO } from "../do/blog";

export interface SendEmailMessage {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface SendEmailBinding {
  send(message: SendEmailMessage): Promise<void>;
}

export interface Env {
  // Durable Objects
  BLOG_DO: DurableObjectNamespace<BlogDO>;

  // R2 Bucket for media files
  MY_BUCKET: R2Bucket;

  // KV Namespaces
  CACHE_KV: KVNamespace;
  HOTP_KV: KVNamespace;

  // Email service
  EMAIL?: SendEmailBinding;

  // Environment variables
  SITE_NAME: string;
  SITE_URL: string;
  SITE_DESCRIPTION: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  FROM_EMAIL?: string;
  HOTP_HEADER_KEY?: string;
  ADMIN_EMAIL?: string;
  JWT_SECRET?: string;
}

export type HonoEnv = {
  Bindings: Env;
  Variables: {
    user?: import("./blog").AuthUser;
    isHotpAuthenticated?: boolean;
  };
};
