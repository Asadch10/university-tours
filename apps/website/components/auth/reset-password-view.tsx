'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { AuthShell, authInputClasses } from '@/components/auth/auth-shell';
import { authApi, ApiError } from '@/lib/client-api';
import { cn } from '@/lib/utils';

export function ResetPasswordView() {
  const router = useRouter();
  const token = useSearchParams().get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const canSubmit = password.length >= 8 && password === confirm;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg('Your password must be at least 8 characters.');
      setStatus('error');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Those passwords don’t match.');
      setStatus('error');
      return;
    }
    if (!token) {
      setErrorMsg('This reset link is invalid. Please request a new one.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      await authApi.resetPassword(token, password);
      setStatus('success');
      setTimeout(() => router.push('/login'), 1200);
    } catch (err) {
      setErrorMsg(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Please try again.',
      );
      setStatus('error');
    }
  }

  // Missing token → the page was opened without the email link.
  if (!token) {
    return (
      <AuthShell
        heading="Reset link required"
        subtitle="This page needs a valid reset link. Request a new one to continue."
      >
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 text-sm font-semibold text-maroon-900 hover:underline"
        >
          <ArrowLeft size={15} /> Request a reset link
        </Link>
      </AuthShell>
    );
  }

  if (status === 'success') {
    return (
      <AuthShell heading="Password updated" subtitle="You can now log in with your new password.">
        <div className="flex items-start gap-3 rounded-2xl border border-verified/30 bg-verified/10 p-5 text-sm text-ink-800">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-verified" />
          <div>
            <p className="font-semibold text-ink-900">All set</p>
            <p className="mt-1 text-ink-600">Redirecting you to the log in page…</p>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell heading="Create a new password" subtitle="Choose a strong password you don’t use anywhere else.">
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {status === 'error' && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl border border-maroon-200 bg-maroon-50 px-4 py-3 text-sm text-maroon-900"
          >
            <AlertCircle size={16} className="shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* New password */}
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-bold text-ink-900">
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create your password…"
              className={cn(authInputClasses, 'pr-11')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-400 transition-colors hover:text-ink-700"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-ink-400">Must be at least 8 characters.</p>
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirm" className="mb-2 block text-sm font-bold text-ink-900">
            Confirm password
          </label>
          <input
            id="confirm"
            name="confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your password…"
            className={authInputClasses}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={status === 'loading'}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed',
            canSubmit ? 'bg-maroon-900 text-white hover:bg-maroon-800' : 'bg-ink-100 text-ink-500',
          )}
        >
          {status === 'loading' ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Updating password…
            </>
          ) : (
            'Update password'
          )}
        </button>

        <p className="text-center text-sm text-ink-500">
          <Link href="/login" className="font-semibold text-ink-900 hover:underline">
            Back to log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
