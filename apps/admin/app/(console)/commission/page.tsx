'use client';

import { useState } from 'react';
import { Percent, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input, Field } from '@/components/ui/input';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useCommission, useCommissionActions } from '@/lib/queries';
import { formatPrice } from '@/lib/utils';

const SAMPLE_CENTS = 6500; // $65 sample booking

function split(grossCents: number, pct: number) {
  const keeps = Math.round((grossCents * pct) / 100);
  return { keeps, receives: grossCents - keeps };
}

export default function CommissionPage() {
  const { data: commission, isLoading: loading } = useCommission();
  const { set: setCommission } = useCommissionActions();

  const pct = commission?.commissionPct ?? 0;

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('0');
  const toast = useToast();

  const live = split(SAMPLE_CENTS, pct);
  const draftPct = parseFloat(draft);
  const draftValid = Number.isFinite(draftPct) && draftPct >= 0 && draftPct <= 100 && draftPct !== pct;
  const preview = split(SAMPLE_CENTS, Number.isFinite(draftPct) ? draftPct : 0);

  function openEdit() {
    setDraft(String(pct));
    setOpen(true);
  }

  async function save() {
    if (!draftValid) return;
    try {
      await setCommission.mutateAsync(draftPct);
      setOpen(false);
      toast.success('Commission updated', `New rate is ${draftPct}%.`);
    } catch (e) {
      toast.error('Could not update commission', (e as Error).message);
    }
  }

  return (
    <RequirePermission anyOf={['commission.set']}>
      <div className="space-y-6">
        <PageHeader
          title="Commission"
          description="The global rate the platform keeps on every booking."
          actions={
            <Can perm="commission.set">
              <Button variant="primary" onClick={openEdit} disabled={loading}>
                <Pencil size={15} /> Edit rate
              </Button>
            </Can>
          }
        />

        {loading ? (
          <Skeleton className="h-40 w-full max-w-xl" />
        ) : (
          <Card className="max-w-xl">
            <CardBody className="p-6">
              <div className="flex items-center gap-4">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-800">
                  <Percent size={28} />
                </span>
                <div>
                  <p className="font-display text-6xl font-bold leading-none text-ink-900">{pct}%</p>
                  <p className="mt-2 text-sm text-ink-500">Platform commission · guide keeps {100 - pct}%</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-ink-200/70 bg-ink-50/50 p-4 text-sm">
                <p className="mb-2 font-semibold text-ink-700">On a {formatPrice(SAMPLE_CENTS)} booking</p>
                <div className="flex items-center justify-between">
                  <span className="text-ink-500">Platform keeps</span>
                  <span className="font-semibold text-brand-900">{formatPrice(live.keeps)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-ink-500">Guide receives</span>
                  <span className="font-semibold text-ink-900">{formatPrice(live.receives)}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Edit modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Edit commission"
        description="Applies to new and pending bookings."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={!draftValid || setCommission.isPending} onClick={save}>
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
            error={draft && (!Number.isFinite(draftPct) || draftPct < 0 || draftPct > 100) ? 'Enter a value between 0 and 100.' : undefined}
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
            <p className="mb-2 font-semibold text-ink-700">Preview · {formatPrice(SAMPLE_CENTS)} booking</p>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Platform keeps</span>
              <span className="font-semibold text-brand-900">{formatPrice(preview.keeps)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-500">Guide receives</span>
              <span className="font-semibold text-ink-900">{formatPrice(preview.receives)}</span>
            </div>
          </div>
        </div>
      </Modal>
    </RequirePermission>
  );
}
