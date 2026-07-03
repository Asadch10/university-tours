'use client';

import { useEffect, useState } from 'react';
import { CreditCard, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tokenStore } from '@/lib/client-api';
import { settingsInput, COUNTRIES } from './shared';

export function PaymentsSettings() {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    const u = tokenStore.user;
    if (u?.name) setName(u.name);
  }, []);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Payment method</h1>

      {/* Card element (visual only for now) */}
      <div className="mt-8">
        <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3 transition-colors focus-within:border-maroon-800 focus-within:ring-2 focus-within:ring-maroon-800/15">
          <CreditCard size={18} className="shrink-0 text-ink-400" />
          <input placeholder="Card number" className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none" />
          <input placeholder="MM / YY" className="w-16 bg-transparent text-right text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none" />
          <input placeholder="CVC" className="w-10 bg-transparent text-right text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none" />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-400">
          I authorize University Campus Private Tours to send instructions to the financial institution that
          issued my card to take payments from my card account.
        </p>
      </div>

      {/* Billing details */}
      <div className="mt-8">
        <h2 className="font-display text-xl font-semibold text-ink-900">Billing details</h2>

        <div className="mt-4 space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className={settingsInput}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input placeholder="Street address" className={settingsInput} />
            <input placeholder="Apt, suite, building" className={settingsInput} />
            <input placeholder="Postal code" className={settingsInput} />
            <input placeholder="City" className={settingsInput} />
            <input placeholder="State" className={settingsInput} />
            <div className="relative">
              <select value={country} onChange={(e) => setCountry(e.target.value)} className={`${settingsInput} cursor-pointer appearance-none pr-10`}>
                <option value="">Select country…</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <Button variant="primary" size="lg" className="w-full">
          Save payment method
        </Button>
      </div>
    </div>
  );
}
