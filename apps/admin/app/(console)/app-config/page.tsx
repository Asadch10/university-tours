'use client';

import { useEffect, useState } from 'react';
import { Plus, Send, AlertTriangle, Smartphone, Flag, Wrench, Megaphone } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Switch } from '@/components/ui/switch';
import { DataTable, type Column } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Input, Textarea, Select, Field } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import { useAppConfig, useAppConfigActions, useCampaigns, useCampaignActions } from '@/lib/queries';
import type { AppConfig, PushCampaign } from '@/lib/data';
import { formatCompact, formatDateTime, humanize } from '@/lib/utils';

type Segment = PushCampaign['segment'];
const SEGMENTS: Segment[] = ['ALL', 'BUYERS', 'GUIDES'];

function SegmentBadge({ segment }: { segment: Segment }) {
  const variant = segment === 'ALL' ? 'maroon' : segment === 'BUYERS' ? 'info' : 'gold';
  return <Badge variant={variant}>{humanize(segment)}</Badge>;
}

export default function AppConfigPage() {
  const toast = useToast();
  const confirm = useConfirm();

  const { data: config, isLoading: loadingConfig } = useAppConfig();
  const { save } = useAppConfigActions();
  const { data: campaigns = [], isLoading: loadingCampaigns } = useCampaigns();
  const { create: createCampaign, send: sendCampaignAction } = useCampaignActions();
  const loading = loadingConfig || loadingCampaigns;

  // Editable form state, hydrated from the live config once it loads.
  const [flags, setFlags] = useState<AppConfig['featureFlags']>([]);
  const [minVersion, setMinVersion] = useState('');
  const [forceMsg, setForceMsg] = useState('');
  const [maintenance, setMaintenance] = useState(false);
  const [banner, setBanner] = useState('');
  const [savingRelease, setSavingRelease] = useState(false);
  const [savingMaint, setSavingMaint] = useState(false);

  // Composer
  const [composerOpen, setComposerOpen] = useState(false);
  const [cTitle, setCTitle] = useState('');
  const [cSegment, setCSegment] = useState<Segment>('ALL');
  const [cBody, setCBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!config) return;
    setFlags(config.featureFlags);
    setMinVersion(config.minSupportedVersion);
    setForceMsg(config.forceUpdateMessage);
    setMaintenance(config.maintenanceMode);
    setBanner(config.maintenanceBanner);
  }, [config]);

  const flagsToJson = (list: AppConfig['featureFlags']) =>
    Object.fromEntries(list.map((f) => [f.key, f.enabled]));

  const toggleFlag = async (key: string, next: boolean) => {
    const updated = flags.map((f) => (f.key === key ? { ...f, enabled: next } : f));
    setFlags(updated);
    try {
      await save.mutateAsync({ featureFlagsJson: flagsToJson(updated) });
      toast.success('Flag updated', 'Applies on the next app-config fetch — no release needed.');
    } catch (e) {
      setFlags(flags); // revert
      toast.error((e as Error).message);
    }
  };

  const saveRelease = async () => {
    if (!minVersion.trim()) {
      toast.error('Minimum supported version is required.');
      return;
    }
    setSavingRelease(true);
    try {
      await save.mutateAsync({ minSupportedVersion: minVersion.trim(), forceUpdateMessage: forceMsg });
      toast.success('Release control saved');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingRelease(false);
    }
  };

  const toggleMaintenance = async (next: boolean) => {
    if (next) {
      const { confirmed } = await confirm({
        title: 'Enable maintenance mode?',
        description: 'This gates the mobile and web apps — users will see the maintenance banner and most actions will be blocked.',
        confirmLabel: 'Enable maintenance',
        tone: 'danger',
      });
      if (!confirmed) return;
    }
    // Maintenance is on whenever a banner is set; clear it to turn the mode off.
    const nextBanner = next ? banner || 'We are performing scheduled maintenance. Please check back soon.' : '';
    try {
      await save.mutateAsync({ maintenanceBanner: next ? nextBanner : null });
      setMaintenance(next);
      setBanner(nextBanner);
      toast.success(next ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const saveBanner = async () => {
    setSavingMaint(true);
    try {
      await save.mutateAsync({ maintenanceBanner: maintenance ? banner : null });
      toast.success('Maintenance banner saved');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingMaint(false);
    }
  };

  const resetComposer = () => {
    setCTitle('');
    setCSegment('ALL');
    setCBody('');
  };

  const saveDraft = async () => {
    if (!cTitle.trim() || !cBody.trim()) {
      toast.error('Title and body are required.');
      return;
    }
    try {
      await createCampaign.mutateAsync({ segment: cSegment, title: cTitle.trim(), body: cBody.trim() });
      setComposerOpen(false);
      resetComposer();
      toast.success('Campaign saved as draft');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const sendNow = async () => {
    if (!cTitle.trim() || !cBody.trim()) {
      toast.error('Title and body are required.');
      return;
    }
    const { confirmed } = await confirm({
      title: 'Send this push campaign now?',
      description: `This fans out immediately to the ${humanize(cSegment)} segment. It cannot be unsent.`,
      confirmLabel: 'Send now',
    });
    if (!confirmed) return;
    setSending(true);
    try {
      const created = (await createCampaign.mutateAsync({ segment: cSegment, title: cTitle.trim(), body: cBody.trim() })) as { id: string };
      await sendCampaignAction.mutateAsync(created.id);
      setComposerOpen(false);
      resetComposer();
      toast.success('Campaign sent', `Fanning out to the ${humanize(cSegment)} segment.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const campaignColumns: Column<PushCampaign>[] = [
    {
      key: 'title',
      header: 'Campaign',
      cell: (c) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink-900">{c.title}</p>
          <p className="truncate text-xs text-ink-500">{c.body}</p>
        </div>
      ),
    },
    { key: 'segment', header: 'Segment', cell: (c) => <SegmentBadge segment={c.segment} /> },
    { key: 'status', header: 'Status', cell: (c) => <StatusBadge status={c.status} /> },
    {
      key: 'reach',
      header: 'Reach',
      align: 'right',
      cell: (c) => <span className="tabular-nums text-ink-700">{c.reach ? formatCompact(c.reach) : '—'}</span>,
    },
    {
      key: 'when',
      header: 'When',
      hideOnMobile: true,
      cell: (c) => (
        <span className="text-ink-500">
          {c.sentAt ? formatDateTime(c.sentAt) : c.scheduledAt ? formatDateTime(c.scheduledAt) : '—'}
        </span>
      ),
    },
  ];

  return (
    <RequirePermission anyOf={['appconfig.manage']}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Content & Platform"
          title="App Configuration"
          description="Remote configuration for the mobile and web clients — feature flags, release gating, maintenance mode, and push campaigns."
        />

        {/* Feature flags */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Flag size={16} className="text-maroon-800" /> Feature flags
              </span>
            }
            description="Toggle capabilities remotely — changes apply on the next app-config fetch, no release required."
          />
          <CardBody className="divide-y divide-ink-200/60">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              flags.map((f) => (
                <div key={f.key} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">{f.label}</p>
                    <p className="text-xs text-ink-500">{f.desc}</p>
                  </div>
                  <Switch checked={f.enabled} onChange={(v) => toggleFlag(f.key, v)} label={f.label} />
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Release control */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Smartphone size={16} className="text-maroon-800" /> Mobile release control
              </span>
            }
            description="Clients below the minimum supported version see a blocking force-update screen."
          />
          <CardBody className="space-y-4">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <Field label="Minimum supported version" htmlFor="min-version" hint="Semver, e.g. 1.4.0">
                  <Input
                    id="min-version"
                    value={minVersion}
                    onChange={(e) => setMinVersion(e.target.value)}
                    className="font-mono sm:max-w-xs"
                    placeholder="1.4.0"
                  />
                </Field>
                <Field label="Force-update message" htmlFor="force-msg">
                  <Textarea
                    id="force-msg"
                    rows={3}
                    value={forceMsg}
                    onChange={(e) => setForceMsg(e.target.value)}
                    placeholder="A new version is required…"
                  />
                </Field>
                <div className="flex justify-end">
                  <Button variant="primary" size="sm" loading={savingRelease} onClick={saveRelease}>
                    Save release control
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* Maintenance mode */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Wrench size={16} className="text-maroon-800" /> Maintenance mode
              </span>
            }
            description="When on, the apps are gated and show the maintenance banner."
          />
          <CardBody className="space-y-4">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-ink-200 bg-ink-50/50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">Maintenance mode</p>
                    <p className="text-xs text-ink-500">{maintenance ? 'The apps are currently gated.' : 'The apps are operating normally.'}</p>
                  </div>
                  <Switch checked={maintenance} onChange={toggleMaintenance} label="Maintenance mode" />
                </div>

                {maintenance && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-warn/25 bg-warn/10 px-4 py-3">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />
                    <div>
                      <p className="text-sm font-semibold text-ink-900">Preview — users will see:</p>
                      <p className="mt-0.5 text-sm text-ink-700">{banner || 'No banner message set.'}</p>
                    </div>
                  </div>
                )}

                <Field label="Maintenance banner" htmlFor="maint-banner">
                  <Textarea
                    id="maint-banner"
                    rows={2}
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                    placeholder="Scheduled maintenance…"
                  />
                </Field>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" loading={savingMaint} onClick={saveBanner}>
                    Save banner
                  </Button>
                </div>
              </>
            )}
          </CardBody>
        </Card>

        {/* Push campaigns */}
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Megaphone size={16} className="text-maroon-800" /> Push campaigns
              </span>
            }
            description="Broadcast push notifications to a user segment."
            action={
              <Can perm="campaigns.send">
                <Button variant="primary" size="sm" onClick={() => setComposerOpen(true)}>
                  <Plus size={15} /> New campaign
                </Button>
              </Can>
            }
          />
          <CardBody>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <DataTable
                columns={campaignColumns}
                rows={campaigns}
                rowKey={(c) => c.id}
                empty={{ title: 'No campaigns yet', description: 'Create a push campaign to reach your users.' }}
              />
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        size="lg"
        title="New push campaign"
        description="Compose a notification and either save it as a draft or send it now."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setComposerOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" size="sm" onClick={saveDraft}>
              Save draft
            </Button>
            <Button variant="primary" size="sm" loading={sending} onClick={sendNow}>
              <Send size={14} /> Send now
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Title" htmlFor="camp-title" required>
            <Input
              id="camp-title"
              value={cTitle}
              onChange={(e) => setCTitle(e.target.value)}
              placeholder="Summer tour season is here"
            />
          </Field>
          <Field label="Segment" htmlFor="camp-segment" hint="Who receives this notification.">
            <Select id="camp-segment" value={cSegment} onChange={(e) => setCSegment(e.target.value as Segment)}>
              {SEGMENTS.map((s) => (
                <option key={s} value={s}>
                  {humanize(s)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Body" htmlFor="camp-body" required>
            <Textarea
              id="camp-body"
              rows={4}
              value={cBody}
              onChange={(e) => setCBody(e.target.value)}
              placeholder="Book a private campus tour before fall visits fill up."
            />
          </Field>
        </div>
      </Modal>
    </RequirePermission>
  );
}
