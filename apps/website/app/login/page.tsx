'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { AuthShell, authInputClasses } from '@/components/auth/auth-shell';
import { setSession } from '@/lib/auth';
import { authApi, ApiError } from '@/lib/client-api';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('Please enter a valid email and password.');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter a valid email and password.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    try {
      const res = await authApi.login(email.trim(), password);
      setSession(res);
      setStatus('success');
      // Show the branded loader briefly, then go home (or to onboarding if no role yet).
      setTimeout(() => router.push(res.user.role ? '/' : '/onboarding'), 900);
    } catch (err) {
      setErrorMsg(
        err instanceof ApiError && err.status === 401
          ? 'Incorrect email or password.'
          : err instanceof ApiError
            ? err.message
            : 'Something went wrong. Please try again.',
      );
      setStatus('error');
    }
  }

  // After a successful sign-in, show a full-screen branded loader, then redirect.
  if (status === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="University Campus Private Tours" className="h-24 w-auto animate-pulse" />
        <p className="flex items-center gap-2 text-sm font-medium text-ink-500">
          <Loader2 size={16} className="animate-spin text-brand" /> Signing you in…
        </p>
      </div>
    );
  }

  return (
    <AuthShell>
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

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-bold text-ink-900">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password…"
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
          </div>

          {/* Forgot password */}
          <p className="text-center text-sm text-ink-500">
            Forgot your password?{' '}
            <Link href="/forgot-password" className="font-semibold text-ink-900 hover:underline">
              Reset password.
            </Link>
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed',
              email && password
                ? 'bg-maroon-900 text-white hover:bg-maroon-800'
                : 'bg-ink-100 text-ink-500',
            )}
          >
            {status === 'loading' ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Logging in…
              </>
            ) : (
              'Log in'
            )}
          </button>
        </form>
    </AuthShell>
  );
}
