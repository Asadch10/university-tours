'use client';

import { useState } from 'react';
import { BadgeCheck, ShieldAlert, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/toast';
import { useVerification, useVerificationActions, type ApplicantKind } from '@/lib/queries';
import { formatDate } from '@/lib/utils';

/**
 * Identity-verification state for one applicant, with a manual override.
 *
 * The copy is careful on purpose. Stripe Identity confirms a government ID is genuine
 * and matches a selfie — it does NOT confirm enrolment. An admin reading "Verified"
 * and assuming the person is a student would be exactly the wrong takeaway, so the
 * panel says which of the two it is every time.
 */

const TONE = {
  VERIFIED:   { icon: BadgeCheck,  cls: 'border-success/30 bg-success/10 text-success',  label: 'ID verified' },
  PROCESSING: { icon: Clock,       cls: 'border-warn/30 bg-warn/10 text-warn',           label: 'Checking…' },
  PENDING:    { icon: Clock,       cls: 'border-ink-200 bg-surface-2 text-ink-600',      label: 'Not finished' },
  FAILED:     { icon: ShieldAlert, cls: 'border-danger/30 bg-danger/10 text-danger',     label: 'ID check failed' },
  CANCELED:   { icon: ShieldAlert, cls: 'border-ink-200 bg-surface-2 text-ink-600',      label: 'Cancelled' },
} as const;

export function VerificationPanel({ userId, kind = 'GUIDE' }: { userId: string; kind?: ApplicantKind }) {
  const toast = useToast();
  const { data: v, isLoading } = useVerification(userId, kind);
  const { refresh, decide } = useVerificationActions(kind);
  const [note, setNote] = useState('');

  if (isLoading) {
    return (
      <div className="rounded-xl border border-ink-200 p-4 text-sm text-ink-500">
        <Loader2 size={14} className="mr-2 inline animate-spin" /> Loading verification…
      </div>
    );
  }

  const tone = v ? TONE[v.status] : null;
  const Icon = tone?.icon;

  return (
    <div className="rounded-xl border border-ink-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Identity verification</p>
        {v?.method === 'STRIPE_IDENTITY' && (
          <button
            type="button"
            onClick={() => refresh.mutate(userId, {
              onSuccess: () => toast.success('Refreshed from Stripe'),
              onError: (e) => toast.error('Could not refresh', (e as Error).message),
            })}
            disabled={refresh.isPending}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition-colors hover:text-ink-900 disabled:opacity-50"
          >
            <RefreshCw size={12} className={refresh.isPending ? 'animate-spin' : ''} /> Refresh
          </button>
        )}
      </div>

      {v && tone && Icon ? (
        <div className={`mt-3 flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${tone.cls}`}>
          <Icon size={15} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold">{tone.label}</p>
            <p className="mt-0.5 text-xs opacity-90">
              {v.method === 'MANUAL' ? 'Decided manually by an admin'
                : v.method === 'IDME' ? 'Verified via ID.me'
                : 'Government ID + selfie, via Stripe'}
              {v.verifiedAt ? ` · ${formatDate(v.verifiedAt)}` : ''}
            </p>
            {v.lastError && <p className="mt-1 text-xs opacity-90">{v.lastError}</p>}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-500">Not started — the applicant hasn&apos;t run an ID check.</p>
      )}

      {/* The distinction that matters most on this screen. */}
      <p className="mt-3 text-xs leading-relaxed text-ink-500">
        {v?.status === 'VERIFIED' && v.method !== 'MANUAL'
          ? 'This confirms who they are — it does NOT confirm enrolment. Check the uploaded student ID for that.'
          : 'An ID check confirms identity only. Enrolment is confirmed by the uploaded document.'}
      </p>

      {/* Manual override — automated checks reject plenty of legitimate applicants,
          particularly non-US documents, so this is a first-class path, not a hack. */}
      <div className="mt-4 border-t border-ink-200 pt-3">
        <label className="block text-xs font-medium text-ink-600">
          Override manually
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason / note (optional)"
            className="mt-1.5 w-full rounded-lg border border-ink-200 bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none"
          />
        </label>
        <div className="mt-2.5 flex gap-2">
          <Button
            size="sm" variant="primary" disabled={decide.isPending}
            onClick={() => decide.mutate({ userId, verified: true, note: note || undefined }, {
              onSuccess: () => { toast.success('Marked verified'); setNote(''); },
              onError: (e) => toast.error('Could not save', (e as Error).message),
            })}
          >
            Mark verified
          </Button>
          <Button
            size="sm" variant="danger-outline" disabled={decide.isPending}
            onClick={() => decide.mutate({ userId, verified: false, note: note || undefined }, {
              onSuccess: () => { toast.warning('Marked not verified'); setNote(''); },
              onError: (e) => toast.error('Could not save', (e as Error).message),
            })}
          >
            Mark failed
          </Button>
        </div>
      </div>
    </div>
  );
}
