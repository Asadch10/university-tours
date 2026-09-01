/**
 * Manage listing.
 *
 * A user may hold BOTH a guide and a counselor profile, each with its own review status,
 * so they sit behind a segmented switcher that is hidden entirely when only one exists.
 * Everything is read live from `profileJson.guideListing` / `profileJson.counselorListing`
 * — the same JSON the website and the admin queue work from.
 *
 * The website renders this as a CV: a wide hero panel and every field stacked open. That
 * needs a lot of horizontal room, so on a phone it becomes a photo header with the status
 * on top of it, a stat strip, and collapsible sections — you see the state of your listing
 * in one screen and open only the parts you care about.
 */
import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { font, radius, spacing, type Palette } from '../theme';
import { useStyles, useThemeColors } from '../theme-context';
import { useToast } from '../components/Toast';
import { friendlyError, session } from '../api/auth';
import { accountApi } from '../api/account';
import { parseAvailability, type Availability, type GuideService } from '../api/guides';
import { labelForDate, labelForTime, listingApi, type ListingStatus } from '../api/applications';
import { SERVICE_LABEL, labelToService } from '../tour-types';

type IoniconName = keyof typeof Ionicons.glyphMap;
type Section = 'guide' | 'counselor';
type ManageRoute = RouteProp<{ params: { tab?: Section } }, 'params'>;

/** The subset of the listing JSON this screen renders. */
interface Listing {
  status?: string;
  listingTitle?: string;
  intro?: string;
  school?: string;
  tourTypes?: string[];
  photos?: string[];
  photo?: string;
  idPhoto?: string;
  completedStep?: string;
  submittedAt?: string;
  publishedAt?: string;
  rejectionReason?: string;
  availability?: unknown;
  answers?: unknown;
  [key: string]: unknown;
}

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'guide', label: 'Guide' },
  { key: 'counselor', label: 'Counselor' },
];

const SERVICE_ICON: Record<GuideService, IoniconName> = {
  CAMPUS_TOUR: 'walk-outline',
  VIDEO_CONSULTATION: 'videocam-outline',
  CONSULTATION: 'chatbubble-ellipses-outline',
};

