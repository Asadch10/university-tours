'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { accountApi, friendlyError, type MyProfileDto } from '@/lib/client-api';
import { updateSessionUser } from '@/lib/auth';
import { useToast } from '@/lib/toast';

const OPTIONS = [
  { key: 'book', label: 'Book a private tour' },
  { key: 'guide', label: 'Become a guide and host tours' },
  { key: 'other', label: 'Other' },
];

export function CollegeStatus({ profile }: { profile?: MyProfileDto | null }) {
  const toast = useToast();
  const [selected, setSelected] = useState('book');
  const [saving, setSaving] = useState(false);

  // Derive the current choice from the saved intent, falling back to the account role.
  useEffect(() => {
    if (!profile) return;
    const p = (profile.profileJson ?? {}) as Record<string, unknown>;
    if (p.intent === 'book' || p.intent === 'guide' || p.intent === 'other') setSelected(p.intent);
    else if (profile.role === 'SELLER') setSelected('guide');
    else if (profile.role === 'BUYER') setSelected('book');
  }, [profile]);

  async function save() {
    setSaving(true);
    try {
      // College status is managed through the onboarding endpoint (it also sets the role).
      const res = await accountApi.completeOnboarding(selected);
      if (res.role) updateSessionUser({ role: res.role });
      toast.success('College status updated', 'Your preference has been saved.');
    } catch (e) {
      toast.error('Could not save', friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-ink-900">College status</h1>

      <p className="mt-8 text-sm font-medium text-ink-700">I want to…</p>

      <div className="mt-3 space-y-3">
        {OPTIONS.map((o) => {
          const active = selected === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => setSelected(o.key)}
              className={cn(
                'flex w-full items-center gap-3 rounded-2xl border px-5 py-4 text-left transition-colors',
                active ? 'border-maroon-800 bg-maroon-50/50 ring-1 ring-inset ring-maroon-800' : 'border-ink-200 bg-white hover:border-maroon-300',
              )}
            >
              <span className={cn('inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', active ? 'border-maroon-800' : 'border-ink-300')}>
                {active && <span className="h-2.5 w-2.5 rounded-full bg-maroon-800" />}
              </span>
              <span className="text-sm font-medium text-ink-900">{o.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-10">
        <Button variant="primary" size="lg" className="w-full" disabled={saving} onClick={save}>
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Saving…
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </div>
  );
}
