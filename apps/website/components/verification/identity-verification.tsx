'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { BadgeCheck, Clock, Loader2, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';
import { verificationApi, friendlyError, type VerificationDto } from '@/lib/client-api';

/**
 * Stripe Identity check for an applicant.
 *
 * The wording here is deliberate: this verifies WHO someone is, not that they are a
 * student. Stripe confirms a government ID is genuine and matches a selfie; enrolment
 * is still established by the uploaded document and admin review. Implying otherwise
 * would mislead both the applicant and the admin reviewing them.
 *
 * The flow opens Stripe's own modal, so no document ever reaches our servers — we only
 * ever store a status.
 */

const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const STATE = {
  VERIFIED: {
    icon: BadgeCheck,
    tone: 'border-emerald-200 bg-emerald-50/60 text-emerald-300',
    title: 'Identity verified',
    body: 'Your government ID has been confirmed. Our team still reviews your enrolment document separately.',
  },
  PROCESSING: {
    icon: Clock,
    tone: 'border-gold-600/25 bg-gold-100/40 text-gold-800',
    title: 'Checking your ID',
    body: 'This usually takes under a minute — we will update this automatically.',
  },
  FAILED: {
    icon: AlertTriangle,
    tone: 'border-red-200 bg-red-50/70 text-red-700',
    title: 'We could not verify that',
    body: 'Try again with a clearer photo, or continue — an admin can verify you manually.',
  },
  CANCELED: {
    icon: AlertTriangle,
    tone: 'border-ink-200 bg-canvas-alt text-ink-600',
    title: 'Verification cancelled',
    body: 'You can start it again whenever you are ready.',
  },
} as const;

export function IdentityVerification({ kind = 'GUIDE' }: { kind?: 'GUIDE' | 'COUNSELOR' }) {
  const toast = useToast();
  const [record, setRecord] = useState<VerificationDto | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRecord(await verificationApi.mine(kind));
    } catch {
      // An unreachable check should read as "not started", never break the form.
      setRecord(null);
    }
  }, [kind]);

  useEffect(() => { void load(); }, [load]);

  // While Stripe is still checking, poll: the webhook updates the row server-side and
  // the applicant should not have to reload to see the result.
  useEffect(() => {
    if (record?.status !== 'PROCESSING') return;
    const t = setInterval(() => {
      void verificationApi.refresh(kind).then(setRecord).catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, [record?.status, kind]);

  async function start() {
    setBusy(true);
    try {
      const session = await verificationApi.startStripe(kind);
      const stripeJs = PK ? await loadStripe(PK) : null;

      if (stripeJs && session.clientSecret) {
        const { error } = await stripeJs.verifyIdentity(session.clientSecret);
        // Closing the modal is not an error worth shouting about.
        if (error && error.code !== 'session_cancelled') {
          toast.error(error.message ?? 'Verification failed');
        }
      } else if (session.url) {
        // Fallback to Stripe's hosted page when Stripe.js cannot load.
        window.location.href = session.url;
        return;
      } else {
        toast.error('Verification is unavailable right now.');
      }
      // Re-read the provider's truth rather than inferring it from the modal result.
      setRecord(await verificationApi.refresh(kind));
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  if (record === undefined) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-ink-200 bg-canvas-alt px-4 py-5 text-sm text-ink-500">
        <Loader2 size={16} className="animate-spin" /> Checking verification status…
      </div>
    );
  }

  const state = record ? STATE[record.status as keyof typeof STATE] : undefined;
  const retryable = !record || record.status === 'PENDING' || record.status === 'FAILED' || record.status === 'CANCELED';

  if (retryable) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-surface p-5">
        {state && (
          <div className={cn('mb-4 flex items-start gap-3 rounded-xl border p-3', state.tone)}>
            <state.icon size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{state.title}</p>
              <p className="mt-0.5 text-[0.82rem] leading-relaxed opacity-90">
                {record?.lastError || state.body}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-maroon-900 text-white">
            <ShieldCheck size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink-900">Verify your identity</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-600">
              Confirm a government ID and take a selfie. This proves who you are — your
              enrolment is checked separately from the document you upload. Your ID is
              handled by Stripe and is never stored on our servers.
            </p>
            <button
              type="button"
              onClick={start}
              disabled={busy}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-maroon-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-maroon-800 disabled:opacity-60"
            >
              {busy ? <><Loader2 size={15} className="animate-spin" /> Opening…</> : record ? 'Try again' : 'Start verification'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const Icon = state!.icon;
  return (
    <div className={cn('flex items-start gap-3 rounded-2xl border p-4', state!.tone)}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{state!.title}</p>
        <p className="mt-0.5 text-[0.85rem] leading-relaxed opacity-90">{state!.body}</p>
      </div>
      {record!.status === 'PROCESSING' && (
        <button
          type="button"
          onClick={() => void verificationApi.refresh(kind).then(setRecord).catch(() => {})}
          className="shrink-0 rounded-lg p-1.5 opacity-70 transition-opacity hover:opacity-100"
          aria-label="Refresh status"
        >
          <RefreshCw size={15} />
        </button>
      )}
    </div>
  );
}
