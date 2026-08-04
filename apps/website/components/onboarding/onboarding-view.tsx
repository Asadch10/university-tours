'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { accountApi, authApi, friendlyError, tokenStore } from '@/lib/client-api';
import { updateSessionUser } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { universities } from '@/lib/data';

const OPTIONS = [
  { key: 'book', label: 'Book a private tour' },
  { key: 'guide', label: 'Become a guide and host tours' },
  { key: 'other', label: 'Other' },
];

const inputClasses =
  'w-full rounded-xl border border-ink-200 bg-surface px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15';

type Step = 'intent' | 'schools';

/** First-run welcome. Buyers get a second step to pick schools before heading to Browse guides. */
export function OnboardingView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyToken = searchParams.get('token');
  const toast = useToast();
  const [firstName, setFirstName] = useState('');
  const [selected, setSelected] = useState('');
  const [step, setStep] = useState<Step>('intent');
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  // Schools step
  const [schools, setSchools] = useState<string[]>([]);
  const [customSchools, setCustomSchools] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Arrived from the email "Verify my email" button → confirm it first.
      if (verifyToken) {
        try {
          await authApi.verifyEmail(verifyToken);
          updateSessionUser({ emailVerified: true });
          if (!cancelled) toast.success('Email verified', 'Your email address is confirmed.');
        } catch {
          if (!cancelled) toast.error('Verification failed', 'That link is invalid or has expired.');
        }
        // Drop the token from the URL so a refresh doesn't re-run verification.
        router.replace('/onboarding');
      }

      const u = tokenStore.user;
      if (!u) {
        router.replace('/login');
        return;
      }
      if (cancelled) return;
      setFirstName((u.name || '').trim().split(/\s+/)[0] || '');

      // Role decides onboarding: if it's already set, onboarding is done → skip.
      try {
        const me = await accountApi.getMe();
        if (cancelled) return;
        if (me.role) router.replace('/');
        else setChecking(false);
      } catch {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, verifyToken]);

  async function handleIntentContinue() {
    // Buyers pick their schools next; everyone else finishes here.
    if (selected === 'book') {
      setStep('schools');
      return;
    }
    setSaving(true);
    try {
      const res = await accountApi.completeOnboarding(selected);
      if (res.role) updateSessionUser({ role: res.role });
      router.push('/');
    } catch (e) {
      toast.error('Something went wrong', friendlyError(e));
      setSaving(false);
    }
  }

  async function handleSchoolsContinue() {
    const custom = customSchools
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const all = Array.from(new Set([...schools, ...custom]));
    setSaving(true);
    try {
      const res = await accountApi.completeOnboarding('book', all);
      if (res.role) updateSessionUser({ role: res.role });
      router.push('/search');
    } catch (e) {
      toast.error('Something went wrong', friendlyError(e));
      setSaving(false);
    }
  }

  const hero = universities[0]?.image;

  if (checking) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-maroon-950">
        <Loader2 className="animate-spin text-ivory/80" size={28} />
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh bg-maroon-950">
      {/* Campus backdrop */}
      <div className="absolute inset-0">
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-canvas/75 via-maroon-950/65 to-maroon-950/85" />
        <div className="bg-grid absolute inset-0 opacity-20" aria-hidden />
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-md items-center px-5 py-16">
        <div className="w-full overflow-hidden rounded-3xl bg-surface shadow-lift">
          {step === 'intent' ? (
            <>
              {/* Hero */}
              <div className="relative h-52 bg-maroon-gradient">
                {hero && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={hero} alt="" className="h-full w-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-canvas/70 to-canvas/20" />
                <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                  <h1 className="font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
                    Welcome to University Campus Private Tours{firstName ? `, ${firstName}` : ''}
                  </h1>
                </div>
              </div>

              {/* Intent */}
              <div className="p-6 sm:p-8">
                <p className="text-sm font-semibold text-ink-800">I want to…</p>
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
                          active ? 'border-brand bg-brand-tint/50 ring-1 ring-inset ring-brand' : 'border-ink-200 bg-surface hover:border-brand-muted',
                        )}
                      >
                        <span className={cn('inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', active ? 'border-brand' : 'border-ink-300')}>
                          {active && <span className="h-2.5 w-2.5 rounded-full bg-maroon-800" />}
                        </span>
                        <span className="text-sm font-medium text-ink-900">{o.label}</span>
                      </button>
                    );
                  })}
                </div>

                <Button type="button" variant="primary" size="lg" className="mt-6 w-full" disabled={!selected || saving} onClick={handleIntentContinue}>
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> One moment…
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </>
          ) : (
            /* ─── Schools step (buyers) ─────────────────────────────────── */
            <div className="p-6 sm:p-8">
              <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
                What schools are you interested in?
              </h1>
              <p className="mt-3 text-sm text-ink-600">
                This helps us personalize your experience. You can edit your list of schools later.
              </p>

              {/* Add from list */}
              <div className="mt-6">
                <label htmlFor="ob-school" className="mb-1.5 block text-sm font-semibold text-ink-900">
                  Add schools
                </label>
                <div className="relative">
                  <select
                    id="ob-school"
                    value=""
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) setSchools((s) => (s.includes(v) ? s : [...s, v]));
                    }}
                    className={cn(inputClasses, 'cursor-pointer appearance-none pr-10')}
                  >
                    <option value="">Select…</option>
                    {universities
                      .filter((u) => !schools.includes(u.name))
                      .map((u) => (
                        <option key={u.slug} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                  <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                </div>

                {schools.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {schools.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-brand-tint py-1.5 pl-3 pr-1.5 text-sm font-medium text-brand ring-1 ring-inset ring-brand-muted">
                        {s}
                        <button
                          type="button"
                          onClick={() => setSchools((arr) => arr.filter((x) => x !== s))}
                          aria-label={`Remove ${s}`}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-brand transition-colors hover:bg-maroon-200/60"
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom */}
              <div className="mt-5">
                <label htmlFor="ob-custom" className="block text-sm font-semibold text-ink-900">
                  If a school isn&apos;t listed, please type your own
                </label>
                <p className="mt-0.5 text-xs text-ink-500">Separate multiple schools with commas</p>
                <textarea
                  id="ob-custom"
                  rows={4}
                  value={customSchools}
                  onChange={(e) => setCustomSchools(e.target.value)}
                  placeholder="Enter school name(s)…"
                  className={cn(inputClasses, 'mt-2 resize-y leading-relaxed')}
                />
              </div>

              <Button type="button" variant="primary" size="lg" className="mt-6 w-full" disabled={saving} onClick={handleSchoolsContinue}>
                {saving ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> One moment…
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
