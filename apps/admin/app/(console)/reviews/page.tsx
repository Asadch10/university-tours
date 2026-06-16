'use client';

import { useMemo, useState } from 'react';
import { Star, EyeOff, Eye, MoreHorizontal, MessageSquareOff } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import { SearchInput } from '@/components/ui/search-input';
import { Tabs } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/states';
import { RequirePermission } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import { useReviews, useReviewActions } from '@/lib/queries';
import type { Review } from '@/lib/data';
import { cn, formatDate } from '@/lib/utils';

const TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'VISIBLE', label: 'Visible' },
  { value: 'HIDDEN', label: 'Hidden' },
];

export default function ReviewsPage() {
  const { data: rows = [], isLoading: loading } = useReviews();
  const { setHidden: setHiddenMutation } = useReviewActions();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('ALL');

  const toast = useToast();
  const confirm = useConfirm();

  const counts = useMemo(
    () => ({
      ALL: rows.length,
      VISIBLE: rows.filter((r) => !r.hidden).length,
      HIDDEN: rows.filter((r) => r.hidden).length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab === 'VISIBLE' && r.hidden) return false;
      if (tab === 'HIDDEN' && !r.hidden) return false;
      if (!q) return true;
      return (
        r.text.toLowerCase().includes(q) ||
        r.buyer.toLowerCase().includes(q) ||
        r.guide.toLowerCase().includes(q)
      );
    });
  }, [rows, query, tab]);

  const avg = useMemo(() => {
    if (rows.length === 0) return 0;
    return rows.reduce((s, r) => s + r.rating, 0) / rows.length;
  }, [rows]);

  async function setHidden(r: Review, hidden: boolean) {
    await setHiddenMutation.mutateAsync({ id: r.id, hidden });
  }

  async function hide(r: Review) {
    const { confirmed } = await confirm({
      title: 'Hide this review?',
      description: 'Hiding removes the review from public view on the guide and school pages. You can unhide it later.',
      confirmLabel: 'Hide review',
      tone: 'danger',
      reason: { label: 'Reason (optional)', placeholder: 'e.g. spam, contains contact details…', required: false },
    });
    if (!confirmed) return;
    try {
      await setHidden(r, true);
      toast.success('Review hidden', 'It is no longer visible to the public.');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function unhide(r: Review) {
    const { confirmed } = await confirm({
      title: 'Unhide this review?',
      description: 'The review will be visible to the public again.',
      confirmLabel: 'Unhide review',
    });
    if (!confirmed) return;
    try {
      await setHidden(r, false);
      toast.success('Review restored', 'It is now visible to the public.');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <RequirePermission anyOf={['reviews.moderate']}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Operations"
          title="Reviews"
          description="Moderate buyer reviews — hide content that violates policy and keep the marketplace trustworthy."
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs tabs={TABS.map((t) => ({ ...t, count: counts[t.value as keyof typeof counts] }))} value={tab} onChange={setTab} />
          <SearchInput value={query} onChange={setQuery} placeholder="Search text, buyer, guide…" className="lg:w-72" />
        </div>

        {!loading && rows.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-ink-600">
            <Stars rating={Math.round(avg)} />
            <span className="font-semibold text-ink-900">{avg.toFixed(1)}</span>
            <span className="text-ink-400">average across {rows.length} reviews</span>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MessageSquareOff}
            title="No reviews found"
            description={query || tab !== 'ALL' ? 'Try adjusting your search or filter.' : 'Reviews will appear here as buyers leave them.'}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((r) => (
              <ReviewCard key={r.id} review={r} onHide={hide} onUnhide={unhide} />
            ))}
          </div>
        )}
      </div>
    </RequirePermission>
  );
}

function ReviewCard({
  review: r,
  onHide,
  onUnhide,
}: {
  review: Review;
  onHide: (r: Review) => void;
  onUnhide: (r: Review) => void;
}) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border border-ink-200/70 bg-white p-5 shadow-soft transition-shadow hover:shadow-card',
        r.hidden && 'opacity-60',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <Stars rating={r.rating} />
        <div className="flex items-center gap-2">
          {r.hidden ? (
            <Badge variant="danger">Hidden</Badge>
          ) : (
            <Badge variant="success" dot>Visible</Badge>
          )}
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              trigger={
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-800">
                  <MoreHorizontal size={18} />
                </span>
              }
              items={
                r.hidden
                  ? [{ label: 'Unhide', icon: <Eye size={15} />, onClick: () => onUnhide(r) }]
                  : [{ label: 'Hide', icon: <EyeOff size={15} />, tone: 'danger', onClick: () => onHide(r) }]
              }
            />
          </div>
        </div>
      </div>

      <p className="flex-1 text-sm leading-relaxed text-ink-700">“{r.text}”</p>

      <div className="mt-4 space-y-1 border-t border-ink-200/60 pt-3 text-xs text-ink-500">
        <p>
          <span className="font-semibold text-ink-700">{r.buyer}</span>
          <span className="text-ink-400"> → </span>
          <span className="font-semibold text-ink-700">{r.guide}</span>
        </p>
        <p className="flex items-center justify-between">
          <span>{r.school}</span>
          <span className="text-ink-400">{formatDate(r.createdAt)}</span>
        </p>
      </div>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={16}
          className={i < rating ? 'fill-gold-500 text-gold-500' : 'text-ink-200'}
        />
      ))}
    </div>
  );
}
