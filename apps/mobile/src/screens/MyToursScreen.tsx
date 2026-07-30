import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { font, colors, radius, spacing } from '../theme';
import {
  bookingsApi,
  formatPrice,
  bookingRef,
  fmtDate,
  fmtDuration,
  guestPaid,
  type BookingDto,
  type BookingStatus,
  type BookingServiceType,
} from '../api/bookings';
import { friendlyError } from '../api/auth';
import { BookingCardSkeleton } from '../components/Skeleton';

type ViewKey = 'guest' | 'guide';
type TabKey = 'requests' | 'confirmed' | 'past' | 'canceled';
type IoniconName = keyof typeof Ionicons.glyphMap;

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: 'guest', label: 'As guest' },
  { key: 'guide', label: 'As guide' },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: 'requests', label: 'Requests' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'past', label: 'Past' },
  { key: 'canceled', label: 'Canceled' },
];

const TAB_STATUSES: Record<TabKey, BookingStatus[]> = {
  requests: ['PENDING'],
  confirmed: ['CONFIRMED'],
  past: ['COMPLETED'],
  canceled: ['CANCELLED', 'DECLINED', 'EXPIRED'],
};

// Green isn't in the shared palette; local tokens for "confirmed / paid".
const GREEN_BG = '#e4f3ec';
const GREEN_FG = '#137a4d';
const RED_BG = '#fbe9ec';

const STATUS_STYLE: Record<BookingStatus, { label: string; bg: string; fg: string }> = {
  PENDING_PAYMENT: { label: 'Awaiting payment', bg: colors.maroon50, fg: colors.gold500 },
  PENDING: { label: 'Pending', bg: '#faf1d8', fg: '#8a6d1f' },
  CONFIRMED: { label: 'Confirmed', bg: GREEN_BG, fg: GREEN_FG },
  COMPLETED: { label: 'Completed', bg: colors.ink100, fg: colors.ink600 },
  DECLINED: { label: 'Rejected', bg: RED_BG, fg: colors.danger },
  EXPIRED: { label: 'Expired', bg: colors.ink100, fg: colors.ink500 },
  CANCELLED: { label: 'Canceled', bg: RED_BG, fg: colors.danger },
};

function serviceMeta(t: BookingServiceType): { icon: IoniconName; label: string } {
  if (t === 'VIDEO_CONSULTATION') return { icon: 'videocam', label: 'Video consultation' };
  if (t === 'CONSULTATION') return { icon: 'chatbubbles', label: 'Consultancy' };
  return { icon: 'walk', label: 'Campus tour' };
}

