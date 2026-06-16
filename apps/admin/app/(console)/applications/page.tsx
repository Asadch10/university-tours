'use client';

import { useMemo, useState } from 'react';
import { FileText, GraduationCap, Lock, Mail, Bell } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTable, type Column } from '@/components/ui/table';
import { Tabs } from '@/components/ui/tabs';
import { SearchInput } from '@/components/ui/search-input';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/skeleton';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import { timeAgo } from '@/lib/utils';
import { useApplications, useApplicationActions } from '@/lib/queries';
import type { Application, ApplicationStatus } from '@/lib/data';

type Filter = 'ALL' | ApplicationStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CHANGES_REQUESTED', label: 'Changes requested' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function ApplicationsPage() {
  const { data: rows = [], isLoading: loading } = useApplications();
  const { approve, reject, requestChanges } = useApplicationActions();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Application | null>(null);

  const { success, info, error } = useToast();
  const confirm = useConfirm();

  const counts = useMemo(
    () =>
      FILTERS.reduce<Record<Filter, number>>(
        (acc, f) => {
          acc[f.value] = f.value === 'ALL' ? rows.length : rows.filter((r) => r.status === f.value).length;
          return acc;
        },
        { ALL: 0, PENDING: 0, CHANGES_REQUESTED: 0, APPROVED: 0, REJECTED: 0 },
      ),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== 'ALL' && r.status !== filter) return false;
      if (!q) return true;
      return (
        r.applicant.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.school.toLowerCase().includes(q)
      );
    });
  }, [rows, filter, query]);

  async function onApprove(app: Application) {
    try {
      await approve.mutateAsync(app.id);
      setActive(null);
      success('Application approved', `${app.applicant} can now create listings. They’ve been notified.`);
    } catch (e) {
      error((e as Error).message);
    }
  }

  async function onRequestChanges(app: Application) {
    const { confirmed, reason } = await confirm({
      title: 'Request changes',
      description: `Send ${app.applicant} a request to revise and resubmit their application.`,
      confirmLabel: 'Request changes',
      tone: 'default',
      reason: { label: 'What needs to change?', placeholder: 'e.g. Re-upload a clearer enrollment document.', required: true },
    });
    if (!confirmed) return;
    try {
      await requestChanges.mutateAsync({ id: app.id, reason: reason ?? '' });
      setActive(null);
      success('Changes requested', `${app.applicant} was notified by email and push.`);
    } catch (e) {
      error((e as Error).message);
    }
  }

  async function onReject(app: Application) {
    const { confirmed, reason } = await confirm({
      title: 'Reject application',
      description: `This permanently rejects ${app.applicant}’s application. They will be notified.`,
      confirmLabel: 'Reject application',
      tone: 'danger',
      reason: { label: 'Reason for rejection', placeholder: 'e.g. Could not verify current enrollment.', required: true },
    });
    if (!confirmed) return;
    try {
      await reject.mutateAsync({ id: app.id, reason: reason ?? '' });
      setActive(null);
      success('Application rejected', `${app.applicant} was notified by email and push.`);
    } catch (e) {
      error((e as Error).message);
    }
  }

  const columns: Column<Application>[] = [
    {
      key: 'applicant',
      header: 'Applicant',
      cell: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.applicant} src={a.avatar} size={38} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink-900">{a.applicant}</p>
            <p className="truncate text-xs text-ink-500">{a.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'school', header: 'School', hideOnMobile: true, cell: (a) => <span className="text-ink-700">{a.school}</span> },
    {
      key: 'major',
      header: 'Major · Grad year',
      hideOnMobile: true,
      cell: (a) => (
        <span className="text-ink-700">
          {a.major} · {a.gradYear}
        </span>
      ),
    },
    { key: 'submitted', header: 'Submitted', hideOnMobile: true, cell: (a) => <span className="text-ink-500">{timeAgo(a.submittedAt)}</span> },
    { key: 'status', header: 'Status', cell: (a) => <StatusBadge status={a.status} /> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (a) => (
        <Button variant="outline" size="sm" onClick={() => setActive(a)}>
          Review
        </Button>
      ),
    },
  ];

  return (
    <RequirePermission anyOf={['applications.decide']}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Marketplace"
          title="Applications"
          description="Review guide applications — verify enrollment, read questionnaire answers, and approve, request changes, or reject."
        />

        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Tabs
                value={filter}
                onChange={(v) => setFilter(v as Filter)}
                tabs={FILTERS.map((f) => ({ value: f.value, label: f.label, count: counts[f.value] }))}
              />
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search applicant, email, or school…"
                className="sm:w-72"
              />
            </div>

            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(a) => a.id}
              onRowClick={(a) => setActive(a)}
              empty={{
                title: query ? 'No matching applications' : 'No applications here',
                description: query
                  ? 'Try a different name, email, or school.'
                  : 'Applications with this status will appear here.',
              }}
            />
          </div>
        )}

        <ApplicationDetailModal
          app={active}
          onClose={() => setActive(null)}
          onApprove={onApprove}
          onRequestChanges={onRequestChanges}
          onReject={onReject}
          onViewDoc={() => info('Opening secure document…', 'Enrollment documents are encrypted and admin-only.')}
        />
      </div>
    </RequirePermission>
  );
}

