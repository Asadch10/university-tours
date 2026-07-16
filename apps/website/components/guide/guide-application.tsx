'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { universities } from '@/lib/data';
import {
  accountApi,
  friendlyError,
  questionnaireApi,
  type QuestionnaireQuestion,
} from '@/lib/client-api';
import { updateSessionUser } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { AvailabilityPicker } from '@/components/guide/availability-picker';
import {
  parseAvailability,
  cleanAvailability,
  missingAvailability,
  labelToService,
  TOUR_TYPE_LABELS,
  type Availability,
  type ServiceType,
} from '@/lib/availability';

const TOUR_TYPE_OPTIONS = ['Campus tour', 'Video chat', 'Consultancy'];

type Step = 'details' | 'paid' | 'photos';

const STEPS: { key: Step; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'paid', label: 'Getting paid' },
  { key: 'photos', label: 'Photos' },
];

const inp =
  'w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-maroon-800 focus:outline-none focus:ring-2 focus:ring-maroon-800/15';
const sel = `${inp} cursor-pointer`;
const area = `${inp} min-h-[110px] resize-y leading-relaxed`;

const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
const ACADEMIC_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate student'];
const ADMISSION_TYPES = ['First-year', 'Transfer', 'International', 'Graduate'];
const ACADEMIC_FOCUS = ['STEM', 'Business', 'Humanities', 'Social sciences', 'Arts', 'Health / Medicine', 'Undecided'];
const PERSONALITY_TYPES = ['Introvert', 'Extrovert', 'Ambivert'];
const EXPERIENCE_RATINGS = ['Excellent', 'Very good', 'Good', 'Fair', 'Poor'];
const YES_NO = ['Yes', 'No'];
const EXTRACURRICULARS = [
  'Greek life', 'Club/Organization', 'Job/Internship', 'ROTC', 'NCAA varsity sport', 'Recreational sport',
  'Student government', 'Community service', 'Religious/Cultural group', 'Art/Music/Performance', 'Study abroad', 'Other',
];
const HOUSING = ['Dorm', 'Off-campus house or apartment', 'Fraternity or sorority house', 'Home (Commuter)', 'Other'];

const GUIDELINES = [
  { key: 'personable', title: 'Be personable', img: universities[0]?.image, body: "It's essential to share your personal story as a college student. Your guest chose you as their guide and wants to hear about your college experience. Be honest when answering questions and simply tell the truth about the awesome and not-so-awesome aspects of your school." },
  { key: 'punctual', title: 'Be punctual', img: universities[1]?.image, body: 'Treat hosting tours like a job commitment and be welcoming, kind, engaging and punctual. Your guest is paying you money and they deserve a great experience. Keep your availability updated, arrive on time, and always communicate with your guests.' },
  { key: 'prepared', title: 'Be prepared', img: universities[2]?.image, body: '', link: true },
];

function Field({ label, desc, required, children }: { label: string; desc?: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <p className="text-base font-bold text-ink-900">{label}</p>
      {desc && <p className="mt-0.5 text-sm text-ink-500">{desc}</p>}
      <div className="mt-2">{children}</div>
      {required && <p className="mt-1.5 text-sm font-semibold text-red-600">Required</p>}
    </div>
  );
}

function CheckboxList({ name, options }: { name: string; options: string[] }) {
  return (
    <div className="space-y-1">
      {options.map((o) => (
        <label key={o} className="flex cursor-pointer select-none items-center gap-2.5 py-1 text-sm text-ink-800">
          <input type="checkbox" name={name} value={o} className="h-4 w-4 rounded border-ink-300 text-maroon-900 accent-maroon-900" />
          {o}
        </label>
      ))}
    </div>
  );
}

