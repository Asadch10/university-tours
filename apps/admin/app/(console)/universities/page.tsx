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
  X,
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
import { ImageUpload } from '@/components/ui/image-upload';
import { Switch } from '@/components/ui/switch';
import { Dropdown, type MenuAction } from '@/components/ui/dropdown';
import { TableSkeleton, StatGridSkeleton } from '@/components/ui/skeleton';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import { type School } from '@/lib/data';
import { useSchools, useSchoolActions } from '@/lib/queries';
import { formatCompact, mediaUrl } from '@/lib/utils';

type StatusFilter = 'all' | 'enabled' | 'disabled';

const EMPTY_FORM = {
  name: '',
  location: '',
  state: '',
  toursFrom: '', // dollars, as typed
  tags: [] as string[],
  image: null as string | null,
  enabled: true,
};

type FormState = typeof EMPTY_FORM;
type FormErrors = Partial<Record<keyof FormState, string>>;

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
  const [saving, setSaving] = useState(false);
  const [tagDraft, setTagDraft] = useState('');

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
    setTagDraft('');
    setModalOpen(true);
  }

  function openEdit(s: School) {
    setEditing(s);
    setForm({
      name: s.name,
      location: s.location,
      state: s.state,
      toursFrom: s.toursFromCents != null ? String(s.toursFromCents / 100) : '',
      tags: s.tags ?? [],
      image: s.image ?? null,
      enabled: s.enabled,
    });
    setErrors({});
    setTagDraft('');
    setModalOpen(true);
  }

  function addTag(raw: string) {
    const t = raw.trim();
    if (!t) return;
    setForm((f) => (f.tags.includes(t) ? f : { ...f, tags: [...f.tags, t] }));
    setTagDraft('');
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function onNameChange(value: string) {
    setForm((f) => ({ ...f, name: value }));
    if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.location.trim()) next.location = 'Location is required.';
    if (!form.state.trim()) next.state = 'State is required.';
    if (form.toursFrom.trim() && !(Number(form.toursFrom) >= 0))
      next.toursFrom = 'Enter a valid amount (or leave blank).';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const toursFromCents = form.toursFrom.trim() ? Math.round(Number(form.toursFrom) * 100) : null;
    const name = form.name.trim();
    const base = {
      name,
      location: form.location.trim(),
      state: form.state.trim(),
      tags: form.tags,
      toursFromCents,
      image: form.image,
      enabled: form.enabled,
    };

    try {
      if (editing) {
        // Slug stays stable on edit so the public URL doesn't change.
        await update.mutateAsync({ id: editing.id, data: base });
        toast.success('University updated', `${name} has been saved.`);
      } else {
        // Slug is derived from the name on the backend.
        await create.mutateAsync(base);
        toast.success('University added', `${name} is now in the marketplace.`);
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
      cell: (s) => {
        return (
          <div className="flex items-center gap-3">
            {s.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(s.image)}
                alt=""
                className="h-10 w-10 shrink-0 rounded-xl object-cover shadow-soft ring-1 ring-ink-200/70"
              />
            ) : (
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-ivory shadow-soft">
                <GraduationCap size={18} />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-900">{s.name}</p>
              <p className="truncate text-xs text-ink-500">/{s.slug}</p>
            </div>
          </div>
        );
      },
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
        size="xl"
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
        <div className="space-y-5">
          {/* Single campus photo — used as banner, card image, and logo */}
          <ImageUpload
            label="Campus photo"
            aspect="video"
            value={form.image}
            onChange={(url) => setField('image', url)}
          />

          <Field label="Name" htmlFor="uni-name" required error={errors.name}>
            <Input
              id="uni-name"
              value={form.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Stanford University"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Location" htmlFor="uni-location" required error={errors.location}>
              <Input
                id="uni-location"
                value={form.location}
                onChange={(e) => setField('location', e.target.value)}
                placeholder="Stanford, CA"
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

          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field
              label="Tours from"
              htmlFor="uni-tours-from"
              error={errors.toursFrom}
              hint="Starting tour price (USD)."
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-400">$</span>
                <Input
                  id="uni-tours-from"
                  type="number"
                  min={0}
                  step="1"
                  className="pl-7"
                  value={form.toursFrom}
                  onChange={(e) => setField('toursFrom', e.target.value)}
                  placeholder="65"
                />
              </div>
            </Field>

            <Field label="Popular programs" htmlFor="uni-tags" hint="Press Enter or comma to add.">
              <div className="min-h-[42px] rounded-xl border border-ink-200 bg-white px-2.5 py-2 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/15">
                {form.tags.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap gap-1.5">
                    {form.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          className="text-brand-400 hover:text-brand-700"
                          aria-label={`Remove ${t}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  id="uni-tags"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addTag(tagDraft);
                    } else if (e.key === 'Backspace' && !tagDraft && form.tags.length) {
                      removeTag(form.tags[form.tags.length - 1]!);
                    }
                  }}
                  onBlur={() => addTag(tagDraft)}
                  placeholder={form.tags.length ? 'Add another…' : 'Engineering, Business'}
                  className="w-full bg-transparent px-1 py-0.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
                />
              </div>
            </Field>
          </div>

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
