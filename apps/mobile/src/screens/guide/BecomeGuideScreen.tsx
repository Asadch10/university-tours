/**
 * Become a guide.
 *
 * Same three steps, fields, validation and payload as the website's application
 * (apps/website/components/guide/guide-application.tsx) — every save writes
 * `profileJson.guideListing` through POST /users/me/guide-listing, so an application begun
 * here finishes on the website and vice versa.
 *
 * The LAYOUT is native, not a port. The web form is one tall column with its submit button
 * at the very bottom; here the fields are grouped into labelled cards, the step rail is a
 * thin progress bar in the header, choices are full-width rows, and the action stays
 * pinned above the home indicator so it is always one tap away.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { font, radius, spacing, type Palette } from '../../theme';
import { useStyles, useThemeColors } from '../../theme-context';
import { useToast } from '../../components/Toast';
import { friendlyError, session } from '../../api/auth';
import { accountApi } from '../../api/account';
import { fetchUniversities, type UniversityPin } from '../../api/schools';
import { parseAvailability, type Availability } from '../../api/guides';
import {
  cleanAvailability,
  listingApi,
  missingAvailability,
  questionnaireApi,
  servicesFor,
  uploadApi,
  type QuestionnaireQuestion,
} from '../../api/applications';
import { SERVICE_LABEL, SERVICE_DESC, TOUR_TYPE_OPTIONS, labelToService } from '../../tour-types';
import { pickImage, pickImages } from '../../media';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import {
  Card,
  CheckRow,
  Field,
  GhostButton,
  Input,
  OptionRow,
  PhotoTile,
  PrimaryButton,
  QuestionInput,
  SectionHeader,
  Select,
  StickyFooter,
  UploadRow,
  type IoniconName,
} from '../apply/form-kit';
import { AvailabilityPicker } from '../apply/AvailabilityPicker';

type Props = NativeStackScreenProps<RootStackParamList, 'BecomeGuide'>;
type Step = 'details' | 'paid' | 'photos';

const STEPS: { key: Step; label: string }[] = [
  { key: 'details', label: 'Your details' },
  { key: 'paid', label: 'Getting paid' },
  { key: 'photos', label: 'Photos' },
];

/** Icon per tour type, so the choices read at a glance instead of as three text rows. */
const TOUR_ICON: Record<string, IoniconName> = {
  'Campus tour': 'walk-outline',
  'Video chat': 'videocam-outline',
  Consultancy: 'chatbubble-ellipses-outline',
};

/** The three commitments of step 2 — same copy as the website's GUIDELINES. */
const GUIDELINES: { key: string; icon: IoniconName; title: string; body: string }[] = [
  {
    key: 'personable',
    icon: 'happy-outline',
    title: 'Be personable',
    body: "It's essential to share your personal story as a college student. Your guest chose you as their guide and wants to hear about your college experience. Be honest and tell the truth about the awesome and not-so-awesome parts of your school.",
  },
  {
    key: 'punctual',
    icon: 'time-outline',
    title: 'Be punctual',
    body: 'Treat hosting tours like a job commitment: be welcoming, kind, engaging and on time. Your guest is paying you and deserves a great experience. Keep your availability updated and always communicate.',
  },
  {
    key: 'prepared',
    icon: 'book-outline',
    title: 'Be prepared',
    body: 'Think back to when you were applying to college and remember everything you wanted to know and the questions you had — then be ready to answer them.',
  },
];