export function MyToursScreen() {
  const [view, setView] = useState<ViewKey>('guest');
  const [tab, setTab] = useState<TabKey>('requests');
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<BookingDto | null>(null);

  const load = useCallback(
    (opts?: { refresh?: boolean }) => {
      if (opts?.refresh) setRefreshing(true);
      else setLoading(true);
      bookingsApi
        .list(view)
        .then((res) => setBookings(res.data))
        .catch(() => setBookings([]))
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [view],
  );

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const g: Record<TabKey, BookingDto[]> = { requests: [], confirmed: [], past: [], canceled: [] };
    for (const b of bookings) {
      for (const t of TABS) {
        if (TAB_STATUSES[t.key].includes(b.status)) g[t.key].push(b);
      }
    }
    return g;
  }, [bookings]);

  const active = grouped[tab];

  if (selected) {
    return (
      <BookingDetail
        booking={selected}
        view={view}
        onBack={() => setSelected(null)}
        onChanged={() => {
          setSelected(null);
          load();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>My tours</Text>
        {/* Perspective switch */}
        <View style={styles.segment}>
          {VIEWS.map((v) => {
            const on = view === v.key;
            return (
              <Pressable
                key={v.key}
                onPress={() => {
                  setView(v.key);
                  setTab('requests');
                }}
                style={[styles.segmentBtn, on && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, on && styles.segmentTextActive]}>{v.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Tabs — fixed full-width row (all four fit; no horizontal scroll) */}
      <View style={styles.tabRow}>
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={styles.tabBtn}>
              <Text style={[styles.tabText, on && styles.tabTextActive]} numberOfLines={1}>
                {t.label}
              </Text>
              <Text style={[styles.tabCount, on && styles.tabCountActive]}>
                {loading ? '…' : grouped[t.key].length}
              </Text>
              {on && <View style={styles.tabUnderline} />}
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={[styles.list, { gap: spacing(3) }]}>
          {Array.from({ length: 4 }).map((_, i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={active}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => <BookingRow booking={item} view={view} onPress={() => setSelected(item)} />}
          contentContainerStyle={styles.list}
          initialNumToRender={8}
          windowSize={11}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load({ refresh: true })} tintColor={colors.maroon800} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={26} color={colors.maroon800} />
              </View>
              <Text style={styles.emptyTitle}>No tours yet</Text>
              <Text style={styles.emptyText}>
                {view === 'guest'
                  ? 'Tours you book with student guides will show up here.'
                  : 'Tour requests from families will show up here once you’re listed as a guide.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

/* ═══ List row ══════════════════════════════════════════════════════════ */

function BookingRow({ booking: b, view, onPress }: { booking: BookingDto; view: ViewKey; onPress: () => void }) {
  const { icon, label } = serviceMeta(b.serviceType);
  const other = view === 'guest' ? b.seller?.name : b.buyer?.name;
  const otherLabel = view === 'guest' ? 'with' : 'for';
  const school = b.listing?.school?.name ?? b.schoolName;
  const st = STATUS_STYLE[b.status];

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={colors.maroon800} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {b.listing?.title ?? b.listingTitle ?? label}
        </Text>
        <Text style={styles.rowRef}>{bookingRef(b.bookingNo)}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>
          {other ? `${otherLabel} ${other}` : ''}
          {school ? ` · ${school}` : ''}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {fmtDate(b.scheduledDate)}
          {b.scheduledTime ? ` · ${b.scheduledTime}` : ''} · {b.guestCount} guest{b.guestCount > 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowPrice}>{formatPrice(b.grossCents)}</Text>
        <StatusPill status={b.status} />
        {guestPaid(b.payment?.status) && <PaidPill />}
      </View>
    </Pressable>
  );
}

function StatusPill({ status }: { status: BookingStatus }) {
  const st = STATUS_STYLE[status];
  return (
    <View style={[styles.pill, { backgroundColor: st.bg }]}>
      <Text style={[styles.pillText, { color: st.fg }]}>{st.label}</Text>
    </View>
  );
}

function PaidPill() {
  return (
    <View style={[styles.pill, { backgroundColor: GREEN_BG, flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
      <Ionicons name="checkmark" size={11} color={GREEN_FG} />
      <Text style={[styles.pillText, { color: GREEN_FG }]}>Paid</Text>
    </View>
  );
}

/* ═══ Booking detail ════════════════════════════════════════════════════ */

function BookingDetail({
  booking: b,
  view,
  onBack,
  onChanged,
}: {
  booking: BookingDto;
  view: ViewKey;
  onBack: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<null | 'accept' | 'decline' | 'complete'>(null);
  const [meetingLink, setMeetingLink] = useState(b.videoLink ?? '');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [localReview, setLocalReview] = useState<{ rating: number; text: string | null } | null>(null);

  const { icon, label: serviceLabel } = serviceMeta(b.serviceType);
  const st = STATUS_STYLE[b.status];
  const isGuide = view === 'guide';
  const canAcceptDecline = isGuide && b.status === 'PENDING';
  const canComplete = isGuide && b.status === 'CONFIRMED';
  const needsLink = b.serviceType === 'VIDEO_CONSULTATION' || b.serviceType === 'CONSULTATION';
  const validLink = /^https?:\/\/.+/i.test(meetingLink.trim());

  const title = b.listing?.title ?? b.listingTitle ?? serviceLabel;
  const school = b.listing?.school?.name ?? b.schoolName;
  const other = view === 'guest' ? b.seller?.name : b.buyer?.name;
  const otherRole = view === 'guest' ? 'Guide' : 'Guest';
  const otherFirst = other?.split(' ')[0] ?? (view === 'guest' ? 'the guide' : 'the guest');
  const duration = fmtDuration(b.durationMinutes);

  const rows: { icon: IoniconName; label: string; value: string }[] = [
    ...(other ? [{ icon: 'person-outline' as IoniconName, label: otherRole, value: other }] : []),
    ...(school ? [{ icon: 'school-outline' as IoniconName, label: 'School', value: school }] : []),
    {
      icon: 'calendar-outline',
      label: 'Date',
      value: `${fmtDate(b.scheduledDate)}${b.scheduledTime ? ` · ${b.scheduledTime}` : ''}`,
    },
    ...(duration ? [{ icon: 'time-outline' as IoniconName, label: 'Duration', value: duration }] : []),
    { icon: 'people-outline', label: 'Guests', value: `${b.guestCount} guest${b.guestCount > 1 ? 's' : ''}` },
  ];

  const showConfirmedLink = b.status === 'CONFIRMED' && needsLink && !!b.videoLink;

  async function act(action: 'accept' | 'decline' | 'complete') {
    if (action === 'accept' && needsLink && !validLink) {
      Alert.alert('Meeting link required', 'Paste a valid Google Meet or Zoom link before confirming.');
      return;
    }
    setBusy(action);
    try {
      if (action === 'accept') await bookingsApi.accept(b.id, needsLink ? meetingLink.trim() : undefined);
      else if (action === 'decline') await bookingsApi.decline(b.id);
      else await bookingsApi.complete(b.id);
      Alert.alert(
        action === 'accept' ? 'Booking confirmed' : action === 'decline' ? 'Booking rejected' : 'Marked complete',
        action === 'accept'
          ? 'Payment captured. The guest has been notified by email.'
          : action === 'decline'
            ? 'The payment hold was released. The guest has been notified.'
            : 'The guest has been notified by email.',
        [{ text: 'OK', onPress: onChanged }],
      );
    } catch (e) {
      setBusy(null);
      Alert.alert('Something went wrong', friendlyError(e));
    }
  }

  async function submitReview() {
    if (rating < 1) {
      Alert.alert('Pick a rating', 'Select 1 to 5 stars before submitting.');
      return;
    }
    setSubmittingReview(true);
    try {
      await bookingsApi.review(b.id, rating, reviewText.trim() || undefined);
      setLocalReview({ rating, text: reviewText.trim() || null });
      Alert.alert('Review submitted', 'Thanks — your feedback is now on the guide’s profile.');
    } catch (e) {
      Alert.alert('Could not submit review', friendlyError(e));
    } finally {
      setSubmittingReview(false);
    }
  }

  const existingReview = localReview ?? b.review;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.detailScroll}>
        <Pressable style={styles.backBtn} onPress={onBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={18} color={colors.maroon900} />
          <Text style={styles.backText}>Back to My tours</Text>
        </Pressable>

        <View style={styles.detailCard}>
          {/* Header */}
          <View style={styles.detailHeader}>
            <View style={styles.detailHeaderIcon}>
              <Ionicons name={icon} size={26} color={colors.maroon800} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.detailKicker}>
                {serviceLabel.toUpperCase()} · {bookingRef(b.bookingNo)}
              </Text>
              <Text style={styles.detailTitle}>{title}</Text>
            </View>
          </View>

          {/* Status + price */}
          <View style={styles.detailStatusRow}>
            <View style={{ flexDirection: 'row', gap: spacing(2), alignItems: 'center' }}>
              <StatusPill status={b.status} />
              {guestPaid(b.payment?.status) && <PaidPill />}
            </View>
            <Text style={styles.detailPrice}>{formatPrice(b.grossCents)}</Text>
          </View>

          {/* Detail rows */}
          <View style={styles.rowsBox}>
            {rows.map((r, i) => (
              <View key={r.label} style={[styles.detailRow, i > 0 && styles.detailRowBorder]}>
                <Ionicons name={r.icon} size={16} color={colors.ink300} />
                <Text style={styles.detailRowLabel}>{r.label}</Text>
                <Text style={styles.detailRowValue}>{r.value}</Text>
              </View>
            ))}
          </View>

          {/* Confirmed meeting link */}
          {showConfirmedLink && (
            <View style={styles.linkBox}>
              <Text style={styles.linkBoxTitle}>
                <Ionicons name="link" size={14} color={GREEN_FG} /> Meeting link
              </Text>
              <Pressable style={styles.joinBtn} onPress={() => Linking.openURL(b.videoLink!)}>
                <Ionicons name="videocam" size={16} color={colors.white} />
                <Text style={styles.joinBtnText}>Join meeting</Text>
                <Ionicons name="open-outline" size={14} color={colors.white} />
              </Pressable>
              <Text style={styles.linkUrl}>{b.videoLink}</Text>
            </View>
          )}

          {/* Guide meeting-link input */}
          {canAcceptDecline && needsLink && (
            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>
                <Ionicons name="link" size={14} color={colors.maroon800} /> Meeting link (Google Meet or Zoom)
              </Text>
              <TextInput
                value={meetingLink}
                onChangeText={setMeetingLink}
                placeholder="https://meet.google.com/abc-defg-hij"
                placeholderTextColor={colors.ink300}
                autoCapitalize="none"
                keyboardType="url"
                style={styles.input}
              />
              <Text style={styles.inputHint}>
                Create the meeting for the scheduled time, paste the link, then confirm. {otherFirst} gets it by email
                and here in My tours.
              </Text>
            </View>
          )}

          {/* Guest waiting note */}
          {!isGuide && b.status === 'PENDING' && needsLink && (
            <Text style={styles.note}>
              Once {otherFirst} confirms, your meeting link will appear here and in your email.
            </Text>
          )}

          <Text style={styles.note}>
            {b.status === 'PENDING'
              ? view === 'guest'
                ? 'You’ve paid — the amount is held and only charged once the guide confirms.'
                : 'The guest has already paid. Confirm to capture the payment, or reject to release the hold.'
              : b.status === 'CONFIRMED'
                ? 'Confirmed — you’re all set. Check your email for details.'
                : `This booking is ${st.label.toLowerCase()}.`}
          </Text>

          {/* Review */}
          {b.status === 'COMPLETED' &&
            (existingReview ? (
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="star" size={14} color={colors.gold500} /> {isGuide ? `${otherFirst}’s review` : 'Your review'}
                </Text>
                <StarsStatic value={existingReview.rating} />
                {existingReview.text ? <Text style={styles.reviewText}>“{existingReview.text}”</Text> : null}
              </View>
            ) : isGuide ? (
              <Text style={styles.note}>No review yet — {otherFirst} can leave one from their My tours.</Text>
            ) : (
              <View style={styles.inputBox}>
                <Text style={styles.inputLabelPlain}>Leave a review for {otherFirst}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable key={n} onPress={() => setRating(n)} hitSlop={4}>
                      <Ionicons
                        name={rating >= n ? 'star' : 'star-outline'}
                        size={30}
                        color={rating >= n ? colors.gold500 : colors.ink200}
                      />
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  value={reviewText}
                  onChangeText={setReviewText}
                  placeholder={`Share how your ${serviceLabel.toLowerCase()} with ${otherFirst} went…`}
                  placeholderTextColor={colors.ink300}
                  multiline
                  style={[styles.input, styles.textarea]}
                />
                <Pressable
                  style={[styles.primaryBtn, (submittingReview || rating < 1) && styles.btnDisabled]}
                  onPress={submitReview}
                  disabled={submittingReview || rating < 1}
                >
                  {submittingReview ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Ionicons name="star" size={16} color={colors.white} />
                      <Text style={styles.primaryBtnText}>Submit review</Text>
                    </>
                  )}
                </Pressable>
              </View>
            ))}

          {/* Guide actions */}
          {canAcceptDecline && (
            <View style={{ gap: spacing(2), marginTop: spacing(1) }}>
              <Pressable
                style={[styles.primaryBtn, (!!busy || (needsLink && !validLink)) && styles.btnDisabled]}
                onPress={() => act('accept')}
                disabled={!!busy || (needsLink && !validLink)}
              >
                {busy === 'accept' ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                    <Text style={styles.primaryBtnText}>Confirm booking</Text>
                  </>
                )}
              </Pressable>
              <Pressable style={[styles.dangerBtn, !!busy && styles.btnDisabled]} onPress={() => act('decline')} disabled={!!busy}>
                {busy === 'decline' ? (
                  <ActivityIndicator color={colors.danger} />
                ) : (
                  <>
                    <Ionicons name="ban" size={16} color={colors.danger} />
                    <Text style={styles.dangerBtnText}>Reject</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
          {canComplete && (
            <Pressable
              style={[styles.primaryBtn, !!busy && styles.btnDisabled, { marginTop: spacing(1) }]}
              onPress={() => act('complete')}
              disabled={!!busy}
            >
              {busy === 'complete' ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={16} color={colors.white} />
                  <Text style={styles.primaryBtnText}>Mark as complete</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StarsStatic({ value }: { value: number }) {
  return (
    <View style={[styles.starsRow, { marginTop: spacing(2) }]}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={value >= n ? 'star' : 'star-outline'} size={18} color={colors.gold500} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: spacing(5), paddingTop: spacing(2), paddingBottom: spacing(3) },
  title: { fontSize: font(28), fontWeight: '800', color: colors.ink900 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderRadius: radius.pill,
    padding: 4,
    marginTop: spacing(4),
  },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing(2.5), borderRadius: radius.pill },
  segmentBtnActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  segmentText: { fontSize: font(14), fontWeight: '600', color: colors.ink500 },
  segmentTextActive: { color: colors.maroon900 },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.ink100,
  },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing(2.5) },
  tabText: { fontSize: font(13), fontWeight: '700', color: colors.ink500 },
  tabTextActive: { color: colors.maroon900 },
  tabCount: { fontSize: font(12), fontWeight: '600', color: colors.ink300, marginTop: 2 },
  tabCountActive: { color: colors.maroon800 },
  tabUnderline: {
    position: 'absolute',
    left: spacing(3),
    right: spacing(3),
    bottom: -1,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.maroon900,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing(5), gap: spacing(3), flexGrow: 1 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing(16), gap: spacing(2) },
  emptyIcon: {
    height: 56,
    width: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.maroon50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(1),
  },
  emptyTitle: { fontSize: font(17), fontWeight: '800', color: colors.ink900 },
  emptyText: { fontSize: font(14), color: colors.ink500, textAlign: 'center', maxWidth: 280 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: radius.lg,
    padding: spacing(4),
  },
  rowIcon: {
    height: 44,
    width: 44,
    borderRadius: radius.md,
    backgroundColor: colors.maroon50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: font(15), fontWeight: '700', color: colors.ink900 },
  rowRef: { fontSize: font(12), fontWeight: '700', color: colors.maroon800, marginTop: 1 },
  rowSub: { fontSize: font(13), color: colors.ink500, marginTop: 1 },
  rowMeta: { fontSize: font(12), color: colors.ink300, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', gap: spacing(1) },
  rowPrice: { fontSize: font(14), fontWeight: '800', color: colors.ink900 },

  pill: { borderRadius: radius.pill, paddingHorizontal: spacing(2.5), paddingVertical: 3 },
  pillText: { fontSize: font(11), fontWeight: '700' },

  // Detail
  detailScroll: { padding: spacing(5), paddingBottom: spacing(10) },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), marginBottom: spacing(4) },
  backText: { fontSize: font(14), fontWeight: '700', color: colors.maroon900 },
  detailCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: radius.xl,
    overflow: 'hidden',
    paddingBottom: spacing(5),
  },
  detailHeader: {
    flexDirection: 'row',
    gap: spacing(3),
    padding: spacing(5),
    borderBottomWidth: 1,
    borderBottomColor: colors.ink100,
  },
  detailHeaderIcon: {
    height: 52,
    width: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.maroon50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailKicker: { fontSize: font(11), fontWeight: '800', letterSpacing: 1, color: colors.ink300 },
  detailTitle: { fontSize: font(20), fontWeight: '800', color: colors.ink900, marginTop: 2 },
  detailStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(5),
    paddingTop: spacing(5),
  },
  detailPrice: { fontSize: font(18), fontWeight: '800', color: colors.ink900 },
  rowsBox: {
    marginHorizontal: spacing(5),
    marginTop: spacing(4),
    borderWidth: 1,
    borderColor: colors.ink100,
    borderRadius: radius.lg,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), paddingHorizontal: spacing(4), paddingVertical: spacing(3.5) },
  detailRowBorder: { borderTopWidth: 1, borderTopColor: colors.ink100 },
  detailRowLabel: { width: 84, fontSize: font(13), color: colors.ink500 },
  detailRowValue: { flex: 1, textAlign: 'right', fontSize: font(13), fontWeight: '600', color: colors.ink900 },

  linkBox: {
    margin: spacing(5),
    marginBottom: 0,
    padding: spacing(4),
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GREEN_FG + '55',
    backgroundColor: GREEN_BG + '80',
  },
  linkBoxTitle: { fontSize: font(14), fontWeight: '700', color: colors.ink900 },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    backgroundColor: colors.maroon900,
    borderRadius: radius.lg,
    paddingVertical: spacing(3),
    marginTop: spacing(3),
  },
  joinBtnText: { color: colors.white, fontSize: font(14), fontWeight: '700' },
  linkUrl: { fontSize: font(12), color: colors.ink500, textAlign: 'center', marginTop: spacing(2) },

  inputBox: {
    margin: spacing(5),
    marginBottom: 0,
    padding: spacing(4),
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink200,
    backgroundColor: colors.ivory,
  },
  inputLabel: { fontSize: font(14), fontWeight: '700', color: colors.ink900 },
  inputLabelPlain: { fontSize: font(14), fontWeight: '700', color: colors.ink900 },
  input: {
    marginTop: spacing(2),
    borderWidth: 1,
    borderColor: colors.ink200,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    fontSize: font(14),
    color: colors.ink900,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  inputHint: { fontSize: font(12), color: colors.ink500, marginTop: spacing(2) },

  note: {
    marginHorizontal: spacing(5),
    marginTop: spacing(4),
    backgroundColor: colors.ink100,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2.5),
    fontSize: font(12),
    color: colors.ink500,
    textAlign: 'center',
  },

  starsRow: { flexDirection: 'row', gap: spacing(1.5), marginTop: spacing(3) },
  reviewText: { fontSize: font(14), fontStyle: 'italic', color: colors.ink600, marginTop: spacing(2), lineHeight: 20 },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    backgroundColor: colors.maroon900,
    borderRadius: radius.lg,
    paddingVertical: spacing(3.5),
    marginHorizontal: spacing(5),
    marginTop: spacing(3),
  },
  primaryBtnText: { color: colors.white, fontSize: font(14), fontWeight: '700' },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    borderWidth: 1,
    borderColor: colors.danger + '55',
    borderRadius: radius.lg,
    paddingVertical: spacing(3.5),
    marginHorizontal: spacing(5),
  },
  dangerBtnText: { color: colors.danger, fontSize: font(14), fontWeight: '700' },
  btnDisabled: { opacity: 0.55 },
});
