'use client';

import { useMemo, useState } from 'react';
import { Plus, Pencil, Eye, EyeOff, Trash2, MoreHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs } from '@/components/ui/tabs';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable, type Column } from '@/components/ui/table';
import { Dropdown } from '@/components/ui/dropdown';
import { Modal } from '@/components/ui/modal';
import { Input, Textarea, Select, Field } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TableSkeleton } from '@/components/ui/skeleton';
import { RequirePermission } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import { useCmsBlocks, useCmsActions } from '@/lib/queries';
import type { CmsBlock } from '@/lib/data';
import { formatDate, humanize } from '@/lib/utils';

type BlockType = CmsBlock['type'];

const TYPE_TABS: { value: string; label: string; type?: BlockType }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'HOMEPAGE_SECTION', label: 'Homepage', type: 'HOMEPAGE_SECTION' },
  { value: 'FAQ', label: 'FAQ', type: 'FAQ' },
  { value: 'PAGE', label: 'Pages', type: 'PAGE' },
  { value: 'TESTIMONIAL', label: 'Testimonials', type: 'TESTIMONIAL' },
];

const TYPE_OPTIONS: BlockType[] = ['HOMEPAGE_SECTION', 'FAQ', 'PAGE', 'TESTIMONIAL'];

interface DraftBlock {
  id?: string;
  key: string;
  type: BlockType;
  title: string;
  content: string;
  published: boolean;
}

const EMPTY_DRAFT: DraftBlock = {
  key: '',
  type: 'HOMEPAGE_SECTION',
  title: '',
  content: '',
  published: false,
};

