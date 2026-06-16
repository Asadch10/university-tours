'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  ArrowRight,
  Building2,
  Users,
  Receipt,
} from 'lucide-react';
import { useAuth, DEMO_CREDENTIALS } from '@/lib/auth';
import { Logo } from '@/components/brand/logo';
import { Badge } from '@/components/ui/badge';

const highlights = [
  { icon: Building2, title: 'One console for the whole marketplace', body: 'Vet guides, manage universities, and moderate content from a single place.' },
  { icon: Receipt, title: 'Money handled with care', body: 'Commission, refunds, and manual payouts — every action confirmed and audited.' },
  { icon: Users, title: 'Role-based by design', body: 'Super Admin, Manager, and Support each see exactly what they should.' },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, ready, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');
  const [error, setError] = useState('');

  // If already signed in, skip the form.
  useEffect(() => {
    if (ready && user) router.replace('/dashboard');
  }, [ready, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setStatus('loading');
    const res = await signIn(email, password);
    if (res.ok) {
      router.replace('/dashboard');
    } else {
      setError(res.error ?? 'Sign in failed.');
      setStatus('idle');
    }
  }

  function fillDemo() {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setError('');
  }

  return (
    <div className="min-h-dvh bg-ivory">
      <div className="grid min-h-dvh lg:grid-cols-2">
        {/* LEFT — brand showcase */}
        <aside className="relative hidden overflow-hidden bg-maroon-gradient lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold-500/15 blur-3xl" aria-hidden />

          <div className="relative">
            <Logo variant="light" />
          </div>

          <div className="relative max-w-md">
            <Badge variant="gold" className="mb-6 bg-white/15 text-ivory ring-white/25 backdrop-blur">
              <ShieldCheck size={12} /> Operations Console
            </Badge>
            <h1 className="font-display text-4xl font-semibold leading-tight text-ivory xl:text-[2.75rem]">
              Run the entire marketplace from one place.
            </h1>
            <p className="mt-4 text-ivory/75">
              The web-only admin portal for University Campus Private Tours — secure, role-based, and
              built to keep every booking, payout, and guide in order.
            </p>

            <ul className="mt-10 space-y-6">
              {highlights.map(({ icon: Icon, title, body }) => (
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

          <p className="relative text-2xs text-ivory/45">
            Confidential · access logged · deny-by-default permissions.
          </p>
        </aside>

        {/* RIGHT — form */}
        <main className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Logo />
            </div>

            <div className="mb-8">
              <h2 className="font-display text-3xl font-semibold text-ink-900">Sign in to the console</h2>
              <p className="mt-2 text-sm text-ink-600">Enter your admin credentials to continue.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {error && (
                <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                  <AlertCircle size={17} className="shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-semibold text-ink-900">Email</label>
                <div className="relative">
                  <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@tour.com"
                    className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-11 pr-4 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/15"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-ink-900">Password</label>
                <div className="relative">
                  <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-ink-200 bg-white py-3 pl-11 pr-11 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 hover:text-ink-700"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-maroon-900 text-sm font-semibold text-ivory shadow-soft transition-all duration-200 hover:bg-maroon-800 hover:shadow-lift disabled:opacity-60"
              >
                {status === 'loading' ? (
                  <><Loader2 size={18} className="animate-spin" /> Signing in…</>
                ) : (
                  <>Sign in <ArrowRight size={18} /></>
                )}
              </button>
            </form>

            {/* Demo credentials */}
            <button
              type="button"
              onClick={fillDemo}
              className="mt-6 w-full rounded-xl border border-dashed border-ink-300 bg-cream/50 px-4 py-3 text-left transition-colors hover:border-maroon-800/40 hover:bg-cream"
            >
              <p className="text-2xs font-semibold uppercase tracking-wider text-maroon-800">Demo credentials — click to fill</p>
              <p className="mt-1 font-mono text-sm text-ink-700">{DEMO_CREDENTIALS.email} · {DEMO_CREDENTIALS.password}</p>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
