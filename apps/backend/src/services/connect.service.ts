// Stripe Connect (Express) — guide payout onboarding.
//
// A guide connects their bank account through Stripe's own hosted onboarding
// (we never touch bank details). Once onboarding is complete, their booking
// payments are split automatically (see booking.service: application_fee +
// transfer_data.destination).
import type Stripe from 'stripe';
import { prisma } from '@ucpt/db';
import { stripe, isStripeEnabled } from '../lib/stripe.js';
import { config } from '../config.js';
import { HttpError } from '../lib/http.js';
import { logger } from '../lib/logger.js';

const webBase = () => config.APP_WEB_URL.replace(/\/+$/, '');

export interface ConnectBank {
  bankName: string | null;
  last4: string;
  currency: string;
  country: string;
}

export interface ConnectStatus {
  connected: boolean; // a Stripe account exists for this user
  payoutsEnabled: boolean; // onboarding complete — can receive payouts
  detailsSubmitted: boolean; // finished the onboarding form (may still be verifying)
  bank: ConnectBank | null; // the connected payout bank account (masked)
}

/** Pull the default payout bank account off a retrieved Connect account. */
function bankFromAccount(acct: Stripe.Account): ConnectBank | null {
  const banks = (acct.external_accounts?.data ?? []).filter(
    (e): e is Stripe.BankAccount => e.object === 'bank_account',
  );
  const primary = banks.find((b) => b.default_for_currency) ?? banks[0];
  if (!primary) return null;
  return {
    bankName: primary.bank_name,
    last4: primary.last4,
    currency: primary.currency,
    country: primary.country,
  };
}

/**
 * Create (or reuse) the guide's Express account and return a fresh onboarding
 * link. The link is single-use and short-lived — always mint a new one.
 */
// Country dropdown label → ISO code for account creation.
const COUNTRY_ISO: Record<string, string> = {
  'United States': 'US', 'United Kingdom': 'GB', Canada: 'CA', Australia: 'AU',
  India: 'IN', Pakistan: 'PK', Germany: 'DE', France: 'FR', Spain: 'ES',
  Italy: 'IT', Netherlands: 'NL', Ireland: 'IE', Singapore: 'SG',
  'United Arab Emirates': 'AE',
};

export async function startConnectOnboarding(userId: string, country?: string): Promise<{ url: string }> {
  if (!isStripeEnabled()) throw new HttpError(503, 'stripe_disabled', 'Payments are not configured');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, stripeAccountId: true },
  });
  if (!user) throw new HttpError(404, 'not_found', 'User not found');

  let accountId = user.stripeAccountId;
  if (!accountId) {
    const iso = country ? COUNTRY_ISO[country] : undefined;
    const acct = await stripe().accounts.create({
      type: 'express',
      email: user.email,
      business_type: 'individual',
      capabilities: { transfers: { requested: true } },
      ...(iso ? { country: iso } : {}),
      metadata: { userId: user.id },
    });
    accountId = acct.id;
    await prisma.user.update({ where: { id: userId }, data: { stripeAccountId: accountId } });
    logger.info({ userId, accountId }, 'Created Stripe Connect account');
  }

  const link = await stripe().accountLinks.create({
    account: accountId,
    refresh_url: `${webBase()}/settings?section=payouts&connect=refresh`,
    return_url: `${webBase()}/settings?section=payouts&connect=return`,
    type: 'account_onboarding',
  });
  return { url: link.url };
}

/** Live status from Stripe (also caches payouts-enabled on the user). */
export async function getConnectStatus(userId: string): Promise<ConnectStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeAccountId: true, stripePayoutsEnabled: true },
  });
  if (!user) throw new HttpError(404, 'not_found', 'User not found');
  if (!user.stripeAccountId || !isStripeEnabled()) {
    return { connected: false, payoutsEnabled: false, detailsSubmitted: false, bank: null };
  }
  try {
    const acct = await stripe().accounts.retrieve(user.stripeAccountId);
    const payoutsEnabled = !!acct.payouts_enabled;
    if (payoutsEnabled !== user.stripePayoutsEnabled) {
      await prisma.user.update({ where: { id: userId }, data: { stripePayoutsEnabled: payoutsEnabled } });
    }
    return {
      connected: true,
      payoutsEnabled,
      detailsSubmitted: !!acct.details_submitted,
      bank: bankFromAccount(acct),
    };
  } catch (err) {
    logger.error({ err, userId }, 'Stripe Connect status retrieve failed');
    // Fall back to the cached flag so the page still renders.
    return { connected: true, payoutsEnabled: user.stripePayoutsEnabled, detailsSubmitted: user.stripePayoutsEnabled, bank: null };
  }
}

