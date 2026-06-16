'use client';

import { useMemo, useState } from 'react';
import { UserPlus, ShieldCheck, Ban, Check, Download, MoreHorizontal, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Avatar } from '@/components/ui/avatar';
import { Tabs } from '@/components/ui/tabs';
import { DataTable, type Column } from '@/components/ui/table';
import { Dropdown } from '@/components/ui/dropdown';
import { Modal } from '@/components/ui/modal';
import { Input, Select, Field } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import { useAdminAccounts, useAdminActions, useAuditLogs } from '@/lib/queries';
import type { AdminAccount, AuditLog } from '@/lib/data';
import { ROLES, ROLE_LABELS, ROLE_PERMISSIONS, type Role, type Permission } from '@/lib/rbac';
import { timeAgo, formatDateTime, downloadCsv, toCsv } from '@/lib/utils';

const TABS = [
  { value: 'ADMINS', label: 'Admins' },
  { value: 'PERMISSIONS', label: 'Permissions' },
  { value: 'AUDIT', label: 'Audit log' },
];

const ALL_ROLES: Role[] = ['SUPER_ADMIN', 'MANAGER', 'SUPPORT'];

/** Union of every permission referenced in the role→permission map, in declaration order. */
const ALL_PERMISSIONS: Permission[] = (() => {
  const seen = new Set<Permission>();
  for (const role of ALL_ROLES) for (const p of ROLE_PERMISSIONS[role]) seen.add(p);
  return [...seen];
})();

