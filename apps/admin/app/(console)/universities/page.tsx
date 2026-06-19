'use client';

import { useMemo, useState } from 'react';
import {
  Plus,
  GraduationCap,
  Star,
  Pencil,
  Power,
  PowerOff,
  Building2,
  CheckCircle2,
  Users,
  MoreHorizontal,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs } from '@/components/ui/tabs';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable, type Column } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { Input, Field } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dropdown, type MenuAction } from '@/components/ui/dropdown';
import { TableSkeleton, StatGridSkeleton } from '@/components/ui/skeleton';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import { type School } from '@/lib/data';
import { useSchools, useSchoolActions } from '@/lib/queries';
import { formatCompact } from '@/lib/utils';

type StatusFilter = 'all' | 'enabled' | 'disabled';

const EMPTY_FORM = {
  name: '',
  slug: '',
  location: '',
  state: '',
  enabled: true,
};

type FormState = typeof EMPTY_FORM;
type FormErrors = Partial<Record<keyof FormState, string>>;

/** "Stanford University" → "stanford-university" */
function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function UniversitiesPage() {
  const { data: rows = [], isLoading: loading } = useSchools();
  const { create, update } = useSchoolActions();

  const toast = useToast();
  const confirm = useConfirm();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const stats = useMemo(() => {
    const enabled = rows.filter((s) => s.enabled).length;
    const ambassadors = rows.reduce((sum, s) => sum + s.ambassadors, 0);
    return { total: rows.length, enabled, ambassadors };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((s) => {
      if (filter === 'enabled' && !s.enabled) return false;
      if (filter === 'disabled' && s.enabled) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q)
      );
    });
  }, [rows, query, filter]);

  const tabs = useMemo(
    () => [
      { value: 'all', label: 'All', count: rows.length },
      { value: 'enabled', label: 'Enabled', count: rows.filter((s) => s.enabled).length },
      { value: 'disabled', label: 'Disabled', count: rows.filter((s) => !s.enabled).length },
    ],
    [rows],
  );

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setSlugTouched(false);
    setModalOpen(true);
  }

  function openEdit(s: School) {
    setEditing(s);
    setForm({
      name: s.name,
      slug: s.slug,
      location: s.location,
      state: s.state,
      enabled: s.enabled,
    });
    setErrors({});
    setSlugTouched(true);
    setModalOpen(true);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function onNameChange(value: string) {
    setForm((f) => ({
      ...f,
      name: value,
      // Auto-suggest slug from name until the user edits it directly.
      slug: slugTouched ? f.slug : slugify(value),
    }));
    if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.slug.trim()) next.slug = 'Slug is required.';
    else if (!/^[a-z0-9-]+$/.test(form.slug)) next.slug = 'Use lowercase letters, numbers, and hyphens only.';
    else if (
      rows.some((s) => s.slug === form.slug.trim() && s.id !== editing?.id)
    )
      next.slug = 'That slug is already in use.';
    if (!form.location.trim()) next.location = 'Location is required.';
    if (!form.state.trim()) next.state = 'State is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      location: form.location.trim(),
      state: form.state.trim(),
      enabled: form.enabled,
    };

    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          data: {
            name: payload.name,
            location: payload.location,
            enabled: payload.enabled,
          },
        });
        toast.success('University updated', `${payload.name} has been saved.`);
      } else {
        await create.mutateAsync({
          name: payload.name,
          slug: payload.slug,
          location: payload.location,
          enabled: payload.enabled,
        });
        toast.success('University added', `${payload.name} is now in the marketplace.`);
      }
      setModalOpen(false);
    } catch (e) {
      toast.error('Save failed', e instanceof Error ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(s: School) {
    const disabling = s.enabled;
    const { confirmed } = await confirm({
      title: disabling ? `Disable ${s.name}?` : `Enable ${s.name}?`,
      description: disabling
        ? 'Disabling hides this university from the public site — its guides and listings will no longer be discoverable.'
        : 'Enabling makes this university discoverable on the public site again.',
      confirmLabel: disabling ? 'Disable' : 'Enable',
      tone: disabling ? 'danger' : 'default',
    });
    if (!confirmed) return;
    try {
      await update.mutateAsync({ id: s.id, data: { enabled: !s.enabled } });
      if (disabling) toast.warning('University disabled', `${s.name} is now hidden from the public site.`);
      else toast.success('University enabled', `${s.name} is live on the public site.`);
    } catch (e) {
      toast.error('Update failed', e instanceof Error ? e.message : undefined);
    }
  }

  const columns: Column<School>[] = [
    {
      key: 'name',
      header: 'University',
      cell: (s) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-maroon-gradient text-ivory shadow-soft">
            <GraduationCap size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink-900">{s.name}</p>
            <p className="truncate text-xs text-ink-500">/{s.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      hideOnMobile: true,
      cell: (s) => <span className="text-ink-700">{s.location}</span>,
    },
    {
      key: 'ambassadors',
      header: 'Ambassadors',
      align: 'right',
      hideOnMobile: true,
      cell: (s) => <span className="font-medium text-ink-800">{formatCompact(s.ambassadors)}</span>,
    },
    {
      key: 'bookings',
      header: 'Bookings',
      align: 'right',
      hideOnMobile: true,
      cell: (s) => <span className="font-medium text-ink-800">{formatCompact(s.bookings)}</span>,
    },
    {
      key: 'rating',
      header: 'Rating',
      hideOnMobile: true,
      cell: (s) =>
        s.rating > 0 ? (
          <span className="inline-flex items-center gap-1 font-medium text-ink-800">
            <Star size={14} className="fill-gold-500 text-gold-500" />
            {s.rating.toFixed(1)}
          </span>
        ) : (
          <span className="text-ink-400">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (s) => <StatusBadge status={s.enabled ? 'ACTIVE' : 'DISABLED'} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (s) => {
        const items: (MenuAction | 'separator')[] = [
          { label: 'Edit', icon: <Pencil size={15} />, onClick: () => openEdit(s) },
          'separator',
          s.enabled
            ? { label: 'Disable', icon: <PowerOff size={15} />, tone: 'danger', onClick: () => handleToggle(s) }
            : { label: 'Enable', icon: <Power size={15} />, onClick: () => handleToggle(s) },
        ];
        return (
          <Can
            perm="universities.manage"
            fallback={<StatusBadge status={s.enabled ? 'ACTIVE' : 'DISABLED'} size="sm" />}
          >
            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <Dropdown
                trigger={
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800">
                    <MoreHorizontal size={18} />
                  </span>
                }
                items={items}
              />
            </div>
          </Can>
        );
      },
    },
  ];

  return (
    <RequirePermission anyOf={['universities.manage']}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Marketplace"
          title="Universities"
          description="Manage the campuses available on the marketplace, their public listing pages, and visibility."
          actions={
            <Can perm="universities.manage">
              <Button variant="primary" onClick={openCreate}>
                <Plus size={16} /> Add university
              </Button>
            </Can>
          }
        />

        {loading ? (
          <StatGridSkeleton count={3} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Universities" value={formatCompact(stats.total)} icon={Building2} hint="on the marketplace" />
            <StatCard label="Enabled" value={formatCompact(stats.enabled)} icon={CheckCircle2} hint="visible to the public" />
            <StatCard label="Ambassadors" value={formatCompact(stats.ambassadors)} icon={Users} hint="across all campuses" />
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs tabs={tabs} value={filter} onChange={(v) => setFilter(v as StatusFilter)} />
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search universities…"
            className="sm:w-72"
          />
        </div>

        {loading ? (
          <TableSkeleton cols={6} />
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(s) => s.id}
            empty={{
              title: query || filter !== 'all' ? 'No universities match' : 'No universities yet',
              description:
                query || filter !== 'all'
                  ? 'Try clearing the search or switching filters.'
                  : 'Add your first university to start building the marketplace.',
              action: (
                <Can perm="universities.manage">
                  <Button variant="primary" size="sm" onClick={openCreate}>
                    <Plus size={15} /> Add university
                  </Button>
                </Can>
              ),
            }}
          />
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        size="lg"
        title={editing ? 'Edit university' : 'Add university'}
        description={
          editing
            ? `Update ${editing.name}'s public listing details.`
            : 'Create a new university listing for the marketplace.'
        }
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
              {editing ? 'Save changes' : 'Add university'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" htmlFor="uni-name" required error={errors.name}>
            <Input
              id="uni-name"
              value={form.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Stanford University"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Slug"
              htmlFor="uni-slug"
              required
              error={errors.slug}
              hint="Used in the public URL — /universities/{slug}"
            >
              <Input
                id="uni-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setField('slug', e.target.value);
                }}
                placeholder="stanford-university"
              />
            </Field>
            <Field label="State" htmlFor="uni-state" required error={errors.state}>
              <Input
                id="uni-state"
                value={form.state}
                onChange={(e) => setField('state', e.target.value)}
                placeholder="California"
              />
            </Field>
          </div>

          <Field label="Location" htmlFor="uni-location" required error={errors.location}>
            <Input
              id="uni-location"
              value={form.location}
              onChange={(e) => setField('location', e.target.value)}
              placeholder="Stanford, CA"
            />
          </Field>

          <div className="flex items-center justify-between rounded-xl border border-ink-200 bg-ink-50/50 px-4 py-3">
            <div className="min-w-0 pr-4">
              <p className="text-sm font-semibold text-ink-900">Enabled</p>
              <p className="text-xs text-ink-500">When off, this university is hidden from the public site.</p>
            </div>
            <Switch
              id="uni-enabled"
              checked={form.enabled}
              onChange={(v) => setField('enabled', v)}
              label="Enabled"
            />
          </div>
        </div>
      </Modal>
    </RequirePermission>
  );
}
