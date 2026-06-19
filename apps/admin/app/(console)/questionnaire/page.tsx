'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Plus,
  Info,
  Lock,
  ListChecks,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Modal } from '@/components/ui/modal';
import { Input, Select, Field } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/states';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import { cn, formatDate, humanize } from '@/lib/utils';
import {
  type Questionnaire,
  type Question,
  type QuestionType,
} from '@/lib/data';
import { useQuestionnaires, useQuestionnaireActions } from '@/lib/queries';

const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'SHORT_TEXT', label: 'Short text' },
  { value: 'LONG_TEXT', label: 'Long text' },
  { value: 'SINGLE_SELECT', label: 'Single select' },
  { value: 'MULTI_SELECT', label: 'Multi select' },
  { value: 'FILE', label: 'File upload' },
];

const hasOptions = (t: QuestionType) => t === 'SINGLE_SELECT' || t === 'MULTI_SELECT';
let uid = 0;
const newId = () => `qq-new-${++uid}`;

/** UI question type → backend enum expected by the create mutation. */
const typeToApi = (t: QuestionType): 'TEXT' | 'LONG_TEXT' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'FILE' =>
  t === 'SHORT_TEXT'
    ? 'TEXT'
    : t === 'SINGLE_SELECT'
      ? 'SINGLE_CHOICE'
      : t === 'MULTI_SELECT'
        ? 'MULTI_CHOICE'
        : t;

