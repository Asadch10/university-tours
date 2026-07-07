// Centralized, validated environment access for the API process.
// NOTE: .env is loaded by ./env.ts, imported first in the entry point.
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().default(4000),
  CORS_ALLOWLIST: z.string().default('http://localhost:3000,http://localhost:3001'),
  JWT_ACCESS_SECRET: z.string().default('change-me-access'),
  JWT_REFRESH_SECRET: z.string().default('change-me-refresh'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Public URL of the website — used to build the email-verification link.
  APP_WEB_URL: z.string().default('http://localhost:3000'),

  // Email verification token (stateless JWT, separate secret from auth tokens).
  EMAIL_VERIFY_SECRET: z.string().default('change-me-email-verify'),
  EMAIL_VERIFY_TTL: z.string().default('24h'),

  // Password reset token (stateless, single-use JWT — see auth.service).
  PASSWORD_RESET_SECRET: z.string().default('change-me-password-reset'),
  PASSWORD_RESET_TTL: z.string().default('1h'),

  // Outbound email (Resend over SMTP). If neither MAIL_PASSWORD nor RESEND_API_KEY
  // is set, the mailer no-ops and just logs the verification link (safe for dev).
  MAIL_HOST: z.string().default('smtp.resend.com'),
  MAIL_PORT: z.coerce.number().default(465),
  MAIL_USERNAME: z.string().default('resend'),
  MAIL_PASSWORD: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM_ADDRESS: z.string().default('no-reply@ahmadnaeem.com'),
  MAIL_FROM_NAME: z.string().default('University Campus Private Tours'),
});

export const config = envSchema.parse(process.env);

export const corsAllowlist = config.CORS_ALLOWLIST.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