export default function RolesPage() {
  const [tab, setTab] = useState('ADMINS');
  const { data: admins = [], isLoading: loadingAdmins } = useAdminAccounts();
  const { data: auditLogs = [], isLoading: loadingAudit } = useAuditLogs();
  const { create: createAdmin, update: updateAdmin } = useAdminActions();
  const loading = loadingAdmins || loadingAudit;

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invName, setInvName] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invPassword, setInvPassword] = useState('');
  const [invRole, setInvRole] = useState<Role>('SUPPORT');

  // Change-role modal
  const [roleTarget, setRoleTarget] = useState<AdminAccount | null>(null);
  const [nextRole, setNextRole] = useState<Role>('SUPPORT');

  const toast = useToast();
  const confirm = useConfirm();

  const counts = useMemo(
    () => ({ ADMINS: admins.length, AUDIT: auditLogs.length }),
    [admins.length, auditLogs.length],
  );

  // ── Admin mutations ──────────────────────────────────────────────
  const sendInvite = async () => {
    if (!invName.trim() || !invEmail.trim() || !invPassword.trim()) {
      toast.error('Name, email, and a temporary password are required.');
      return;
    }
    try {
      await createAdmin.mutateAsync({
        name: invName.trim(),
        email: invEmail.trim().toLowerCase(),
        password: invPassword,
        adminRoleName: invRole,
      });
      setInviteOpen(false);
      setInvName('');
      setInvEmail('');
      setInvPassword('');
      setInvRole('SUPPORT');
      toast.success('Admin created', `${invEmail.trim()} can sign in as ${ROLE_LABELS[invRole]}.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const openChangeRole = (a: AdminAccount) => {
    setRoleTarget(a);
    setNextRole(a.role);
  };

  const applyRoleChange = async () => {
    if (!roleTarget) return;
    if (nextRole === roleTarget.role) {
      setRoleTarget(null);
      return;
    }
    const { confirmed } = await confirm({
      title: 'Change this admin’s role?',
      description: `${roleTarget.name} will move from ${ROLE_LABELS[roleTarget.role]} to ${ROLE_LABELS[nextRole]}. Their permissions change immediately.`,
      confirmLabel: 'Change role',
    });
    if (!confirmed) return;
    try {
      await updateAdmin.mutateAsync({ id: roleTarget.id, data: { adminRoleName: nextRole } });
      toast.success('Role updated', `${roleTarget.name} is now ${ROLE_LABELS[nextRole]}.`);
      setRoleTarget(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const toggleDisabled = async (a: AdminAccount) => {
    const disabling = a.status !== 'DISABLED';
    const { confirmed } = await confirm({
      title: disabling ? 'Disable this admin?' : 'Re-enable this admin?',
      description: disabling
        ? `${a.name} will lose console access immediately. Their account and audit history are retained.`
        : `${a.name} will regain console access with their existing role.`,
      confirmLabel: disabling ? 'Disable' : 'Enable',
      tone: disabling ? 'danger' : 'default',
    });
    if (!confirmed) return;
    try {
      await updateAdmin.mutateAsync({ id: a.id, data: { status: disabling ? 'DISABLED' : 'ACTIVE' } });
      toast.success(disabling ? 'Admin disabled' : 'Admin enabled');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const exportAudit = () => {
    downloadCsv('audit-log.csv', toCsv(auditLogs as unknown as Record<string, unknown>[]));
    toast.success('Audit log exported');
  };

  // ── Columns ──────────────────────────────────────────────────────
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
    { key: 'role', header: 'Role', cell: (a) => <Badge variant="maroon">{ROLE_LABELS[a.role]}</Badge> },
    {
      key: '2fa',
      header: '2FA',
      cell: (a) =>
        a.twoFactor ? <Badge variant="success">On</Badge> : <Badge variant="warning">Off</Badge>,
    },
    { key: 'status', header: 'Status', cell: (a) => <StatusBadge status={a.status} /> },
    {
      key: 'lastActive',
      header: 'Last active',
      hideOnMobile: true,
      cell: (a) => <span className="text-ink-500">{timeAgo(a.lastActiveAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (a) => (
        <Can perm="admins.manage">
          <Dropdown
            trigger={
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-800">
                <MoreHorizontal size={18} />
              </span>
            }
            items={[
              { label: 'Change role', icon: <ShieldCheck size={15} />, onClick: () => openChangeRole(a) },
              {
                label: a.status === 'DISABLED' ? 'Enable' : 'Disable',
                icon: a.status === 'DISABLED' ? <ShieldCheck size={15} /> : <Ban size={15} />,
                tone: a.status === 'DISABLED' ? 'default' : 'danger',
                onClick: () => toggleDisabled(a),
              },
            ]}
          />
        </Can>
      ),
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
          title="Roles & Audit"
          description="Manage admin accounts, review the role→permission matrix, and inspect the immutable audit trail."
          actions={
            tab === 'ADMINS' ? (
              <Can perm="admins.manage">
                <Button variant="primary" onClick={() => setInviteOpen(true)}>
                  <UserPlus size={16} /> Invite admin
                </Button>
              </Can>
            ) : tab === 'AUDIT' ? (
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
            count: t.value === 'ADMINS' ? counts.ADMINS : t.value === 'AUDIT' ? counts.AUDIT : undefined,
          }))}
          value={tab}
          onChange={setTab}
        />

        {/* Admins */}
        {tab === 'ADMINS' && (
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl border border-info/20 bg-info/5 px-4 py-2.5 text-sm text-ink-700">
                <ShieldAlert size={16} className="mt-0.5 shrink-0 text-info" />
                Only a Super Admin can invite, disable, or re-role admin accounts.
              </div>
              {loading ? (
                <TableSkeleton cols={6} />
              ) : (
                <DataTable
                  columns={adminColumns}
                  rows={admins}
                  rowKey={(a) => a.id}
                  empty={{ title: 'No admins', description: 'Invite your first administrator.' }}
                />
              )}
            </CardBody>
          </Card>
        )}

        {/* Permissions matrix */}
        {tab === 'PERMISSIONS' && (
          <Card>
            <CardBody className="space-y-4">
              {loading ? (
                <TableSkeleton cols={4} />
              ) : (
                <div className="scroll-branded overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-ink-200/60 bg-ink-50/50">
                        <th className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-wider text-ink-500">
                          Permission
                        </th>
                        {ALL_ROLES.map((r) => (
                          <th key={r} className="px-4 py-3 text-center text-2xs font-semibold uppercase tracking-wider text-ink-500">
                            {ROLE_LABELS[r]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-200/60">
                      {ALL_PERMISSIONS.map((perm) => (
                        <tr key={perm}>
                          <td className="px-4 py-3 font-mono text-2xs text-ink-700">{perm}</td>
                          {ALL_ROLES.map((r) => (
                            <td key={r} className="px-4 py-3 text-center">
                              {ROLE_PERMISSIONS[r].includes(perm) ? (
                                <Check size={16} className="mx-auto text-maroon-800" />
                              ) : (
                                <span className="text-ink-300">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-xs text-ink-500">
                Permissions are key-based and re-checked server-side on every request — this matrix is read-only
                and reflects the current role mappings.
              </p>
            </CardBody>
          </Card>
        )}

        {/* Audit log */}
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

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        size="md"
        title="Invite admin"
        description="Creates an admin account with a temporary password. Share the credentials securely."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={createAdmin.isPending} onClick={sendInvite}>
              <UserPlus size={14} /> Create admin
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" htmlFor="inv-name" required>
            <Input id="inv-name" value={invName} onChange={(e) => setInvName(e.target.value)} placeholder="Jordan Avery" />
          </Field>
          <Field label="Email" htmlFor="inv-email" required>
            <Input
              id="inv-email"
              type="email"
              value={invEmail}
              onChange={(e) => setInvEmail(e.target.value)}
              placeholder="jordan.a@tour.com"
            />
          </Field>
          <Field
            label="Temporary password"
            htmlFor="inv-password"
            hint="Share this securely — the admin should change it after first sign-in."
            required
          >
            <Input
              id="inv-password"
              type="text"
              value={invPassword}
              onChange={(e) => setInvPassword(e.target.value)}
              placeholder="Temp pass they'll reset"
              autoComplete="off"
            />
          </Field>
          <Field label="Role" htmlFor="inv-role" hint={ROLES.find((r) => r.value === invRole)?.blurb}>
            <Select id="inv-role" value={invRole} onChange={(e) => setInvRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>

      {/* Change-role modal */}
      <Modal
        open={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        size="md"
        title="Change role"
        description={roleTarget ? `Update the role for ${roleTarget.name}.` : undefined}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setRoleTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={applyRoleChange}>
              Continue
            </Button>
          </>
        }
      >
        {roleTarget && (
          <Field label="Role" htmlFor="chg-role" hint={ROLES.find((r) => r.value === nextRole)?.blurb}>
            <Select id="chg-role" value={nextRole} onChange={(e) => setNextRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </Modal>
    </RequirePermission>
  );
}