function ApplicationDetailModal({
  app,
  onClose,
  onApprove,
  onRequestChanges,
  onReject,
  onViewDoc,
}: {
  app: Application | null;
  onClose: () => void;
  onApprove: (a: Application) => void;
  onRequestChanges: (a: Application) => void;
  onReject: (a: Application) => void;
  onViewDoc: () => void;
}) {
  const open = !!app;
  const decidable = app?.status === 'PENDING' || app?.status === 'CHANGES_REQUESTED';

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Guide application"
      footer={
        app ? (
          decidable ? (
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-1.5 text-2xs text-ink-500">
                <Mail size={13} /> <Bell size={13} /> Applicant is notified by email + push.
              </p>
              <Can perm="applications.decide">
                <div className="flex flex-wrap items-center justify-end gap-2.5">
                  <Button variant="danger-outline" size="sm" onClick={() => onReject(app)}>
                    Reject
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onRequestChanges(app)}>
                    Request changes
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => onApprove(app)}>
                    Approve
                  </Button>
                </div>
              </Can>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )
        ) : null
      }
    >
      {app && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar name={app.applicant} src={app.avatar} size={56} ring />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-semibold text-ink-900">{app.applicant}</h3>
                <StatusBadge status={app.status} />
              </div>
              <p className="mt-0.5 text-sm text-ink-600">{app.email}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
                <GraduationCap size={15} className="text-maroon-800" />
                {app.school} · {app.major} · Class of {app.gradYear}
              </p>
            </div>
          </div>

          {/* Prior decision reason */}
          {!decidable && app.reason && (
            <div className="rounded-xl border border-ink-200/70 bg-ink-50/60 p-3.5 text-sm">
              <p className="font-semibold text-ink-900">Decision note</p>
              <p className="mt-0.5 text-ink-600">{app.reason}</p>
            </div>
          )}

          {/* Enrollment document */}
          <div>
            <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-500">Enrollment document</p>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-200/70 bg-white p-3 shadow-soft">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-maroon-50 text-maroon-800">
                  <FileText size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{app.enrollmentDoc}</p>
                  <p className="flex items-center gap-1 text-2xs text-ink-500">
                    <Lock size={11} /> Encrypted · admin-only
                  </p>
                </div>
              </div>
              <Button variant="subtle" size="sm" onClick={onViewDoc}>
                View
              </Button>
            </div>
          </div>

          {/* Answers */}
          <div>
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-ink-500">Questionnaire answers</p>
            <div className="space-y-3.5">
              {app.answers.map((qa, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold text-ink-900">{qa.question}</p>
                  <p className="mt-0.5 text-sm text-ink-600">{qa.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
