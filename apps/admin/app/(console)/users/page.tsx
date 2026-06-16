'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  Eye,
  KeyRound,
  PauseCircle,
  Ban,
  PlayCircle,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dropdown, type MenuAction } from '@/components/ui/dropdown';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/modal';
import { RequirePermission } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import { useUsers, useUserActions } from '@/lib/queries';
import type { User, UserStatus } from '@/lib/data';
import { formatDate, humanize } from '@/lib/utils';

const ROLE_TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'BUYER', label: 'Buyers' },
  { value: 'SELLER', label: 'Sellers' },
];

export default function UsersPage() {
  const { data: rows = [], isLoading: loading } = useUsers();
  const { setStatus } = useUserActions();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');
  const [active, setActive] = useState<User | null>(null);

  const toast = useToast();
  const confirm = useConfirm();

  const counts = useMemo(
    () => ({
      ALL: rows.length,
      BUYER: rows.filter((u) => u.role === 'BUYER').length,
      SELLER: rows.filter((u) => u.role === 'SELLER').length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((u) => {
      if (role !== 'ALL' && u.role !== role) return false;
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [rows, query, role, statusFilter]);

  async function applyStatus(u: User, status: UserStatus, label: string) {
    try {
      await setStatus.mutateAsync({ id: u.id, status });
      setActive((prev) => (prev && prev.id === u.id ? { ...prev, status } : prev));
      toast.success(label, `${u.name} is now ${humanize(status).toLowerCase()}.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function suspend(u: User) {
    const { confirmed } = await confirm({
      title: `Suspend ${u.name}?`,
      description: 'Suspended users cannot book or host until reactivated.',
      confirmLabel: 'Suspend user',
      reason: { label: 'Reason for suspension', placeholder: 'Shared in the audit log…', required: true },
    });
    if (confirmed) applyStatus(u, 'SUSPENDED', 'User suspended');
  }

  async function ban(u: User) {
    const { confirmed } = await confirm({
      title: `Ban ${u.name}?`,
      description: 'Banning permanently revokes access to the platform. This is a serious action.',
      confirmLabel: 'Ban user',
      tone: 'danger',
      reason: { label: 'Reason for ban', placeholder: 'Shared in the audit log…', required: true },
    });
    if (confirmed) applyStatus(u, 'BANNED', 'User banned');
  }

  async function reactivate(u: User) {
    const { confirmed } = await confirm({
      title: `Reactivate ${u.name}?`,
      description: 'Restores full access to book and host.',
      confirmLabel: 'Reactivate',
    });
    if (confirmed) applyStatus(u, 'ACTIVE', 'User reactivated');
  }

  async function resetPassword(u: User) {
    const { confirmed } = await confirm({
      title: `Send password reset to ${u.name}?`,
      description: `A reset link will be emailed to ${u.email}.`,
      confirmLabel: 'Send reset link',
    });
    if (!confirmed) return;
    // Wire to @ucpt/sdk: admin.users.sendPasswordReset({ id })
    toast.info('Reset link sent', `A password reset link was emailed to ${u.email}.`);
  }

  function statusActions(u: User): (MenuAction | 'separator')[] {
    if (u.status === 'ACTIVE')
      return [
        { label: 'Suspend', icon: <PauseCircle size={15} />, onClick: () => suspend(u) },
        { label: 'Ban', icon: <Ban size={15} />, tone: 'danger', onClick: () => ban(u) },
      ];
    if (u.status === 'SUSPENDED')
      return [
        { label: 'Reactivate', icon: <PlayCircle size={15} />, onClick: () => reactivate(u) },
        { label: 'Ban', icon: <Ban size={15} />, tone: 'danger', onClick: () => ban(u) },
      ];
    return [{ label: 'Reactivate', icon: <PlayCircle size={15} />, onClick: () => reactivate(u) }];
  }

  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'User',
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} src={u.avatar} size={38} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-semibold text-ink-900">{u.name}</span>
              {!u.emailVerified && (
                <Badge variant="warning" className="shrink-0">Unverified</Badge>
              )}
            </div>
            <p className="truncate text-xs text-ink-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (u) => <Badge variant={u.role === 'SELLER' ? 'maroon' : 'neutral'}>{humanize(u.role)}</Badge>,
    },
    { key: 'school', header: 'School', hideOnMobile: true, cell: (u) => <span className="text-ink-600">{u.school ?? '—'}</span> },
    { key: 'bookings', header: 'Bookings', align: 'right', hideOnMobile: true, cell: (u) => <span className="font-semibold text-ink-800">{u.bookings}</span> },
    { key: 'joined', header: 'Joined', hideOnMobile: true, cell: (u) => <span className="whitespace-nowrap text-ink-600">{formatDate(u.joinedAt)}</span> },
    { key: 'status', header: 'Status', cell: (u) => <StatusBadge status={u.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (u) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Dropdown
            trigger={
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-800">
                <MoreHorizontal size={18} />
              </span>
            }
            items={[
              { label: 'View profile', icon: <Eye size={15} />, onClick: () => setActive(u) },
              { label: 'Reset password', icon: <KeyRound size={15} />, onClick: () => resetPassword(u) },
              'separator',
              ...statusActions(u),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <RequirePermission anyOf={['users.manage']}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Operations"
          title="Users"
          description="Buyers and seller-guides across the platform — review profiles and manage account status."
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            tabs={ROLE_TABS.map((t) => ({ ...t, count: counts[t.value as keyof typeof counts] }))}
            value={role}
            onChange={setRole}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | UserStatus)}
              aria-label="Filter by status"
              className="sm:w-40"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
            </Select>
            <SearchInput value={query} onChange={setQuery} placeholder="Search name or email…" className="sm:w-64" />
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(u) => u.id}
          loading={loading}
          onRowClick={(u) => setActive(u)}
          empty={{
            title: 'No users found',
            description:
              query || role !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try adjusting your search or filters.'
                : 'Users will appear here as they sign up.',
          }}
          footer={
            !loading ? (
              <span>
                Showing <span className="font-semibold text-ink-800">{filtered.length}</span> of {rows.length} users
              </span>
            ) : undefined
          }
        />
      </div>

      <UserDetail
        user={active}
        onClose={() => setActive(null)}
        actions={active ? statusActions(active) : []}
        onResetPassword={resetPassword}
      />
    </RequirePermission>
  );
}

function UserDetail({
  user,
  onClose,
  actions,
  onResetPassword,
}: {
  user: User | null;
  onClose: () => void;
  actions: (MenuAction | 'separator')[];
  onResetPassword: (u: User) => void;
}) {
  if (!user) return null;
  const u = user;
  const menuActions = actions.filter((a): a is MenuAction => a !== 'separator');

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      size="lg"
      title="User profile"
      footer={
        <div className="flex w-full flex-wrap items-center justify-end gap-2.5">
          <Button variant="outline" size="sm" onClick={() => onResetPassword(u)}>
            <KeyRound size={15} /> Reset password
          </Button>
          {menuActions.map((a) => (
            <Button
              key={a.label}
              variant={a.tone === 'danger' ? 'danger' : a.label === 'Reactivate' ? 'primary' : 'outline'}
              size="sm"
              onClick={a.onClick}
            >
              {a.icon}
              {a.label}
            </Button>
          ))}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar name={u.name} src={u.avatar} size={64} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-lg font-semibold text-ink-900">{u.name}</h3>
              <StatusBadge status={u.status} />
            </div>
            <p className="truncate text-sm text-ink-500">{u.email}</p>
          </div>
        </div>

        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Detail label="Role" value={<Badge variant={u.role === 'SELLER' ? 'maroon' : 'neutral'}>{humanize(u.role)}</Badge>} />
          <Detail
            label="School"
            value={
              <span className="inline-flex items-center gap-1.5 text-sm text-ink-700">
                {u.school ? <GraduationCap size={15} className="text-ink-400" /> : null}
                {u.school ?? '—'}
              </span>
            }
          />
          <Detail label="Joined" value={<span className="text-sm text-ink-700">{formatDate(u.joinedAt)}</span>} />
          <Detail label="Bookings" value={<span className="text-sm font-semibold text-ink-900">{u.bookings}</span>} />
          <Detail
            label="Email verification"
            value={
              u.emailVerified ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                  <CheckCircle2 size={15} /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-warn">
                  <AlertTriangle size={15} /> Unverified
                </span>
              )
            }
          />
        </dl>
      </div>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-2xs font-semibold uppercase tracking-wider text-ink-500">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
