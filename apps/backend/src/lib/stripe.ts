// Stripe client factory. Keys come from the environment (see config.ts / .env).
// The client is memoized so we build a single Stripe instance per process.
import Stripe from 'stripe';
import { config } from '../config.js';
import { logger } from './logger.js';

let cached: Stripe | null = null;

/** True when a usable (non-placeholder) secret key is configured. */
export function isStripeEnabled(): boolean {
  const key = config.STRIPE_SECRET_KEY;
  return Boolean(key && key.startsWith('sk_'));
}

/** The publishable key handed to the browser to mount Stripe.js / the Payment Element. */
export function publishableKey(): string | null {
  const key = config.STRIPE_PUBLISHABLE_KEY;
  return key && key.startsWith('pk_') ? key : null;
}

/** Lowercase ISO-4217 currency all charges are created in. */
export const currency = (config.STRIPE_CURRENCY || 'usd').toLowerCase();

/**
 * The memoized Stripe client. Throws if Stripe is not configured — callers that
 * must degrade gracefully should gate on isStripeEnabled() first.
 */
export function stripe(): Stripe {
  if (!isStripeEnabled()) {
    throw new Error('Stripe is not configured (STRIPE_SECRET_KEY missing or invalid)');
  }
  if (!cached) {
    cached = new Stripe(config.STRIPE_SECRET_KEY as string, {
      // Pin an API version so behaviour is stable across Stripe upgrades.
      apiVersion: '2025-02-24.acacia',
      appInfo: { name: 'University Campus Private Tours' },
    });
    logger.info('Stripe client initialised');
  }
  return cached;
}