export default function QuestionnairePage() {
  const { data, isLoading: loading } = useQuestionnaires();
  const serverVersions = useMemo(() => data ?? [], [data]);
  const { create } = useQuestionnaireActions();

  // Local working copy for in-place question edits (no granular per-question API);
  // synced from the server whenever the query data changes.
  const [versions, setVersions] = useState<Questionnaire[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);

  const { success, error } = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    const cloned = serverVersions.map((q) => ({ ...q, questions: q.questions.map((qq) => ({ ...qq })) }));
    setVersions(cloned);
    setSelectedId((prev) => {
      if (prev && cloned.some((v) => v.id === prev)) return prev;
      return cloned.find((q) => q.status === 'PUBLISHED')?.id ?? cloned[0]?.id ?? null;
    });
  }, [serverVersions]);

  const selected = useMemo(() => versions.find((v) => v.id === selectedId), [versions, selectedId]);
  const readOnly = selected?.status === 'ARCHIVED';

  function updateSelected(mut: (questions: Question[]) => Question[]) {
    setVersions((prev) =>
      prev.map((v) =>
        v.id === selectedId
          ? { ...v, questions: mut(v.questions), updatedAt: new Date().toISOString() }
          : v,
      ),
    );
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    updateSelected((qs) => {
      if (target < 0 || target >= qs.length) return qs;
      const next = [...qs];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  async function removeQuestion(q: Question) {
    const { confirmed } = await confirm({
      title: 'Delete question',
      description: `Remove “${q.label}” from this draft? Published versions are unaffected.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!confirmed) return;
    updateSelected((qs) => qs.filter((x) => x.id !== q.id));
    success('Question deleted');
  }

  function saveQuestion(q: Question) {
    updateSelected((qs) => {
      const exists = qs.some((x) => x.id === q.id);
      return exists ? qs.map((x) => (x.id === q.id ? q : x)) : [...qs, q];
    });
    setEditorOpen(false);
    setEditing(null);
    success(editing ? 'Question updated' : 'Question added');
  }

  async function publishVersion() {
    const base = versions.find((v) => v.id === selectedId) ?? versions[0];
    if (!base) return;
    const { confirmed } = await confirm({
      title: 'Publish new version',
      description:
        'This publishes a new version of the application questionnaire and archives the current published one. Existing applications keep their snapshotted answers and are unaffected.',
      confirmLabel: 'Publish version',
    });
    if (!confirmed) return;
    try {
      await create.mutateAsync(
        base.questions.map((qq, i) => ({
          type: typeToApi(qq.type),
          label: qq.label,
          required: qq.required,
          order: i,
          options: qq.options,
        })),
      );
      success('Version published', 'The previous version was archived.');
    } catch (e) {
      error('Publish failed', e instanceof Error ? e.message : undefined);
    }
  }

  return (
    <RequirePermission anyOf={['questionnaires.manage']}>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Marketplace"
          title="Questionnaire"
          description="Build the guide application questionnaire. Publish new versions as your screening evolves."
          actions={
            <Can perm="questionnaires.manage">
              <Button variant="primary" size="sm" onClick={publishVersion}>
                <Plus size={15} /> Publish new version
              </Button>
            </Can>
          }
        />

        <div className="flex items-start gap-2.5 rounded-xl border border-info/20 bg-info/5 px-4 py-3 text-sm text-ink-700">
          <Info size={16} className="mt-0.5 shrink-0 text-info" />
          <p>
            Answers are <span className="font-semibold text-ink-900">snapshotted</span> onto each application at
            submission, so editing or publishing a new questionnaire never alters historical applications.
          </p>
        </div>

        {loading || !selected ? (
          <TableSkeleton />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
            {/* Versions list */}
            <div className="space-y-3">
              <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Versions</p>
              {versions.map((v) => {
                const active = v.id === selectedId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedId(v.id)}
                    className={cn(
                      'w-full rounded-2xl border bg-white p-4 text-left shadow-soft transition-all',
                      active ? 'border-maroon-800/50 ring-2 ring-maroon-800/15' : 'border-ink-200/70 hover:border-maroon-800/30',
                      v.status === 'PUBLISHED' && !active && 'border-maroon-800/30 bg-maroon-50/30',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-base font-semibold text-ink-900">Version {v.version}</span>
                      <StatusBadge status={v.status} />
                    </div>
                    <p className="mt-1 text-xs text-ink-500">
                      {v.questions.length} question{v.questions.length === 1 ? '' : 's'} · Updated {formatDate(v.updatedAt)}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Builder */}
            <Card>
              <div className="flex flex-col gap-3 border-b border-ink-200/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-semibold text-ink-900">Version {selected.version}</h3>
                    <StatusBadge status={selected.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-ink-500">
                    {readOnly
                      ? 'Archived versions are read-only.'
                      : 'Reorder, add, edit, or remove the questions applicants will answer.'}
                  </p>
                </div>
                {!readOnly && (
                  <Can perm="questionnaires.manage">
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => {
                        setEditing(null);
                        setEditorOpen(true);
                      }}
                    >
                      <Plus size={15} /> Add question
                    </Button>
                  </Can>
                )}
              </div>

              <CardBody className="space-y-3">
                {readOnly && (
                  <div className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">
                    <Lock size={13} /> This version is archived. Select the published version or publish a new one to make changes.
                  </div>
                )}

                {selected.questions.length === 0 ? (
                  <EmptyState
                    icon={ListChecks}
                    title="No questions yet"
                    description={readOnly ? 'This version has no questions.' : 'Add your first question to start building this version.'}
                    action={
                      !readOnly ? (
                        <Can perm="questionnaires.manage">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setEditing(null);
                              setEditorOpen(true);
                            }}
                          >
                            <Plus size={15} /> Add question
                          </Button>
                        </Can>
                      ) : undefined
                    }
                  />
                ) : (
                  selected.questions.map((q, i) => (
                    <div
                      key={q.id}
                      className="flex items-center gap-3 rounded-xl border border-ink-200/70 bg-white p-3 shadow-soft"
                    >
                      <GripVertical size={16} className="shrink-0 text-ink-300" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-900">{q.label}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge variant="neutral" size="sm">{humanize(q.type)}</Badge>
                          {q.required && <Badge variant="maroon" size="sm">Required</Badge>}
                          {hasOptions(q.type) && q.options?.length ? (
                            <span className="text-2xs text-ink-400">{q.options.length} options</span>
                          ) : null}
                        </div>
                      </div>

                      {!readOnly && (
                        <Can perm="questionnaires.manage">
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Move up"
                              disabled={i === 0}
                              onClick={() => move(i, -1)}
                            >
                              <ArrowUp size={15} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Move down"
                              disabled={i === selected.questions.length - 1}
                              onClick={() => move(i, 1)}
                            >
                              <ArrowDown size={15} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Edit"
                              onClick={() => {
                                setEditing(q);
                                setEditorOpen(true);
                              }}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Delete"
                              className="text-danger hover:bg-danger/10"
                              onClick={() => removeQuestion(q)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </Can>
                      )}
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          </div>
        )}

        <QuestionEditor
          open={editorOpen}
          question={editing}
          onClose={() => {
            setEditorOpen(false);
            setEditing(null);
          }}
          onSave={saveQuestion}
        />
      </div>
    </RequirePermission>
  );
}

function QuestionEditor({
  open,
  question,
  onClose,
  onSave,
}: {
  open: boolean;
  question: Question | null;
  onClose: () => void;
  onSave: (q: Question) => void;
}) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<QuestionType>('SHORT_TEXT');
  const [required, setRequired] = useState(true);
  const [options, setOptions] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLabel(question?.label ?? '');
    setType(question?.type ?? 'SHORT_TEXT');
    setRequired(question?.required ?? true);
    setOptions(question?.options ?? []);
    setError('');
  }, [open, question]);

  function submit() {
    if (!label.trim()) {
      setError('A question label is required.');
      return;
    }
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (hasOptions(type) && cleanOptions.length < 2) {
      setError('Add at least two options for a select question.');
      return;
    }
    onSave({
      id: question?.id ?? newId(),
      label: label.trim(),
      type,
      required,
      options: hasOptions(type) ? cleanOptions : undefined,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={question ? 'Edit question' : 'Add question'}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={submit}>
            {question ? 'Save changes' : 'Add question'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Question label" htmlFor="q-label" required error={error && !label.trim() ? error : undefined}>
          <Input
            id="q-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Why do you want to be a campus guide?"
            autoFocus
          />
        </Field>

        <Field label="Answer type" htmlFor="q-type">
          <Select id="q-type" value={type} onChange={(e) => setType(e.target.value as QuestionType)}>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-center justify-between rounded-xl border border-ink-200/70 bg-ink-50/40 px-3.5 py-3">
          <div>
            <p className="text-sm font-semibold text-ink-900">Required</p>
            <p className="text-xs text-ink-500">Applicants must answer this question.</p>
          </div>
          <Switch checked={required} onChange={setRequired} label="Required" />
        </div>

        {hasOptions(type) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-900">Options</p>
              <Button variant="ghost" size="sm" onClick={() => setOptions((o) => [...o, ''])}>
                <Plus size={14} /> Add option
              </Button>
            </div>
            {options.length === 0 && <p className="text-xs text-ink-500">Add at least two options.</p>}
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={opt}
                    onChange={(e) => setOptions((o) => o.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder={`Option ${i + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove option"
                    className="shrink-0 text-ink-400 hover:text-danger"
                    onClick={() => setOptions((o) => o.filter((_, j) => j !== i))}
                  >
                    <X size={15} />
                  </Button>
                </div>
              ))}
            </div>
            {error && hasOptions(type) && label.trim() && <p className="text-xs text-danger">{error}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}
