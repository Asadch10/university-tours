'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { AuthShell, authInputClasses } from '@/components/auth/auth-shell';
import { signIn } from '@/lib/auth';
import { cn } from '@/lib/utils';

const COUNTRY_CODES = [
  { flag: '🇺🇸', code: '+1', label: 'US' },
  { flag: '🇬🇧', code: '+44', label: 'UK' },
  { flag: '🇨🇦', code: '+1', label: 'CA' },
  { flag: '🇦🇺', code: '+61', label: 'AU' },
  { flag: '🇮🇳', code: '+91', label: 'IN' },
  { flag: '🇵🇰', code: '+92', label: 'PK' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [dialCode, setDialCode] = useState('+1');
  const [phone, setPhone] = useState('');
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const isValid = Boolean(email && firstName && lastName && password && agree);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValid) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    // Simulated sign-up — no real backend. Persist the account (which also
    // marks the user as logged in for the header) and hand off to the profile.
    signIn({ name: `${firstName} ${lastName}`.trim(), email });
    setTimeout(() => router.push('/profile'), 700);
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {status === 'error' && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl border border-maroon-200 bg-maroon-50 px-4 py-3 text-sm text-maroon-900"
          >
            <AlertCircle size={16} className="shrink-0" />
            Please complete all fields and accept the terms.
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

        {/* First + last name */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="mb-2 block text-sm font-bold text-ink-900">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              className={authInputClasses}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-2 block text-sm font-bold text-ink-900">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className={authInputClasses}
            />
          </div>
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
        </div>

        {/* Phone number */}
        <div>
          <label htmlFor="phone" className="mb-2 block text-sm font-bold text-ink-900">
            Phone number
          </label>
          <div className="flex items-center rounded-lg border border-ink-200 bg-white transition-colors focus-within:border-maroon-800 focus-within:ring-2 focus-within:ring-maroon-800/15">
            <div className="relative flex items-center gap-1.5 border-r border-ink-200 pl-3 pr-2">
              <select
                aria-label="Country code"
                value={dialCode}
                onChange={(e) => setDialCode(e.target.value)}
                className="cursor-pointer appearance-none bg-transparent py-3 pr-5 text-sm text-ink-900 focus:outline-none"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.label} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 000-0000"
              className="w-full min-w-0 bg-transparent px-3 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Terms */}
        <label
          htmlFor="agree"
          className="flex cursor-pointer select-none items-start gap-2.5 text-sm leading-relaxed text-ink-700"
        >
          <input
            id="agree"
            name="agree"
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-maroon-900 accent-maroon-900"
          />
          <span>
            I agree to University Campus Private Tours&apos;{' '}
            <Link href="/terms" className="font-medium text-maroon-900 underline-offset-2 hover:underline">
              Terms of Service
            </Link>{' '}
            and acknowledge the{' '}
            <Link href="/privacy" className="font-medium text-maroon-900 underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            . I understand that University Campus Private Tours is not affiliated with schools to
            ensure every tour is authentic and unbiased.
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={status === 'loading'}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed',
            isValid
              ? 'bg-maroon-900 text-white hover:bg-maroon-800'
              : 'bg-ink-100 text-ink-500',
          )}
        >
          {status === 'loading' ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Creating account…
            </>
          ) : (
            'Sign up'
          )}
        </button>
      </form>
    </AuthShell>
  );
}