export function ManageListingScreen() {
  const tc = useThemeColors();
  const s = useStyles(makeStyles);
  const toast = useToast();
  const nav = useNavigation<any>();
  const route = useRoute<ManageRoute>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState('');
  const [guide, setGuide] = useState<Listing | null>(null);
  const [counselor, setCounselor] = useState<Listing | null>(null);
  const [section, setSection] = useState<Section>(route.params?.tab ?? 'guide');
  const [confirm, setConfirm] = useState<Section | null>(null);
  const [deleting, setDeleting] = useState(false);
  // `tab` steers which profile opens, but only the FIRST time — after that the user's own
  // tap wins, so switching bottom tabs and coming back doesn't yank them back to `tab`.
  const sectionResolved = useRef(false);

  const load = useCallback(async () => {
    try {
      const me = await accountApi.getMe();
      setName(me.name ?? '');
      const p = (me.profileJson ?? {}) as Record<string, unknown>;
      const g = (p.guideListing ?? null) as Listing | null;
      const c = (p.counselorListing ?? null) as Listing | null;
      setGuide(g);
      setCounselor(c);
      if (!sectionResolved.current) {
        // Honour `tab` when they actually hold that profile; otherwise land on whichever
        // one exists (guide wins when they hold both).
        const wanted = route.params?.tab;
        const valid = wanted === 'counselor' ? !!c : wanted === 'guide' ? !!g : false;
        setSection(valid ? wanted! : g ? 'guide' : c ? 'counselor' : 'guide');
        sectionResolved.current = true;
      }
    } catch {
      /* keep whatever is on screen; pull-to-refresh can retry */
    } finally {
      setLoading(false);
    }
  }, [route.params?.tab]);

  // Reload on focus — coming back from a submitted application must show the new status.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function remove(which: Section) {
    setDeleting(true);
    try {
      const res =
        which === 'guide' ? await listingApi.deleteGuide() : await listingApi.deleteCounselor();
      if (res.role) await session.setUser({ role: res.role });
      // Fall back to the surviving profile rather than stranding the user on an empty
      // state with the (now hidden) switcher gone.
      if (which === 'guide') {
        setGuide(null);
        if (counselor) setSection('counselor');
      } else {
        setCounselor(null);
        if (guide) setSection('guide');
      }
      setConfirm(null);
      toast.success(which === 'guide' ? 'Listing deleted' : 'Profile deleted', 'It has been removed.');
    } catch (e) {
      toast.error('Could not delete', friendlyError(e));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.loading}>
          <ActivityIndicator size="large" color={tc.maroon800} />
        </View>
      </SafeAreaView>
    );
  }

  const both = !!guide && !!counselor;
  const listing = section === 'guide' ? guide : counselor;
  const status = (listing?.status as ListingStatus | undefined) ?? null;
  const isDraft = !!listing && status === 'draft';
  const submitted = !!listing && !isDraft;

  const startApplication = () =>
    nav.navigate(section === 'guide' ? 'BecomeGuide' : 'BecomeCounselor');

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style="auto" />

      {/* ── Title bar + switcher ── */}
      <View style={s.topBar}>
        <Text style={s.title}>Manage listing</Text>
        {both && (
          <View style={s.segment}>
            {SECTIONS.map((x) => {
              const on = section === x.key;
              return (
                <Pressable
                  key={x.key}
                  style={[s.segmentBtn, on && s.segmentBtnOn]}
                  onPress={() => setSection(x.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[s.segmentText, on && s.segmentTextOn]}>{x.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + spacing(8) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={tc.maroon800} />
        }
      >
        {!listing && <EmptyState section={section} onStart={startApplication} />}

        {isDraft && (
          <DraftState
            section={section}
            listing={listing!}
            onContinue={startApplication}
            onDelete={() => setConfirm(section)}
          />
        )}

        {submitted && (
          <SubmittedState
            section={section}
            listing={listing!}
            name={name}
            onEdit={() =>
              section === 'guide'
                ? nav.navigate('BecomeGuide')
                : // `edit` bypasses the counselor screen's status view, which would
                  // otherwise show instead of the form on an already-submitted profile.
                  nav.navigate('BecomeCounselor', { edit: true })
            }
            onDelete={() => setConfirm(section)}
          />
        )}
      </ScrollView>

      {/* ── Delete confirmation ── */}
      <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
        <Pressable style={s.modalBackdrop} onPress={() => !deleting && setConfirm(null)} />
        <View style={s.modalWrap} pointerEvents="box-none">
          <View style={s.modalCard}>
            <View style={s.modalIcon}>
              <Ionicons name="trash-outline" size={22} color={tc.dangerFg} />
            </View>
            <Text style={s.modalTitle}>
              {confirm === 'counselor' ? 'Delete profile?' : 'Delete listing?'}
            </Text>
            <Text style={s.modalBody}>
              This permanently removes it and everything you’ve entered. It cannot be undone.
            </Text>
            <Pressable
              style={({ pressed }) => [s.modalDelete, deleting && s.disabled, pressed && s.pressed]}
              disabled={deleting}
              onPress={() => confirm && remove(confirm)}
            >
              {deleting ? (
                <ActivityIndicator color={tc.onBrand} />
              ) : (
                <Text style={s.modalDeleteText}>Delete permanently</Text>
              )}
            </Pressable>
            <Pressable style={s.modalCancel} disabled={deleting} onPress={() => setConfirm(null)}>
              <Text style={s.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ═══ No listing yet ═══════════════════════════════════════════════════════ */

function EmptyState({ section, onStart }: { section: Section; onStart: () => void }) {
  const s = useStyles(makeStyles);
  const tc = useThemeColors();
  const guide = section === 'guide';

  const perks: { icon: IoniconName; title: string; body: string }[] = guide
    ? [
        { icon: 'wallet-outline', title: 'Earn on your schedule', body: 'Host tours whenever it suits your classes.' },
        { icon: 'videocam-outline', title: 'In person or over video', body: 'Walk families around campus, or answer questions from your dorm.' },
        { icon: 'shield-checkmark-outline', title: 'Verified and trusted', body: 'Every listing is reviewed before it goes live.' },
      ]
    : [
        { icon: 'people-outline', title: 'Reach families deciding now', body: 'Advise students actively choosing where to apply.' },
        { icon: 'calendar-outline', title: 'Set your own hours', body: 'Take sessions only on the dates and times you offer.' },
        { icon: 'shield-checkmark-outline', title: 'Credentials reviewed', body: 'Every counselor is verified before going live.' },
      ];

  return (
    <View>
      <View style={s.hero}>
        <View style={s.heroGlow} />
        <View style={s.heroIcon}>
          <Ionicons name={guide ? 'school-outline' : 'compass-outline'} size={26} color={tc.onBrand} />
        </View>
        <Text style={s.heroTitle}>
          {guide ? 'Share your campus with the students who come next' : 'Guide families through admissions'}
        </Text>
        <Text style={s.heroBody}>
          {guide
            ? 'Set up your listing once — tell your story, add photos, choose how you host. About 10 minutes.'
            : 'Apply once — tell us about your practice, set your availability, start taking consultations.'}
        </Text>
        <Pressable style={({ pressed }) => [s.heroBtn, pressed && s.pressed]} onPress={onStart}>
          <Text style={s.heroBtnText}>{guide ? 'Start your listing' : 'Start your application'}</Text>
          <Ionicons name="arrow-forward" size={16} color={tc.maroon900} />
        </Pressable>
      </View>

      <View style={s.perkList}>
        {perks.map((p) => (
          <View key={p.title} style={s.perkRow}>
            <View style={s.perkIcon}>
              <Ionicons name={p.icon} size={18} color={tc.maroon800} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.perkTitle}>{p.title}</Text>
              <Text style={s.perkBody}>{p.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ═══ Draft — resume the application ═══════════════════════════════════════ */

function DraftState({
  section,
  listing,
  onContinue,
  onDelete,
}: {
  section: Section;
  listing: Listing;
  onContinue: () => void;
  onDelete: () => void;
}) {
  const s = useStyles(makeStyles);
  const tc = useThemeColors();

  // The guide flow has three steps to track; the counselor application is one form.
  const steps =
    section === 'guide'
      ? [
          { key: 'details', label: 'Your details' },
          { key: 'paid', label: 'Getting paid' },
          { key: 'photos', label: 'Photos & submit' },
        ]
      : [];
  const done = listing.completedStep === 'paid' ? 2 : listing.completedStep === 'details' ? 1 : 0;
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;

  return (
    <View style={s.card}>
      <View style={s.cardHead}>
        <View style={[s.pill, { backgroundColor: tc.warnBg }]}>
          <Ionicons name="create-outline" size={12} color={tc.warnFg} />
          <Text style={[s.pillText, { color: tc.warnFg }]}>Draft</Text>
        </View>
      </View>

      <Text style={s.cardTitle}>
        {section === 'guide'
          ? listing.listingTitle?.trim() || 'Pick up where you left off'
          : 'Not submitted yet'}
      </Text>
      <Text style={s.cardBody}>
        {section === 'guide'
          ? 'Your progress is saved. Finish the remaining steps and submit for review.'
          : 'Finish the remaining questions and submit — our team reviews credentials within a couple of business days.'}
      </Text>

      {steps.length > 0 && (
        <>
          <View style={s.progressRow}>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${pct}%` }]} />
            </View>
            <Text style={s.progressPct}>{pct}%</Text>
          </View>

          <View style={s.stepList}>
            {steps.map((x, i) => {
              const isDone = i < done;
              const current = i === done;
              return (
                <View key={x.key} style={s.stepRow}>
                  <View style={[s.stepBadge, isDone && s.stepBadgeDone, current && s.stepBadgeCurrent]}>
                    {isDone ? (
                      <Ionicons name="checkmark" size={13} color={tc.onBrand} />
                    ) : (
                      <Text style={[s.stepBadgeText, current && s.stepBadgeTextOn]}>{i + 1}</Text>
                    )}
                  </View>
                  <Text style={[s.stepText, isDone && s.stepTextDone, current && s.stepTextCurrent]}>
                    {x.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}

      <Pressable style={({ pressed }) => [s.primaryBtn, pressed && s.pressed]} onPress={onContinue}>
        <Text style={s.primaryBtnText}>
          {section === 'guide' ? 'Continue your listing' : 'Continue application'}
        </Text>
        <Ionicons name="arrow-forward" size={16} color={tc.onBrand} />
      </Pressable>
      <Pressable style={s.textBtn} onPress={onDelete}>
        <Text style={s.textBtnText}>Discard draft</Text>
      </Pressable>
    </View>
  );
}

/* ═══ Submitted — status, stats, then collapsible detail ═══════════════════ */

function SubmittedState({
  section,
  listing,
  name,
  onEdit,
  onDelete,
}: {
  section: Section;
  listing: Listing;
  name: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const s = useStyles(makeStyles);
  const tc = useThemeColors();
  const { width } = useWindowDimensions();
  const status = (listing.status as ListingStatus) ?? 'under_review';

  const photos = (Array.isArray(listing.photos) ? listing.photos : []).filter(
    (p): p is string => typeof p === 'string' && /^https?:\/\//.test(p),
  );
  const hero = photos[0] ?? (typeof listing.photo === 'string' ? listing.photo : null);

  const availability = parseAvailability(listing.availability);
  const services = (Array.isArray(listing.tourTypes) ? listing.tourTypes : [])
    .map((t) => labelToService(String(t)))
    .filter((x): x is GuideService => x !== null);

  const dateCount = services.reduce((n, x) => n + (availability[x]?.dates.length ?? 0), 0);
  const thumb = (width - spacing(5) * 2 - spacing(2) * 2) / 3;

  const tone =
    status === 'published'
      ? { bg: tc.successBg, fg: tc.successFg, icon: 'checkmark-circle' as IoniconName, label: 'Live' }
      : status === 'suspended' || status === 'rejected'
        ? { bg: tc.dangerBg, fg: tc.dangerFg, icon: 'alert-circle' as IoniconName, label: status === 'rejected' ? 'Not approved' : 'Suspended' }
        : { bg: tc.warnBg, fg: tc.warnFg, icon: 'hourglass' as IoniconName, label: 'Under review' };

  const statusBody =
    status === 'published'
      ? 'Families can find you and request bookings. Keep your photos fresh — better photos get more bookings.'
      : status === 'suspended'
        ? listing.rejectionReason || 'Your listing was taken off the site by our team. Contact support if you think this is a mistake.'
        : status === 'rejected'
          ? listing.rejectionReason || 'Our team could not approve this at the moment. Contact support if you think this is a mistake.'
          : 'Our team is reviewing your listing to keep the marketplace safe. This usually takes up to 48 hours.';

  return (
    <View>
      {/* ── Header: photo, name, status badge over it ── */}
      <View style={s.profileHead}>
        {hero ? (
          <Image source={{ uri: hero }} style={s.profilePhoto} contentFit="cover" transition={180} />
        ) : (
          <View style={[s.profilePhoto, s.profilePhotoEmpty]}>
            <Ionicons name="person" size={34} color={tc.ink300} />
          </View>
        )}
        <View style={[s.statusBadge, { backgroundColor: tone.bg }]}>
          <Ionicons name={tone.icon} size={12} color={tone.fg} />
          <Text style={[s.statusBadgeText, { color: tone.fg }]}>{tone.label}</Text>
        </View>
        <Text style={s.profileName} numberOfLines={2}>
          {section === 'guide'
            ? listing.listingTitle?.trim() || name || 'Your listing'
            : name || 'Your counselor profile'}
        </Text>
        {!!listing.school && (
          <View style={s.profileMetaRow}>
            <Ionicons name="school-outline" size={14} color={tc.ink500} />
            <Text style={s.profileMeta} numberOfLines={1}>
              {listing.school}
            </Text>
          </View>
        )}
      </View>

      {/* ── Status note ── */}
      <View style={[s.statusNote, { backgroundColor: tone.bg }]}>
        <Text style={[s.statusNoteText, { color: tone.fg }]}>{statusBody}</Text>
      </View>

      {/* ── Stat strip ── */}
      <View style={s.stats}>
        <Stat icon="pricetags-outline" value={String(services.length)} label={services.length === 1 ? 'Service' : 'Services'} />
        <View style={s.statDivider} />
        <Stat icon="calendar-outline" value={String(dateCount)} label={dateCount === 1 ? 'Date' : 'Dates'} />
        <View style={s.statDivider} />
        <Stat icon="images-outline" value={String(photos.length)} label={photos.length === 1 ? 'Photo' : 'Photos'} />
      </View>

      {/* ── Actions ── */}
      <View style={s.actionRow}>
        <Pressable style={({ pressed }) => [s.actionBtn, pressed && s.pressed]} onPress={onEdit}>
          <Ionicons name="create-outline" size={17} color={tc.onBrand} />
          <Text style={s.actionBtnText}>Edit</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [s.actionGhost, pressed && s.pressed]} onPress={onDelete}>
          <Ionicons name="trash-outline" size={17} color={tc.dangerFg} />
          <Text style={s.actionGhostText}>Delete</Text>
        </Pressable>
      </View>

      {/* ── Collapsible detail ── */}
      {!!listing.intro && (
        <Accordion title="About you" icon="person-outline">
          <Text style={s.body}>{listing.intro}</Text>
        </Accordion>
      )}

      {services.length > 0 && (
        <Accordion
          title={section === 'guide' ? 'Tour types' : 'Services'}
          icon="pricetags-outline"
          badge={String(services.length)}
        >
          <View style={{ gap: spacing(2) }}>
            {services.map((x) => (
              <View key={x} style={s.serviceRow}>
                <Ionicons name={SERVICE_ICON[x]} size={17} color={tc.maroon800} />
                <Text style={s.serviceText}>{SERVICE_LABEL[x]}</Text>
              </View>
            ))}
          </View>
        </Accordion>
      )}

      {services.length > 0 && (
        <Accordion title="Availability" icon="calendar-outline" badge={String(dateCount)}>
          <AvailabilitySummary services={services} availability={availability} />
        </Accordion>
      )}

      {photos.length > 0 && (
        <Accordion title="Photos" icon="images-outline" badge={String(photos.length)}>
          <View style={s.thumbGrid}>
            {photos.map((p) => (
              <Image
                key={p}
                source={{ uri: p }}
                style={{ width: thumb, height: thumb, borderRadius: radius.md }}
                contentFit="cover"
                transition={150}
              />
            ))}
          </View>
        </Accordion>
      )}

      <AnswersAccordion listing={listing} />
    </View>
  );
}

function Stat({ icon, value, label }: { icon: IoniconName; value: string; label: string }) {
  const s = useStyles(makeStyles);
  const tc = useThemeColors();
  return (
    <View style={s.stat}>
      <Ionicons name={icon} size={16} color={tc.maroon800} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

/**
 * A collapsible detail block.
 *
 * The web CV shows everything expanded at once, which is fine across a desktop's width but
 * turns into a very long scroll on a phone — so each block starts closed and opens on tap.
 */
function Accordion({
  title,
  icon,
  badge,
  children,
}: {
  title: string;
  icon: IoniconName;
  badge?: string;
  children: React.ReactNode;
}) {
  const s = useStyles(makeStyles);
  const tc = useThemeColors();
  const [open, setOpen] = useState(false);

  return (
    <View style={s.accordion}>
      <Pressable
        style={({ pressed }) => [s.accordionHead, pressed && s.pressed]}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={s.accordionIcon}>
          <Ionicons name={icon} size={17} color={tc.maroon800} />
        </View>
        <Text style={s.accordionTitle}>{title}</Text>
        {badge ? (
          <View style={s.accordionBadge}>
            <Text style={s.accordionBadgeText}>{badge}</Text>
          </View>
        ) : null}
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={tc.ink300} />
      </Pressable>
      {open && <View style={s.accordionBody}>{children}</View>}
    </View>
  );
}

/** Dates + times per service, in the same "applies to every date" model as the picker. */
function AvailabilitySummary({
  services,
  availability,
}: {
  services: GuideService[];
  availability: Availability;
}) {
  const s = useStyles(makeStyles);
  const offered = services.filter((x) => availability[x]);

  if (offered.length === 0) return <Text style={s.muted}>No availability set yet.</Text>;

  return (
    <View style={{ gap: spacing(4) }}>
      {offered.map((x) => {
        const entry = availability[x]!;
        return (
          <View key={x}>
            <Text style={s.availService}>{SERVICE_LABEL[x]}</Text>
            <View style={s.availChips}>
              {entry.dates.slice(0, 6).map((d) => (
                <View key={d} style={s.availChip}>
                  <Text style={s.availChipText}>{labelForDate(d)}</Text>
                </View>
              ))}
              {entry.dates.length > 6 && (
                <View style={s.availChip}>
                  <Text style={s.availChipText}>+{entry.dates.length - 6} more</Text>
                </View>
              )}
            </View>
            <Text style={s.availTimes}>
              {entry.times.slice(0, 6).map(labelForTime).join(' · ')}
              {entry.times.length > 6 ? ` +${entry.times.length - 6} more` : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/**
 * The questionnaire answers, as saved.
 *
 * The two flows store them differently — guides keep a labelled snapshot array, counselors
 * a plain key→value map — so both shapes are handled rather than assuming one.
 */
function AnswersAccordion({ listing }: { listing: Listing }) {
  const s = useStyles(makeStyles);
  const raw = listing.answers;

  const rows: { label: string; value: string }[] = [];
  if (Array.isArray(raw)) {
    for (const a of raw as { label?: string; value?: string | string[] }[]) {
      const value = Array.isArray(a.value) ? a.value.join(', ') : String(a.value ?? '');
      if (a.label && value.trim()) rows.push({ label: a.label, value });
    }
  } else if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      const value = Array.isArray(v) ? v.join(', ') : String(v ?? '');
      if (value.trim()) rows.push({ label: k, value });
    }
  }

  if (rows.length === 0) return null;

  return (
    <Accordion title="Application answers" icon="document-text-outline" badge={String(rows.length)}>
      <View style={{ gap: spacing(4) }}>
        {rows.map((r, i) => (
          <View key={`${r.label}-${i}`}>
            <Text style={s.answerLabel}>{r.label}</Text>
            <Text style={s.answerValue}>{r.value}</Text>
          </View>
        ))}
      </View>
    </Accordion>
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: tc.ivory },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pressed: { opacity: 0.7 },
    disabled: { opacity: 0.6 },
    scroll: { paddingHorizontal: spacing(5), paddingTop: spacing(2) },
    body: { fontSize: font(14), lineHeight: 21, color: tc.ink600 },
    muted: { fontSize: font(13.5), color: tc.ink500 },

    topBar: {
      backgroundColor: tc.white,
      paddingHorizontal: spacing(5),
      paddingTop: spacing(2),
      paddingBottom: spacing(3.5),
      borderBottomWidth: 1,
      borderBottomColor: tc.ink100,
    },
    title: { fontSize: font(26), fontWeight: '800', color: tc.ink900 },
    segment: {
      flexDirection: 'row',
      gap: spacing(1),
      backgroundColor: tc.ivory,
      borderRadius: radius.md,
      padding: 3,
      marginTop: spacing(3.5),
    },
    segmentBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: 36,
      borderRadius: radius.sm,
    },
    segmentBtnOn: { backgroundColor: tc.maroon900 },
    segmentText: { fontSize: font(13.5), fontWeight: '700', color: tc.ink500 },
    segmentTextOn: { color: tc.onBrand, fontWeight: '800' },

    /* Empty state */
    hero: {
      backgroundColor: tc.maroon900,
      borderRadius: radius.xl + 4,
      padding: spacing(6),
      marginTop: spacing(4),
      overflow: 'hidden',
    },
    heroGlow: {
      position: 'absolute',
      top: -70,
      right: -50,
      height: 180,
      width: 180,
      borderRadius: 90,
      backgroundColor: '#ffffff14',
    },
    heroIcon: {
      height: 52,
      width: 52,
      borderRadius: radius.lg,
      backgroundColor: '#ffffff26',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTitle: {
      fontSize: font(22),
      fontWeight: '800',
      color: tc.onBrand,
      lineHeight: 29,
      marginTop: spacing(4),
    },
    heroBody: { fontSize: font(13.5), lineHeight: 20, color: '#ffffffb8', marginTop: spacing(2.5) },
    heroBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(2),
      height: 50,
      backgroundColor: tc.ivory,
      borderRadius: radius.lg,
      marginTop: spacing(5),
    },
    heroBtnText: { fontSize: font(15), fontWeight: '800', color: tc.maroon900 },

    perkList: { gap: spacing(3), marginTop: spacing(5) },
    perkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(3),
      backgroundColor: tc.white,
      borderWidth: 1,
      borderColor: tc.ink100,
      borderRadius: radius.lg,
      padding: spacing(3.5),
    },
    perkIcon: {
      height: 40,
      width: 40,
      borderRadius: radius.md,
      backgroundColor: tc.maroon50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    perkTitle: { fontSize: font(14), fontWeight: '700', color: tc.ink900 },
    perkBody: { fontSize: font(12.5), lineHeight: 18, color: tc.ink500, marginTop: 2 },

    /* Draft */
    card: {
      backgroundColor: tc.white,
      borderWidth: 1,
      borderColor: tc.ink100,
      borderRadius: radius.xl,
      padding: spacing(5),
      marginTop: spacing(4),
    },
    cardHead: { flexDirection: 'row' },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(1.5),
      borderRadius: radius.pill,
      paddingHorizontal: spacing(2.5),
      paddingVertical: spacing(1.5),
    },
    pillText: { fontSize: font(11), fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
    cardTitle: { fontSize: font(20), fontWeight: '800', color: tc.ink900, marginTop: spacing(3), lineHeight: 26 },
    cardBody: { fontSize: font(13.5), lineHeight: 20, color: tc.ink500, marginTop: spacing(2) },

    progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), marginTop: spacing(5) },
    progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: tc.ink100, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3, backgroundColor: tc.maroon900 },
    progressPct: { fontSize: font(12), fontWeight: '800', color: tc.maroon800, minWidth: 34, textAlign: 'right' },

    stepList: { gap: spacing(3), marginTop: spacing(4) },
    stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
    stepBadge: {
      height: 26,
      width: 26,
      borderRadius: 13,
      backgroundColor: tc.ink100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepBadgeDone: { backgroundColor: tc.maroon900 },
    stepBadgeCurrent: { backgroundColor: tc.maroon50, borderWidth: 2, borderColor: tc.maroon800 },
    stepBadgeText: { fontSize: font(12), fontWeight: '800', color: tc.ink500 },
    stepBadgeTextOn: { color: tc.maroon800 },
    stepText: { flex: 1, fontSize: font(14), color: tc.ink300 },
    stepTextDone: { color: tc.ink500, textDecorationLine: 'line-through' },
    stepTextCurrent: { color: tc.ink900, fontWeight: '700' },

    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(2),
      height: 50,
      backgroundColor: tc.maroon900,
      borderRadius: radius.lg,
      marginTop: spacing(6),
    },
    primaryBtnText: { fontSize: font(15), fontWeight: '800', color: tc.onBrand },
    textBtn: { alignItems: 'center', justifyContent: 'center', height: 44, marginTop: spacing(1) },
    textBtnText: { fontSize: font(13.5), fontWeight: '700', color: tc.ink500 },

    /* Submitted */
    profileHead: { alignItems: 'center', paddingTop: spacing(6), paddingBottom: spacing(2) },
    profilePhoto: { height: 104, width: 104, borderRadius: 52 },
    profilePhotoEmpty: {
      backgroundColor: tc.white,
      borderWidth: 1,
      borderColor: tc.ink200,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(1.5),
      borderRadius: radius.pill,
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(1.5),
      marginTop: -spacing(3),
      borderWidth: 3,
      borderColor: tc.ivory,
    },
    statusBadgeText: { fontSize: font(11.5), fontWeight: '800' },
    profileName: {
      fontSize: font(21),
      fontWeight: '800',
      color: tc.ink900,
      textAlign: 'center',
      lineHeight: 28,
      marginTop: spacing(3),
    },
    profileMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), marginTop: spacing(1.5) },
    profileMeta: { fontSize: font(13.5), color: tc.ink500 },

    statusNote: { borderRadius: radius.lg, padding: spacing(4), marginTop: spacing(4) },
    statusNoteText: { fontSize: font(13), lineHeight: 19, fontWeight: '600' },

    stats: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: tc.white,
      borderWidth: 1,
      borderColor: tc.ink100,
      borderRadius: radius.lg,
      paddingVertical: spacing(3.5),
      marginTop: spacing(3),
    },
    stat: { flex: 1, alignItems: 'center', gap: spacing(1) },
    statDivider: { width: 1, height: 34, backgroundColor: tc.ink100 },
    statValue: { fontSize: font(18), fontWeight: '800', color: tc.ink900 },
    statLabel: { fontSize: font(11.5), fontWeight: '600', color: tc.ink500 },

    actionRow: { flexDirection: 'row', gap: spacing(3), marginTop: spacing(3) },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(2),
      height: 48,
      backgroundColor: tc.maroon900,
      borderRadius: radius.lg,
    },
    actionBtnText: { fontSize: font(14.5), fontWeight: '800', color: tc.onBrand },
    actionGhost: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(2),
      height: 48,
      borderWidth: 1.5,
      borderColor: tc.danger + '55',
      borderRadius: radius.lg,
    },
    actionGhostText: { fontSize: font(14.5), fontWeight: '800', color: tc.dangerFg },

    /* Accordion */
    accordion: {
      backgroundColor: tc.white,
      borderWidth: 1,
      borderColor: tc.ink100,
      borderRadius: radius.lg,
      marginTop: spacing(3),
      overflow: 'hidden',
    },
    accordionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(3),
      minHeight: 60,
      paddingHorizontal: spacing(4),
      paddingVertical: spacing(3),
    },
    accordionIcon: {
      height: 36,
      width: 36,
      borderRadius: radius.md,
      backgroundColor: tc.maroon50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accordionTitle: { flex: 1, fontSize: font(14.5), fontWeight: '700', color: tc.ink900 },
    accordionBadge: {
      minWidth: 24,
      alignItems: 'center',
      backgroundColor: tc.ivory,
      borderRadius: radius.pill,
      paddingHorizontal: spacing(2),
      paddingVertical: 2,
    },
    accordionBadgeText: { fontSize: font(11.5), fontWeight: '800', color: tc.ink500 },
    accordionBody: {
      paddingHorizontal: spacing(4),
      paddingTop: spacing(4),
      paddingBottom: spacing(4.5),
      borderTopWidth: 1,
      borderTopColor: tc.ink100,
    },

    serviceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2.5) },
    serviceText: { flex: 1, fontSize: font(14), color: tc.ink900 },

    availService: { fontSize: font(13.5), fontWeight: '800', color: tc.ink900 },
    availChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1.5), marginTop: spacing(2) },
    availChip: {
      backgroundColor: tc.ivory,
      borderRadius: radius.sm,
      paddingHorizontal: spacing(2.5),
      paddingVertical: spacing(1.5),
    },
    availChipText: { fontSize: font(11.5), fontWeight: '600', color: tc.ink600 },
    availTimes: { fontSize: font(12.5), lineHeight: 18, color: tc.ink500, marginTop: spacing(2) },

    thumbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
    answerLabel: { fontSize: font(12), fontWeight: '700', color: tc.ink500 },
    answerValue: { fontSize: font(14), lineHeight: 20, color: tc.ink900, marginTop: 3 },

    /* Delete modal */
    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000099' },
    modalWrap: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing(6),
    },
    modalCard: {
      width: '100%',
      maxWidth: 380,
      alignItems: 'center',
      backgroundColor: tc.white,
      borderRadius: radius.xl + 4,
      padding: spacing(6),
    },
    modalIcon: {
      height: 52,
      width: 52,
      borderRadius: 26,
      backgroundColor: tc.dangerBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalTitle: { fontSize: font(19), fontWeight: '800', color: tc.ink900, marginTop: spacing(4) },
    modalBody: {
      fontSize: font(13.5),
      lineHeight: 20,
      color: tc.ink500,
      textAlign: 'center',
      marginTop: spacing(2),
    },
    modalDelete: {
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center',
      height: 50,
      backgroundColor: tc.danger,
      borderRadius: radius.lg,
      marginTop: spacing(6),
    },
    modalDeleteText: { fontSize: font(15), fontWeight: '800', color: tc.onBrand },
    modalCancel: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', height: 46 },
    modalCancelText: { fontSize: font(14.5), fontWeight: '700', color: tc.ink500 },
  });
