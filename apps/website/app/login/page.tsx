'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const inputClasses =
  'w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/15';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    // Simulated auth — no real backend.
    setTimeout(() => setStatus('success'), 1100);
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-ivory">
      {/* Soft brand glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-radial-fade" aria-hidden />
      <div
        className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5 pb-16 pt-[calc(var(--header-h)+2.5rem)]">
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-[2rem]">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            Log in to manage bookings and message your guides.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-ink-200/70 bg-white p-6 shadow-card sm:p-8">
          {status === 'success' ? (
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl border border-verified/30 bg-verified/10 p-5 text-sm text-ink-800"
            >
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-verified" />
              <div>
                <p className="font-semibold text-ink-900">You’re logged in</p>
                <p className="mt-1 text-ink-600">Redirecting you to your dashboard…</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {status === 'error' && (
                <div
                  role="alert"
                  className="flex items-center gap-2.5 rounded-xl border border-maroon-200 bg-maroon-50 px-4 py-3 text-sm text-maroon-900"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  Please enter a valid email and password.
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-800">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
                    aria-hidden
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={cn(inputClasses, 'pl-10')}
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-ink-800">
                    Password
                  </label>
                  <Link
                    href="/login"
                    className="rounded text-sm font-medium text-maroon-800 underline-offset-2 hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
                    aria-hidden
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={cn(inputClasses, 'px-10')}
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

              <label
                htmlFor="remember"
                className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-ink-700"
              >
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-ink-300 text-maroon-900 accent-maroon-900"
                />
                Remember me on this device
              </label>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Logging in…
                  </>
                ) : (
                  <>
                    Log in <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-7 text-center text-sm text-ink-600">
          New here?{' '}
          <Link
            href="/register"
            className="rounded font-semibold text-maroon-800 underline-offset-2 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
