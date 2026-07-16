'use client';

import { useCallback, useEffect, useState } from 'react';
import { Lock, Loader2, CheckCircle2, ExternalLink, ChevronDown, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { settingsInput, COUNTRIES } from './shared';
import {
  connectApi,
  friendlyError,
  type ConnectStatus,
  type PayoutSummary,
} from '@/lib/client-api';
import { useToast } from '@/lib/toast';

function money(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(
      (cents ?? 0) / 100,
    );
  } catch {
    return `$${((cents ?? 0) / 100).toFixed(2)}`;
  }
}

function payoutDate(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function PayoutsSettings() {
  const toast = useToast();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<null | 'connect' | 'cashout' | 'dashboard'>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([connectApi.status(), connectApi.payouts()])
      .then(([s, sum]) => {
        setStatus(s);
        setSummary(sum);
      })
      .catch(() => {
        setStatus({ connected: false, payoutsEnabled: false, detailsSubmitted: false, bank: null });
        setSummary({ currency: 'usd', availableCents: 0, pendingCents: 0, completeCents: 0, payouts: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('connect')) window.history.replaceState({}, '', '/settings?section=payouts');
    }
  }, [load]);

  async function connect() {
    setWorking('connect');
    try {
      const { url } = await connectApi.onboard(country || undefined);
      window.location.href = url;
    } catch (e) {
      setWorking(null);
      toast.error('Couldn’t start bank setup', friendlyError(e));
    }
  }

  async function cashOut() {
    setWorking('cashout');
    try {
      const { amountCents } = await connectApi.cashOut();
      toast.success('Cash out started', `${money(amountCents, cur)} is on its way to your bank.`);
      load();
    } catch (e) {
      toast.error('Couldn’t cash out', friendlyError(e));
    } finally {
      setWorking(null);
    }
  }

  async function openDashboard() {
    setWorking('dashboard');
    try {
      const { url } = await connectApi.dashboard();
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      toast.error('Couldn’t open Stripe dashboard', friendlyError(e));
    } finally {
      setWorking(null);
    }
  }

  const cur = summary?.currency ?? 'usd';
  const available = summary?.availableCents ?? 0;
  const stats = [
    { label: 'Available', value: money(available, cur) },
    { label: 'Pending', value: money(summary?.pendingCents ?? 0, cur) },
    { label: 'Complete', value: money(summary?.completeCents ?? 0, cur) },
  ];

  if (loading) {
    return (
      <div className="flex max-w-2xl justify-center py-24">
        <Loader2 className="animate-spin text-maroon-800" size={26} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Payouts</h1>

      {/* Balance summary — dynamic from Stripe */}
      <div className="mt-8 flex flex-wrap gap-x-14 gap-y-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-display text-2xl font-bold text-ink-900">{s.value}</p>
            <p className="text-sm text-ink-500">{s.label}</p>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="md"
        className="mt-6"
        disabled={available <= 0 || working !== null}
        onClick={cashOut}
      >
        {working === 'cashout' ? <Loader2 size={16} className="animate-spin" /> : null}
        Cash out {money(available, cur)}
      </Button>

      {/* Bank account — Stripe Connect */}
      <div className="mt-10">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl font-semibold text-ink-900">Bank account</h2>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#635bff] px-2 py-1 text-xs font-semibold text-white">
            <Lock size={11} /> Powered by Stripe
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">
          University Campus Private Tours uses Stripe to securely send your earnings to your bank account.
          Stripe uses industry-leading security protocols to encrypt and protect your personal data.
        </p>

        {status?.payoutsEnabled ? (
          /* Connected — show the bank on file */
          <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-verified/10 text-verified">
                  <CheckCircle2 size={20} />
                </span>
                <div>
                  <p className="font-semibold text-ink-900">
                    {status.bank ? `${status.bank.bankName ?? 'Bank account'} ···· ${status.bank.last4}` : 'Bank account connected'}
                  </p>
                  <p className="text-sm text-ink-600">
                    {status.bank ? `${status.bank.currency.toUpperCase()} · ${status.bank.country}` : 'Ready to receive payouts.'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="md" disabled={working !== null} onClick={openDashboard} className="shrink-0">
                {working === 'dashboard' ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={15} />}
                Manage on Stripe
              </Button>
            </div>
          </div>
        ) : (
          /* Not connected (or setup incomplete) — country + connect */
          <div className="mt-8">
            <h3 className="font-display text-lg font-semibold text-ink-900">Bank account details</h3>
            <div className="mt-4">
              <label htmlFor="s-country" className="mb-1.5 block text-sm font-semibold text-ink-900">
                Country
              </label>
              <div className="relative">
                <select
                  id="s-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={`${settingsInput} cursor-pointer appearance-none pr-10`}
                >
                  <option value="">Select your country…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              </div>
            </div>
            <Button variant="primary" size="md" className="mt-4" disabled={working !== null} onClick={connect}>
              {working === 'connect' ? <Loader2 size={16} className="animate-spin" /> : null}
              {status?.connected ? 'Finish bank setup' : 'Connect bank account'}
            </Button>
          </div>
        )}
      </div>

      {/* Completed payouts — dynamic from Stripe */}
      <div className="mt-10">
        <h3 className="font-display text-lg font-semibold text-ink-900">Completed payouts</h3>
        <div className="mt-4 grid grid-cols-3 gap-4 border-b border-ink-200 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
          <span>Amount</span>
          <span>Bank account</span>
          <span>Date</span>
        </div>
        {summary && summary.payouts.length > 0 ? (
          summary.payouts.map((p, i) => (
            <div key={i} className="grid grid-cols-3 gap-4 border-b border-ink-100 py-3 text-sm text-ink-800">
              <span className="font-semibold">{money(p.amountCents, p.currency)}</span>
              <span className="text-ink-600">
                {p.last4 ? `···· ${p.last4}` : '—'}
                {p.status !== 'paid' && <span className="ml-1 text-xs text-ink-400">({p.status})</span>}
              </span>
              <span className="text-ink-600">{payoutDate(p.arrivalDate)}</span>
            </div>
          ))
        ) : (
          <p className="border-b border-ink-100 py-4 text-sm text-ink-500">No completed payouts yet</p>
        )}
      </div>
    </div>
  );
}