export default function CmsPage() {
  const { data: blocks = [], isLoading: loading } = useCmsBlocks();
  const { create, update, setPublished, remove } = useCmsActions();
  const [tab, setTab] = useState('ALL');
  const [query, setQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<DraftBlock>(EMPTY_DRAFT);
  const saving = create.isPending || update.isPending;

  const toast = useToast();
  const confirm = useConfirm();

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: blocks.length };
    for (const t of TYPE_OPTIONS) map[t] = blocks.filter((b) => b.type === t).length;
    return map;
  }, [blocks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blocks.filter((b) => {
      if (tab !== 'ALL' && b.type !== tab) return false;
      if (!q) return true;
      return b.title.toLowerCase().includes(q) || b.key.toLowerCase().includes(q);
    });
  }, [blocks, tab, query]);

  const openCreate = () => {
    setDraft(EMPTY_DRAFT);
    setEditorOpen(true);
  };

  const openEdit = (b: CmsBlock) => {
    setDraft({ id: b.id, key: b.key, type: b.type, title: b.title, content: b.content, published: b.published });
    setEditorOpen(true);
  };

  const saveDraft = async () => {
    if (!draft.title.trim() || !draft.key.trim()) {
      toast.error('Title and key are required.');
      return;
    }
    // Publishing triggers ISR revalidation on the web app.
    try {
      if (draft.id) {
        await update.mutateAsync({ id: draft.id, title: draft.title, content: draft.content, published: draft.published });
      } else {
        await create.mutateAsync({ key: draft.key, type: draft.type, title: draft.title, content: draft.content, published: draft.published });
      }
      setEditorOpen(false);
      toast.success(draft.id ? 'Block updated' : 'Block created');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const togglePublish = async (b: CmsBlock) => {
    const turningOn = !b.published;
    const { confirmed } = await confirm({
      title: turningOn ? 'Publish this block?' : 'Unpublish this block?',
      description: turningOn
        ? 'Published content is live on the website immediately. ISR revalidation will refresh affected pages.'
        : 'This content will be removed from the live website on the next revalidation.',
      confirmLabel: turningOn ? 'Publish' : 'Unpublish',
      tone: turningOn ? 'default' : 'danger',
    });
    if (!confirmed) return;
    try {
      await setPublished.mutateAsync({ id: b.id, published: turningOn });
      toast.success(turningOn ? 'Block published — revalidation triggered' : 'Block unpublished');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const removeBlock = async (b: CmsBlock) => {
    const { confirmed } = await confirm({
      title: 'Delete this block?',
      description: `“${b.title}” (${b.key}) will be permanently removed. This cannot be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!confirmed) return;
    try {
      await remove.mutateAsync(b.id);
      toast.success('Block deleted');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const columns: Column<CmsBlock>[] = [
    {
      key: 'block',
      header: 'Block',
      cell: (b) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink-900">{b.title}</p>
          <p className="truncate font-mono text-2xs text-ink-500">{b.key}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      cell: (b) => <Badge variant="neutral">{humanize(b.type)}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (b) => <StatusBadge status={b.published ? 'PUBLISHED' : 'DRAFT'} />,
    },
    {
      key: 'updated',
      header: 'Updated',
      hideOnMobile: true,
      cell: (b) => <span className="text-ink-500">{formatDate(b.updatedAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (b) => (
        <Dropdown
          trigger={
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-800">
              <MoreHorizontal size={18} />
            </span>
          }
          items={[
            { label: 'Edit', icon: <Pencil size={15} />, onClick: () => openEdit(b) },
            {
              label: b.published ? 'Unpublish' : 'Publish',
              icon: b.published ? <EyeOff size={15} /> : <Eye size={15} />,
              onClick: () => togglePublish(b),
            },
            'separator',
            { label: 'Delete', icon: <Trash2 size={15} />, tone: 'danger', onClick: () => removeBlock(b) },
          ]}
        />
      ),
    },
  ];

  return (
    <RequirePermission anyOf={['cms.edit']}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Content & Platform"
          title="CMS"
          description="Lightweight content blocks served to the marketing website and mobile apps. Publishing pushes live and triggers ISR revalidation."
          actions={
            <Button variant="primary" onClick={openCreate}>
              <Plus size={16} /> New block
            </Button>
          }
        />

        <Card>
          <CardBody className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Tabs
                tabs={TYPE_TABS.map((t) => ({ value: t.value, label: t.label, count: counts[t.value] }))}
                value={tab}
                onChange={setTab}
              />
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search title or key…"
                className="sm:w-72"
              />
            </div>

            {loading ? (
              <TableSkeleton cols={5} />
            ) : (
              <DataTable
                columns={columns}
                rows={filtered}
                rowKey={(b) => b.id}
                empty={{
                  title: query || tab !== 'ALL' ? 'No matching blocks' : 'No content blocks yet',
                  description:
                    query || tab !== 'ALL'
                      ? 'Try a different filter or search term.'
                      : 'Create your first block to publish content to the website.',
                  action: (
                    <Button variant="primary" size="sm" onClick={openCreate}>
                      <Plus size={15} /> New block
                    </Button>
                  ),
                }}
              />
            )}
          </CardBody>
        </Card>
      </div>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        size="lg"
        title={draft.id ? 'Edit content block' : 'New content block'}
        description="Content blocks are key-based and consumed by the web and mobile clients."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={saving} onClick={saveDraft}>
              {draft.id ? 'Save changes' : 'Create block'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" htmlFor="cms-title" required>
              <Input
                id="cms-title"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Homepage hero"
              />
            </Field>
            <Field label="Key" htmlFor="cms-key" hint="Stable identifier the clients fetch by." required>
              <Input
                id="cms-key"
                value={draft.key}
                onChange={(e) => setDraft((d) => ({ ...d, key: e.target.value }))}
                placeholder="home.hero"
                className="font-mono"
              />
            </Field>
          </div>
          <Field label="Type" htmlFor="cms-type">
            <Select
              id="cms-type"
              value={draft.type}
              onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as BlockType }))}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {humanize(t)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Content" htmlFor="cms-content">
            <Textarea
              id="cms-content"
              rows={6}
              value={draft.content}
              onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))}
              placeholder="The copy served to clients for this block…"
            />
          </Field>
          <div className="flex items-center justify-between rounded-xl border border-ink-200 bg-ink-50/50 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">Published</p>
              <p className="text-xs text-ink-500">Live content triggers ISR revalidation on save.</p>
            </div>
            <Switch
              checked={draft.published}
              onChange={(v) => setDraft((d) => ({ ...d, published: v }))}
              label="Published"
            />
          </div>
        </div>
      </Modal>
    </RequirePermission>
  );
}
