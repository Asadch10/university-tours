// Saved cards on file (Stripe Customer + SetupIntent).
//
// The card is entered on the client via Stripe Elements and confirmed against a
// SetupIntent — the raw card number never reaches our server (PCI-safe). We only
// store the Stripe customer id; Stripe holds the card and returns masked details.
import { prisma } from '@ucpt/db';
import { stripe, isStripeEnabled, publishableKey } from '../lib/stripe.js';
import { HttpError } from '../lib/http.js';

export interface SavedCard {
  id: string; // payment method id
  brand: string; // visa | mastercard | …
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

/** Create (or reuse) the user's Stripe Customer. */
async function getOrCreateCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, name: true },
  });
  if (!user) throw new HttpError(404, 'not_found', 'User not found');
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe().customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: { userId },
  });
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

/**
 * Start saving a card: returns a SetupIntent client secret for the Payment Element
 * to confirm against. On success Stripe attaches the card to the customer.
 */
export async function createSetupIntent(userId: string): Promise<{ clientSecret: string | null; publishableKey: string | null }> {
  if (!isStripeEnabled()) throw new HttpError(503, 'stripe_disabled', 'Payments are not configured');
  const customer = await getOrCreateCustomer(userId);
  const intent = await stripe().setupIntents.create({
    customer,
    payment_method_types: ['card'],
    usage: 'off_session', // so the saved card can be charged for future bookings
  });
  return { clientSecret: intent.client_secret, publishableKey: publishableKey() };
}

/** List the user's saved cards (masked), with the default flagged. */
export async function listPaymentMethods(userId: string): Promise<{ data: SavedCard[] }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } });
  if (!user?.stripeCustomerId || !isStripeEnabled()) return { data: [] };
  const customerId = user.stripeCustomerId;

  const [pms, customer] = await Promise.all([
    stripe().paymentMethods.list({ customer: customerId, type: 'card' }),
    stripe().customers.retrieve(customerId),
  ]);
  const defaultPm =
    customer && !customer.deleted && typeof customer.invoice_settings?.default_payment_method === 'string'
      ? customer.invoice_settings.default_payment_method
      : null;

  const data: SavedCard[] = pms.data
    .filter((pm) => pm.card)
    .map((pm) => ({
      id: pm.id,
      brand: pm.card!.brand,
      last4: pm.card!.last4,
      expMonth: pm.card!.exp_month,
      expYear: pm.card!.exp_year,
      isDefault: pm.id === defaultPm,
    }));
  return { data };
}

/** Remove a saved card (only if it belongs to this user's customer). */
export async function deletePaymentMethod(userId: string, paymentMethodId: string): Promise<{ ok: true }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } });
  if (!user?.stripeCustomerId) throw new HttpError(404, 'not_found', 'No saved cards');
  const pm = await stripe().paymentMethods.retrieve(paymentMethodId);
  if (pm.customer !== user.stripeCustomerId) throw new HttpError(403, 'forbidden', 'Not your card');
  await stripe().paymentMethods.detach(paymentMethodId);
  return { ok: true };
}

/** Make a saved card the default for future charges. */
export async function setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<{ ok: true }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } });
  if (!user?.stripeCustomerId) throw new HttpError(404, 'not_found', 'No saved cards');
  const pm = await stripe().paymentMethods.retrieve(paymentMethodId);
  if (pm.customer !== user.stripeCustomerId) throw new HttpError(403, 'forbidden', 'Not your card');
  await stripe().customers.update(user.stripeCustomerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
  return { ok: true };
}
