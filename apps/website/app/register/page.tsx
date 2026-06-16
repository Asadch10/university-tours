'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  GraduationCap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Loader2,
  AlertCircle,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Role = 'BUYER' | 'SELLER';

const inputClasses =
  'w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/15';

const roleOptions: { value: Role; icon: typeof Users; label: string; hint: string }[] = [
  { value: 'BUYER', icon: Users, label: 'Buyer', hint: 'Book campus tours' },
  { value: 'SELLER', icon: GraduationCap, label: 'Seller', hint: 'Host tours & earn' },
];

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
  const router = useRouter();
  const [role, setRole] = useState<Role>('BUYER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const strength = passwordStrength(password);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name || !email || !password || !agree) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    // Simulated sign-up — no real backend. Hand off basics to the profile step.
    try {
      localStorage.setItem('ucpt_role', role);
      localStorage.setItem('ucpt_name', name);
      localStorage.setItem('ucpt_email', email);
    } catch {
      /* storage may be unavailable — profile still works with empty defaults */
    }
    setTimeout(() => router.push('/profile'), 700);
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
            Create your account
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            Join in under a minute — no fees to sign up.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-ink-200/70 bg-white p-6 shadow-card sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Role: Buyer / Seller */}
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink-800">I want to join as</legend>
              <div className="grid grid-cols-2 gap-3">
                {roleOptions.map(({ value, icon: Icon, label, hint }) => {
                  const selected = role === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRole(value)}
                      aria-pressed={selected}
                      className={cn(
                        'relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-300 ease-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-800/30',
                        selected
                          ? 'border-maroon-800 bg-maroon-50 shadow-soft'
                          : 'border-ink-200 bg-white hover:border-maroon-300 hover:shadow-soft',
                      )}
                    >
                      {selected && (
                        <span className="absolute right-2.5 top-2.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-maroon-900 text-ivory">
                          <Check size={12} />
                        </span>
                      )}
                      <span
                        className={cn(
                          'inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
                          selected
                            ? 'bg-maroon-gradient text-ivory'
                            : 'bg-maroon-50 text-maroon-800',
                        )}
                      >
                        <Icon size={20} />
                      </span>
                      <span className="text-sm font-semibold text-ink-900">{label}</span>
                      <span className="text-xs text-ink-500">{hint}</span>
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
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-800">
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
                  className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-400 transition-colors hover:text-ink-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
                className="mt-0.5 h-4 w-4 rounded border-ink-300 text-maroon-900 accent-maroon-900"
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" className="font-medium text-maroon-800 underline-offset-2 hover:underline">
                  Terms
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="font-medium text-maroon-800 underline-offset-2 hover:underline">
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
        </div>

        <p className="mt-7 text-center text-sm text-ink-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="rounded font-semibold text-maroon-800 underline-offset-2 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
