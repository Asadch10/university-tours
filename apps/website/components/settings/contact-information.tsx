'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { accountApi, friendlyError, type MyProfileDto } from '@/lib/client-api';
import { useToast } from '@/lib/toast';
import { settingsInput, DIAL_CODES } from './shared';

export function ContactInformation({ profile }: { profile?: MyProfileDto | null }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [dial, setDial] = useState('+92');
  const [phone, setPhone] = useState('');
  const [promo, setPromo] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setEmail(profile.email ?? '');
    const p = (profile.profileJson ?? {}) as Record<string, unknown>;
    if (typeof p.phone === 'string') setPhone(p.phone);
    if (typeof p.promo === 'boolean') setPromo(p.promo);
  }, [profile]);

  async function save() {
    setSaving(true);
    try {
      // Email is read-only — only phone + promo are updatable here.
      await accountApi.updateContact({ phone: phone.trim(), promo });
      toast.success('Contact info updated', 'Your changes have been saved.');
    } catch (e) {
      toast.error('Could not save', friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Contact information</h1>

      <div className="mt-8 space-y-6">
        {/* Email */}
        <div>
          <label htmlFor="s-email" className="mb-1.5 block text-sm font-semibold text-ink-900">
            Email address
          </label>
          <input
            id="s-email"
            type="email"
            value={email}
            readOnly
            disabled
            aria-readonly="true"
            className={`${settingsInput} cursor-not-allowed bg-ink-50 text-ink-500`}
          />
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
            <CheckCircle2 size={15} className="text-verified" /> Your email address is verified
          </p>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="s-phone" className="mb-1.5 block text-sm font-semibold text-ink-900">
            Phone number
          </label>
          <div className="flex items-center rounded-xl border border-ink-200 bg-surface transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
            <div className="relative flex items-center border-r border-ink-200 pl-3">
              <select
                aria-label="Country code"
                value={dial}
                onChange={(e) => setDial(e.target.value)}
                className="cursor-pointer appearance-none bg-transparent py-3 pr-6 text-sm text-ink-900 focus:outline-none"
              >
                {DIAL_CODES.map((c) => (
                  <option key={c.label} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-1.5 text-ink-400" />
            </div>
            <input
              id="s-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="307 6718155"
              className="w-full min-w-0 bg-transparent px-3 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Promo */}
        <label htmlFor="s-promo" className="flex cursor-pointer select-none items-start gap-2.5 text-sm leading-relaxed text-ink-700">
          <input
            id="s-promo"
            type="checkbox"
            checked={promo}
            onChange={(e) => setPromo(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-brand accent-brand"
          />
          <span>
            I&apos;d like to receive promotional messages from University Campus Private Tours. Message and
            data rates may apply. Text STOP to cancel.
          </span>
        </label>
      </div>

      <div className="mt-10">
        <Button variant="primary" size="lg" className="w-full" disabled={saving} onClick={save}>
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Saving…
            </>
          ) : (
            'Save changes'
          )}
        </Button>
      </div>
    </div>
  );
}