export function BecomeGuideScreen({ navigation }: Props) {
  const tc = useThemeColors();
  const s = useStyles(makeStyles);
  const toast = useToast();
  const { width } = useWindowDimensions();

  const [step, setStep] = useState<Step>('details');
  const [loading, setLoading] = useState(true);
  const [savingStep, setSavingStep] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // ── Step 1: details ──
  const [listingTitle, setListingTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [school, setSchool] = useState('');
  const [schoolNotListed, setSchoolNotListed] = useState(false);
  const [allSchools, setAllSchools] = useState<UniversityPin[]>([]);
  const [tourTypes, setTourTypes] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Availability>({});
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Step 2: getting paid ──
  const [paidAgreed, setPaidAgreed] = useState<Record<string, boolean>>({});
  const allPaidAgreed = GUIDELINES.every((g) => paidAgreed[g.key]);

  // ── Step 3: photos ──
  const [photos, setPhotos] = useState<string[]>([]);
  const [requiredPhotos, setRequiredPhotos] = useState(3);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const services = useMemo(() => servicesFor(tourTypes), [tourTypes]);
  const clearErr = (key: string) => setErrors((e) => (e[key] ? { ...e, [key]: '' } : e));

  // Three columns of photos, sized off the real viewport rather than percentages so the
  // gutters stay even on every phone width.
  const photoSize = (width - spacing(5) * 2 - spacing(4.5) * 2 - spacing(2.5) * 2) / 3;

  /* ── Load the saved draft + the admin questionnaire ─────────────────────── */
  useEffect(() => {
    let active = true;

    fetchUniversities()
      .then((u) => active && setAllSchools(u))
      .catch(() => {});

    Promise.all([
      accountApi.getMe().catch(() => null),
      questionnaireApi.active('GUIDE').catch(() => ({ questions: [], requiredPhotos: 3 })),
    ])
      .then(([me, q]) => {
        if (!active) return;
        setQuestions(q.questions ?? []);
        if (q.requiredPhotos > 0) setRequiredPhotos(q.requiredPhotos);

        const profile = (me?.profileJson ?? {}) as Record<string, unknown>;
        const draft = (profile.guideListing ?? null) as Record<string, unknown> | null;
        if (!draft) return;

        const str = (v: unknown) => (typeof v === 'string' ? v : '');
        setListingTitle(str(draft.listingTitle));
        setIntro(str(draft.intro));
        setSchool(str(draft.school));
        if (draft.agreedContract === true) setAgree(true);
        if (draft.agreedGuidelines === true) {
          setPaidAgreed(Object.fromEntries(GUIDELINES.map((g) => [g.key, true])));
        }
        if (Array.isArray(draft.tourTypes)) {
          setTourTypes(draft.tourTypes.filter((t): t is string => typeof t === 'string'));
        }
        setAvailability(parseAvailability(draft.availability));
        // Ignore any legacy in-session blob URLs — only uploaded files survive.
        if (Array.isArray(draft.photos)) {
          setPhotos(draft.photos.filter((p): p is string => typeof p === 'string' && /^https?:\/\//.test(p)));
        }
        if (/^https?:\/\//.test(str(draft.idPhoto))) setIdPhoto(str(draft.idPhoto));

        // Answers live under each question's stable key (e.g. draft.hometown).
        const restored: Record<string, string | string[]> = {};
        for (const question of q.questions ?? []) {
          const raw = draft[question.key ?? question.id];
          if (raw === undefined || raw === null) continue;
          restored[question.id] = Array.isArray(raw)
            ? raw.filter((x): x is string => typeof x === 'string')
            : String(raw);
        }
        setAnswers(restored);

        // Resume on the step AFTER the last one completed.
        if (draft.completedStep === 'paid') setStep('photos');
        else if (draft.completedStep === 'details') setStep('paid');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // A school typed by hand (not in the list) reopens the "not listed" input on resume.
  useEffect(() => {
    if (!school || allSchools.length === 0) return;
    if (!allSchools.some((u) => u.name === school)) setSchoolNotListed(true);
  }, [school, allSchools]);

  /* ── Payload ────────────────────────────────────────────────────────────── */

  /** The listing shape shared by draft saves and publish — mirrors collectDetails(). */
  function collectDetails() {
    // Each answer is written under its stable key so the guide profile and search read it
    // exactly as before; a label snapshot is kept for questions with no key.
    const byKey: Record<string, string | string[]> = {};
    const snapshot: {
      questionId: string;
      key: string | null;
      label: string;
      type: string;
      value: string | string[];
    }[] = [];
    for (const q of questions) {
      const value = answers[q.id] ?? (q.type === 'MULTI_CHOICE' ? [] : '');
      byKey[q.key || q.id] = value;
      snapshot.push({ questionId: q.id, key: q.key, label: q.label, type: q.type, value });
    }

    return {
      listingTitle: listingTitle.trim(),
      intro: intro.trim(),
      school: school.trim(),
      tourTypes,
      ...byKey,
      availability: cleanAvailability(availability, services),
      answers: snapshot.filter((a) =>
        Array.isArray(a.value) ? a.value.length > 0 : String(a.value).trim() !== '',
      ),
      agreedContract: agree,
    };
  }

  /* ── Step 1 → validate, save draft, advance ─────────────────────────────── */
  async function saveDetails() {
    const errs: Record<string, string> = {};
    if (!listingTitle.trim()) errs.listingTitle = 'Please fill in this field.';
    if (!school.trim()) errs.school = 'Please select or enter your school.';
    if (!tourTypes.length) errs.tourType = 'Please select at least one tour type.';

    const missing = missingAvailability(availability, services);
    if (missing.length) {
      errs.availability = services.length
        ? `Add dates and times for: ${missing.map((x) => SERVICE_LABEL[x]).join(', ')}.`
        : 'Please add your availability.';
    }
    for (const q of questions) {
      if (!q.required) continue;
      const v = answers[q.id];
      const empty = Array.isArray(v) ? v.length === 0 : !String(v ?? '').trim();
      if (empty) errs[`q-${q.id}`] = 'Please answer this question.';
    }
    if (!idPhoto) errs.idPhoto = 'Please upload a photo of your student ID.';
    if (!agree) errs.agree = 'Please agree to the Independent Contractor Agreement to continue.';

    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error('Please complete the required fields', 'We’ve highlighted what still needs your attention.');
      return;
    }

    setErrors({});
    setSavingStep(true);
    try {
      // idPhoto is the proof of identity the admin reviews to approve the application.
      await listingApi.saveGuide({ ...collectDetails(), idPhoto, status: 'draft', completedStep: 'details' });
      setStep('paid');
    } catch (e) {
      toast.error('Could not save your details', friendlyError(e));
    } finally {
      setSavingStep(false);
    }
  }

  /* ── Step 2 → save the agreement, advance ───────────────────────────────── */
  async function savePaid() {
    setSavingStep(true);
    try {
      await listingApi.saveGuide({ agreedGuidelines: allPaidAgreed, status: 'draft', completedStep: 'paid' });
      setStep('photos');
    } catch (e) {
      toast.error('Could not save', friendlyError(e));
    } finally {
      setSavingStep(false);
    }
  }

  /* ── Step 3 → submit for review ─────────────────────────────────────────── */
  async function publish() {
    setPublishing(true);
    try {
      const res = await listingApi.saveGuide({
        ...collectDetails(),
        idPhoto, // carried through so the proof is never lost at publish
        agreedGuidelines: allPaidAgreed,
        photos,
        completedStep: 'photos',
      });
      if (res.role) await session.setUser({ role: res.role });
      toast.success('Listing submitted', 'It’s now under review.');
      // Reset rather than replace/goBack: the application can be entered from onboarding,
      // from Manage listing, or from Settings, so only a reset reliably leaves ONE Main
      // route behind — on the right tab — with no way back into the submitted form.
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main', params: { screen: 'Manage listing', params: { tab: 'guide' } } }],
      });
    } catch (e) {
      toast.error('Could not publish listing', friendlyError(e));
      setPublishing(false);
    }
  }

  /* ── Uploads ────────────────────────────────────────────────────────────── */

  async function uploadId() {
    const picked = await pickImage();
    if (!picked) return;
    setUploadingId(true);
    try {
      setIdPhoto(await uploadApi.file(picked.uri, picked.name, picked.type));
      clearErr('idPhoto');
    } catch (e) {
      toast.error('Couldn’t upload your ID', friendlyError(e));
    } finally {
      setUploadingId(false);
    }
  }

  async function addPhotos() {
    const picked = await pickImages(10);
    if (!picked.length) return;
    setUploadingPhotos(true);
    try {
      const urls = await Promise.all(picked.map((p) => uploadApi.file(p.uri, p.name, p.type)));
      setPhotos((prev) => [...prev, ...urls]);
    } catch (e) {
      toast.error('Couldn’t upload photo', friendlyError(e));
    } finally {
      setUploadingPhotos(false);
    }
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.loading}>
          <ActivityIndicator size="large" color={tc.maroon800} />
        </View>
      </SafeAreaView>
    );
  }

  const stepIndex = STEPS.findIndex((x) => x.key === step);
  const progress = (stepIndex + 1) / STEPS.length;
  const photosLeft = Math.max(0, requiredPhotos - photos.length);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="auto" />

      {/* ── Header: back, step counter, thin progress bar ── */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <Pressable
            onPress={() => (stepIndex > 0 ? setStep(STEPS[stepIndex - 1].key) : navigation.goBack())}
            hitSlop={10}
            style={s.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color={tc.ink900} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>{STEPS[stepIndex].label}</Text>
            <Text style={s.headerStep}>
              Step {stepIndex + 1} of {STEPS.length} · Become a guide
            </Text>
          </View>
        </View>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* ═══════════ Step 1 — Details ═══════════ */}
          {step === 'details' && (
            <>
              <Text style={s.h1}>Tell guests about you</Text>
              <Text style={s.lede}>
                You must currently be enrolled in college to be a Campus Private Tours guide.
              </Text>

              {/* Your listing */}
              <SectionHeader title="Your listing" />
              <Card>
                <Field
                  first
                  label="Listing title"
                  desc="Briefly describe yourself to guests"
                  required
                  error={errors.listingTitle}
                >
                  <Input
                    value={listingTitle}
                    error={!!errors.listingTitle}
                    onChangeText={(v) => {
                      setListingTitle(v);
                      clearErr('listingTitle');
                    }}
                    placeholder="e.g. Friendly CS junior who loves campus"
                  />
                </Field>

                <Field label="Introduce yourself" desc="A few sentences guests will read first">
                  <Input
                    multiline
                    value={intro}
                    onChangeText={setIntro}
                    placeholder="Write your answer here…"
                  />
                </Field>

                <Field label="School" required error={errors.school}>
                  {schoolNotListed ? (
                    <Input
                      value={school}
                      error={!!errors.school}
                      onChangeText={(v) => {
                        setSchool(v);
                        clearErr('school');
                      }}
                      placeholder="Type your school name"
                    />
                  ) : (
                    <Select
                      value={school}
                      options={allSchools.map((u) => u.name)}
                      placeholder="Choose your school"
                      title="Select your school"
                      searchable
                      error={!!errors.school}
                      onChange={(v) => {
                        setSchool(v);
                        clearErr('school');
                      }}
                    />
                  )}
                  <View style={{ marginTop: spacing(1) }}>
                    <CheckRow
                      label="My school isn’t listed — let me type it"
                      checked={schoolNotListed}
                      onToggle={() => {
                        setSchoolNotListed((v) => !v);
                        setSchool('');
                      }}
                    />
                  </View>
                </Field>
              </Card>

              {/* What you offer */}
              <SectionHeader
                title="What you offer"
                hint="Pick more than one to increase your chances of getting booked."
              />
              <Card>
                <Field first required error={errors.tourType}>
                  {TOUR_TYPE_OPTIONS.map((o) => {
                    const svc = labelToService(o.value);
                    return (
                      <OptionRow
                        key={o.value}
                        title={o.label}
                        subtitle={svc ? SERVICE_DESC[svc] : undefined}
                        icon={TOUR_ICON[o.value]}
                        selected={tourTypes.includes(o.value)}
                        onPress={() => {
                          clearErr('tourType');
                          setTourTypes((prev) =>
                            prev.includes(o.value)
                              ? prev.filter((t) => t !== o.value)
                              : [...prev, o.value],
                          );
                        }}
                      />
                    );
                  })}
                </Field>

                <Field
                  label="Your availability"
                  desc="Set the dates and times you can host. Guests can only book what you offer here."
                  required
                  error={errors.availability}
                >
                  <AvailabilityPicker
                    types={services}
                    value={availability}
                    onChange={(v) => {
                      clearErr('availability');
                      setAvailability(v);
                    }}
                  />
                </Field>
              </Card>

              {/* About-you questions — admin-managed via the questionnaire */}
              {questions.length > 0 && (
                <>
                  <SectionHeader title="About you" />
                  <Card>
                    {questions.map((q, i) => (
                      <Field
                        key={q.id}
                        first={i === 0}
                        label={q.label}
                        required={q.required}
                        error={errors[`q-${q.id}`]}
                      >
                        <QuestionInput
                          q={q}
                          value={answers[q.id]}
                          error={!!errors[`q-${q.id}`]}
                          onChange={(v) => {
                            clearErr(`q-${q.id}`);
                            setAnswers((a) => ({ ...a, [q.id]: v }));
                          }}
                        />
                      </Field>
                    ))}
                  </Card>
                </>
              )}

              {/* Eligibility */}
              <SectionHeader
                title="Eligibility"
                hint="Your ID is confidential and is never shown publicly."
              />
              <Card>
                <Field first required error={errors.idPhoto}>
                  <UploadRow
                    uri={idPhoto}
                    uploading={uploadingId}
                    error={!!errors.idPhoto}
                    onPress={uploadId}
                    onRemove={() => setIdPhoto(null)}
                    title="Upload your student ID"
                    hint="Must clearly show your face and name · JPG or PNG, max 5MB"
                  />
                </Field>

                <View style={s.agreeBox}>
                  <CheckRow checked={agree} onToggle={() => { setAgree((v) => !v); clearErr('agree'); }}>
                    <Text style={s.agreeText}>
                      I agree to the <Text style={s.agreeStrong}>Independent Contractor Agreement</Text>
                    </Text>
                  </CheckRow>
                  {errors.agree ? (
                    <View style={s.errorRow}>
                      <Ionicons name="alert-circle" size={13} color={tc.dangerFg} />
                      <Text style={s.errorText}>{errors.agree}</Text>
                    </View>
                  ) : null}
                </View>
              </Card>
            </>
          )}

          {/* ═══════════ Step 2 — Getting paid ═══════════ */}
          {step === 'paid' && (
            <>
              <Text style={s.h1}>Get paid to show your campus</Text>
              <Text style={s.lede}>
                After each tour you can transfer your earnings straight to your bank account.
                Agree to the three guidelines below to continue.
              </Text>

              <View style={{ gap: spacing(3), marginTop: spacing(6) }}>
                {GUIDELINES.map((g) => {
                  const on = !!paidAgreed[g.key];
                  return (
                    <Pressable
                      key={g.key}
                      style={({ pressed }) => [s.guideCard, on && s.guideCardOn, pressed && s.pressed]}
                      onPress={() => setPaidAgreed((p) => ({ ...p, [g.key]: !p[g.key] }))}
                    >
                      <View style={s.guideTop}>
                        <View style={[s.guideIcon, on && s.guideIconOn]}>
                          <Ionicons name={g.icon} size={19} color={on ? tc.onBrand : tc.maroon800} />
                        </View>
                        <Text style={s.guideTitle}>{g.title}</Text>
                        <View style={[s.guideCheck, on && s.guideCheckOn]}>
                          {on && <Ionicons name="checkmark" size={14} color={tc.onBrand} />}
                        </View>
                      </View>
                      <Text style={s.guideBody}>{g.body}</Text>
                      <Text style={[s.guideAgree, on && s.guideAgreeOn]}>
                        {on ? 'Agreed' : 'Tap to agree'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {/* ═══════════ Step 3 — Photos ═══════════ */}
          {step === 'photos' && (
            <>
              <Text style={s.h1}>Add photos of yourself</Text>
              <Text style={s.lede}>
                Use photos of just you, or make sure you’re easily recognizable in each one.
              </Text>

              <View style={s.photoStatus}>
                <Ionicons
                  name={photosLeft === 0 ? 'checkmark-circle' : 'images-outline'}
                  size={17}
                  color={photosLeft === 0 ? tc.successFg : tc.maroon800}
                />
                <Text style={s.photoStatusText}>
                  {photosLeft === 0
                    ? `${photos.length} photo${photos.length > 1 ? 's' : ''} added — you’re good to go`
                    : `${photos.length} of ${requiredPhotos} added · ${photosLeft} more needed`}
                </Text>
              </View>

              <Card style={{ marginTop: spacing(4) }}>
                <View style={s.photoGrid}>
                  {photos.map((src, i) => (
                    <PhotoTile
                      key={`${src}-${i}`}
                      uri={src}
                      size={photoSize}
                      onRemove={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                    />
                  ))}
                  <PhotoTile size={photoSize} uploading={uploadingPhotos} onPress={addPhotos} />
                </View>
              </Card>
            </>
          )}
        </ScrollView>

        {/* ── Pinned action ── */}
        <StickyFooter>
          {step === 'details' && (
            <PrimaryButton
              label="Continue"
              icon="arrow-forward"
              loading={savingStep}
              onPress={saveDetails}
            />
          )}
          {step === 'paid' && (
            <>
              <PrimaryButton
                label={allPaidAgreed ? 'Continue' : `Agree to all ${GUIDELINES.length} to continue`}
                icon={allPaidAgreed ? 'arrow-forward' : undefined}
                disabled={!allPaidAgreed}
                loading={savingStep}
                onPress={savePaid}
              />
              <GhostButton label="Back" onPress={() => setStep('details')} />
            </>
          )}
          {step === 'photos' && (
            <>
              <PrimaryButton
                label={photosLeft > 0 ? `Add ${photosLeft} more photo${photosLeft > 1 ? 's' : ''}` : 'Submit for review'}
                disabled={photosLeft > 0 || uploadingPhotos}
                loading={publishing}
                onPress={publish}
              />
              <GhostButton label="Back" onPress={() => setStep('paid')} />
            </>
          )}
        </StickyFooter>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: tc.ivory },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pressed: { opacity: 0.7 },

    header: { backgroundColor: tc.white, borderBottomWidth: 1, borderBottomColor: tc.ink100 },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(1),
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2.5),
    },
    backBtn: { height: 40, width: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: font(17), fontWeight: '800', color: tc.ink900 },
    headerStep: { fontSize: font(12), color: tc.ink500, marginTop: 1 },
    progressTrack: { height: 3, backgroundColor: tc.ink100 },
    progressFill: { height: '100%', backgroundColor: tc.maroon900 },

    scroll: { padding: spacing(5), paddingBottom: spacing(10) },
    h1: { fontSize: font(24), fontWeight: '800', color: tc.ink900, lineHeight: 31 },
    lede: { fontSize: font(14), lineHeight: 21, color: tc.ink500, marginTop: spacing(2) },

    errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), marginTop: spacing(2) },
    errorText: { flex: 1, fontSize: font(12.5), fontWeight: '600', color: tc.dangerFg, lineHeight: 17 },

    agreeBox: {
      marginTop: spacing(5),
      backgroundColor: tc.ivory,
      borderRadius: radius.md,
      paddingHorizontal: spacing(3.5),
      paddingVertical: spacing(2),
    },
    agreeText: { flex: 1, fontSize: font(14), lineHeight: 20, color: tc.ink900 },
    agreeStrong: { fontWeight: '800', color: tc.maroon800 },

    guideCard: {
      backgroundColor: tc.white,
      borderWidth: 1.5,
      borderColor: tc.ink100,
      borderRadius: radius.xl,
      padding: spacing(4.5),
    },
    guideCardOn: { borderColor: tc.maroon800, backgroundColor: tc.maroon50 },
    guideTop: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
    guideIcon: {
      height: 40,
      width: 40,
      borderRadius: radius.md,
      backgroundColor: tc.maroon50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    guideIconOn: { backgroundColor: tc.maroon900 },
    guideTitle: { flex: 1, fontSize: font(16.5), fontWeight: '800', color: tc.ink900 },
    guideCheck: {
      height: 24,
      width: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: tc.ink300,
      alignItems: 'center',
      justifyContent: 'center',
    },
    guideCheckOn: { backgroundColor: tc.maroon900, borderColor: tc.maroon900 },
    guideBody: { fontSize: font(13.5), lineHeight: 20, color: tc.ink500, marginTop: spacing(3) },
    guideAgree: {
      fontSize: font(12),
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: tc.ink300,
      marginTop: spacing(3),
    },
    guideAgreeOn: { color: tc.maroon800 },

    photoStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(2),
      backgroundColor: tc.cream,
      borderRadius: radius.md,
      paddingHorizontal: spacing(3.5),
      paddingVertical: spacing(3),
      marginTop: spacing(6),
    },
    photoStatusText: { flex: 1, fontSize: font(13), fontWeight: '600', color: tc.ink900 },
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2.5) },
  });
