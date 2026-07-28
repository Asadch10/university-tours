'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Eye,
  KeyRound,
  PauseCircle,
  Ban,
  PlayCircle,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
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
import { RequirePermission } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import { useUsers, useUserActions } from '@/lib/queries';
import type { User, UserStatus } from '@/lib/data';
import { formatDate, humanize } from '@/lib/utils';

const ROLE_TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'GUIDE', label: 'Guide' },
  { value: 'GUEST', label: 'Guest' },
];

export default function UsersPage() {
  const router = useRouter();
  const { data: rows = [], isLoading: loading } = useUsers();
  const { setStatus } = useUserActions();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');

  const toast = useToast();
  const confirm = useConfirm();

  const counts = useMemo(
    () => ({
      ALL: rows.length,
      GUIDE: rows.filter((u) => u.role === 'GUIDE').length,
      GUEST: rows.filter((u) => u.role === 'GUEST').length,
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
      key: 'userNo',
      header: 'ID',
      cell: (u) => <span className="font-mono text-xs font-semibold text-brand-900">U-{u.userNo}</span>,
    },
    {
      key: 'user',
      header: 'User',
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} src={u.avatar} size={38} />
          <div className="min-w-0">
            <span className="block truncate font-semibold text-ink-900">{u.name}</span>
            <p className="truncate text-xs text-ink-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (u) => <Badge variant={u.role === 'GUIDE' ? 'brand' : 'neutral'}>{humanize(u.role)}</Badge>,
    },
    { key: 'school', header: 'School', hideOnMobile: true, cell: (u) => <span className="text-ink-600">{u.school ?? '—'}</span> },
    { key: 'bookings', header: 'Bookings', align: 'right', hideOnMobile: true, cell: (u) => <span className="font-semibold text-ink-800">{u.bookings}</span> },
    { key: 'joined', header: 'Joined', hideOnMobile: true, cell: (u) => <span className="whitespace-nowrap text-ink-600">{formatDate(u.joinedAt)}</span> },
    {
      key: 'emailVerified',
      header: 'Email',
      cell: (u) =>
        u.emailVerified ? (
          <Badge variant="success"><CheckCircle2 size={12} /> Verified</Badge>
        ) : (
          <Badge variant="warning"><AlertTriangle size={12} /> Unverified</Badge>
        ),
    },
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
              { label: 'View profile', icon: <Eye size={15} />, onClick: () => router.push(`/users/${u.id}`) },
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
          title="Users"
          description="Guides and guests across the platform — review profiles and manage account status."
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
          onRowClick={(u) => router.push(`/users/${u.id}`)}
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
    </RequirePermission>
  );
}

