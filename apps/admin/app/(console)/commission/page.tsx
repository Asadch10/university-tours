'use client';

import { useState } from 'react';
import { Percent, Pencil, Tag } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input, Field } from '@/components/ui/input';
import { DataTable, type Column } from '@/components/ui/table';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useCommission, useCommissionActions, usePriceBounds, usePriceBoundActions } from '@/lib/queries';
import { SERVICE_LABEL } from '@/lib/tour-types';
import type { PriceBoundDto } from '@/lib/api';
import { formatPrice } from '@/lib/utils';

const SAMPLE_CENTS = 6500; // $65 sample booking

function split(grossCents: number, pct: number) {
  const keeps = Math.round((grossCents * pct) / 100);
  return { keeps, receives: grossCents - keeps };
}

/** Cents ⇄ whole-dollar strings for the edit form. Prices here are always whole dollars. */
const toDollars = (cents: number) => String(Math.round(cents / 100));
const toCents = (dollars: string) => Math.round(parseFloat(dollars) * 100);

export default function PriceAndCommissionPage() {
  return (
    <RequirePermission anyOf={['commission.set']}>
      <div className="space-y-10">
        <PageHeader
          title="Price & commission"
          description="Suggested pricing for each tour type, and the platform's cut of every booking."
        />
        <PricingSection />
        <CommissionSection />
      </div>
    </RequirePermission>
  );
}

/* ─── Pricing ─────────────────────────────────────────────────────────── */

function PricingSection() {
  const { data: bounds, isLoading, isError, refetch } = usePriceBounds();
  const { set } = usePriceBoundActions();
  const toast = useToast();

  const [editing, setEditing] = useState<PriceBoundDto | null>(null);
  const [draft, setDraft] = useState({ h1: '', h2: '' });

  function openEdit(row: PriceBoundDto) {
    setEditing(row);
    setDraft({ h1: toDollars(row.suggested1hCents), h2: toDollars(row.suggested2hCents) });
  }

  const nums = { h1: toCents(draft.h1), h2: toCents(draft.h2) };
  const valid = Object.values(nums).every((n) => Number.isFinite(n) && n >= 0);

  async function save() {
    if (!editing || !valid) return;
    try {
      // min/max are NOT NULL and still cap what a guide may charge, but they are no longer
      // edited here. Carry the stored values through, widening them only as far as needed
      // to contain the new suggested prices — the server rejects a suggested price that
      // falls outside the range, and that range is no longer visible to explain the error.
      const minCents = Math.min(editing.minCents, nums.h1, nums.h2);
      const maxCents = Math.max(editing.maxCents, nums.h1, nums.h2);

      await set.mutateAsync({
        serviceType: editing.serviceType,
        minCents,
        maxCents,
        suggested1hCents: nums.h1,
        suggested2hCents: nums.h2,
      });
      toast.success('Pricing updated', `${SERVICE_LABEL[editing.serviceType]} saved.`);
      setEditing(null);
    } catch (e) {
      toast.error('Could not update pricing', (e as Error).message);
    }
  }

  const columns: Column<PriceBoundDto>[] = [
    {
      key: 'service',
      header: 'Service type',
      cell: (r) => <span className="font-semibold text-ink-900">{SERVICE_LABEL[r.serviceType]}</span>,
    },
    {
      key: 'h1',
      header: 'Suggested 1 hr',
      align: 'right',
      cell: (r) => <span className="font-semibold text-ink-900">{formatPrice(r.suggested1hCents)}</span>,
    },
    {
      key: 'h2',
      header: 'Suggested 2 hr',
      align: 'right',
      cell: (r) => <span className="font-semibold text-ink-900">{formatPrice(r.suggested2hCents)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (r) => (
        <Can perm="commission.set">
          <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
            <Pencil size={14} /> Edit
          </Button>
        </Can>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
          <Tag size={17} />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-ink-900">Tour pricing</h2>
          <p className="text-sm text-ink-500">
            Suggested prices shown to guides, and the range they may charge within.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={bounds ?? []}
        rowKey={(r) => r.serviceType}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        empty={{ title: 'No pricing configured' }}
      />

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${SERVICE_LABEL[editing.serviceType].toLowerCase()} pricing` : ''}
        description="Applies to new listings and any guide editing their price."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={!valid || set.isPending} onClick={save}>
              Save changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Suggested 1 hr ($)" htmlFor="p-h1" required>
              <Input
                id="p-h1"
                type="number"
                inputMode="decimal"
                min={0}
                step={5}
                value={draft.h1}
                onChange={(e) => setDraft((d) => ({ ...d, h1: e.target.value }))}
              />
            </Field>
            <Field label="Suggested 2 hr ($)" htmlFor="p-h2" required>
              <Input
                id="p-h2"
                type="number"
                inputMode="decimal"
                min={0}
                step={5}
                value={draft.h2}
                onChange={(e) => setDraft((d) => ({ ...d, h2: e.target.value }))}
              />
            </Field>
          </div>

          {!valid && (
            <p className="text-sm text-red-600">Enter a whole-dollar amount in both fields.</p>
          )}
        </div>
      </Modal>
    </section>
  );
}

/* ─── Commission ──────────────────────────────────────────────────────── */

function CommissionSection() {
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
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
            <Percent size={17} />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">Commission</h2>
            <p className="text-sm text-ink-500">The global rate the platform keeps on every booking.</p>
          </div>
        </div>
        <Can perm="commission.set">
          <Button variant="primary" onClick={openEdit} disabled={loading}>
            <Pencil size={15} /> Edit rate
          </Button>
        </Can>
      </div>

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
    </section>
  );
}
