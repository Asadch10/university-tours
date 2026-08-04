'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Mail, Reply, Trash2, Calendar, Tag, User, CheckCircle2, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RequirePermission } from '@/components/auth/permission-gate';
import { useContactMessages, useContactActions } from '@/lib/queries';
import { usePageBreadcrumb } from '@/components/layout/breadcrumb';
import { useToast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/confirm';
import { formatDateTime } from '@/lib/utils';

export default function ContactDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: rows = [], isLoading } = useContactMessages();
  const { setStatus, remove } = useContactActions();
  const toast = useToast();
  const confirm = useConfirm();

  // URLs are "C-<n>" (sequential); still accept the raw id for older/direct links.
  const m = rows.find(
    (r) => `C-${r.contactNo}`.toLowerCase() === id.toLowerCase() || String(r.contactNo) === id || r.id === id,
  );

  usePageBreadcrumb(m ? `C-${m.contactNo}` : null);

  // Mark as read the first time it's opened.
  const markedRef = useRef<string | null>(null);
  useEffect(() => {
    if (m && m.status !== 'read' && markedRef.current !== m.id) {
      markedRef.current = m.id;
      setStatus.mutate({ id: m.id, status: 'read' });
    }
  }, [m, setStatus]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-ink-400" size={26} />
      </div>
    );
  }

  if (!m) {
    return (
      <div className="rounded-2xl border border-ink-200/70 bg-surface p-10 text-center">
        <p className="font-semibold text-ink-900">Message not found</p>
        <p className="mt-1 text-sm text-ink-500">It may have been deleted, or the link is invalid.</p>
        <Button variant="outline" size="sm" className="mt-5" onClick={() => router.push('/contact')}>
          Back to Contact us
        </Button>
      </div>
    );
  }

  const isNew = m.status !== 'read';

  async function toggleRead() {
    if (!m) return;
    await setStatus.mutateAsync({ id: m.id, status: isNew ? 'read' : 'new' });
    toast.success(isNew ? 'Marked as read' : 'Marked as unread');
  }

  async function del() {
    if (!m) return;
    const { confirmed } = await confirm({
      title: 'Delete this message?',
      description: 'This permanently removes the contact message. This cannot be undone.',
      confirmLabel: 'Delete message',
      tone: 'danger',
    });
    if (!confirmed) return;
    try {
      await remove.mutateAsync(m.id);
      toast.success('Message deleted');
      router.push('/contact');
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <RequirePermission anyOf={['contact.view']}>
      <div className="space-y-6">
        {/* Header — summary banner */}
        <section className="overflow-hidden rounded-2xl border border-ink-200/70 bg-surface shadow-soft">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-sm font-semibold text-brand-900">C-{m.contactNo}</span>
                <Badge variant="gold">{m.topic}</Badge>
                {isNew ? <Badge variant="success" dot>New</Badge> : <Badge variant="neutral">Read</Badge>}
              </div>
              <h1 className="mt-2 font-display text-2xl font-bold text-ink-900">{m.name}</h1>
              <a href={`mailto:${m.email}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-800">
                <Mail size={14} className="shrink-0 text-ink-400" /> {m.email}
              </a>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2.5">
              <a
                href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.topic}`)}`}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800"
              >
                <Reply size={15} /> Reply
              </a>
              <button
                type="button"
                onClick={toggleRead}
                className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-surface px-4 py-2.5 text-sm font-semibold text-ink-900 shadow-soft transition-colors hover:bg-ink-50"
              >
                {isNew ? <><CheckCircle2 size={15} /> Mark read</> : <><RotateCcw size={15} /> Mark unread</>}
              </button>
              <button
                type="button"
                onClick={del}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-surface px-4 py-2.5 text-sm font-semibold text-red-600 shadow-soft transition-colors hover:bg-red-50"
              >
                <Trash2 size={15} /> Delete
              </button>
            </div>
          </div>
        </section>

        {/* Details */}
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Message */}
          <section className="rounded-2xl border border-ink-200/70 bg-surface p-6 shadow-soft">
            <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">Message</p>
            <p className="whitespace-pre-line text-[0.95rem] leading-relaxed text-ink-800">{m.message}</p>
          </section>

          {/* Meta */}
          <aside className="space-y-4 rounded-2xl border border-ink-200/70 bg-surface p-6 shadow-soft">
            <Meta icon={User} label="Full name" value={m.name} />
            <Meta icon={Mail} label="Email" value={m.email} />
            <Meta icon={Tag} label="Topic" value={m.topic} />
            <Meta icon={Calendar} label="Submitted" value={formatDateTime(m.createdAt)} />
          </aside>
        </div>
      </div>
    </RequirePermission>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-ink-800">{value}</p>
      </div>
    </div>
  );
}
