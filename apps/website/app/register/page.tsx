'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Star,
  Sparkles,
  GraduationCap,
  Users,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Role = 'BUYER' | 'SELLER';

const inputClasses =
  'w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/15';

const roleOptions: {
  value: Role;
  icon: typeof Users;
  title: string;
  subtitle: string;
}[] = [
  {
    value: 'BUYER',
    icon: Users,
    title: 'I’m a family or student visitor',
    subtitle: 'Book private campus tours with verified guides.',
  },
  {
    value: 'SELLER',
    icon: GraduationCap,
    title: 'I’m a current student guide',
    subtitle: 'Host tours, set your rates, and get paid.',
  },
];

const showcaseCopy: Record<
  Role,
  { badge: string; heading: string; body: string; bullets: { icon: typeof Star; text: string }[] }
> = {
  BUYER: {
    badge: 'Visit with confidence',
    heading: 'See campus life through a real student’s eyes.',
    body: 'Create your account to book verified guides, compare universities, and get the honest answers brochures never give.',
    bullets: [
      { icon: ShieldCheck, text: 'Identity- and enrollment-verified guides' },
      { icon: Star, text: '4.9 average rating across thousands of visits' },
      { icon: Sparkles, text: 'Only charged when your guide accepts' },
    ],
  },
  SELLER: {
    badge: 'Earn on your schedule',
    heading: 'Share your campus. Get paid for it.',
    body: 'Create your guide account to set your own rates, accept the requests you want, and build a reputation with real reviews.',
    bullets: [
      { icon: Sparkles, text: 'Typical earnings of $45–$90 per tour' },
      { icon: ShieldCheck, text: 'Accept or decline any request freely' },
      { icon: Star, text: 'Build your profile with verified reviews' },
    ],
  },
};

function passwordStrength(value: string): { score: number; label: string; tone: string } {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  const map = [
    { label: 'Too short', tone: 'bg-maroon-500' },
    { label: 'Weak', tone: 'bg-maroon-400' },
    { label: 'Fair', tone: 'bg-gold-400' },
    { label: 'Good', tone: 'bg-gold-500' },
    { label: 'Strong', tone: 'bg-verified' },
  ];
  return { score, ...map[score]! };
}

export default function RegisterPage() {
  const [role, setRole] = useState<Role>('BUYER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const copy = showcaseCopy[role];
  const strength = passwordStrength(password);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name || !email || !password || !agree) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    // Simulated sign-up — no real backend.
    setTimeout(() => setStatus('success'), 1100);
  }

  return (
    <div className="min-h-dvh bg-ivory pt-[var(--header-h)]">
      <div className="grid min-h-[calc(100dvh-var(--header-h))] lg:grid-cols-2">
        {/* LEFT — brand showcase (adapts to role) */}
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
              <Sparkles size={12} /> {copy.badge}
            </Badge>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight text-ivory xl:text-[2.75rem]">
              {copy.heading}
            </h1>
            <p className="mt-4 text-ivory/75">{copy.body}</p>

            <ul className="mt-10 space-y-6">
              {copy.bullets.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-gold-300 ring-1 ring-inset ring-white/15">
                    <Icon size={20} />
                  </span>
                  <p className="text-sm text-ivory/85">{text}</p>
                </li>
              ))}
            </ul>
          </div>

          <figure className="relative max-w-md rounded-2xl bg-white/10 p-6 text-ivory ring-1 ring-inset ring-white/15 backdrop-blur">
            <blockquote className="font-display text-lg leading-relaxed">
              “Joining as a guide was the best campus job I’ve had — flexible hours and I love
              showing families around.”
            </blockquote>
            <figcaption className="mt-4 text-sm text-ivory/70">Marcus T. — junior, top guide</figcaption>
          </figure>
        </aside>

        {/* RIGHT — form */}
        <main className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            {/* Compact mobile brand */}
            <div className="mb-8 lg:hidden">
              <Logo />
            </div>

            <div className="mb-7">
              <h2 className="font-display text-3xl font-semibold text-ink-900 sm:text-[2rem]">
                Create your account
              </h2>
              <p className="mt-2 text-sm text-ink-600">
                Join in under a minute — no booking fees to sign up.
              </p>
            </div>

            {status === 'success' ? (
              <div
                role="status"
                className="flex items-start gap-3 rounded-2xl border border-verified/30 bg-verified/10 p-5 text-sm text-ink-800"
              >
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-verified" />
                <div>
                  <p className="font-semibold text-ink-900">Account created</p>
                  <p className="mt-1 text-ink-600">
                    Welcome aboard! Setting up your{' '}
                    {role === 'SELLER' ? 'guide' : 'visitor'} dashboard…
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Role toggle */}
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-ink-800">
                    How will you use the platform?
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {roleOptions.map(({ value, icon: Icon, title, subtitle }) => {
                      const selected = role === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRole(value)}
                          aria-pressed={selected}
                          className={cn(
                            'group flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-300 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800/30',
                            selected
                              ? 'border-maroon-800 bg-maroon-50 shadow-soft'
                              : 'border-ink-200 bg-white hover:border-maroon-300 hover:shadow-soft',
                          )}
                        >
                          <span
                            className={cn(
                              'inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
                              selected
                                ? 'bg-maroon-gradient text-ivory'
                                : 'bg-maroon-50 text-maroon-800 group-hover:bg-maroon-100',
                            )}
                          >
                            <Icon size={18} />
                          </span>
                          <span className="mt-3 text-sm font-semibold text-ink-900">{title}</span>
                          <span className="mt-1 text-xs leading-relaxed text-ink-500">
                            {subtitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {status === 'error' && (
                  <div
                    role="alert"
                    className="flex items-center gap-2.5 rounded-xl border border-maroon-200 bg-maroon-50 px-4 py-3 text-sm text-maroon-900"
                  >
                    <AlertCircle size={16} className="shrink-0" />
                    Please complete all fields and accept the terms.
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink-800">
                    Full name
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
                      aria-hidden
                    />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className={cn(inputClasses, 'pl-10')}
                    />
                  </div>
                </div>

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
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-medium text-ink-800"
                  >
                    Password
                  </label>
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
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      aria-describedby="password-hint"
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

                  {/* Strength hint */}
                  <div id="password-hint" className="mt-2">
                    <div className="flex gap-1.5" aria-hidden>
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={cn(
                            'h-1.5 flex-1 rounded-full transition-colors',
                            password && strength.score > i ? strength.tone : 'bg-ink-200',
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-ink-500">
                      {password
                        ? `Password strength: ${strength.label}`
                        : 'Use 8+ characters with a number and a symbol.'}
                    </p>
                  </div>
                </div>

                <label
                  htmlFor="agree"
                  className="flex cursor-pointer select-none items-start gap-2.5 text-sm text-ink-700"
                >
                  <input
                    id="agree"
                    name="agree"
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-ink-300 text-maroon-900 accent-maroon-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800/30"
                  />
                  <span>
                    I agree to the{' '}
                    <Link
                      href="/terms"
                      className="font-medium text-maroon-800 underline-offset-2 hover:underline"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/privacy"
                      className="font-medium text-maroon-800 underline-offset-2 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
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
                      <Loader2 size={18} className="animate-spin" /> Creating account…
                    </>
                  ) : (
                    <>
                      Create account <ArrowRight size={18} />
                    </>
                  )}
                </Button>
              </form>
            )}

            <p className="mt-8 text-center text-sm text-ink-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="rounded font-semibold text-maroon-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800/30"
              >
                Log in
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
