'use client';

import { useMemo, useState } from 'react';
import { Download, DollarSign, Percent, Wallet, Banknote } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { StatGridSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Tabs } from '@/components/ui/tabs';
import { DataTable, type Column } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Input, Select, Field } from '@/components/ui/input';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import type { LedgerEntry, GuideBalance, Payout } from '@/lib/data';
import {
  useTransactions,
  useGuideBalances,
  usePayouts,
  usePayoutActions,
} from '@/lib/queries';
import { formatPrice, formatDate, humanize, toCsv, downloadCsv } from '@/lib/utils';

type TabValue = 'ledger' | 'balances' | 'payouts';

const PAYOUT_METHODS: Payout['method'][] = ['BANK_TRANSFER', 'PAYPAL', 'CHECK'];

const ledgerTypeVariant: Record<LedgerEntry['type'], 'success' | 'info' | 'warning'> = {
  CAPTURE: 'success',
  PAYOUT: 'info',
  REFUND: 'warning',
};

type GuideBalanceRow = GuideBalance & { sellerId: string };

export default function TransactionsPage() {
  const [tab, setTab] = useState<TabValue>('ledger');

  const { data: ledgerData, isLoading: ledgerLoading } = useTransactions();
  const { data: balancesData, isLoading: balancesLoading } = useGuideBalances();
  const { data: payoutsData, isLoading: payoutsLoading } = usePayouts();
  const { record } = usePayoutActions();

  const ledger = ledgerData ?? [];
  const balances = balancesData ?? [];
  const payouts = payoutsData ?? [];
  const loading = ledgerLoading || balancesLoading || payoutsLoading;

  // Record-payout modal state
  const [payoutTarget, setPayoutTarget] = useState<GuideBalanceRow | null>(null);
  const [amountUsd, setAmountUsd] = useState('');
  const [method, setMethod] = useState<Payout['method']>('BANK_TRANSFER');
  const [reference, setReference] = useState('');

  const toast = useToast();
  const confirm = useConfirm();

  const stats = useMemo(
    () => ({
      gross: ledger.reduce((s, l) => s + l.grossCents, 0),
      commission: ledger.reduce((s, l) => s + l.commissionCents, 0),
      pending: balances.reduce((s, b) => s + b.balanceCents, 0),
      paidOut: payouts.reduce((s, p) => s + p.amountCents, 0),
    }),
    [ledger, balances, payouts],
  );

  // ─── CSV export of the active tab ───────────────────────────────
  function exportActive() {
    if (tab === 'ledger') {
      downloadCsv('ledger.csv', toCsv(ledger as unknown as Record<string, unknown>[]));
    } else if (tab === 'balances') {
      downloadCsv('guide-balances.csv', toCsv(balances as unknown as Record<string, unknown>[]));
    } else {
      downloadCsv('payouts.csv', toCsv(payouts as unknown as Record<string, unknown>[]));
    }
    toast.success('Export ready', 'Your CSV download has started.');
  }

  // ─── Record payout ──────────────────────────────────────────────
  function openPayout(guide: GuideBalanceRow) {
    setPayoutTarget(guide);
    setAmountUsd((guide.balanceCents / 100).toFixed(2));
    setMethod('BANK_TRANSFER');
    setReference('');
  }

  const amountCents = Math.round(parseFloat(amountUsd || '0') * 100);
  const amountValid =
    payoutTarget != null &&
    Number.isFinite(amountCents) &&
    amountCents > 0 &&
    amountCents <= payoutTarget.balanceCents;

  async function submitPayout() {
    if (!payoutTarget || !amountValid) return;
    const guide = payoutTarget;

    const { confirmed, reason } = await confirm({
      title: 'Record payout',
      description: `Record ${formatPrice(amountCents)} payout to ${guide.guide} via ${humanize(method)}?`,
      confirmLabel: 'Record payout',
      reason: { label: 'Note (optional)', placeholder: 'Internal note for the audit log…' },
    });
    if (!confirmed) return;

    try {
      await record.mutateAsync({
        sellerId: guide.sellerId,
        amountCents,
        method,
        reference: reference.trim() || undefined,
        note: reason || undefined,
      });
      setPayoutTarget(null);
      toast.success('Payout recorded', `${formatPrice(amountCents)} to ${guide.guide}.`);
    } catch (e) {
      toast.error('Payout failed', e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  // ─── Columns ────────────────────────────────────────────────────
  const ledgerCols: Column<LedgerEntry>[] = [
    {
      key: 'type',
      header: 'Type',
      cell: (r) => <Badge variant={ledgerTypeVariant[r.type]}>{humanize(r.type)}</Badge>,
    },
    {
      key: 'booking',
      header: 'Booking',
      cell: (r) => <span className="font-mono text-xs text-ink-600">{r.bookingId}</span>,
    },
    { key: 'guide', header: 'Guide', cell: (r) => <span className="text-ink-800">{r.guide}</span> },
    {
      key: 'gross',
      header: 'Gross',
      align: 'right',
      cell: (r) => formatPrice(r.grossCents),
    },
    {
      key: 'commission',
      header: 'Commission',
      align: 'right',
      cell: (r) => <span className="text-ink-600">{formatPrice(r.commissionCents)}</span>,
    },
    {
      key: 'net',
      header: 'Net',
      align: 'right',
      cell: (r) => <span className="font-semibold text-ink-900">{formatPrice(r.netCents)}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      hideOnMobile: true,
      cell: (r) => <span className="text-ink-500">{formatDate(r.createdAt)}</span>,
    },
  ];

  const balanceCols: Column<GuideBalanceRow>[] = [
    {
      key: 'guide',
      header: 'Guide',
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.guide} src={r.avatar} size={32} />
          <span className="font-medium text-ink-900">{r.guide}</span>
        </div>
      ),
    },
    {
      key: 'school',
      header: 'School',
      hideOnMobile: true,
      cell: (r) => <span className="text-ink-600">{r.school}</span>,
    },
    {
      key: 'completed',
      header: 'Completed net',
      align: 'right',
      cell: (r) => formatPrice(r.completedNetCents),
    },
    {
      key: 'paid',
      header: 'Paid out',
      align: 'right',
      hideOnMobile: true,
      cell: (r) => <span className="text-ink-600">{formatPrice(r.paidOutCents)}</span>,
    },
    {
      key: 'balance',
      header: 'Balance',
      align: 'right',
      cell: (r) => (
        <span className="font-semibold text-maroon-900">{formatPrice(r.balanceCents)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (r) => (
        <Can perm="payouts.record">
          <Button
            variant="outline"
            size="sm"
            disabled={r.balanceCents === 0}
            onClick={() => openPayout(r)}
          >
            Record payout
          </Button>
        </Can>
      ),
    },
  ];

  const payoutCols: Column<Payout>[] = [
    {
      key: 'id',
      header: 'Payout',
      cell: (r) => <span className="font-mono text-xs text-ink-600">{r.id}</span>,
    },
    { key: 'guide', header: 'Guide', cell: (r) => <span className="text-ink-800">{r.guide}</span> },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      cell: (r) => <span className="font-semibold text-ink-900">{formatPrice(r.amountCents)}</span>,
    },
    {
      key: 'method',
      header: 'Method',
      cell: (r) => <Badge variant="neutral">{humanize(r.method)}</Badge>,
    },
    {
      key: 'reference',
      header: 'Reference',
      hideOnMobile: true,
      cell: (r) => <span className="font-mono text-xs text-ink-600">{r.reference}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      cell: (r) => <span className="text-ink-500">{formatDate(r.createdAt)}</span>,
    },
  ];

  return (
    <RequirePermission anyOf={['transactions.view']}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Finance"
          title="Transactions & Payouts"
          description="Every captured payment, guide balance, and manual payout in one ledger."
          actions={
            <Button variant="outline" onClick={exportActive}>
              <Download size={16} /> Export CSV
            </Button>
          }
        />

        {loading ? (
          <StatGridSkeleton count={4} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Gross processed" value={formatPrice(stats.gross)} icon={DollarSign} hint="captured payments" />
            <StatCard label="Commission earned" value={formatPrice(stats.commission)} icon={Percent} hint="platform share" />
            <StatCard label="Pending payouts" value={formatPrice(stats.pending)} icon={Wallet} hint="owed to guides" />
            <StatCard label="Total paid out" value={formatPrice(stats.paidOut)} icon={Banknote} hint="all-time" />
          </div>
        )}

        <Tabs
          tabs={[
            { value: 'ledger', label: 'Ledger', count: ledger.length },
            { value: 'balances', label: 'Guide balances', count: balances.length },
            { value: 'payouts', label: 'Payouts', count: payouts.length },
          ]}
          value={tab}
          onChange={(v) => setTab(v as TabValue)}
        />

        {tab === 'ledger' && (
          <DataTable
            columns={ledgerCols}
            rows={ledger}
            rowKey={(r) => r.id}
            loading={loading}
            empty={{ title: 'No transactions yet', description: 'Captured payments will appear here.' }}
          />
        )}

        {tab === 'balances' && (
          <DataTable
            columns={balanceCols}
            rows={balances}
            rowKey={(r) => r.guide}
            loading={loading}
            empty={{ title: 'No guide balances', description: 'Balances accrue as bookings complete.' }}
          />
        )}

        {tab === 'payouts' && (
          <DataTable
            columns={payoutCols}
            rows={payouts}
            rowKey={(r) => r.id}
            loading={loading}
            empty={{ title: 'No payouts yet', description: 'Recorded payouts will appear here.' }}
          />
        )}
      </div>

      {/* Record payout modal */}
      <Modal
        open={!!payoutTarget}
        onClose={() => setPayoutTarget(null)}
        title="Record payout"
        description={
          payoutTarget
            ? `${payoutTarget.guide} · balance ${formatPrice(payoutTarget.balanceCents)}`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setPayoutTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={!amountValid} onClick={submitPayout}>
              Record payout
            </Button>
          </>
        }
      >
        {payoutTarget && (
          <div className="space-y-4">
            <Field
              label="Amount (USD)"
              htmlFor="payout-amount"
              error={
                amountUsd && !amountValid
                  ? `Enter an amount between $0.01 and ${formatPrice(payoutTarget.balanceCents)}.`
                  : undefined
              }
              hint={!amountUsd ? `Maximum ${formatPrice(payoutTarget.balanceCents)}.` : undefined}
              required
            >
              <Input
                id="payout-amount"
                type="number"
                inputMode="decimal"
                min={0.01}
                step={0.01}
                max={payoutTarget.balanceCents / 100}
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
              />
            </Field>

            <Field label="Method" htmlFor="payout-method" required>
              <Select
                id="payout-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as Payout['method'])}
              >
                {PAYOUT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {humanize(m)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Reference" htmlFor="payout-ref" hint="ACH ID, PayPal txn, or check number.">
              <Input
                id="payout-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. ACH-2026-0599"
              />
            </Field>
          </div>
        )}
      </Modal>
    </RequirePermission>
  );
}
