'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { INTENT_OPTIONS, intentOptionFor } from '@/lib/onboarding-options';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { accountApi, friendlyError, type MyProfileDto } from '@/lib/client-api';
import { updateSessionUser } from '@/lib/auth';
import { useToast } from '@/lib/toast';

// The same three choices the onboarding screen offers — shared so they can't drift.
const OPTIONS = INTENT_OPTIONS;

export function CollegeStatus({ profile }: { profile?: MyProfileDto | null }) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<string>('guest');
  const [saving, setSaving] = useState(false);

  // Current status, resolved from the saved intent (falling back to the account role).
  const current = intentOptionFor(
    ((profile?.profileJson ?? {}) as Record<string, unknown>).intent,
    profile?.role,
  );

  useEffect(() => {
    if (profile) setSelected(current.key);
  }, [profile, current.key]);

  async function save() {
    setSaving(true);
    try {
      // College status is managed through the onboarding endpoint (it also sets the role).
      const res = await accountApi.completeOnboarding(selected);
      if (res.role) updateSessionUser({ role: res.role });
      const next = OPTIONS.find((o) => o.key === selected);
      toast.success('College status updated', 'Your preference has been saved.');
      // Switching into an applicant mode is only useful if it takes you there.
      if (next && next.key !== current.key && next.key !== 'guest') router.push(next.href);
    } catch (e) {
      toast.error('Could not save', friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-ink-900">College status</h1>

      {/* Current status — read-only text, not another control. */}
      <p className="mt-3 text-sm text-ink-600">
        {profile ? current.statusText : 'Loading your status…'}
      </p>

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
                'flex w-full items-start gap-3 rounded-2xl border px-5 py-4 text-left transition-colors',
                active ? 'border-brand bg-brand-tint/50 ring-1 ring-inset ring-brand' : 'border-ink-200 bg-surface hover:border-brand-muted',
              )}
            >
              <span className={cn('mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', active ? 'border-brand' : 'border-ink-300')}>
                {active && <span className="h-2.5 w-2.5 rounded-full bg-maroon-800" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink-900">{o.label}</span>
                <span className="mt-0.5 block text-xs text-ink-500">{o.description}</span>
              </span>
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
