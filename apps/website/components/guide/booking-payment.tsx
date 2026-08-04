'use client';

// Stripe Payment Element step for the guide booking flow. The card is only
// authorized here (a hold) — the guide's acceptance captures it later.
import { useMemo, useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Loader2, Lock, ArrowLeft, ShieldCheck } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { bookingsApi } from '@/lib/client-api';
import { stripeAppearanceFor } from '@/lib/stripe-appearance';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';

// Cache one Stripe.js loader per publishable key across mounts.
const loaders = new Map<string, Promise<Stripe | null>>();
function stripeFor(pk: string): Promise<Stripe | null> {
  let p = loaders.get(pk);
  if (!p) {
    p = loadStripe(pk);
    loaders.set(pk, p);
  }
  return p;
}

export interface BookingPaymentProps {
  bookingId: string;
  clientSecret: string;
  publishableKey: string;
  amountCents: number;
  guideName: string;
  tourLabel: string;
  onPaid: () => void;
  onBack: () => void;
}

export function BookingPayment(props: BookingPaymentProps) {
  const stripePromise = useMemo(() => stripeFor(props.publishableKey), [props.publishableKey]);
  const { theme } = useTheme();
  return (
    <div className="mt-6 rounded-3xl border border-ink-200/70 bg-surface p-6 shadow-card">
      <button
        type="button"
        onClick={props.onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900"
      >
        <ArrowLeft size={15} /> Back
      </button>
      <h3 className="font-display text-xl font-bold text-brand">Confirm and pay</h3>
      <p className="mt-1.5 text-sm text-ink-600">
        You&apos;re authorizing <span className="font-semibold text-ink-900">{formatPrice(props.amountCents)}</span>. Your card
        is only charged once {props.guideName.split(' ')[0]} accepts your {props.tourLabel.toLowerCase()}.
      </p>
      <Elements
        key={theme}
        stripe={stripePromise}
        options={{
          clientSecret: props.clientSecret,
          appearance: stripeAppearanceFor(theme),
        }}
      >
        <PaymentForm {...props} />
      </Elements>
    </div>
  );
}

function PaymentForm({ bookingId, amountCents, onPaid }: BookingPaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function handlePay() {
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    // Authorize the card without leaving the page (no redirect for card payments).
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      setSubmitting(false);
      toast.error('Payment failed', error.message ?? 'Please check your card details and try again.');
      return;
    }
    // requires_capture = authorized hold (our manual-capture flow); succeeded is a fallback.
    if (paymentIntent && (paymentIntent.status === 'requires_capture' || paymentIntent.status === 'succeeded')) {
      try {
        await bookingsApi.confirmPayment(bookingId);
      } catch {
        // The webhook is a backstop — the hold is placed, so still show success.
      }
      onPaid();
      return;
    }
    setSubmitting(false);
    toast.error('Payment not completed', 'Your card was not authorized. Please try again.');
  }

  return (
    <div className="mt-5">
      <PaymentElement options={{ layout: 'tabs' }} />
      <button
        type="button"
        disabled={!stripe || submitting}
        onClick={handlePay}
        className={cn(
          'mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-center font-semibold transition-colors',
          stripe && !submitting
            ? 'bg-maroon-900 text-ivory hover:bg-maroon-800'
            : 'cursor-not-allowed bg-ink-200 text-ink-500',
        )}
      >
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Authorizing…
          </>
        ) : (
          <>
            <Lock size={16} /> Pay {formatPrice(amountCents)}
          </>
        )}
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-ink-500">
        <ShieldCheck size={14} /> Secured by Stripe · you won&apos;t be charged until the guide accepts
      </p>
    </div>
  );
}
