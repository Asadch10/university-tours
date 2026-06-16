'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './modal';
import { Button } from './button';
import { Textarea } from './input';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  /** When set, requires a reason before confirming (captured in the audit log). */
  reason?: { label: string; placeholder?: string; required?: boolean };
}

type Resolver = (result: { confirmed: boolean; reason?: string }) => void;

const ConfirmContext = createContext<((o: ConfirmOptions) => Promise<{ confirmed: boolean; reason?: string }>) | null>(
  null,
);

/**
 * Confirmation gate for irreversible / financial actions (Part II R2: require confirmation and
 * reason capture). Usage: `const confirm = useConfirm(); const { confirmed, reason } = await confirm({...})`.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const resolver = useRef<Resolver | null>(null);

  const confirm = useCallback((o: ConfirmOptions) => {
    setOpts(o);
    setReason('');
    return new Promise<{ confirmed: boolean; reason?: string }>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (confirmed: boolean) => {
    if (opts?.reason?.required && confirmed && !reason.trim()) return;
    resolver.current?.({ confirmed, reason: reason.trim() || undefined });
    resolver.current = null;
    setBusy(false);
    setOpts(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={!!opts}
        onClose={() => close(false)}
        size="sm"
        title={
          <span className="flex items-center gap-2">
            {opts?.tone === 'danger' && <AlertTriangle size={18} className="text-danger" />}
            {opts?.title}
          </span>
        }
        description={opts?.description}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => close(false)}>
              {opts?.cancelLabel ?? 'Cancel'}
            </Button>
            <Button
              variant={opts?.tone === 'danger' ? 'danger' : 'primary'}
              size="sm"
              loading={busy}
              disabled={!!opts?.reason?.required && !reason.trim()}
              onClick={() => {
                setBusy(true);
                close(true);
              }}
            >
              {opts?.confirmLabel ?? 'Confirm'}
            </Button>
          </>
        }
      >
        {opts?.reason && (
          <div className="space-y-1.5">
            <label htmlFor="confirm-reason" className="block text-sm font-semibold text-ink-900">
              {opts.reason.label}
              {opts.reason.required && <span className="ml-0.5 text-danger">*</span>}
            </label>
            <Textarea
              id="confirm-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={opts.reason.placeholder}
              autoFocus
            />
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>');
  return ctx;
}
