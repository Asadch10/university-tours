/**
 * Become a college counselor.
 *
 * Same contract as the website's counselor application
 * (apps/website/components/counselor/counselor-application.tsx): the admin-managed
 * COUNSELOR questionnaire, services + availability in the guide's shape, and a save to
 * `profileJson.counselorListing`, which coexists with a guide listing so one account can
 * hold both. Deliberately one step, as on the web — counselors have no photo gallery and
 * no "getting paid" guidelines.
 *
 * The layout is native: grouped cards, full-width choice rows, and a pinned submit bar
 * instead of the web form's single tall column with the button at the very bottom.
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { font, radius, spacing, type Palette } from '../../theme';
import { useStyles, useThemeColors } from '../../theme-context';
import { useToast } from '../../components/Toast';
import { friendlyError, session } from '../../api/auth';
import { accountApi } from '../../api/account';
import { parseAvailability, type Availability } from '../../api/guides';
import {
  cleanAvailability,
  listingApi,
  missingAvailability,
  questionnaireApi,
  servicesFor,
  uploadApi,
  type ListingStatus,
  type QuestionnaireQuestion,
} from '../../api/applications';
import { SERVICE_DESC, SERVICE_LABEL, TOUR_TYPE_OPTIONS, labelToService } from '../../tour-types';
import { pickImage } from '../../media';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import {
  Card,
  CheckRow,
  Field,
  GhostButton,
  OptionRow,
  PrimaryButton,
  QuestionInput,
  SectionHeader,
  StickyFooter,
  type IoniconName,
} from '../apply/form-kit';
import { AvailabilityPicker } from '../apply/AvailabilityPicker';

type Props = NativeStackScreenProps<RootStackParamList, 'BecomeCounselor'>;

const TOUR_ICON: Record<string, IoniconName> = {
  'Campus tour': 'walk-outline',
  'Video chat': 'videocam-outline',
  Consultancy: 'chatbubble-ellipses-outline',
};

export function BecomeCounselorScreen({ navigation, route }: Props) {
  const tc = useThemeColors();
  const s = useStyles(makeStyles);
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [status, setStatus] = useState<ListingStatus | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [agree, setAgree] = useState(false);
  const [tourTypes, setTourTypes] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Availability>({});

  const services = useMemo(() => servicesFor(tourTypes), [tourTypes]);
  // Arriving from Manage listing → Edit: show the form even though the profile has already
  // been submitted. Re-submitting sends it back through review, as the website's edit
  // modal does.
  const editing = route.params?.edit === true;

  /* ── Load the counselor questionnaire + any saved draft ─────────────────── */
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      questionnaireApi.active('COUNSELOR').catch(() => ({ questions: [], requiredPhotos: 0 })),
      accountApi.getMe().catch(() => null),
    ])
      .then(([q, me]) => {
        if (cancelled) return;
        setQuestions(q.questions ?? []);

        const profile = (me?.profileJson ?? {}) as Record<string, unknown>;
        const draft = (profile.counselorListing ?? null) as Record<string, unknown> | null;
        if (!draft) return;

        setStatus((draft.status as ListingStatus) ?? 'draft');
        setRejectionReason(typeof draft.rejectionReason === 'string' ? draft.rejectionReason : '');
        if (typeof draft.photo === 'string') setPhoto(draft.photo);
        if (draft.agreedTerms === true) setAgree(true);
        if (Array.isArray(draft.tourTypes)) {
          setTourTypes(draft.tourTypes.filter((t): t is string => typeof t === 'string'));
        }
        setAvailability(parseAvailability(draft.availability));

        // Counselor answers are nested under `answers`, keyed by fieldKey (or question id).
        const saved = (draft.answers ?? {}) as Record<string, unknown>;
        const restored: Record<string, string | string[]> = {};
        for (const question of q.questions ?? []) {
          const v = saved[question.key ?? question.id] ?? saved[question.id];
          if (Array.isArray(v)) restored[question.id] = v.filter((x): x is string => typeof x === 'string');
          else if (typeof v === 'string') restored[question.id] = v;
        }
        setAnswers(restored);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function setAnswer(id: string, v: string | string[]) {
    setAnswers((prev) => ({ ...prev, [id]: v }));
    setErrors((prev) => (prev[id] ? { ...prev, [id]: '' } : prev));
  }

  /** Store answers under fieldKey when present, so the profile can read them by name. */
  function answersForSave() {
    const out: Record<string, string | string[]> = {};
    for (const q of questions) {
      const v = answers[q.id];
      if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) continue;
      out[q.key ?? q.id] = v;
    }
    return out;
  }

  /** Services + availability are saved alongside the answers, in the guide's shape. */
  function listingPayload() {
    return {
      answers: answersForSave(),
      photo,
      agreedTerms: agree,
      tourTypes,
      availability: cleanAvailability(availability, services),
    };
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    for (const q of questions) {
      if (!q.required) continue;
      const v = answers[q.id];
      if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) {
        errs[q.id] = 'This question is required.';
      }
    }
    if (!tourTypes.length) errs.tourType = 'Please select at least one service.';
    const missing = missingAvailability(availability, services);
    if (services.length && missing.length) {
      errs.availability = `Add dates and times for ${missing.map((x) => SERVICE_LABEL[x]).join(', ')}.`;
    }

    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Please complete the required fields');
      return false;
    }
    if (!agree) {
      toast.error('Please confirm the counselor agreement before submitting.');
      return false;
    }
    return true;
  }

  // Reset, not replace: the application can be entered from onboarding, Manage listing or
  // Settings, so only a reset reliably leaves ONE Main route behind, on the right tab.
  const goManage = () =>
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main', params: { screen: 'Manage listing', params: { tab: 'counselor' } } }],
    });

  async function saveDraft() {
    setSavingDraft(true);
    try {
      await listingApi.saveCounselor({ ...listingPayload(), status: 'draft' });
      toast.success('Draft saved', 'Come back any time to finish.');
    } catch (e) {
      toast.error('Could not save', friendlyError(e));
    } finally {
      setSavingDraft(false);
    }
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Anything other than 'draft' submits for review — the backend sets 'under_review'
      // itself and notifies the admin team.
      const res = await listingApi.saveCounselor({ ...listingPayload(), status: 'submitted' });
      if (res.role) await session.setUser({ role: res.role });
      if (editing) {
        toast.success('Changes submitted', 'Your profile goes live once re-approved.');
        goManage();
        return;
      }
      setStatus('under_review');
      toast.success('Application submitted', 'Our team will review your credentials.');
    } catch (e) {
      toast.error('Could not submit', friendlyError(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadPhoto() {
    const picked = await pickImage();
    if (!picked) return;
    setUploadingPhoto(true);
    try {
      setPhoto(await uploadApi.file(picked.uri, picked.name, picked.type));
    } catch (e) {
      toast.error('Couldn’t upload your photo', friendlyError(e));
    } finally {
      setUploadingPhoto(false);
    }
  }

  /* ── Chrome shared by the form and the status screens ───────────────────── */
  const Frame = ({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) => (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="auto" />
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={tc.ink900} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle} numberOfLines={1}>
            {editing ? 'Edit counselor profile' : 'Become a counselor'}
          </Text>
          {subtitle ? <Text style={s.headerSub}>{subtitle}</Text> : null}
        </View>
      </View>
      {children}
    </SafeAreaView>
  );

  if (loading) {
    return (
      <Frame>
        <View style={s.loading}>
          <ActivityIndicator size="large" color={tc.maroon800} />
        </View>
      </Frame>
    );
  }

  /* ── Already submitted / decided: show the status, not the form ─────────── */
  if (!editing && status === 'under_review') {
    return (
      <Frame>
        <StatusCard
          tone="review"
          icon="hourglass-outline"
          title="Application under review"
          body="Our team is verifying your credentials. We’ll email you as soon as there’s a decision — usually within a few business days."
          actionLabel="Go to Manage listing"
          onAction={goManage}
        />
      </Frame>
    );
  }

  if (!editing && status === 'published') {
    return (
      <Frame>
        <StatusCard
          tone="approved"
          icon="checkmark-circle-outline"
          title="You’re approved"
          body="Your profile is live in the directory and families can book consultations with you."
          actionLabel="Manage your profile"
          onAction={goManage}
        />
      </Frame>
    );
  }

  if (!editing && (status === 'rejected' || status === 'suspended')) {
    return (
      <Frame>
        <StatusCard
          tone="rejected"
          icon="alert-circle-outline"
          title={status === 'rejected' ? 'Not approved' : 'Profile suspended'}
          body={
            rejectionReason ||
            'Our team reviewed your application and could not approve it at this time. Contact support if you think this was a mistake.'
          }
        />
      </Frame>
    );
  }

  /* ── The form ───────────────────────────────────────────────────────────── */
  const unavailable = questions.length === 0;

  return (
    <Frame subtitle={editing ? 'Changes go back through review' : 'Reviewed in a few business days'}>
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
          <Text style={s.h1}>Tell us about your practice</Text>
          <Text style={s.lede}>
            Our team reviews every counselor before their profile goes live, so families know
            who they&rsquo;re booking.
          </Text>

          {/* Profile photo — a proper avatar row rather than the web's small circle + link */}
          <SectionHeader title="Your profile" />
          <Card>
            <Pressable
              style={({ pressed }) => [s.photoRow, pressed && s.pressed]}
              onPress={uploadPhoto}
              disabled={uploadingPhoto}
            >
              <View style={s.avatar}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color={tc.maroon800} />
                ) : photo ? (
                  <Image source={{ uri: photo }} style={s.avatarImg} contentFit="cover" transition={150} />
                ) : (
                  <Ionicons name="person-outline" size={26} color={tc.ink300} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.photoTitle}>
                  {photo ? 'Replace profile photo' : 'Add a profile photo'}
                </Text>
                <Text style={s.photoHint}>
                  A clear headshot helps families choose you · JPG or PNG
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={tc.ink300} />
            </Pressable>
          </Card>

          {/* Services */}
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
                      setErrors((prev) => ({ ...prev, tourType: '' }));
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
              desc="Set the dates and times you can take sessions. Families can only book what you offer here."
              required
              error={errors.availability}
            >
              <AvailabilityPicker
                types={services}
                value={availability}
                onChange={(v) => {
                  setErrors((prev) => ({ ...prev, availability: '' }));
                  setAvailability(v);
                }}
              />
            </Field>
          </Card>

          {/* Admin-managed questions */}
          {unavailable ? (
            <View style={s.notice}>
              <Ionicons name="information-circle-outline" size={19} color={tc.warnFg} />
              <Text style={s.noticeText}>
                The counselor application isn’t available yet. Please check back shortly.
              </Text>
            </View>
          ) : (
            <>
              <SectionHeader title="Your background" />
              <Card>
                {questions.map((q, i) => (
                  <Field
                    key={q.id}
                    first={i === 0}
                    label={q.label}
                    required={q.required}
                    error={errors[q.id]}
                  >
                    <QuestionInput
                      q={q}
                      value={answers[q.id]}
                      error={!!errors[q.id]}
                      onChange={(v) => setAnswer(q.id, v)}
                    />
                  </Field>
                ))}

                <View style={s.agreeBox}>
                  <CheckRow checked={agree} onToggle={() => setAgree((v) => !v)}>
                    <Text style={s.agreeText}>
                      I confirm this is accurate and agree to the{' '}
                      <Text style={s.agreeStrong}>counselor terms</Text>.
                    </Text>
                  </CheckRow>
                </View>
              </Card>
            </>
          )}
        </ScrollView>

        {!unavailable && (
          <StickyFooter>
            <PrimaryButton
              label={editing ? 'Submit changes' : 'Submit application'}
              loading={submitting}
              onPress={submit}
            />
            {!editing && (
              <GhostButton
                label={savingDraft ? 'Saving…' : 'Save and finish later'}
                disabled={savingDraft}
                onPress={saveDraft}
              />
            )}
          </StickyFooter>
        )}
      </KeyboardAvoidingView>
    </Frame>
  );
}

/* ─── Status card (under review / approved / rejected) ─────────────────────── */

function StatusCard({
  tone,
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  tone: 'review' | 'approved' | 'rejected';
  icon: IoniconName;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const s = useStyles(makeStyles);
  const tc = useThemeColors();
  const ring =
    tone === 'approved'
      ? { bg: tc.successBg, fg: tc.successFg }
      : tone === 'rejected'
        ? { bg: tc.dangerBg, fg: tc.dangerFg }
        : { bg: tc.warnBg, fg: tc.warnFg };

  return (
    <ScrollView contentContainerStyle={s.statusWrap}>
      <View style={[s.statusIcon, { backgroundColor: ring.bg }]}>
        <Ionicons name={icon} size={30} color={ring.fg} />
      </View>
      <Text style={s.statusTitle}>{title}</Text>
      <Text style={s.statusBody}>{body}</Text>
      {actionLabel && onAction && (
        <View style={s.statusAction}>
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: tc.ivory },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pressed: { opacity: 0.7 },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(1),
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2.5),
      backgroundColor: tc.white,
      borderBottomWidth: 1,
      borderBottomColor: tc.ink100,
    },
    backBtn: { height: 40, width: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: font(17), fontWeight: '800', color: tc.ink900 },
    headerSub: { fontSize: font(12), color: tc.ink500, marginTop: 1 },

    scroll: { padding: spacing(5), paddingBottom: spacing(10) },
    h1: { fontSize: font(24), fontWeight: '800', color: tc.ink900, lineHeight: 31 },
    lede: { fontSize: font(14), lineHeight: 21, color: tc.ink500, marginTop: spacing(2) },

    photoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3.5) },
    avatar: {
      height: 64,
      width: 64,
      borderRadius: 32,
      backgroundColor: tc.ivory,
      borderWidth: 1,
      borderColor: tc.ink200,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImg: { height: '100%', width: '100%' },
    photoTitle: { fontSize: font(14.5), fontWeight: '700', color: tc.ink900 },
    photoHint: { fontSize: font(12), lineHeight: 17, color: tc.ink500, marginTop: 2 },

    notice: {
      flexDirection: 'row',
      gap: spacing(2.5),
      marginTop: spacing(7),
      borderRadius: radius.lg,
      backgroundColor: tc.warnBg,
      padding: spacing(4),
    },
    noticeText: { flex: 1, fontSize: font(13.5), lineHeight: 20, color: tc.ink900 },

    agreeBox: {
      marginTop: spacing(5),
      backgroundColor: tc.ivory,
      borderRadius: radius.md,
      paddingHorizontal: spacing(3.5),
      paddingVertical: spacing(2),
    },
    agreeText: { flex: 1, fontSize: font(14), lineHeight: 20, color: tc.ink900 },
    agreeStrong: { fontWeight: '800', color: tc.maroon800 },

    statusWrap: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing(7),
      paddingVertical: spacing(10),
    },
    statusIcon: {
      height: 68,
      width: 68,
      borderRadius: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusTitle: {
      fontSize: font(22),
      fontWeight: '800',
      color: tc.ink900,
      textAlign: 'center',
      marginTop: spacing(5),
    },
    statusBody: {
      fontSize: font(14),
      lineHeight: 22,
      color: tc.ink500,
      textAlign: 'center',
      marginTop: spacing(3),
    },
    statusAction: { alignSelf: 'stretch', marginTop: spacing(8) },
  });
