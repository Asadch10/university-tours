'use client';

import { useState } from 'react';
import { ShieldCheck, Download } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Tabs } from '@/components/ui/tabs';
import { DataTable, type Column } from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/skeleton';
import { RequirePermission } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useAdminAccounts, useAuditLogs } from '@/lib/queries';
import type { AdminAccount, AuditLog } from '@/lib/data';
import { timeAgo, formatDateTime, downloadCsv, toCsv } from '@/lib/utils';

const TABS = [
  { value: 'ADMINS', label: 'Admins' },
  { value: 'AUDIT', label: 'Audit log' },
];

export default function RolesPage() {
  const [tab, setTab] = useState('ADMINS');
  const { data: admins = [], isLoading: loadingAdmins } = useAdminAccounts();
  const { data: auditLogs = [], isLoading: loadingAudit } = useAuditLogs();
  const loading = loadingAdmins || loadingAudit;

  const toast = useToast();

  const exportAudit = () => {
    downloadCsv('audit-log.csv', toCsv(auditLogs as unknown as Record<string, unknown>[]));
    toast.success('Audit log exported');
  };

  const adminColumns: Column<AdminAccount>[] = [
    {
      key: 'admin',
      header: 'Admin',
      cell: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.name} src={a.avatar} size={36} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink-900">{a.name}</p>
            <p className="truncate text-xs text-ink-500">{a.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', cell: (a) => <StatusBadge status={a.status} /> },
    {
      key: 'lastActive',
      header: 'Last active',
      hideOnMobile: true,
      cell: (a) => <span className="text-ink-500">{timeAgo(a.lastActiveAt)}</span>,
    },
  ];

  const auditColumns: Column<AuditLog>[] = [
    { key: 'actor', header: 'Actor', cell: (l) => <span className="font-medium text-ink-900">{l.actor}</span> },
    { key: 'action', header: 'Action', cell: (l) => <Badge variant="neutral" className="font-mono">{l.action}</Badge> },
    {
      key: 'entity',
      header: 'Entity',
      className: 'max-w-[20rem]',
      cell: (l) => <span className="block truncate text-ink-700">{l.entity}</span>,
    },
    { key: 'ip', header: 'IP', hideOnMobile: true, cell: (l) => <span className="font-mono text-2xs text-ink-500">{l.ip}</span> },
    { key: 'when', header: 'When', hideOnMobile: true, cell: (l) => <span className="text-ink-500">{formatDateTime(l.createdAt)}</span> },
  ];

  return (
    <RequirePermission anyOf={['admins.manage', 'audit.view']}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Administration"
          title="Admin & Audit"
          description="View the admin account and inspect the immutable audit trail."
          actions={
            tab === 'AUDIT' ? (
              <Button variant="outline" onClick={exportAudit}>
                <Download size={16} /> Export CSV
              </Button>
            ) : null
          }
        />

        <Tabs
          tabs={TABS.map((t) => ({
            value: t.value,
            label: t.label,
            count: t.value === 'ADMINS' ? admins.length : t.value === 'AUDIT' ? auditLogs.length : undefined,
          }))}
          value={tab}
          onChange={setTab}
        />

        {tab === 'ADMINS' && (
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl border border-info/20 bg-info/5 px-4 py-2.5 text-sm text-ink-700">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-info" />
                Single-admin mode — all console actions are available to the signed-in admin.
              </div>
              {loading ? (
                <TableSkeleton cols={3} />
              ) : (
                <DataTable
                  columns={adminColumns}
                  rows={admins}
                  rowKey={(a) => a.id}
                  empty={{ title: 'No admins', description: 'No admin accounts found.' }}
                />
              )}
            </CardBody>
          </Card>
        )}

        {tab === 'AUDIT' && (
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl border border-ink-200 bg-ink-50/50 px-4 py-2.5 text-sm text-ink-600">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-ink-400" />
                The audit trail is immutable and append-only — entries cannot be edited or removed.
              </div>
              {loading ? (
                <TableSkeleton cols={5} />
              ) : (
                <DataTable
                  columns={auditColumns}
                  rows={auditLogs}
                  rowKey={(l) => l.id}
                  empty={{ title: 'No audit entries', description: 'Administrative actions will appear here.' }}
                />
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </RequirePermission>
  );
}
