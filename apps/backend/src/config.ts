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
});

export const config = envSchema.parse(process.env);

export const corsAllowlist = config.CORS_ALLOWLIST.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