function Select({ name, options, placeholder = 'Select…' }: { name: string; options: string[]; placeholder?: string }) {
  return (
    <select name={name} className={sel} defaultValue="">
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/** Renders one admin-managed question by its type. */
function QuestionInput({
  q,
  value,
  onChange,
}: {
  q: QuestionnaireQuestion;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}) {
  if (q.type === 'LONG_TEXT') {
    return (
      <textarea
        className={area}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your answer here…"
      />
    );
  }
  if (q.type === 'SINGLE_CHOICE') {
    return (
      <select className={sel} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {q.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  if (q.type === 'MULTI_CHOICE') {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-1">
        {q.options.map((o) => (
          <label key={o} className="flex cursor-pointer select-none items-center gap-2.5 py-1 text-sm text-ink-800">
            <input
              type="checkbox"
              checked={arr.includes(o)}
              onChange={(e) => onChange(e.target.checked ? [...arr, o] : arr.filter((x) => x !== o))}
              className="h-4 w-4 rounded border-ink-300 text-maroon-900 accent-maroon-900"
            />
            {o}
          </label>
        ))}
      </div>
    );
  }
  // TEXT (and FILE fallback) → single-line input.
  return (
    <input
      className={inp}
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Write your answer here…"
    />
  );
}

export function GuideApplication() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<Step>('details');
  const [loading, setLoading] = useState(true);
  const [savingStep, setSavingStep] = useState(false);
  const [schoolNotListed, setSchoolNotListed] = useState(false);
  const [agree, setAgree] = useState(false);
  // Tour type + availability are controlled (they drive per-type availability UI).
  const [tourTypes, setTourTypes] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Availability>({});
  // Admin-managed extra questions + answers (keyed by question id).
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [requiredPhotos, setRequiredPhotos] = useState(3);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState(false);
  const idInput = useRef<HTMLInputElement>(null);
  const [paidAgreed, setPaidAgreed] = useState<Record<string, boolean>>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const photosInput = useRef<HTMLInputElement>(null);
  const detailsFormRef = useRef<HTMLFormElement>(null);
  const draftRef = useRef<Record<string, unknown> | null>(null);

  const allPaidAgreed = GUIDELINES.every((g) => paidAgreed[g.key]);
  const togglePaid = (key: string) => setPaidAgreed((p) => ({ ...p, [key]: !p[key] }));

  // Load any saved draft so a half-finished application resumes on the first unfilled step.
  useEffect(() => {
    let active = true;
    accountApi
      .getMe()
      .then((me) => {
        if (!active) return;
        const p = (me.profileJson ?? {}) as Record<string, unknown>;
        const draft = (p.guideListing ?? null) as Record<string, unknown> | null;
        if (draft) {
          draftRef.current = draft;
          if (draft.agreedContract) setAgree(true);
          if (draft.agreedGuidelines) {
            setPaidAgreed(Object.fromEntries(GUIDELINES.map((g) => [g.key, true])));
          }
          const school = typeof draft.school === 'string' ? draft.school : '';
          if (school && !universities.some((u) => u.name === school)) setSchoolNotListed(true);
          if (Array.isArray(draft.tourTypes)) {
            setTourTypes(draft.tourTypes.filter((t): t is string => typeof t === 'string'));
          }
          setAvailability(parseAvailability(draft.availability));
          // (Questionnaire answers are restored by key once questions load — see effect below.)
          // Restore previously-uploaded photos (ignore legacy in-session blob URLs).
          if (Array.isArray(draft.photos)) {
            setPhotos(draft.photos.filter((p): p is string => typeof p === 'string' && /^https?:\/\//.test(p)));
          }
          if (typeof draft.idPhoto === 'string' && /^https?:\/\//.test(draft.idPhoto)) {
            setIdPhoto(draft.idPhoto);
          }
          // Resume at the step after the last one the user completed.
          if (draft.completedStep === 'paid') setStep('photos');
          else if (draft.completedStep === 'details') setStep('paid');
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    // Admin-managed extra questions + required photo count.
    questionnaireApi
      .active()
      .then((q) => {
        if (!active) return;
        setQuestions(q.questions);
        setRequiredPhotos(q.requiredPhotos > 0 ? q.requiredPhotos : 3);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // Once loaded, imperatively repopulate the (uncontrolled) details form from the draft.
  useEffect(() => {
    if (loading) return;
    const draft = draftRef.current;
    const form = detailsFormRef.current;
    if (!draft || !form) return;

    const setVal = (name: string, val: unknown) => {
      const el = form.elements.namedItem(name) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | null;
      if (el && typeof val === 'string') el.value = val;
    };
    const checkGroup = (name: string, values: unknown) => {
      const set = new Set(Array.isArray(values) ? values.map(String) : []);
      form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`).forEach((el) => {
        el.checked = set.has(el.value);
      });
    };

    setVal('listingTitle', draft.listingTitle);
    setVal('intro', draft.intro);
    setVal(schoolNotListed ? 'schoolCustom' : 'school', draft.school);
    setVal('gender', draft.gender);
    setVal('academicYear', draft.academicYear);
    setVal('age', draft.age);
    setVal('admissionType', draft.admissionType);
    setVal('hometown', draft.hometown);
    setVal('academicFocus', draft.academicFocus);
    setVal('majors', draft.majors);
    setVal('minors', draft.minors);
    setVal('clubs', draft.clubs);
    setVal('personality', draft.personality);
    setVal('experienceRating', draft.experienceRating);
    setVal('describeExperience', draft.describeExperience);
    setVal('tip', draft.tip);
    setVal('favoriteClass', draft.favoriteClass);
    setVal('careerGoals', draft.careerGoals);
    setVal('freeNight', draft.freeNight);
    setVal('highSchool', draft.highSchool);
    setVal('previousCollege', draft.previousCollege);
    setVal('groupTours', draft.groupTours);
    setVal('referral', draft.referral);
    checkGroup('extracurriculars', draft.extracurriculars);
    checkGroup('housing', draft.housing);
  }, [loading, schoolNotListed]);

  // Restore questionnaire answers once the questions load: read each from the
  // draft under its stable key (e.g. draft.gender) so a half-finished (or legacy)
  // application repopulates correctly.
  useEffect(() => {
    const draft = draftRef.current;
    if (!draft || questions.length === 0) return;
    setAnswers((prev) => {
      const next = { ...prev };
      for (const q of questions) {
        if (next[q.id] !== undefined) continue;
        const raw = draft[q.key ?? q.id];
        if (raw === undefined || raw === null) continue;
        next[q.id] = Array.isArray(raw)
          ? raw.filter((x): x is string => typeof x === 'string')
          : String(raw);
      }
      return next;
    });
  }, [questions]);

  /** Read the current details form into the listing shape shared by draft saves and publish. */
  function collectDetails() {
    const fd = detailsFormRef.current ? new FormData(detailsFormRef.current) : new FormData();
    const g = (k: string) => ((fd.get(k) as string | null) ?? '').toString().trim();
    const services = tourTypes.map(labelToService).filter((s): s is ServiceType => s !== null);

    // Each questionnaire answer is written under its stable key (e.g. "gender",
    // "hometown") so the guide profile / search read it exactly as before. A
    // label/type snapshot is also kept for display of custom (keyless) questions.
    const byKey: Record<string, string | string[]> = {};
    const snapshot: { questionId: string; key: string | null; label: string; type: string; value: string | string[] }[] = [];
    for (const q of questions) {
      const value = answers[q.id] ?? (q.type === 'MULTI_CHOICE' ? [] : '');
      byKey[q.key || q.id] = value;
      snapshot.push({ questionId: q.id, key: q.key, label: q.label, type: q.type, value });
    }

    return {
      listingTitle: g('listingTitle'),
      intro: g('intro'),
      school: schoolNotListed ? g('schoolCustom') : g('school'),
      tourTypes,
      ...byKey,
      availability: cleanAvailability(availability, services),
      answers: snapshot.filter((a) => (Array.isArray(a.value) ? a.value.length > 0 : String(a.value).trim() !== '')),
      agreedContract: agree,
    };
  }

  // Step 1 → save the details as a draft, then advance to "Getting paid".
  async function saveDetails() {
    const details = collectDetails();
    // School and tour type drive what guests and admins see, so require them here.
    if (!details.school.trim()) {
      toast.error('School required', 'Please select or enter your school before continuing.');
      return;
    }
    if (!details.tourTypes.length) {
      toast.error('Tour type required', 'Please select at least one tour type before continuing.');
      return;
    }
    // Every selected tour type needs at least one date and one time — that's what
    // guests can book for that type.
    const services = details.tourTypes
      .map(labelToService)
      .filter((s): s is ServiceType => s !== null);
    const missing = missingAvailability(availability, services);
    if (missing.length) {
      toast.error(
        'Availability required',
        `Add at least one date and time for: ${missing.map((s) => TOUR_TYPE_LABELS[s]).join(', ')}.`,
      );
      return;
    }
    // Admin-managed required questions must be answered.
    const missingQ = questions.find((q) => {
      if (!q.required) return false;
      const v = answers[q.id];
      return Array.isArray(v) ? v.length === 0 : !String(v ?? '').trim();
    });
    if (missingQ) {
      toast.error('Answer required', `Please answer: “${missingQ.label}”.`);
      return;
    }
    if (!idPhoto) {
      toast.error('Student ID required', 'Please upload a photo of your student ID — admins verify it to approve you.');
      return;
    }
    setSavingStep(true);
    try {
      // idPhoto is the proof-of-identity the admin reviews to approve the application.
      await accountApi.saveGuideListing({ ...details, idPhoto, status: 'draft', completedStep: 'details' });
      setStep('paid');
    } catch (e) {
      toast.error('Could not save your details', friendlyError(e));
    } finally {
      setSavingStep(false);
    }
  }

  // Step 2 → save the guidelines agreement as a draft, then advance to "Photos".
  async function savePaid() {
    setSavingStep(true);
    try {
      await accountApi.saveGuideListing({ agreedGuidelines: allPaidAgreed, status: 'draft', completedStep: 'paid' });
      setStep('photos');
    } catch (e) {
      toast.error('Could not save', friendlyError(e));
    } finally {
      setSavingStep(false);
    }
  }

  // Step 3 → submit the full listing for review and become a guide.
  async function publish() {
    setPublishing(true);
    try {
      const res = await accountApi.saveGuideListing({
        ...collectDetails(),
        idPhoto, // proof-of-identity — carried through so it's never lost at publish
        agreedGuidelines: allPaidAgreed,
        photos,
        completedStep: 'photos',
      });
      updateSessionUser({ hasListing: true, role: res.role ?? 'SELLER' });
      toast.success('Listing submitted', 'It’s now under review.');
      router.push('/manage-listing');
    } catch (e) {
      toast.error('Could not publish listing', friendlyError(e));
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-white pt-[var(--header-h)]">
        <Loader2 className="animate-spin text-maroon-800" size={28} />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-white pt-[var(--header-h)]">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 lg:grid-cols-[300px_1fr]">
        {/* Left rail — steps */}
        <aside className="border-b border-ink-100 bg-ivory/40 px-6 py-10 lg:min-h-[calc(100dvh-var(--header-h))] lg:border-b-0 lg:border-r lg:px-8">
          <nav className="space-y-1" aria-label="Application steps">
            {STEPS.map((s) => {
              const on = step === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStep(s.key)}
                  className={cn(
                    'relative block w-full rounded-lg px-3 py-2.5 text-left text-lg font-medium transition-colors',
                    on ? 'text-maroon-900' : 'text-ink-400 hover:bg-ink-50 hover:text-ink-700',
                  )}
                >
                  {on && <span className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-maroon-900" aria-hidden />}
                  {s.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <section className="px-6 py-10 sm:px-12">
          {/* Details — kept mounted (hidden on other steps) so entered values persist */}
          <form
            ref={detailsFormRef}
            onSubmit={(e) => e.preventDefault()}
            className={cn('max-w-3xl', step !== 'details' && 'hidden')}
          >
            <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">Become a guide</h1>
            <p className="mt-2 text-ink-600">You must currently be enrolled in college to be a University Campus Private Tours guide.</p>

            <div className="mt-8 space-y-8">
              <Field label="Listing title" desc="Briefly describe yourself to guests" required>
                <input name="listingTitle" className={inp} placeholder="e.g. Friendly CS junior who loves showing off campus" />
              </Field>

              <Field label="Help guests get to know you" desc="Introduce yourself in a few sentences">
                <textarea name="intro" className={area} placeholder="Write your answer here…" />
              </Field>

              <Field label="School" desc="Don't see yours listed here? Click the check box below.">
                {schoolNotListed ? (
                  <input name="schoolCustom" className={inp} placeholder="Type your school name" />
                ) : (
                  <Select name="school" options={universities.map((u) => u.name)} />
                )}
                <label className="mt-2 flex cursor-pointer select-none items-center gap-2.5 text-sm text-ink-800">
                  <input type="checkbox" checked={schoolNotListed} onChange={(e) => setSchoolNotListed(e.target.checked)} className="h-4 w-4 rounded border-ink-300 text-maroon-900 accent-maroon-900" />
                  My school is not listed, let me type my own
                </label>
              </Field>

              <Field label="Tour type" desc="Select which tours you can host. Campus tours are held in-person on campus, while video chats take place virtually. Hint: select both to increase your likelihood of getting bookings.">
                <div className="space-y-1">
                  {TOUR_TYPE_OPTIONS.map((o) => (
                    <label key={o} className="flex cursor-pointer select-none items-center gap-2.5 py-1 text-sm text-ink-800">
                      <input
                        type="checkbox"
                        checked={tourTypes.includes(o)}
                        onChange={(e) =>
                          setTourTypes((prev) =>
                            e.target.checked ? [...prev, o] : prev.filter((t) => t !== o),
                          )
                        }
                        className="h-4 w-4 rounded border-ink-300 text-maroon-900 accent-maroon-900"
                      />
                      {o}
                    </label>
                  ))}
                </div>
              </Field>

              <Field
                label="Your availability"
                desc="For each tour type you selected, choose the dates you can host and the times you're free. The times you pick apply to every date for that tour type. Guests can only book what you set here."
                required
              >
                <AvailabilityPicker
                  types={tourTypes.map(labelToService).filter((s): s is ServiceType => s !== null)}
                  value={availability}
                  onChange={setAvailability}
                />
              </Field>

              {/* About-you questions — admin-managed via the questionnaire */}
              {questions.map((q) => (
                <Field key={q.id} label={q.label} required={q.required}>
                  <QuestionInput
                    q={q}
                    value={answers[q.id]}
                    onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                  />
                </Field>
              ))}

              <Field label="Upload your student ID to confirm your eligibility" desc="Please upload a photo of your school-issued student ID that clearly shows your face and name. Your ID is confidential and will never be shared publicly.">
                <button
                  type="button"
                  onClick={() => idInput.current?.click()}
                  disabled={uploadingId}
                  className="flex aspect-square w-full max-w-xs flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-300 text-center transition-colors hover:border-maroon-400 hover:bg-maroon-50/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingId ? (
                    <>
                      <Loader2 size={24} className="animate-spin text-maroon-800" />
                      <span className="text-xs text-ink-400">Uploading…</span>
                    </>
                  ) : idPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={idPhoto} alt="Student ID" className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    <>
                      <ImagePlus size={24} className="text-ink-400" />
                      <span className="text-lg font-bold text-ink-900">+ Add a photo…</span>
                      <span className="text-xs text-ink-400">.JPG, .GIF or .PNG. Max 5MB</span>
                    </>
                  )}
                </button>
                <input
                  ref={idInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (idInput.current) idInput.current.value = '';
                    if (!f) return;
                    setUploadingId(true);
                    try {
                      // Upload so the ID persists and reaches the admin for verification.
                      const url = await accountApi.uploadPhoto(f);
                      setIdPhoto(url);
                    } catch (err) {
                      toast.error('Couldn’t upload your ID', friendlyError(err));
                    } finally {
                      setUploadingId(false);
                    }
                  }}
                />
              </Field>

              <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm text-ink-800">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-4 w-4 rounded border-ink-300 text-maroon-900 accent-maroon-900" />
                By checking the box I agree to the{' '}
                <Link href="/terms" className="font-medium text-maroon-800 hover:underline">Independent Contractor Agreement</Link>
              </label>

              <div className="pt-2">
                <Button type="button" variant="primary" size="lg" disabled={!agree || savingStep} onClick={saveDetails} className="w-full sm:w-auto">
                  {savingStep ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    'Next: Getting paid'
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Getting paid */}
          {step === 'paid' && (
            <div className="max-w-4xl">
              <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
                Earn $40/hour as a University Campus Private Tours guide
              </h1>
              <p className="mt-3 max-w-3xl text-ink-600">
                University Campus Private Tours is a great way to earn extra money in college. After each tour,
                you can transfer your earnings to your bank account. Follow the guidelines below to become a
                successful guide.
              </p>

              <div className="mt-10 grid gap-8 sm:grid-cols-3">
                {GUIDELINES.map((gg) => (
                  <div key={gg.key}>
                    <div className="aspect-square overflow-hidden rounded-2xl bg-ink-100">
                      {gg.img && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={gg.img} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <h2 className="mt-4 font-display text-xl font-semibold text-ink-900">{gg.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">
                      {gg.link ? (
                        <>
                          Prepare for tours by thinking back to when you were applying to college and remember all
                          of the things you wanted to know and the questions you had. To help you get started, we
                          put together this{' '}
                          <Link href="/resources" className="font-medium text-maroon-800 hover:underline">
                            list of topics and questions
                          </Link>
                          .
                        </>
                      ) : (
                        gg.body
                      )}
                    </p>
                    <label className="mt-4 flex cursor-pointer select-none items-center gap-2.5 text-sm font-medium text-ink-800">
                      <input type="checkbox" checked={!!paidAgreed[gg.key]} onChange={() => togglePaid(gg.key)} className="h-4 w-4 rounded border-ink-300 text-maroon-900 accent-maroon-900" />
                      I understand and agree
                    </label>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Button type="button" variant="primary" size="lg" disabled={!allPaidAgreed || savingStep} onClick={savePaid} className="w-full sm:w-auto">
                  {savingStep ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    'Next: Photos'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Photos */}
          {step === 'photos' && (
            <div className="max-w-3xl">
              <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
                Add at least {requiredPhotos} photo{requiredPhotos > 1 ? 's' : ''} of yourself
              </h1>

              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {photos.map((src, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-ink-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-soft transition-opacity hover:bg-white"
                      aria-label="Remove photo"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => photosInput.current?.click()}
                  disabled={uploadingPhotos}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink-300 text-center transition-colors hover:border-maroon-400 hover:bg-maroon-50/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingPhotos ? (
                    <>
                      <Loader2 size={22} className="animate-spin text-maroon-800" />
                      <span className="text-xs leading-tight text-ink-400">Uploading…</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold text-ink-900">+ Add photo</span>
                      <span className="text-xs leading-tight text-ink-400">.JPG, .GIF or .PNG<br />Max. 5 MB</span>
                    </>
                  )}
                </button>
              </div>
              <input
                ref={photosInput}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (photosInput.current) photosInput.current.value = '';
                  if (!files.length) return;
                  setUploadingPhotos(true);
                  try {
                    // Upload each file so the photos persist (and show on Browse guides).
                    const urls = await Promise.all(files.map((f) => accountApi.uploadPhoto(f)));
                    setPhotos((p) => [...p, ...urls]);
                  } catch (err) {
                    toast.error('Couldn’t upload photo', friendlyError(err));
                  } finally {
                    setUploadingPhotos(false);
                  }
                }}
              />

              <p className="mt-6 text-sm text-ink-400">
                Tip: Use photos of just yourself, or ensure you&apos;re easily recognizable in every photo
              </p>

              <div className="mt-8">
                <Button type="button" variant="primary" size="lg" disabled={photos.length < requiredPhotos || publishing || uploadingPhotos} onClick={publish} className="w-full sm:w-auto">
                  {publishing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Publishing…
                    </>
                  ) : (
                    'Publish listing'
                  )}
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
