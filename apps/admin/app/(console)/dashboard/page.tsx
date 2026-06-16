'use client';

import Link from 'next/link';
import {
  DollarSign,
  Percent,
  CalendarCheck,
  Users,
  ClipboardCheck,
  Wallet,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { StatGridSkeleton, Skeleton } from '@/components/ui/skeleton';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { RevenueChart, BookingsBarChart } from '@/components/dashboard/charts';
import { useDashboard, useApplications, useGuideBalances } from '@/lib/queries';
import { formatPrice, formatCompact, timeAgo } from '@/lib/utils';

const EMPTY_STATS = {
  grossRevenueCents: 0,
  commissionCents: 0,
  bookingsTotal: 0,
  activeGuides: 0,
  pendingApplications: 0,
  pendingPayoutsCents: 0,
  revenueSeries: [] as { month: string; gross: number; commission: number }[],
  bookingsByStatus: [] as { status: string; count: number }[],
  topSchools: [] as { name: string; bookings: number }[],
};

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const { data: applications = [] } = useApplications();
  const { data: guideBalances = [] } = useGuideBalances();

  const loading = isLoading || !data;
  const s = data ?? EMPTY_STATS;
  const pendingApps = applications.filter((a) => a.status === 'PENDING');
  const pendingPayouts = guideBalances.filter((g) => g.balanceCents > 0);

  return (
    <RequirePermission anyOf={['dashboard.view']}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Overview"
          title="Dashboard"
          description="Platform health at a glance — revenue, bookings, and the queues that need attention."
        />

        {loading ? (
          <StatGridSkeleton count={4} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Gross revenue" value={formatPrice(s.grossRevenueCents)} icon={DollarSign} delta={{ value: '9.7%', positive: true }} hint="vs last month" />
            <StatCard label="Commission earned" value={formatPrice(s.commissionCents)} icon={Percent} delta={{ value: '9.7%', positive: true }} hint="25% global rate" />
            <StatCard label="Total bookings" value={formatCompact(s.bookingsTotal)} icon={CalendarCheck} delta={{ value: '4.2%', positive: true }} hint="all-time" />
            <StatCard label="Active guides" value={formatCompact(s.activeGuides)} icon={Users} delta={{ value: '1.1%', positive: true }} hint="verified" />
          </div>
        )}

        {/* Charts */}
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Revenue & commission"
              description="Gross booking value and platform commission, last 6 months"
              action={
                <span className="inline-flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-ink-600"><span className="h-2 w-2 rounded-full bg-maroon-800" /> Gross</span>
                  <span className="inline-flex items-center gap-1.5 text-ink-600"><span className="h-2 w-2 rounded-full bg-gold-500" /> Commission</span>
                </span>
              }
            />
            <CardBody>{loading ? <Skeleton className="h-[260px] w-full" /> : <RevenueChart data={s.revenueSeries} />}</CardBody>
          </Card>

          <Card>
            <CardHeader title="Bookings by status" description="Current distribution" />
            <CardBody>{loading ? <Skeleton className="h-[260px] w-full" /> : <BookingsBarChart data={s.bookingsByStatus} />}</CardBody>
          </Card>
        </div>

        {/* Queues + top schools */}
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Pending applications */}
          <Can perm="applications.decide" fallback={<TopSchools />}>
            <Card>
              <CardHeader
                title="Pending applications"
                description={`${pendingApps.length} awaiting review`}
                action={<Link href="/applications" className="text-sm font-semibold text-maroon-800 hover:underline">Review</Link>}
              />
              <CardBody className="space-y-3">
                {pendingApps.length === 0 ? (
                  <p className="py-6 text-center text-sm text-ink-500">All caught up — no applications pending.</p>
                ) : (
                  pendingApps.map((a) => (
                    <div key={a.id} className="flex items-center gap-3">
                      <Avatar name={a.applicant} src={a.avatar} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900">{a.applicant}</p>
                        <p className="truncate text-xs text-ink-500">{a.major} · {a.school}</p>
                      </div>
                      <span className="shrink-0 text-2xs text-ink-400">{timeAgo(a.submittedAt)}</span>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          </Can>

          {/* Pending payouts */}
          <Can perm="payouts.record" fallback={<TopSchools />}>
            <Card>
              <CardHeader
                title="Payouts due"
                description={`${formatPrice(s.pendingPayoutsCents)} across ${pendingPayouts.length} guides`}
                action={<Link href="/transactions" className="text-sm font-semibold text-maroon-800 hover:underline">Pay out</Link>}
              />
              <CardBody className="space-y-3">
                {pendingPayouts.map((g) => (
                  <div key={g.guide} className="flex items-center gap-3">
                    <Avatar name={g.guide} src={g.avatar} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{g.guide}</p>
                      <p className="truncate text-xs text-ink-500">{g.school}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-maroon-900">{formatPrice(g.balanceCents)}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          </Can>

          <TopSchools />
        </div>
      </div>
    </RequirePermission>
  );
}

function TopSchools() {
  const { data } = useDashboard();
  const topSchools = data?.topSchools ?? [];
  const max = Math.max(1, ...topSchools.map((s) => s.bookings));
  return (
    <Card>
      <CardHeader title="Top universities" description="By total bookings" action={<TrendingUp size={16} className="text-ink-400" />} />
      <CardBody className="space-y-3.5">
        {topSchools.map((s) => (
          <div key={s.name}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="truncate font-medium text-ink-800">{s.name}</span>
              <span className="shrink-0 font-semibold text-ink-900">{s.bookings}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-100">
              <div className="h-full rounded-full bg-gold-sheen" style={{ width: `${(s.bookings / max) * 100}%` }} />
            </div>
          </div>
        ))}
        <ButtonLink href="/universities" variant="outline" size="sm" className="mt-1 w-full">
          Manage universities <ArrowRight size={14} />
        </ButtonLink>
      </CardBody>
    </Card>
  );
}
