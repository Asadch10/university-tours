'use client';

import { useEffect, useState } from 'react';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Plus,
  ListChecks,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input, Select, Field } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/states';
import { RequirePermission, Can } from '@/components/auth/permission-gate';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import { cn, humanize } from '@/lib/utils';
import { type Question, type QuestionType } from '@/lib/data';
import { useQuestionnaire, useQuestionnaireActions, type ApplicantKind } from '@/lib/queries';

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

const typeToApi = (t: QuestionType): 'TEXT' | 'LONG_TEXT' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'FILE' =>
  t === 'SHORT_TEXT'
    ? 'TEXT'
    : t === 'SINGLE_SELECT'
      ? 'SINGLE_CHOICE'
      : t === 'MULTI_SELECT'
        ? 'MULTI_CHOICE'
        : t;

const KINDS: { value: ApplicantKind; label: string; description: string }[] = [
  {
    value: 'GUIDE',
    label: 'Guide questionnaire',
    description: 'Shown on Become a guide. Changes take effect immediately.',
  },
  {
    value: 'COUNSELOR',
    label: 'Counselor questionnaire',
    description: 'Shown on Become a college counselor. Changes take effect immediately.',
  },
];

export default function QuestionnairePage() {
  // Two independent questionnaires behind one screen. Everything below — questions,
  // ordering, the editor — is scoped to the selected kind.
  const [kind, setKind] = useState<ApplicantKind>('GUIDE');
  const { data: questionnaire, isLoading } = useQuestionnaire(kind);
  const { addQuestion, updateQuestion, deleteQuestion, reorderQuestions, setPhotos } = useQuestionnaireActions(kind);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);

  const { success, error } = useToast();
  const confirm = useConfirm();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  async function persistOrder(next: { id: string }[]) {
    if (!questionnaire) return;
    try {
      await reorderQuestions.mutateAsync({ id: questionnaire.id, orderedIds: next.map((q) => q.id) });
    } catch (e) {
      error('Reorder failed', e instanceof Error ? e.message : undefined);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    if (!questionnaire) return;
    const questions = questionnaire.questions;
    const target = index + dir;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[index], next[target]] = [next[target]!, next[index]!];
    await persistOrder(next);
  }

  // Drag-and-drop reorder: move the dragged question to the drop position.
  async function dropAt(to: number) {
    const from = dragIndex;
    setDragIndex(null);
    setOverIndex(null);
    if (!questionnaire || from === null || from === to) return;
    const next = [...questionnaire.questions];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    await persistOrder(next);
  }

  async function removeQuestion(q: Question) {
    if (!questionnaire) return;
    const { confirmed } = await confirm({
      title: 'Delete question',
      description: `Remove "${q.label}"? This change is immediate.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!confirmed) return;
    try {
      await deleteQuestion.mutateAsync({ id: questionnaire.id, qid: q.id });
      success('Question deleted');
    } catch (e) {
      error('Delete failed', e instanceof Error ? e.message : undefined);
    }
  }

  async function saveQuestion(q: Question) {
    if (!questionnaire) return;
    const isNew = q.id.startsWith('qq-new-');
    try {
      if (isNew) {
        await addQuestion.mutateAsync({
          id: questionnaire.id,
          question: { type: typeToApi(q.type), label: q.label, required: q.required, options: q.options },
        });
        success('Question added');
      } else {
        await updateQuestion.mutateAsync({
          id: questionnaire.id,
          qid: q.id,
          data: { type: typeToApi(q.type), label: q.label, required: q.required, options: q.options ?? null },
        });
        success('Question updated');
      }
      setEditorOpen(false);
      setEditing(null);
    } catch (e) {
      error('Save failed', e instanceof Error ? e.message : undefined);
    }
  }

  const questions = questionnaire?.questions ?? [];

  return (
    <RequirePermission anyOf={['questionnaires.manage']}>
      <div className="space-y-6">
        <PageHeader
          title="Questionnaire"
          description={KINDS.find((k) => k.value === kind)?.description}
          actions={
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
          }
        />

        {/* Which application flow is being edited. */}
        <div
          role="tablist"
          aria-label="Questionnaire type"
          className="inline-flex w-full gap-1 overflow-x-auto rounded-xl border border-ink-200 bg-surface-2 p-1 sm:w-auto"
        >
          {KINDS.map((k) => {
            const active = kind === k.value;
            return (
              <button
                key={k.value}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => {
                  setKind(k.value);
                  setEditorOpen(false);
                  setEditing(null);
                }}
                className={cn(
                  'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-ink-600 hover:bg-surface-3 hover:text-ink-900',
                )}
              >
                {k.label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : (
          <>
          <PhotoCountCard
            value={questionnaire?.requiredPhotos ?? 3}
            saving={setPhotos.isPending}
            onSave={async (n) => {
              try {
                await setPhotos.mutateAsync(n);
                success('Photo requirement updated', `Guides must upload ${n} photo${n > 1 ? 's' : ''}.`);
              } catch (e) {
                error('Could not update', e instanceof Error ? e.message : undefined);
              }
            }}
          />
          <Card>
            <div className="border-b border-ink-200/60 px-5 py-4">
              <h3 className="font-display text-base font-semibold text-ink-900">Application questions</h3>
              <p className="mt-0.5 text-sm text-ink-500">
                Reorder, add, edit, or remove the questions applicants will answer.
              </p>
            </div>

            <CardBody className="space-y-3">
              {questions.length === 0 ? (
                <EmptyState
                  icon={ListChecks}
                  title="No questions yet"
                  description="Add your first question to start building the questionnaire."
                />
              ) : (
                questions.map((q, i) => (
                  <div
                    key={q.id}
                    draggable={!reorderQuestions.isPending}
                    onDragStart={() => setDragIndex(i)}
                    onDragEnter={() => setOverIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => void dropAt(i)}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border bg-surface p-3 shadow-soft transition-colors',
                      'cursor-grab active:cursor-grabbing',
                      dragIndex === i ? 'opacity-50' : 'border-ink-200/70',
                      overIndex === i && dragIndex !== null && dragIndex !== i && 'border-brand-500 ring-2 ring-brand-500/20',
                    )}
                  >
                    <GripVertical size={16} className="shrink-0 text-ink-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">{q.label}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="neutral" size="sm">{humanize(q.type)}</Badge>
                        {q.required && <Badge variant="brand" size="sm">Required</Badge>}
                        {hasOptions(q.type) && q.options?.length ? (
                          <span className="text-2xs text-ink-400">{q.options.length} options</span>
                        ) : null}
                      </div>
                    </div>

                    <Can perm="questionnaires.manage">
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Move up"
                          disabled={i === 0 || reorderQuestions.isPending}
                          onClick={() => void move(i, -1)}
                        >
                          <ArrowUp size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Move down"
                          disabled={i === questions.length - 1 || reorderQuestions.isPending}
                          onClick={() => void move(i, 1)}
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
                          className="text-danger hover:bg-danger-solid/10"
                          onClick={() => void removeQuestion(q)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </Can>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
          </>
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

function PhotoCountCard({ value, onSave, saving }: { value: number; onSave: (n: number) => void; saving: boolean }) {
  const [n, setN] = useState(value);
  return (
    <Card>
      <CardBody className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold text-ink-900">Profile photos</h3>
          <p className="mt-0.5 text-sm text-ink-500">
            How many photos a guide must upload on the “Become a guide” Photos step.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="req-photos" className="mb-1 block text-xs font-semibold text-ink-600">
              Required photos
            </label>
            <input
              id="req-photos"
              type="number"
              min={1}
              max={10}
              value={n}
              onChange={(e) => setN(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              className="w-24 rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/15"
            />
          </div>
          <Button variant="primary" size="sm" disabled={saving || n === value} onClick={() => onSave(n)}>
            Save
          </Button>
        </div>
      </CardBody>
    </Card>
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
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLabel(question?.label ?? '');
    setType(question?.type ?? 'SHORT_TEXT');
    setRequired(question?.required ?? true);
    setOptions(question?.options ?? []);
    setFormError('');
  }, [open, question]);

  function submit() {
    if (!label.trim()) {
      setFormError('A question label is required.');
      return;
    }
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (hasOptions(type) && cleanOptions.length < 2) {
      setFormError('Add at least two options for a select question.');
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
        <Field label="Question label" htmlFor="q-label" required error={formError && !label.trim() ? formError : undefined}>
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
            {formError && hasOptions(type) && label.trim() && <p className="text-xs text-danger">{formError}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}
