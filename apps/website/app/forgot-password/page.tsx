'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, MailCheck, ArrowLeft } from 'lucide-react';
import { AuthShell, authInputClasses } from '@/components/auth/auth-shell';
import { authApi } from '@/lib/client-api';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('Please enter a valid email address.');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter a valid email address.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      await authApi.forgotPassword(email.trim());
      setStatus('sent');
    } catch {
      // The endpoint always succeeds for real inputs; only a network error lands here.
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <AuthShell
        heading="Check your inbox"
        subtitle="If an account exists for that email, we’ve sent a link to reset your password."
      >
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-2xl border border-verified/30 bg-verified/10 p-5 text-sm text-ink-800">
            <MailCheck size={20} className="mt-0.5 shrink-0 text-verified" />
            <div>
              <p className="font-semibold text-ink-900">Reset link sent</p>
              <p className="mt-1 text-ink-600">
                We’ve sent a password reset link to{' '}
                <span className="font-semibold text-ink-900">{email.trim()}</span>. It expires in 1
                hour. If you don’t see it, check your spam folder.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
          >
            <ArrowLeft size={15} /> Back to log in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      heading="Reset your password"
      subtitle="Enter the email associated with your account and we’ll send you a link to reset your password."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {status === 'error' && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl border border-brand-muted bg-brand-tint px-4 py-3 text-sm text-brand"
          >
            <AlertCircle size={16} className="shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-bold text-ink-900">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane.doe@example.com"
            className={authInputClasses}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={status === 'loading'}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed',
            email.trim() ? 'bg-maroon-900 text-white hover:bg-maroon-800' : 'bg-ink-100 text-ink-500',
          )}
        >
          {status === 'loading' ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Sending link…
            </>
          ) : (
            'Send reset link'
          )}
        </button>

        <p className="text-center text-sm text-ink-500">
          Remember your password?{' '}
          <Link href="/login" className="font-semibold text-ink-900 hover:underline">
            Log in.
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
