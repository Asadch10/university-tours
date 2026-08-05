import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { font, colors, radius, spacing } from '../../theme';
import { fromPrice, type Guide, type Availability, type GuideService, TIME_SLOTS } from '../../api/guides';
import { bookingsApi } from '../../api/bookings';
import { authorizeCard } from '../../api/payments';
import { session, friendlyError } from '../../api/auth';
import { ApiClientError } from '../../api/client';
import { SERVICE_LABEL, SERVICE_DESC } from '../../tour-types';
import { usePriceBounds, priceFor } from '../../api/pricing';
import { useStyles, useThemeColors } from '../../theme-context';
import type { Palette } from '../../theme';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Prices are NOT derived from these — each tier is priced per tour type by the admin
// (Finance → Price & commission) and fetched via usePriceBounds().
const DURATIONS = [
  { label: '1 hour', minutes: 60, desc: 'A quick campus overview and answers to your top questions.' },
  { label: '2 hours', minutes: 120, recommended: true, desc: 'A thorough, personalized tour and deeper campus insights.' },
];

const TOUR_META: Record<GuideService, { label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }> = {
  CAMPUS_TOUR: { label: SERVICE_LABEL.CAMPUS_TOUR, icon: 'walk', desc: SERVICE_DESC.CAMPUS_TOUR },
  VIDEO_CONSULTATION: { label: SERVICE_LABEL.VIDEO_CONSULTATION, icon: 'videocam', desc: SERVICE_DESC.VIDEO_CONSULTATION },
  CONSULTATION: { label: SERVICE_LABEL.CONSULTATION, icon: 'chatbubbles', desc: SERVICE_DESC.CONSULTATION },
};

const ymd = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** '14:30' → '2:30 PM'. */
function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  if (h == null || m == null) return t;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

type Status = 'idle' | 'submitting' | 'paying' | 'requested' | 'reserved';

