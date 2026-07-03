import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { corsAllowlist } from './config.js';
import { logger } from './lib/logger.js';
import { errorHandler, notFound } from './lib/http.js';
import { apiV1 } from './routes/index.js';
import { webhooksRouter } from './routes/payments.js';
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from './lib/uploads.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: corsAllowlist,
      credentials: true,
    }),
  );
  app.use(pinoHttp({ logger }));

  // Stripe webhook needs the raw body for signature verification — mount BEFORE json().
  app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }), webhooksRouter);

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Rate limiting on write/auth surfaces (Redis-backed in production; Part I §11).
  app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Locally-stored admin media (university banners/logos). Cached and CORS-open for <img> use.
  app.use(
    UPLOAD_URL_PREFIX,
    (_req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      next();
    },
    express.static(UPLOAD_DIR),
  );

  app.use('/api/v1', apiV1);

  app.use((_req, _res, next) => next(notFound()));
  app.use(errorHandler);

  return app;
}
