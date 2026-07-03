'use client';

import { useState } from 'react';
import { Lock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { settingsInput, COUNTRIES } from './shared';

const STATS = [
  { label: 'Available', value: '$0' },
  { label: 'Pending', value: '$0' },
  { label: 'Complete', value: '$0' },
];

export function PayoutsSettings() {
  const [country, setCountry] = useState('');

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Payouts</h1>

      {/* Balance summary */}
      <div className="mt-8 flex flex-wrap gap-x-14 gap-y-4">
        {STATS.map((s) => (
          <div key={s.label}>
            <p className="font-display text-2xl font-bold text-ink-900">{s.value}</p>
            <p className="text-sm text-ink-500">{s.label}</p>
          </div>
        ))}
      </div>

      <Button variant="outline" size="md" className="mt-6" disabled>
        Cash out $0
      </Button>

      {/* Bank account intro */}
      <div className="mt-10">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl font-semibold text-ink-900">Bank account</h2>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[#635bff] px-2 py-1 text-xs font-semibold text-white">
            <Lock size={11} /> Powered by Stripe
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">
          University Campus Private Tours has partnered with Stripe to securely send your earnings to your
          bank account. Stripe uses industry-leading security protocols to encrypt and protect your
          personal data.
        </p>
      </div>

      {/* Bank details */}
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
        <Button variant="outline" size="md" className="mt-4">
          Connect bank account
        </Button>
      </div>

      {/* Completed payouts */}
      <div className="mt-10">
        <h3 className="font-display text-lg font-semibold text-ink-900">Completed payouts</h3>
        <div className="mt-4 grid grid-cols-3 gap-4 border-b border-ink-200 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
          <span>Amount</span>
          <span>Bank account</span>
          <span>Date</span>
        </div>
        <p className="border-b border-ink-100 py-4 text-sm text-ink-500">No completed payouts yet</p>
      </div>
    </div>
  );
}
