'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { accountApi, friendlyError } from '@/lib/client-api';
import { useToast } from '@/lib/toast';
import { settingsInput } from './shared';

export function PasswordSettings() {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (password.length < 8) {
      toast.warning('Password too short', 'Use at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      await accountApi.changePassword(password);
      setPassword('');
      toast.success('Password updated', 'Your new password is saved.');
    } catch (e) {
      toast.error('Could not update password', friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Password</h1>

      <div className="mt-8">
        <label htmlFor="s-password" className="mb-1.5 block text-sm font-semibold text-ink-900">
          New password
        </label>
        <div className="relative">
          <input
            id="s-password"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your new password"
            className={cn(settingsInput, 'pr-11')}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-400 transition-colors hover:text-ink-700"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-500">Use at least 8 characters.</p>
      </div>

      <div className="mt-10">
        <Button variant="primary" size="lg" className="w-full" disabled={saving || password.length < 8} onClick={save}>
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Saving…
            </>
          ) : (
            'Save changes'
          )}
        </Button>
      </div>
    </div>
  );
}