export function BookTour({
  guide,
  availability,
  onBack,
}: {
  guide: Guide;
  availability: Availability;
  onBack: () => void;
}) {
  const tc = useThemeColors();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const fn = guide.name.split(' ')[0];

  const [tourType, setTourType] = useState<GuideService>(guide.services[0] ?? 'CAMPUS_TOUR');
  // No tour type is selected by default. Once the guest picks one, ALL remaining
  // fields (Date, Time, Guests, Duration) appear together — not step by step.
  const [tourPicked, setTourPicked] = useState(false);
  const [date, setDate] = useState<{ y: number; m: number; d: number } | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [duration, setDuration] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  // Admin-managed pricing per tour type (Finance → Price & commission).
  const { bounds: priceBounds } = usePriceBounds();
  // The amount the SERVER actually booked. The backend derives the price itself and
  // ignores the client's `priceCents`, so the confirmation must quote this, not the
  // local estimate — they only differ if an admin changed pricing mid-session.
  const [bookedCents, setBookedCents] = useState<number | null>(null);

  // Per-tour-type availability; a type without it keeps open scheduling.
  const typeAvail = availability[tourType];
  const hasAvail = !!typeAvail;
  const availDates = new Set(typeAvail?.dates ?? []);
  const timesForDate = hasAvail ? (date ? typeAvail!.times : []) : TIME_SLOTS;

  const now = new Date();
  const firstAvail = typeAvail?.dates[0] ?? null;
  const [cal, setCal] = useState(
    firstAvail
      ? { y: Number(firstAvail.slice(0, 4)), m: Number(firstAvail.slice(5, 7)) - 1 }
      : { y: now.getFullYear(), m: now.getMonth() },
  );

  const guests = adults + children;
  const selectedDuration = DURATIONS.find((d) => d.label === duration) ?? null;
  const priceCents = priceFor(priceBounds, tourType, selectedDuration?.minutes ?? 60);
  const ready = Boolean(date && time && duration);
  const busy = status === 'submitting' || status === 'paying';

  const dateLabel = date
    ? new Date(date.y, date.m, date.d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';
  const monthLabel = new Date(cal.y, cal.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const firstWeekday = new Date(cal.y, cal.m, 1).getDay();
  const daysInMonth = new Date(cal.y, cal.m + 1, 0).getDate();
  const todayKey = ymd(now.getFullYear(), now.getMonth(), now.getDate());

  const shiftMonth = (delta: number) => {
    const nm = cal.m + delta;
    setCal({ y: cal.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 });
  };

  function changeTourType(t: GuideService) {
    setTourType(t);
    setTourPicked(true);
    setDate(null);
    setTime(null);
    const first = availability[t]?.dates[0];
    if (first) setCal({ y: Number(first.slice(0, 4)), m: Number(first.slice(5, 7)) - 1 });
  }

  async function handleReserve() {
    if (!ready || status === 'submitting' || status === 'paying' || !date) return;
    if (!(await session.isSignedIn())) {
      Alert.alert('Sign in to book', 'Please sign in from the Account tab to request a tour.');
      return;
    }
    setStatus('submitting');
    let res;
    try {
      res = await bookingsApi.createGuide({
        sellerId: guide.id,
        serviceType: tourType,
        scheduledDate: ymd(date.y, date.m, date.d),
        scheduledTime: time ?? undefined,
        guestCount: guests,
        durationMinutes: selectedDuration?.minutes,
        priceCents,
        listingTitle: guide.headline,
        schoolName: guide.university,
      });
    } catch (e) {
      setStatus('idle');
      // A surviving 401 (token refresh also failed) means the session is truly expired.
      if (e instanceof ApiClientError && e.status === 401) {
        await session.clear();
        Alert.alert('Session expired', 'Please sign in again from the Settings tab to request a tour.');
      } else {
        Alert.alert('Couldn’t send request', friendlyError(e));
      }
      return;
    }

    setBookedCents(res.grossCents);

    // Payments off → the request is already live. Payments on → authorize the card.
    if (!res.clientSecret || !res.publishableKey) {
      setStatus('requested');
      return;
    }

    setStatus('paying');
    const pay = await authorizeCard({
      clientSecret: res.clientSecret,
      publishableKey: res.publishableKey,
      palette: tc,
    });
    if (pay.status === 'unavailable') {
      // In-app card entry needs a dev build; the booking is reserved — finish on web.
      setStatus('reserved');
      return;
    }
    if (pay.status === 'canceled') {
      // Card sheet dismissed — the booking is held as PENDING_PAYMENT; let them retry.
      setStatus('idle');
      return;
    }
    if (pay.status === 'failed') {
      setStatus('idle');
      Alert.alert('Payment failed', pay.message || 'Please check your card details and try again.');
      return;
    }
    // Authorized — flip the booking to PENDING (webhook is a backstop if this fails).
    try {
      await bookingsApi.confirmPayment(res.id);
    } catch {
      /* hold is placed; the webhook will reconcile */
    }
    setStatus('requested');
  }

  // ── Confirmation ──────────────────────────────────────────────────────────
  if (status === 'requested' || status === 'reserved') {
    const webFinish = status === 'reserved';
    return (
      <View style={styles.safe}>
        <StatusBar style="dark" />
        <View style={[styles.confirmWrap, { paddingTop: insets.top + spacing(10) }]}>
          <View style={styles.confirmIcon}>
            <Ionicons name={webFinish ? 'card' : 'calendar'} size={30} color={tc.maroon800} />
          </View>
          <Text style={styles.confirmTitle}>{webFinish ? 'Almost there' : 'Request sent'}</Text>
          <Text style={styles.confirmSub}>
            {webFinish
              ? `Your booking with ${fn} is reserved. Finish the card authorization on the website to confirm — you won’t be charged until ${fn} accepts.`
              : `${fn} has been notified and will confirm your ${TOUR_META[tourType].label.toLowerCase()}. Your card is only a hold — you won’t be charged until they accept.`}
          </Text>

          <View style={styles.summary}>
            <SummaryRow label="Tour type" value={TOUR_META[tourType].label} />
            <SummaryRow label="When" value={`${dateLabel}${time ? ` · ${fmtTime(time)}` : ''}`} />
            <SummaryRow label="Guests" value={`${guests} guest${guests > 1 ? 's' : ''}`} />
            {selectedDuration && <SummaryRow label="Duration" value={selectedDuration.label} />}
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryLabel}>Total if accepted</Text>
              <Text style={styles.summaryTotalValue}>{fromPrice(bookedCents ?? priceCents)}</Text>
            </View>
          </View>

          <Pressable style={styles.primaryBtn} onPress={onBack}>
            <Text style={styles.primaryBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Booking form ──────────────────────────────────────────────────────────
  return (
    <View style={styles.safe}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + spacing(2) }]}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={tc.ink900} />
        </Pressable>
        <Text style={styles.headerTitle}>Request to book</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Guide */}
        <Text style={styles.guideName}>{guide.name}</Text>
        {!!guide.university && (
          <View style={styles.uniRow}>
            <Ionicons name="school-outline" size={14} color={tc.ink500} />
            <Text style={styles.uni}>{guide.university}</Text>
          </View>
        )}

        {/* Tour type */}
        <SectionLabel n={1} text="How would you like to tour?" />
        <View style={{ gap: spacing(2.5) }}>
          {guide.services.map((s) => {
            const meta = TOUR_META[s];
            const active = tourPicked && tourType === s;
            return (
              <Pressable key={s} onPress={() => changeTourType(s)} style={[styles.tourCard, active && styles.tourCardActive]}>
                <View style={[styles.tourIcon, active && styles.tourIconActive]}>
                  <Ionicons name={meta.icon} size={18} color={active ? tc.white : tc.ink600} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tourTitle}>{meta.label}</Text>
                  <Text style={styles.tourDesc}>{meta.desc}</Text>
                </View>
                {/* 1-hour price for this tour type, shown before a duration is chosen. */}
                <Text style={styles.durPrice}>from {fromPrice(priceFor(priceBounds, s, 60))}</Text>
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={active ? tc.maroon800 : tc.ink300}
                />
              </Pressable>
            );
          })}
        </View>

        {/* Date */}
        {tourPicked && (
          <>
            <SectionLabel n={2} text="Pick a date" />
            {hasAvail && (
              <Text style={styles.availHint}>
                <Text style={styles.availDot}>●</Text> Highlighted dates are when {fn} is available.
              </Text>
            )}
            <View style={styles.calCard}>
              <View style={styles.calHead}>
                <Pressable onPress={() => shiftMonth(-1)} hitSlop={8} style={styles.calNav}>
                  <Ionicons name="chevron-back" size={20} color={tc.maroon800} />
                </Pressable>
                <Text style={styles.calMonth}>{monthLabel}</Text>
                <Pressable onPress={() => shiftMonth(1)} hitSlop={8} style={styles.calNav}>
                  <Ionicons name="chevron-forward" size={20} color={tc.maroon800} />
                </Pressable>
              </View>
              <View style={styles.calGrid}>
                {WEEKDAYS.map((w) => (
                  <View key={w} style={styles.calCell}>
                    <Text style={styles.calWeekday}>{w}</Text>
                  </View>
                ))}
                {Array.from({ length: firstWeekday }).map((_, i) => (
                  <View key={`b${i}`} style={styles.calCell} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const key = ymd(cal.y, cal.m, d);
                  // With availability set, the guide's listed dates are always bookable
                  // (matches the website). Open scheduling just blocks past dates.
                  const selectable = hasAvail ? availDates.has(key) : key >= todayKey;
                  const isSel = date && date.y === cal.y && date.m === cal.m && date.d === d;
                  const isOffered = hasAvail && selectable && !isSel;
                  return (
                    <View key={d} style={styles.calCell}>
                      <Pressable
                        disabled={!selectable}
                        onPress={() => {
                          setDate({ y: cal.y, m: cal.m, d });
                          setTime(null);
                        }}
                        style={[styles.calDay, isOffered && styles.calDayOffered, isSel && styles.calDaySel]}
                      >
                        <Text
                          style={[
                            styles.calDayText,
                            !selectable && styles.calDayDisabled,
                            isOffered && styles.calDayOfferedText,
                            isSel && styles.calDayTextSel,
                          ]}
                        >
                          {d}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* Time */}
        {tourPicked && (
          <>
            <SectionLabel n={3} text="Start time" />
            {timesForDate.length === 0 ? (
              <Text style={styles.muted}>
                {date ? 'No times available for this date.' : 'Pick a date first to see available times.'}
              </Text>
            ) : (
              <View style={styles.timeGrid}>
                {timesForDate.map((t) => {
                  const sel = time === t;
                  return (
                    <Pressable key={t} onPress={() => setTime(t)} style={[styles.timeChip, sel && styles.timeChipSel]}>
                      <Text style={[styles.timeChipText, sel && styles.timeChipTextSel]}>{fmtTime(t)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Guests + duration */}
        {tourPicked && (
          <>
            <SectionLabel n={4} text="Guests" />
            <View style={styles.counterCard}>
              <Counter label="Adults" sub="Age 18+" value={adults} min={1} onChange={setAdults} />
              <View style={styles.divider} />
              <Counter label="Children" sub="Age 2–17" value={children} min={0} onChange={setChildren} />
            </View>

            <SectionLabel n={5} text="Duration" />
            <View style={{ gap: spacing(2.5) }}>
              {DURATIONS.map((d) => {
                const sel = duration === d.label;
                return (
                  <Pressable key={d.label} onPress={() => setDuration(d.label)} style={[styles.tourCard, sel && styles.tourCardActive]}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.durTitleRow}>
                        <Text style={styles.tourTitle}>{d.label}</Text>
                        {d.recommended && (
                          <View style={styles.recBadge}>
                            <Text style={styles.recBadgeText}>Recommended</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.tourDesc}>{d.desc}</Text>
                    </View>
                    {/* Price for this duration at the currently selected tour type. */}
                    <Text style={styles.durPrice}>{fromPrice(priceFor(priceBounds, tourType, d.minutes))}</Text>
                    <Ionicons
                      name={sel ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={sel ? tc.maroon800 : tc.ink300}
                    />
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Reserve bar — sits above the tab bar (which already handles the bottom inset) */}
      <View style={styles.bar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.barLabel}>Amount</Text>
          <Text style={styles.barPrice}>{fromPrice(priceCents)}</Text>
        </View>
        <Pressable
          disabled={!ready || busy}
          onPress={handleReserve}
          style={[styles.reserveBtn, (!ready || busy) && styles.reserveBtnDisabled]}
        >
          {busy ? (
            <ActivityIndicator color={tc.white} />
          ) : (
            <Text style={styles.reserveBtnText}>Reserve</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function SectionLabel({ n, text }: { n: number; text: string }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.sectionLabel}>
      <View style={styles.stepDot}>
        <Text style={styles.stepDotText}>{n}</Text>
      </View>
      <Text style={styles.sectionLabelText}>{text}</Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function Counter({
  label,
  sub,
  value,
  min,
  onChange,
}: {
  label: string;
  sub: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  const tc = useThemeColors();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.counterRow}>
      <View>
        <Text style={styles.counterLabel}>{label}</Text>
        <Text style={styles.counterSub}>{sub}</Text>
      </View>
      <View style={styles.counterCtrls}>
        <Pressable
          disabled={value <= min}
          onPress={() => onChange(Math.max(min, value - 1))}
          style={[styles.counterBtn, value <= min && styles.counterBtnDisabled]}
        >
          <Ionicons name="remove" size={18} color={value <= min ? tc.ink300 : tc.ink600} />
        </Pressable>
        <Text style={styles.counterValue}>{value}</Text>
        <Pressable onPress={() => onChange(value + 1)} style={styles.counterBtn}>
          <Ionicons name="add" size={18} color={tc.ink600} />
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
  safe: { flex: 1, backgroundColor: tc.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    paddingHorizontal: spacing(3),
    paddingBottom: spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: tc.ink100,
  },
  backBtn: { height: 36, width: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: font(17), fontWeight: '800', color: tc.ink900 },
  scroll: { padding: spacing(5), paddingBottom: spacing(10) },

  guideName: { fontSize: font(22), fontWeight: '800', color: tc.ink900, letterSpacing: -0.3 },
  uniRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), marginTop: spacing(1) },
  uni: { fontSize: font(14), color: tc.ink600 },

  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), marginTop: spacing(7), marginBottom: spacing(3) },
  stepDot: { height: 22, width: 22, borderRadius: 11, backgroundColor: tc.maroon900, alignItems: 'center', justifyContent: 'center' },
  stepDotText: { color: tc.white, fontSize: font(12), fontWeight: '800' },
  sectionLabelText: { fontSize: font(16), fontWeight: '800', color: tc.ink900 },

  // Tour type + duration cards
  tourCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    borderWidth: 1,
    borderColor: tc.ink200,
    borderRadius: radius.lg,
    padding: spacing(3.5),
  },
  tourCardActive: { borderColor: tc.maroon800, backgroundColor: tc.maroon50 },
  tourIcon: { height: 38, width: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: tc.ink100 },
  tourIconActive: { backgroundColor: tc.maroon800 },
  tourTitle: { fontSize: font(15), fontWeight: '700', color: tc.ink900 },
  tourDesc: { fontSize: font(13), color: tc.ink500, marginTop: 2, lineHeight: 18 },
  durTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
  recBadge: { backgroundColor: tc.maroon50, borderRadius: radius.pill, paddingHorizontal: spacing(2), paddingVertical: 2 },
  recBadgeText: { fontSize: font(10), fontWeight: '700', color: tc.maroon800 },

  // Calendar
  availHint: { fontSize: font(13), color: tc.ink500, marginBottom: spacing(2.5), lineHeight: 19 },
  availDot: { color: tc.maroon800 },
  calCard: { borderWidth: 1, borderColor: tc.ink200, borderRadius: radius.lg, padding: spacing(4) },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(3) },
  calNav: { height: 32, width: 32, alignItems: 'center', justifyContent: 'center' },
  calMonth: { fontSize: font(15), fontWeight: '800', color: tc.ink900 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  calWeekday: { fontSize: font(12), fontWeight: '700', color: tc.ink500, paddingVertical: spacing(1) },
  calDay: { height: 38, width: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  calDayOffered: { backgroundColor: tc.maroon50 },
  calDaySel: { backgroundColor: tc.maroon900 },
  calDayText: { fontSize: font(14), color: tc.ink900 },
  calDayDisabled: { color: tc.ink200 },
  calDayOfferedText: { color: tc.maroon800, fontWeight: '800' },
  calDayTextSel: { color: tc.white, fontWeight: '800' },

  // Time
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
  timeChip: { borderWidth: 1, borderColor: tc.ink200, borderRadius: radius.md, paddingHorizontal: spacing(3.5), paddingVertical: spacing(2.5) },
  timeChipSel: { borderColor: tc.maroon800, backgroundColor: tc.maroon50 },
  timeChipText: { fontSize: font(14), fontWeight: '600', color: tc.ink600 },
  timeChipTextSel: { color: tc.maroon800 },
  muted: { fontSize: font(14), color: tc.ink500 },

  // Guests
  counterCard: { borderWidth: 1, borderColor: tc.ink200, borderRadius: radius.lg, paddingHorizontal: spacing(4) },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing(3.5) },
  divider: { height: 1, backgroundColor: tc.ink100 },
  counterLabel: { fontSize: font(15), fontWeight: '700', color: tc.ink900 },
  counterSub: { fontSize: font(13), color: tc.ink500, marginTop: 1 },
  counterCtrls: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
  counterBtn: { height: 34, width: 34, borderRadius: 17, borderWidth: 1, borderColor: tc.ink300, alignItems: 'center', justifyContent: 'center' },
  counterBtnDisabled: { borderColor: tc.ink100 },
  counterValue: { fontSize: font(16), fontWeight: '700', color: tc.ink900, minWidth: 18, textAlign: 'center' },

  // Reserve bar
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(2.5),
    borderTopWidth: 1,
    borderTopColor: tc.ink200,
    backgroundColor: tc.white,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  barLabel: { fontSize: font(10), fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', color: tc.ink300 },
  durPrice: { fontSize: font(15), fontWeight: '700', color: tc.maroon800, marginRight: spacing(2) },
  barPrice: { fontSize: font(19), fontWeight: '800', color: tc.maroon900, marginTop: 1 },
  barNote: { fontSize: font(12), color: tc.ink500, marginTop: 1 },
  reserveBtn: {
    backgroundColor: tc.maroon900,
    borderRadius: radius.md,
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(2.5),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
  },
  reserveBtnDisabled: { backgroundColor: tc.ink200 },
  reserveBtnText: { color: tc.white, fontSize: font(14), fontWeight: '700' },

  // Confirmation
  confirmWrap: { flex: 1, paddingHorizontal: spacing(6), alignItems: 'center' },
  confirmIcon: { height: 64, width: 64, borderRadius: 32, backgroundColor: tc.maroon50, alignItems: 'center', justifyContent: 'center' },
  confirmTitle: { fontSize: font(22), fontWeight: '800', color: tc.ink900, marginTop: spacing(4) },
  confirmSub: { fontSize: font(14), color: tc.ink600, textAlign: 'center', lineHeight: 21, marginTop: spacing(2) },
  summary: { alignSelf: 'stretch', backgroundColor: tc.cream, borderRadius: radius.lg, padding: spacing(4), marginTop: spacing(6) },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing(4), paddingVertical: spacing(1.5) },
  summaryLabel: { fontSize: font(14), color: tc.ink500 },
  summaryValue: { fontSize: font(14), fontWeight: '600', color: tc.ink900, flexShrink: 1, textAlign: 'right' },
  summaryTotal: { borderTopWidth: 1, borderTopColor: tc.ink200, marginTop: spacing(1.5), paddingTop: spacing(3) },
  summaryTotalValue: { fontSize: font(15), fontWeight: '800', color: tc.maroon900 },
  primaryBtn: { alignSelf: 'stretch', backgroundColor: tc.maroon900, borderRadius: radius.lg, paddingVertical: spacing(4), alignItems: 'center', marginTop: spacing(6) },
  primaryBtnText: { color: tc.white, fontSize: font(15), fontWeight: '700' },
});
