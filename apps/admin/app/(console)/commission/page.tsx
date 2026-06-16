'use client';

import { useState } from 'react';
import { Percent, Pencil, Info, History } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input, Field } from '@/components/ui/input';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import { useCommission, useCommissionActions } from '@/lib/queries';
import { formatPrice, formatDate } from '@/lib/utils';

const SAMPLE_GROSS_CENTS = 6500; // $65.00 sample booking

interface CommissionChange {
  id: string;
  oldPct: number;
  newPct: number;
  actor: string;
  changedAt: string;
}

export default function CommissionPage() {
  const { data: commission, isLoading: loading } = useCommission();
  const { set: setCommission } = useCommissionActions();
  const pct = commission?.commissionPct ?? 0;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('0');

  // Session-local view of rate changes. The authoritative, immutable history of
  // commission changes lives in the audit log (action `commission.update`).
  const [history, setHistory] = useState<CommissionChange[]>([]);

  const toast = useToast();
  const confirm = useConfirm();

  function openEdit() {
    setDraft(String(pct));
    setOpen(true);
  }

  const draftPct = parseFloat(draft);
  const draftValid =
    Number.isFinite(draftPct) && draftPct >= 0 && draftPct <= 100 && draftPct !== pct;

  // Live preview for the sample booking.
  const previewKeeps = Math.round((SAMPLE_GROSS_CENTS * (Number.isFinite(draftPct) ? draftPct : 0)) / 100);
  const previewReceives = SAMPLE_GROSS_CENTS - previewKeeps;

  async function save() {
    if (!draftValid) return;
    const prev = pct;

    const { confirmed } = await confirm({
      title: 'Update commission',
      description: `Change the global commission from ${prev}% to ${draftPct}%? This only affects new bookings going forward.`,
      confirmLabel: 'Update commission',
      reason: { label: 'Reason for change', placeholder: 'Why is the rate changing?', required: true },
    });
    if (!confirmed) return;

    try {
      // Snapshotted per booking, so historical bookings keep their original rate.
      await setCommission.mutateAsync(draftPct);
      setHistory((h) => [
        {
          id: `ch${Date.now()}`,
          oldPct: prev,
          newPct: draftPct,
          actor: 'You',
          changedAt: new Date().toISOString(),
        },
        ...h,
      ]);
      setOpen(false);
      toast.success('Commission updated', `New global rate is ${draftPct}%.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <RequirePermission anyOf={['commission.set']}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Finance"
          title="Commission"
          description="The single global commission rate the platform keeps on every booking."
        />

        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-info/20 bg-info/5 px-4 py-3.5">
          <Info size={18} className="mt-0.5 shrink-0 text-info" />
          <p className="text-sm text-ink-700">
            The commission rate is <span className="font-semibold">snapshotted per booking</span>{' '}
            when it is created, so changing it here only affects{' '}
            <span className="font-semibold">new bookings going forward</span> — historical bookings,
            payouts, and balances are never altered.
          </p>
        </div>

        {loading ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Current commission */}
            <Card className="lg:col-span-2">
              <CardHeader
                title="Current global commission"
                description="Applied to every new booking platform-wide"
                action={
                  <Can perm="commission.set">
                    <Button variant="outline" size="sm" onClick={openEdit}>
                      <Pencil size={14} /> Edit commission
                    </Button>
                  </Can>
                }
              />
              <CardBody>
                <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-800">
                      <Percent size={26} />
                    </span>
                    <div>
                      <p className="font-display text-5xl font-bold leading-none text-ink-900">
                        {pct}%
                      </p>
                      <p className="mt-1.5 text-sm text-ink-500">Platform commission rate</p>
                    </div>
                  </div>

                  <div className="w-full rounded-xl border border-ink-200/70 bg-ink-50/50 px-4 py-3 text-sm sm:w-auto">
                    <p className="mb-1.5 font-semibold text-ink-700">
                      On a {formatPrice(SAMPLE_GROSS_CENTS)} booking
                    </p>
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-ink-500">Platform keeps</span>
                      <span className="font-semibold text-maroon-900">
                        {formatPrice(Math.round((SAMPLE_GROSS_CENTS * pct) / 100))}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-8">
                      <span className="text-ink-500">Guide receives</span>
                      <span className="font-semibold text-ink-900">
                        {formatPrice(SAMPLE_GROSS_CENTS - Math.round((SAMPLE_GROSS_CENTS * pct) / 100))}
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Change history */}
            <Card>
              <CardHeader
                title="Change history"
                description="Recent rate changes"
                action={<History size={16} className="text-ink-400" />}
              />
              <CardBody className="space-y-3.5">
                {history.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 border-b border-ink-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900">
                        {c.oldPct}% → {c.newPct}%
                      </p>
                      <p className="truncate text-xs text-ink-500">
                        {c.actor} · {formatDate(c.changedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      {/* Edit commission modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Edit commission"
        description="This rate applies only to bookings created after the change."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={!draftValid} onClick={save}>
              Save changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field
            label="Commission rate (%)"
            htmlFor="commission-pct"
            required
            error={
              draft && (!Number.isFinite(draftPct) || draftPct < 0 || draftPct > 100)
                ? 'Enter a value between 0 and 100.'
                : undefined
            }
            hint={`Current rate is ${pct}%.`}
          >
            <Input
              id="commission-pct"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              step={0.5}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </Field>

          <div className="rounded-xl border border-ink-200/70 bg-ink-50/50 px-4 py-3 text-sm">
            <p className="mb-1.5 font-semibold text-ink-700">
              Preview · {formatPrice(SAMPLE_GROSS_CENTS)} booking
            </p>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Platform keeps</span>
              <span className="font-semibold text-maroon-900">{formatPrice(previewKeeps)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">Guide receives</span>
              <span className="font-semibold text-ink-900">{formatPrice(previewReceives)}</span>
            </div>
          </div>
        </div>
      </Modal>
    </RequirePermission>
  );
}
