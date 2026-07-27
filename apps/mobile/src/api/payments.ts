// Stripe card authorization for the guide booking flow. The card is only
// AUTHORIZED here (a hold via the backend's manual-capture PaymentIntent) — the
// guide's acceptance captures it later. Mirrors the website's Payment Element step,
// but uses the native PaymentSheet from @stripe/stripe-react-native.
//
// Stripe is a NATIVE module: it only works in a custom dev build / EAS build, not in
// plain Expo Go. So we load it lazily and degrade gracefully ('unavailable') when the
// native binding is missing — the app still runs and the booking falls back to the
// "finish payment on the website" path instead of crashing.
import type * as StripeRN from '@stripe/stripe-react-native';
import { colors } from '../theme';

export type PaymentResult =
  | { status: 'paid' }
  | { status: 'canceled' }
  | { status: 'unavailable' }
  | { status: 'failed'; message: string };

/** Require the native module at call time; null if it isn't linked (e.g. Expo Go). */
function loadStripe(): typeof StripeRN | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@stripe/stripe-react-native') as typeof StripeRN;
    return mod && typeof mod.initPaymentSheet === 'function' ? mod : null;
  } catch {
    return null;
  }
}

/**
 * Open the native card sheet for a booking's PaymentIntent and authorize the hold.
 * `publishableKey` + `clientSecret` come from `bookingsApi.createGuide`.
 */
export async function authorizeCard(opts: {
  clientSecret: string;
  publishableKey: string;
}): Promise<PaymentResult> {
  const stripe = loadStripe();
  if (!stripe) return { status: 'unavailable' };

  try {
    // The publishable key can vary by environment, so set it right before use.
    await stripe.initStripe({ publishableKey: opts.publishableKey });

    const init = await stripe.initPaymentSheet({
      merchantDisplayName: 'University Campus Private Tours',
      paymentIntentClientSecret: opts.clientSecret,
      appearance: { colors: { primary: colors.maroon900 } },
    });
    if (init.error) return { status: 'failed', message: init.error.message };

    const present = await stripe.presentPaymentSheet();
    if (present.error) {
      if (present.error.code === 'Canceled') return { status: 'canceled' };
      return { status: 'failed', message: present.error.message };
    }
    // No error means the card was authorized (requires_capture on the backend).
    return { status: 'paid' };
  } catch {
    // JS loaded but the native module isn't actually linked (Expo Go) → fall back.
    return { status: 'unavailable' };
  }
}
