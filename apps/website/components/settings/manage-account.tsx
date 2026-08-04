'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { accountApi, friendlyError } from '@/lib/client-api';
import { signOut } from '@/lib/auth';
import { useToast } from '@/lib/toast';

export function ManageAccount() {
  const router = useRouter();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function del() {
    if (!confirm) return;
    setDeleting(true);
    try {
      await accountApi.deleteAccount();
      signOut(); // clears the session + calls the logout API
      router.replace('/');
    } catch (e) {
      toast.error('Could not delete account', friendlyError(e));
      setDeleting(false);
    }
  }

  return (
    <div className="flex min-h-[60dvh] max-w-2xl flex-col">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Manage account</h1>

      <label htmlFor="s-delete" className="mt-8 flex cursor-pointer select-none items-center gap-2.5 text-sm font-semibold text-ink-900">
        <input
          id="s-delete"
          type="checkbox"
          checked={confirm}
          onChange={(e) => setConfirm(e.target.checked)}
          className="h-4 w-4 shrink-0 rounded border-ink-300 text-red-600 accent-red-600"
        />
        Delete my account
      </label>

      <p className="mt-6 text-sm text-ink-600">
        Deleting your account will permanently remove your personal data. This action cannot be undone.
      </p>

      <div className="mt-auto pt-12">
        <button
          type="button"
          disabled={!confirm || deleting}
          onClick={del}
          className={cn(
            'inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-colors',
            confirm && !deleting ? 'bg-danger-solid text-white hover:bg-red-500' : 'cursor-not-allowed bg-ink-100 text-ink-400',
          )}
        >
          {deleting ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Deleting…
            </>
          ) : (
            'Delete account'
          )}
        </button>
      </div>
    </div>
  );
}