/** Login link to the guide's Express dashboard (to view/update bank + payouts). */
export async function getConnectDashboardLink(userId: string): Promise<{ url: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeAccountId: true } });
  if (!user?.stripeAccountId) throw new HttpError(400, 'no_account', 'No connected account yet');
  const link = await stripe().accounts.createLoginLink(user.stripeAccountId);
  return { url: link.url };
}

/** Webhook helper: sync the cached flag when Stripe reports an account change. */
export async function syncConnectAccount(accountId: string, payoutsEnabled: boolean): Promise<void> {
  await prisma.user.updateMany({
    where: { stripeAccountId: accountId },
    data: { stripePayoutsEnabled: payoutsEnabled },
  });
}

export interface PayoutRow {
  amountCents: number;
  currency: string;
  status: string;
  arrivalDate: number; // unix seconds
  last4: string | null;
}

export interface PayoutSummary {
  currency: string;
  availableCents: number; // ready to pay out now
  pendingCents: number; // still settling
  completeCents: number; // already sent to the bank
  payouts: PayoutRow[];
}

const EMPTY_SUMMARY: PayoutSummary = { currency: 'usd', availableCents: 0, pendingCents: 0, completeCents: 0, payouts: [] };

/** Live balance + payout history from the guide's connected account. */
export async function getPayoutSummary(userId: string): Promise<PayoutSummary> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeAccountId: true } });
  if (!user?.stripeAccountId || !isStripeEnabled()) return EMPTY_SUMMARY;
  const acctId = user.stripeAccountId;
  try {
    const [balance, list] = await Promise.all([
      stripe().balance.retrieve({}, { stripeAccount: acctId }),
      stripe().payouts.list({ limit: 20, expand: ['data.destination'] }, { stripeAccount: acctId }),
    ]);
    const currency = balance.available[0]?.currency ?? balance.pending[0]?.currency ?? 'usd';
    const sum = (arr: { amount: number; currency: string }[]) =>
      arr.filter((b) => b.currency === currency).reduce((s, b) => s + b.amount, 0);

    const payouts: PayoutRow[] = list.data.map((p) => {
      const dest = p.destination;
      const last4 = dest && typeof dest === 'object' && 'last4' in dest ? (dest.last4 as string) : null;
      return { amountCents: p.amount, currency: p.currency, status: p.status, arrivalDate: p.arrival_date, last4 };
    });
    const completeCents = list.data.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

    return { currency, availableCents: sum(balance.available), pendingCents: sum(balance.pending), completeCents, payouts };
  } catch (err) {
    logger.error({ err, userId }, 'Payout summary failed');
    return EMPTY_SUMMARY;
  }
}

/** Manually pay out the available balance to the guide's bank now. */
export async function cashOut(userId: string): Promise<{ ok: true; amountCents: number }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeAccountId: true } });
  if (!user?.stripeAccountId || !isStripeEnabled()) throw new HttpError(400, 'no_account', 'Connect a bank account first');
  const acctId = user.stripeAccountId;
  const balance = await stripe().balance.retrieve({}, { stripeAccount: acctId });
  const currency = balance.available[0]?.currency ?? 'usd';
  const amount = balance.available.filter((b) => b.currency === currency).reduce((s, b) => s + b.amount, 0);
  if (amount <= 0) throw new HttpError(400, 'no_balance', 'No available balance to cash out yet');
  await stripe().payouts.create({ amount, currency }, { stripeAccount: acctId });
  return { ok: true, amountCents: amount };
}
