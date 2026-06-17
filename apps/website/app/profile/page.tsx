'use client';

import { useEffect, useRef, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Cake,
  MapPin,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Languages,
  DollarSign,
  Camera,
  Heart,
  Plus,
  X,
  UploadCloud,
  FileCheck2,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Role = 'BUYER' | 'SELLER';

const inputClasses =
  'w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/15';
const selectClasses = cn(inputClasses, 'cursor-pointer appearance-none');

const EDUCATION_LEVELS = ['High school', 'Undergraduate', 'Graduate', 'Postgraduate', 'Other'];
const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
const currentYear = 2026;
const GRAD_YEARS = Array.from({ length: 12 }, (_, i) => currentYear - 4 + i);
const HOBBY_SUGGESTIONS = [
  'Photography',
  'Music',
  'Sports',
  'Travel',
  'Reading',
  'Art',
  'Cooking',
  'Volunteering',
  'Fitness',
  'Gaming',
];

function Field({
  id,
  label,
  icon: Icon,
  hint,
  children,
}: {
  id: string;
  label: string;
  icon: typeof User;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-2 text-sm font-medium text-ink-800">
        {label}
        {hint && <span className="text-xs font-normal text-ink-400">{hint}</span>}
      </label>
      <div className="relative">
        <Icon
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
          aria-hidden
        />
        {children}
      </div>
    </div>
  );
}

function SectionHeader({
  step,
  title,
  desc,
}: {
  step: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-maroon-50 font-display text-sm font-bold text-maroon-800">
        {step}
      </span>
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
        <p className="text-sm text-ink-500">{desc}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [role, setRole] = useState<Role>('BUYER');
  const [photo, setPhoto] = useState<string | null>(null);
  const [doc, setDoc] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [fields, setFields] = useState({
    name: '',
    email: '',
    dob: '',
    gender: '',
    phone: '',
    location: '',
    educationLevel: '',
    gradYear: '',
    school: '',
    study: '',
    languages: '',
    rate: '',
    bio: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const photoInput = useRef<HTMLInputElement>(null);
  const docInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const r = localStorage.getItem('ucpt_role');
      if (r === 'SELLER' || r === 'BUYER') setRole(r);
      setFields((f) => ({
        ...f,
        name: localStorage.getItem('ucpt_name') ?? '',
        email: localStorage.getItem('ucpt_email') ?? '',
      }));
    } catch {
      /* storage unavailable — start with empty defaults */
    }
  }, []);

  // When the profile is submitted, jump back to the top so the review message
  // is visible instead of leaving the user scrolled down by the footer.
  useEffect(() => {
    if (status === 'success') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [status]);

  function set<K extends keyof typeof fields>(key: K, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    if (status === 'error') setStatus('idle');
  }

  function addInterest(value: string) {
    const t = value.trim();
    if (t && !interests.includes(t) && interests.length < 12) {
      setInterests((arr) => [...arr, t]);
    }
    setInterestInput('');
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPhoto(URL.createObjectURL(file));
  }

  const isSeller = role === 'SELLER';

  // Live completion meter.
  const checks = [
    fields.name,
    fields.email,
    fields.dob,
    fields.gender,
    fields.phone,
    fields.location,
    fields.educationLevel,
    fields.gradYear,
    fields.school,
    fields.study,
    interests.length ? 'x' : '',
    fields.bio,
    ...(isSeller ? [doc ? 'x' : '', fields.languages, fields.rate] : []),
  ];
  const filled = checks.filter(Boolean).length;
  const completion = Math.round((filled / checks.length) * 100);

  const initials =
    fields.name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fields.name || !fields.dob || !fields.educationLevel || !fields.study) {
      setErrorMsg('Please fill in your name, date of birth, education level, and field of study.');
      setStatus('error');
      return;
    }
    if (isSeller && !doc) {
      setErrorMsg('As a current student, please upload proof of your enrollment to get verified.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    // Simulated save — wire to @ucpt/sdk profile + verification endpoints later.
    setTimeout(() => setStatus('success'), 1000);
  }

  if (status === 'success') {
    return (
      <main className="relative min-h-dvh overflow-hidden bg-ivory pb-20 pt-[calc(var(--header-h)+3rem)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-radial-fade" aria-hidden />
        <div className="relative mx-auto w-full max-w-lg px-5">
          <div className="rounded-3xl border border-verified/30 bg-white p-8 text-center shadow-card">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-verified/10">
              <CheckCircle2 size={34} className="text-verified" />
            </div>
            <h1 className="mt-5 font-display text-2xl font-semibold text-ink-900">
              Profile under review
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
              Thanks, {fields.name.split(' ')[0] || 'there'}! Your profile has been submitted and is
              now under review. Our admin team will verify your details
              {isSeller ? ' and enrollment proof' : ''} and approve your account. You’ll receive an
              email once it’s approved.
            </p>
            <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-ink-50 px-4 py-2 text-xs font-medium text-ink-600 ring-1 ring-inset ring-ink-100">
              <Mail size={14} className="text-maroon-800" />
              We’ll email {fields.email || 'you'} with the result.
            </div>
            <div className="mt-7 flex justify-center">
              <Button type="button" variant="primary" size="lg" onClick={() => setStatus('idle')}>
                Edit profile
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh bg-ivory pb-20 pt-[calc(var(--header-h)+2.5rem)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-radial-fade" aria-hidden />

      <div className="relative mx-auto w-full max-w-6xl px-5">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-[2rem]">
            Complete your profile
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            {isSeller
              ? 'Tell families about yourself and verify your enrollment so they can book you with confidence.'
              : 'Add a few details so guides can tailor your campus visit to you.'}
          </p>
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[320px_1fr]">
          {/* Summary / preview card */}
          <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
            <div className="overflow-hidden rounded-3xl border border-ink-200/70 bg-white shadow-card">
              <div className="relative h-20 bg-maroon-gradient">
                <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
              </div>
              <div className="px-6 pb-6">
                <div className="-mt-10 flex items-end justify-between">
                  <div className="relative">
                    <span className="inline-flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-maroon-gradient font-display text-2xl font-bold text-ivory shadow-soft ring-4 ring-white">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt="Your profile" className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => photoInput.current?.click()}
                      aria-label="Upload a photo"
                      className="absolute -bottom-1.5 -right-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white text-maroon-800 shadow-soft transition-colors hover:bg-maroon-50"
                    >
                      <Camera size={15} />
                    </button>
                    <input
                      ref={photoInput}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onPhoto}
                    />
                  </div>
                  <span
                    className={cn(
                      'mb-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset',
                      isSeller
                        ? 'bg-gold-100 text-gold-800 ring-gold-200'
                        : 'bg-maroon-50 text-maroon-800 ring-maroon-100',
                    )}
                  >
                    {isSeller ? 'Current Student' : 'Family / Student'}
                  </span>
                </div>

                <h2 className="mt-4 font-display text-xl font-semibold text-ink-900">
                  {fields.name || 'Your name'}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
                  <MapPin size={14} /> {fields.location || 'Add your location'}
                </p>
                {fields.study && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
                    <BookOpen size={14} /> {fields.study}
                  </p>
                )}

                {/* Completion meter */}
                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs font-medium text-ink-600">
                    <span>Profile completion</span>
                    <span className="text-maroon-800">{completion}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-gold-sheen transition-all duration-500 ease-premium"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>

                {/* Seller verification status */}
                {isSeller && (
                  <div
                    className={cn(
                      'mt-5 flex items-start gap-2.5 rounded-2xl border p-3 text-xs',
                      doc
                        ? 'border-verified/30 bg-verified/10 text-ink-700'
                        : 'border-gold-200 bg-gold-50 text-ink-700',
                    )}
                  >
                    <ShieldCheck
                      size={16}
                      className={cn('mt-px shrink-0', doc ? 'text-verified' : 'text-gold-600')}
                    />
                    <span>
                      {doc ? (
                        <>Enrollment proof added — pending review.</>
                      ) : (
                        <>Upload enrollment proof below to get verified.</>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-8 rounded-3xl border border-ink-200/70 bg-white p-6 shadow-card sm:p-8"
          >
            {status === 'error' && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl border border-maroon-200 bg-maroon-50 px-4 py-3 text-sm text-maroon-900"
              >
                <AlertCircle size={16} className="shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* 1 — Personal */}
            <section className="space-y-5">
              <SectionHeader step={1} title="Personal details" desc="The basics about you." />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="name" label="Full name" icon={User}>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={fields.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Jane Doe"
                    className={cn(inputClasses, 'pl-10')}
                  />
                </Field>
                <Field id="email" label="Email" icon={Mail}>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={fields.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="you@example.com"
                    className={cn(inputClasses, 'pl-10')}
                  />
                </Field>
                <Field id="dob" label="Date of birth" icon={Cake}>
                  <input
                    id="dob"
                    type="date"
                    required
                    value={fields.dob}
                    onChange={(e) => set('dob', e.target.value)}
                    className={cn(inputClasses, 'pl-10')}
                  />
                </Field>
                <Field id="gender" label="Gender" icon={User}>
                  <select
                    id="gender"
                    value={fields.gender}
                    onChange={(e) => set('gender', e.target.value)}
                    className={cn(selectClasses, 'pl-10')}
                  >
                    <option value="">Select</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="phone" label="Phone" icon={Phone}>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={fields.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className={cn(inputClasses, 'pl-10')}
                  />
                </Field>
                <Field id="location" label="Location" icon={MapPin}>
                  <input
                    id="location"
                    type="text"
                    autoComplete="address-level2"
                    value={fields.location}
                    onChange={(e) => set('location', e.target.value)}
                    placeholder="City, Country"
                    className={cn(inputClasses, 'pl-10')}
                  />
                </Field>
              </div>
            </section>

            <hr className="border-ink-100" />

            {/* 2 — Education */}
            <section className="space-y-5">
              <SectionHeader step={2} title="Education" desc="Where and what you study." />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="educationLevel" label="Education level" icon={GraduationCap}>
                  <select
                    id="educationLevel"
                    required
                    value={fields.educationLevel}
                    onChange={(e) => set('educationLevel', e.target.value)}
                    className={cn(selectClasses, 'pl-10')}
                  >
                    <option value="">Select level</option>
                    {EDUCATION_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="gradYear" label="Graduation year" icon={CalendarDays}>
                  <select
                    id="gradYear"
                    value={fields.gradYear}
                    onChange={(e) => set('gradYear', e.target.value)}
                    className={cn(selectClasses, 'pl-10')}
                  >
                    <option value="">Select year</option>
                    {GRAD_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="school" label="University / School" icon={GraduationCap}>
                  <input
                    id="school"
                    type="text"
                    value={fields.school}
                    onChange={(e) => set('school', e.target.value)}
                    placeholder="e.g. Stanford University"
                    className={cn(inputClasses, 'pl-10')}
                  />
                </Field>
                <Field id="study" label="Field of study" icon={BookOpen}>
                  <input
                    id="study"
                    type="text"
                    required
                    value={fields.study}
                    onChange={(e) => set('study', e.target.value)}
                    placeholder="e.g. Computer Science"
                    className={cn(inputClasses, 'pl-10')}
                  />
                </Field>
              </div>
            </section>

            <hr className="border-ink-100" />

            {/* 3 — Interests & hobbies */}
            <section className="space-y-4">
              <SectionHeader
                step={3}
                title="Interests & hobbies"
                desc="What you love — it helps match you with the right people."
              />
              <Field id="interest" label="Add an interest" icon={Heart} hint="press Enter to add">
                <input
                  id="interest"
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addInterest(interestInput);
                    }
                  }}
                  placeholder="e.g. Hiking"
                  className={cn(inputClasses, 'pl-10')}
                />
              </Field>

              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {interests.map((h) => (
                    <span
                      key={h}
                      className="inline-flex items-center gap-1.5 rounded-full bg-maroon-50 py-1.5 pl-3 pr-1.5 text-sm font-medium text-maroon-900 ring-1 ring-inset ring-maroon-100"
                    >
                      {h}
                      <button
                        type="button"
                        onClick={() => setInterests((arr) => arr.filter((x) => x !== h))}
                        aria-label={`Remove ${h}`}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-maroon-700 transition-colors hover:bg-maroon-200/60"
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {HOBBY_SUGGESTIONS.filter((s) => !interests.includes(s)).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addInterest(s)}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-ink-300 px-3 py-1.5 text-sm text-ink-600 transition-colors hover:border-maroon-300 hover:bg-maroon-50 hover:text-maroon-900"
                  >
                    <Plus size={13} /> {s}
                  </button>
                ))}
              </div>
            </section>

            {/* 4 — Seller verification + guide details */}
            {isSeller && (
              <>
                <hr className="border-ink-100" />
                <section className="space-y-5">
                  <SectionHeader
                    step={4}
                    title="Verification"
                    desc="Required — proof of current enrollment keeps the marketplace trusted."
                  />

                  <div
                    className={cn(
                      'rounded-2xl border-2 border-dashed p-5 transition-colors',
                      doc ? 'border-verified/40 bg-verified/5' : 'border-ink-200 bg-ink-50/40',
                    )}
                  >
                    {doc ? (
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-verified/10 text-verified">
                          <FileCheck2 size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink-900">{doc}</p>
                          <p className="text-xs text-verified">Uploaded — pending team review</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => docInput.current?.click()}
                          className="rounded-lg px-3 py-1.5 text-sm font-medium text-maroon-800 transition-colors hover:bg-maroon-50"
                        >
                          Replace
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => docInput.current?.click()}
                        className="flex w-full flex-col items-center gap-2 py-3 text-center"
                      >
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-maroon-50 text-maroon-800">
                          <UploadCloud size={22} />
                        </span>
                        <span className="text-sm font-semibold text-ink-900">
                          Upload proof of enrollment
                        </span>
                        <span className="text-xs text-ink-500">
                          Student ID, enrollment letter, or transcript · PDF/JPG/PNG, up to 10MB
                        </span>
                      </button>
                    )}
                    <input
                      ref={docInput}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setDoc(file.name);
                          if (status === 'error') setStatus('idle');
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-ink-500">
                    Your document is used only to verify enrollment and is never shown publicly.
                  </p>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="languages" label="Languages" icon={Languages}>
                      <input
                        id="languages"
                        type="text"
                        value={fields.languages}
                        onChange={(e) => set('languages', e.target.value)}
                        placeholder="English, Spanish"
                        className={cn(inputClasses, 'pl-10')}
                      />
                    </Field>
                    <Field id="rate" label="Tour rate (USD)" icon={DollarSign}>
                      <input
                        id="rate"
                        type="number"
                        min={0}
                        value={fields.rate}
                        onChange={(e) => set('rate', e.target.value)}
                        placeholder="65"
                        className={cn(inputClasses, 'pl-10')}
                      />
                    </Field>
                  </div>
                </section>
              </>
            )}

            <hr className="border-ink-100" />

            {/* About */}
            <section className="space-y-3">
              <SectionHeader
                step={isSeller ? 5 : 4}
                title="About you"
                desc={isSeller ? 'Introduce yourself to families.' : 'What you’re hoping to see.'}
              />
              <textarea
                id="bio"
                rows={4}
                value={fields.bio}
                onChange={(e) => set('bio', e.target.value)}
                placeholder={
                  isSeller
                    ? 'Share what makes your campus tours special…'
                    : 'Tell guides what you’re hoping to see and learn…'
                }
                className={cn(inputClasses, 'resize-y leading-relaxed')}
              />
            </section>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Saving profile…
                </>
              ) : (
                <>
                  Save profile <ArrowRight size={18} />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
