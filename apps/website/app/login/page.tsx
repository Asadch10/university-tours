'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Star,
  Users,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const inputClasses =
  'w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/15';

const trustBullets = [
  {
    icon: ShieldCheck,
    title: 'Verified student guides',
    body: 'Every guide is identity- and enrollment-checked before they host.',
  },
  {
    icon: Star,
    title: '4.9 average rating',
    body: 'Thousands of families rate their visits across top campuses.',
  },
  {
    icon: Users,
    title: 'You’re only charged when accepted',
    body: 'No surprises — your card is held until a guide confirms.',
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error' | 'link-sent'
  >('idle');

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

  function handleEmailLink() {
    if (!email) {
      setStatus('error');
      return;
    }
    // Simulated magic-link send — swap for a real @ucpt/sdk call when the backend is wired.
    setStatus('link-sent');
  }

  return (
    <div className="min-h-dvh bg-ivory pt-[var(--header-h)]">
      <div className="grid min-h-[calc(100dvh-var(--header-h))] lg:grid-cols-2">
        {/* LEFT — brand showcase */}
        <aside className="relative hidden overflow-hidden bg-maroon-gradient lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
          <div
            className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl"
            aria-hidden
          />

          <div className="relative">
            <Logo variant="light" />
          </div>

          <div className="relative max-w-md">
            <Badge variant="light">
              <ShieldCheck size={12} /> Welcome back
            </Badge>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight text-ivory xl:text-[2.75rem]">
              Pick up where your campus journey left off.
            </h1>
            <p className="mt-4 text-ivory/75">
              Log in to manage your bookings, message verified student guides, and explore the
              universities your family loves.
            </p>

            <ul className="mt-10 space-y-6">
              {trustBullets.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-gold-300 ring-1 ring-inset ring-white/15">
                    <Icon size={20} />
                  </span>
                  <div>
                    <p className="font-semibold text-ivory">{title}</p>
                    <p className="mt-1 text-sm text-ivory/65">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <figure className="relative max-w-md rounded-2xl bg-white/10 p-6 text-ivory ring-1 ring-inset ring-white/15 backdrop-blur">
            <blockquote className="font-display text-lg leading-relaxed">
              “Our guide showed us the dorms, the dining halls, and the real student life. It made
              the decision so much easier.”
            </blockquote>
            <figcaption className="mt-4 text-sm text-ivory/70">
              Priya M. — parent, visited 3 campuses
            </figcaption>
          </figure>
        </aside>

        {/* RIGHT — form */}
        <main className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            {/* Compact mobile brand */}
            <div className="mb-8 lg:hidden">
              <Logo />
            </div>

            <div className="mb-8">
              <h2 className="font-display text-3xl font-semibold text-ink-900 sm:text-[2rem]">
                Log in to your account
              </h2>
              <p className="mt-2 text-sm text-ink-600">
                Welcome back — enter your details to continue.
              </p>
            </div>

            {status === 'success' ? (
              <div
                role="status"
                className="flex items-start gap-3 rounded-2xl border border-verified/30 bg-verified/10 p-5 text-sm text-ink-800"
              >
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-verified" />
                <div>
                  <p className="font-semibold text-ink-900">You’re logged in</p>
                  <p className="mt-1 text-ink-600">
                    Redirecting you to your dashboard…
                  </p>
                </div>
              </div>
            ) : status === 'link-sent' ? (
              <div
                role="status"
                className="flex items-start gap-3 rounded-2xl border border-verified/30 bg-verified/10 p-5 text-sm text-ink-800"
              >
                <Mail size={20} className="mt-0.5 shrink-0 text-verified" />
                <div>
                  <p className="font-semibold text-ink-900">Check your inbox</p>
                  <p className="mt-1 text-ink-600">
                    We sent a one-time sign-in link to{' '}
                    <span className="font-medium text-ink-900">{email}</span>. It expires in 15
                    minutes.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="mt-3 rounded font-semibold text-maroon-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800/30"
                  >
                    Use a password instead
                  </button>
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
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-ink-800"
                  >
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
                      className="rounded text-sm font-medium text-maroon-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800/30"
                    >
                      Forgot password?
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
                      aria-pressed={showPassword}
                      className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-400 transition-colors hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800/30"
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
                    className="h-4 w-4 rounded border-ink-300 text-maroon-900 accent-maroon-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800/30"
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

                <div className="flex items-center gap-4 py-1" aria-hidden>
                  <span className="h-px flex-1 bg-ink-200" />
                  <span className="text-xs font-medium uppercase tracking-wider text-ink-400">
                    or
                  </span>
                  <span className="h-px flex-1 bg-ink-200" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={handleEmailLink}
                >
                  <Mail size={18} /> Continue with email link
                </Button>
              </form>
            )}

            <p className="mt-8 text-center text-sm text-ink-600">
              New here?{' '}
              <Link
                href="/register"
                className="rounded font-semibold text-maroon-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800/30"
              >
                Create an account
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
