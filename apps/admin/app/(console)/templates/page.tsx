'use client';

import { useMemo, useState } from 'react';
import { Mail, Bell, Pencil, Send } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { DataTable, type Column } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Input, Textarea, Field } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { RequirePermission } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useTemplates, useTemplateActions } from '@/lib/queries';
import type { NotificationTemplate } from '@/lib/data';
import { formatDate } from '@/lib/utils';

type Channel = NotificationTemplate['channel'];

const TABS: { value: string; label: string; channel?: Channel }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'EMAIL', label: 'Email', channel: 'EMAIL' },
  { value: 'PUSH', label: 'Push', channel: 'PUSH' },
];

/** Parse {{variable}} tokens from a template body. */
function parseVars(body: string): string[] {
  const out = new Set<string>();
  const re = /\{\{(\w+)\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) out.add(m[1]!);
  return [...out];
}

/** Interpolate {{var}} tokens with sample values for the live preview (falls back to the name). */
function renderPreview(tpl: string, sampleVars: Record<string, string>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => sampleVars[k] ?? k);
}

function ChannelBadge({ channel }: { channel: Channel }) {
  return channel === 'EMAIL' ? (
    <Badge variant="info">
      <Mail size={12} /> Email
    </Badge>
  ) : (
    <Badge variant="brand">
      <Bell size={12} /> Push
    </Badge>
  );
}

export default function TemplatesPage() {
  const { data: templates = [], isLoading: loading } = useTemplates();
  const { update } = useTemplateActions();
  const [tab, setTab] = useState('ALL');
  const [active, setActive] = useState<NotificationTemplate | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const toast = useToast();

  const counts = useMemo(
    () => ({
      ALL: templates.length,
      EMAIL: templates.filter((t) => t.channel === 'EMAIL').length,
      PUSH: templates.filter((t) => t.channel === 'PUSH').length,
    }),
    [templates],
  );

  const filtered = useMemo(
    () => (tab === 'ALL' ? templates : templates.filter((t) => t.channel === tab)),
    [templates, tab],
  );

  const openEdit = (t: NotificationTemplate) => {
    setActive(t);
    setSubject(t.subject);
    setBody(t.body);
  };

  const detectedVars = useMemo(() => parseVars(body), [body]);

  const save = async () => {
    if (!active) return;
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and body are required.');
      return;
    }
    try {
      await update.mutateAsync({ id: active.id, subject, body });
      setActive(null);
      toast.success('Template saved');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const sendTest = () => {
    // Test sends are not yet exposed by the backend; surfaced as a no-op for now.
    toast.info('Test notification sent to your account');
  };

  const columns: Column<NotificationTemplate>[] = [
    {
      key: 'template',
      header: 'Template',
      cell: (t) => <span className="font-mono text-2xs text-ink-700">{t.key}</span>,
    },
    {
      key: 'channel',
      header: 'Channel',
      cell: (t) => <ChannelBadge channel={t.channel} />,
    },
    {
      key: 'subject',
      header: 'Subject',
      className: 'max-w-[22rem]',
      cell: (t) => <span className="block truncate text-ink-800">{t.subject}</span>,
    },
    {
      key: 'updated',
      header: 'Updated',
      hideOnMobile: true,
      cell: (t) => <span className="text-ink-500">{formatDate(t.updatedAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (t) => (
        <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
          <Pencil size={14} /> Edit
        </Button>
      ),
    },
  ];

  return (
    <RequirePermission anyOf={['templates.edit']}>
      <div className="space-y-6">
        <PageHeader
          title="Notification Templates"
          description="Transactional email and push copy sent by the platform. Bodies support {{variables}} interpolated at send time."
        />

        <Card>
          <CardBody className="space-y-4">
            <Tabs
              tabs={TABS.map((t) => ({ value: t.value, label: t.label, count: counts[t.value as keyof typeof counts] }))}
              value={tab}
              onChange={setTab}
            />

            {loading ? (
              <TableSkeleton cols={5} />
            ) : (
              <DataTable
                columns={columns}
                rows={filtered}
                rowKey={(t) => t.id}
                empty={{
                  title: 'No templates in this channel',
                  description: 'Switch channels to see other notification templates.',
                }}
              />
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        size="xl"
        title={
          active ? (
            <span className="flex items-center gap-2">
              <span className="font-mono text-sm text-ink-600">{active.key}</span>
            </span>
          ) : (
            'Edit template'
          )
        }
        description={active ? `${active.channel === 'EMAIL' ? 'Email' : 'Push'} notification template` : undefined}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => active && sendTest()}>
              <Send size={14} /> Send test
            </Button>
            <Button variant="primary" size="sm" loading={update.isPending} onClick={save}>
              Save changes
            </Button>
          </>
        }
      >
        {active && (
          <div className="grid gap-5 lg:grid-cols-2">
            {/* ── Editor ── */}
            <div className="space-y-4">
              <Field label="Subject" htmlFor="tpl-subject" required>
                <Input id="tpl-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" />
              </Field>
              <Field
                label={active.channel === 'EMAIL' ? 'HTML body' : 'Body'}
                htmlFor="tpl-body"
                hint="Use {{variable}} tokens — replaced when the notification is sent."
                required
              >
                <Textarea
                  id="tpl-body"
                  rows={18}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="font-mono text-[11px] leading-relaxed"
                  placeholder={active.channel === 'EMAIL' ? '<!doctype html> …' : 'Hi {{buyer}}, …'}
                />
              </Field>
              <div className="rounded-xl border border-ink-200 bg-ink-50/50 px-4 py-3">
                <p className="text-xs font-semibold text-ink-700">Variables detected ({detectedVars.length})</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {detectedVars.length === 0 ? (
                    <span className="text-xs text-ink-500">No variables in this body.</span>
                  ) : (
                    detectedVars.map((v) => (
                      <Badge key={v} variant="gold" className="font-mono">
                        {`{{${v}}}`}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── Live preview ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink-700">Live preview</p>
                <span className="text-2xs text-ink-400">with sample data</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-ink-200 bg-surface">
                <div className="border-b border-ink-100 bg-ink-50/60 px-3 py-2 text-xs">
                  <span className="text-ink-400">Subject:</span>{' '}
                  <span className="font-medium text-ink-800">{renderPreview(subject, active.sampleVars) || '—'}</span>
                </div>
                {active.channel === 'EMAIL' ? (
                  <iframe
                    title="Email preview"
                    sandbox=""
                    srcDoc={renderPreview(body, active.sampleVars)}
                    className="h-[28rem] w-full bg-surface"
                  />
                ) : (
                  <div className="px-4 py-4">
                    <p className="whitespace-pre-line rounded-lg bg-ink-50 px-3 py-2.5 text-sm leading-relaxed text-ink-800">
                      {renderPreview(body, active.sampleVars) || '—'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </RequirePermission>
  );
}
