'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AuthShell, authInputClasses } from '@/components/auth/auth-shell';
import { signIn } from '@/lib/auth';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !password) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    // Simulated auth — no real backend. Mark the user logged in (updates the
    // header) and hand off to the profile.
    setTimeout(() => {
      signIn({ email });
      setStatus('success');
      setTimeout(() => router.push('/profile'), 700);
    }, 1100);
  }

  return (
    <AuthShell>
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
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {status === 'error' && (
            <div
              role="alert"
              className="flex items-center gap-2.5 rounded-xl border border-maroon-200 bg-maroon-50 px-4 py-3 text-sm text-maroon-900"
            >
              <AlertCircle size={16} className="shrink-0" />
              Please enter a valid email and password.
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
            <Link href="/login" className="font-semibold text-ink-900 hover:underline">
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
      )}
    </AuthShell>
  );
}
