'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { CreditCard, Loader2, Trash2, Plus, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { paymentMethodsApi, friendlyError, type SavedCard } from '@/lib/client-api';
import { stripeAppearanceFor } from '@/lib/stripe-appearance';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';

// Cache one Stripe.js loader per publishable key.
const loaders = new Map<string, Promise<Stripe | null>>();
function stripeFor(pk: string): Promise<Stripe | null> {
  let p = loaders.get(pk);
  if (!p) {
    p = loadStripe(pk);
    loaders.set(pk, p);
  }
  return p;
}

const brandLabel = (b: string) => b.charAt(0).toUpperCase() + b.slice(1);

export function PaymentsSettings() {
  const toast = useToast();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [setup, setSetup] = useState<{ clientSecret: string; publishableKey: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    paymentMethodsApi
      .list()
      .then((r) => setCards(r.data))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  async function startAdd() {
    setAdding(true);
    try {
      const { clientSecret, publishableKey } = await paymentMethodsApi.setup();
      if (!clientSecret || !publishableKey) throw new Error('Payments are not configured.');
      setSetup({ clientSecret, publishableKey });
    } catch (e) {
      setAdding(false);
      toast.error('Couldn’t start adding a card', friendlyError(e));
    }
  }

  function onSaved() {
    setSetup(null);
    setAdding(false);
    toast.success('Card saved', 'Your card is securely on file with Stripe.');
    load();
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      await paymentMethodsApi.remove(id);
      toast.success('Card removed');
      load();
    } catch (e) {
      toast.error('Couldn’t remove card', friendlyError(e));
    } finally {
      setBusyId(null);
    }
  }

  async function makeDefault(id: string) {
    setBusyId(id);
    try {
      await paymentMethodsApi.setDefault(id);
      load();
    } catch (e) {
      toast.error('Couldn’t set default', friendlyError(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Payment methods</h1>
      <p className="mt-2 text-sm text-ink-600">
        Save a card so checkout is one tap next time. Cards are stored securely by Stripe — we never see your
        full card number.
      </p>

      {/* Saved cards */}
      <div className="mt-8 space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-ink-500">
            <Loader2 size={16} className="animate-spin" /> Loading your cards…
          </div>
        ) : cards.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink-300 bg-ink-50/60 px-4 py-6 text-center text-sm text-ink-500">
            No saved cards yet.
          </p>
        ) : (
          cards.map((c) => (
            <div key={c.id} className="flex items-center gap-4 rounded-2xl border border-ink-200 bg-surface p-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand">
                <CreditCard size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink-900">
                  {brandLabel(c.brand)} ···· {c.last4}
                  {c.isDefault && (
                    <span className="ml-2 rounded-full bg-verified/10 px-2 py-0.5 text-xs font-semibold text-verified">
                      Default
                    </span>
                  )}
                </p>
                <p className="text-sm text-ink-500">
                  Expires {String(c.expMonth).padStart(2, '0')}/{c.expYear}
                </p>
              </div>
              {!c.isDefault && (
                <button
                  type="button"
                  disabled={busyId === c.id}
                  onClick={() => makeDefault(c.id)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline disabled:opacity-50"
                >
                  <Check size={14} /> Make default
                </button>
              )}
              <button
                type="button"
                disabled={busyId === c.id}
                onClick={() => remove(c.id)}
                aria-label="Remove card"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                {busyId === c.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add a card */}
      {setup ? (
        <AddCardForm
          clientSecret={setup.clientSecret}
          publishableKey={setup.publishableKey}
          onSaved={onSaved}
          onCancel={() => {
            setSetup(null);
            setAdding(false);
          }}
        />
      ) : (
        <Button variant="outline" size="md" className="mt-6" disabled={adding} onClick={startAdd}>
          {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Add a card
        </Button>
      )}
    </div>
  );
}

/* ── Add-card form (Stripe Elements → confirmSetup) ── */

function AddCardForm({
  clientSecret,
  publishableKey,
  onSaved,
  onCancel,
}: {
  clientSecret: string;
  publishableKey: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const stripePromise = useMemo(() => stripeFor(publishableKey), [publishableKey]);
  const { theme } = useTheme();
  return (
    <div className="mt-6 rounded-2xl border border-ink-200 bg-surface p-5">
      <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
        <Lock size={14} className="text-brand" /> Add a card
      </p>
      <Elements
        key={theme}
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: stripeAppearanceFor(theme),
        }}
      >
        <SetupForm onSaved={onSaved} onCancel={onCancel} />
      </Elements>
    </div>
  );
}

function SetupForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!stripe || !elements) return;
    setSaving(true);
    const { error } = await stripe.confirmSetup({ elements, redirect: 'if_required' });
    setSaving(false);
    if (error) {
      toast.error('Couldn’t save card', error.message ?? 'Please check your card details.');
      return;
    }
    onSaved();
  }

  return (
    <div>
      <PaymentElement options={{ layout: 'tabs' }} />
      <div className="mt-4 flex gap-2">
        <Button variant="primary" size="md" disabled={!stripe || saving} onClick={submit}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : null}
          Save card
        </Button>
        <Button variant="ghost" size="md" disabled={saving} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
