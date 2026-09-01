/**
 * Per-service availability.
 *
 * Model (identical to the website): availability is PER SERVICE. Each service carries its
 * own set of calendar dates plus ONE set of times that applies to every one of those
 * dates. Guests can only book what is set here.
 *
 * The PRESENTATION is deliberately not the website's. There, every selected service
 * renders its own calendar plus 22 time chips inline — three services is a wall roughly
 * three phone-screens tall, in the middle of an already-long form. Here each service is a
 * one-line summary that opens a focused full-height sheet, so the form stays scannable and
 * picking dates gets the whole screen it deserves.
 */
import { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, radius, spacing, type Palette } from '../../theme';
import { useStyles, useThemeColors } from '../../theme-context';
import { SERVICE_LABEL } from '../../tour-types';
import { TIME_SLOTS, type Availability, type GuideService } from '../../api/guides';
import { labelForTime, ymd } from '../../api/applications';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SERVICE_ICON: Record<GuideService, keyof typeof Ionicons.glyphMap> = {
  CAMPUS_TOUR: 'walk-outline',
  VIDEO_CONSULTATION: 'videocam-outline',
  CONSULTATION: 'chatbubble-ellipses-outline',
};

type Entry = { dates: string[]; times: string[] };

/** Today at midnight — dates before this can't be offered. */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function AvailabilityPicker({
  types,
  value,
  onChange,
}: {
  /** Services currently selected in the form; one row is shown per service. */
  types: GuideService[];
  value: Availability;
  onChange: (next: Availability) => void;
}) {
  const s = useStyles(makeStyles);
  const tc = useThemeColors();
  const [editing, setEditing] = useState<GuideService | null>(null);

  if (types.length === 0) {
    return (
      <View style={s.empty}>
        <Ionicons name="calendar-outline" size={18} color={tc.ink300} />
        <Text style={s.emptyText}>Choose a service above to set when you’re available.</Text>
      </View>
    );
  }

  return (
    <>
      <View style={{ gap: spacing(2.5) }}>
        {types.map((t) => {
          const entry = value[t];
          const set = !!entry && entry.dates.length > 0 && entry.times.length > 0;
          return (
            <Pressable
              key={t}
              style={({ pressed }) => [s.row, set && s.rowSet, pressed && s.pressed]}
              onPress={() => setEditing(t)}
            >
              <View style={[s.rowIcon, set && s.rowIconSet]}>
                <Ionicons name={SERVICE_ICON[t]} size={18} color={set ? tc.onBrand : tc.maroon800} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{SERVICE_LABEL[t]}</Text>
                <Text style={[s.rowSub, set && s.rowSubSet]}>
                  {set
                    ? `${entry!.dates.length} date${entry!.dates.length > 1 ? 's' : ''} · ${entry!.times.length} time${entry!.times.length > 1 ? 's' : ''}`
                    : 'Tap to add dates and times'}
                </Text>
              </View>
              {set ? (
                <Ionicons name="checkmark-circle" size={20} color={tc.successFg} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={tc.ink300} />
              )}
            </Pressable>
          );
        })}
      </View>

      {editing && (
        <AvailabilitySheet
          service={editing}
          entry={value[editing] ?? { dates: [], times: [] }}
          onClose={() => setEditing(null)}
          onSave={(entry) => {
            onChange({ ...value, [editing]: entry });
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

/* ─── The full-height picker ───────────────────────────────────────────────── */

function AvailabilitySheet({
  service,
  entry,
  onClose,
  onSave,
}: {
  service: GuideService;
  entry: Entry;
  onClose: () => void;
  onSave: (entry: Entry) => void;
}) {
  const s = useStyles(makeStyles);
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  const today = useMemo(startOfToday, []);

  // Edited locally and only committed on Done, so backing out leaves the form untouched.
  const [dates, setDates] = useState<string[]>(entry.dates);
  const [times, setTimes] = useState<string[]>(entry.times);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  // Never page back past the current month — past dates aren't bookable.
  const atFirstMonth = year === today.getFullYear() && month === today.getMonth();
  const complete = dates.length > 0 && times.length > 0;

  const toggleDate = (d: string) =>
    setDates((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort()));

  const toggleTime = (t: string) =>
    setTimes((cur) =>
      cur.includes(t)
        ? cur.filter((x) => x !== t)
        : [...cur, t].sort((a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b)),
    );

  /** Morning / afternoon / evening bulk toggles — 22 individual chips is a lot of taps. */
  const BANDS: { label: string; test: (t: string) => boolean }[] = [
    { label: 'Morning', test: (t) => Number(t.split(':')[0]) < 12 },
    { label: 'Afternoon', test: (t) => { const h = Number(t.split(':')[0]); return h >= 12 && h < 17; } },
    { label: 'Evening', test: (t) => Number(t.split(':')[0]) >= 17 },
  ];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.sheet, { paddingTop: insets.top ? spacing(3) : spacing(5) }]}>
        {/* Header */}
        <View style={s.sheetHeader}>
          <Pressable onPress={onClose} hitSlop={10} style={s.sheetClose}>
            <Ionicons name="close" size={22} color={tc.ink900} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.sheetTitle} numberOfLines={1}>
              {SERVICE_LABEL[service]}
            </Text>
            <Text style={s.sheetSub}>When can you host?</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.sheetScroll} showsVerticalScrollIndicator={false}>
          {/* ── Dates ── */}
          <View style={s.blockHead}>
            <Text style={s.blockTitle}>Dates</Text>
            {dates.length > 0 && (
              <Pressable onPress={() => setDates([])} hitSlop={8}>
                <Text style={s.clear}>Clear</Text>
              </Pressable>
            )}
          </View>

          <View style={s.calendar}>
            <View style={s.monthRow}>
              <Pressable
                onPress={() => setCursor(new Date(year, month - 1, 1))}
                disabled={atFirstMonth}
                hitSlop={10}
                style={[s.monthBtn, atFirstMonth && s.monthBtnOff]}
              >
                <Ionicons name="chevron-back" size={18} color={atFirstMonth ? tc.ink300 : tc.ink900} />
              </Pressable>
              <Text style={s.monthLabel}>
                {MONTHS[month]} {year}
              </Text>
              <Pressable
                onPress={() => setCursor(new Date(year, month + 1, 1))}
                hitSlop={10}
                style={s.monthBtn}
              >
                <Ionicons name="chevron-forward" size={18} color={tc.ink900} />
              </Pressable>
            </View>

            <View style={s.weekRow}>
              {WEEKDAYS.map((d, i) => (
                <Text key={`${d}-${i}`} style={s.weekday}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={s.grid}>
              {cells.map((day, i) => {
                if (day === null) return <View key={`x-${i}`} style={s.dayCell} />;
                const date = ymd(year, month, day);
                const past = new Date(year, month, day) < today;
                const on = dates.includes(date);
                return (
                  <Pressable key={date} style={s.dayCell} disabled={past} onPress={() => toggleDate(date)}>
                    <View style={[s.day, on && s.dayOn]}>
                      <Text style={[s.dayText, on && s.dayTextOn, past && s.dayTextOff]}>{day}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Times ── */}
          <View style={[s.blockHead, { marginTop: spacing(7) }]}>
            <Text style={s.blockTitle}>Times</Text>
            {times.length > 0 && (
              <Pressable onPress={() => setTimes([])} hitSlop={8}>
                <Text style={s.clear}>Clear</Text>
              </Pressable>
            )}
          </View>
          <Text style={s.blockHint}>
            These apply to every date you picked above.
          </Text>

          <View style={s.bandRow}>
            {BANDS.map((b) => {
              const slots = TIME_SLOTS.filter(b.test);
              const all = slots.every((t) => times.includes(t));
              return (
                <Pressable
                  key={b.label}
                  style={({ pressed }) => [s.band, all && s.bandOn, pressed && s.pressed]}
                  onPress={() =>
                    setTimes((cur) =>
                      all
                        ? cur.filter((t) => !b.test(t))
                        : [...new Set([...cur, ...slots])].sort(
                            (x, y) => TIME_SLOTS.indexOf(x) - TIME_SLOTS.indexOf(y),
                          ),
                    )
                  }
                >
                  <Text style={[s.bandText, all && s.bandTextOn]}>{b.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={s.chips}>
            {TIME_SLOTS.map((t) => {
              const on = times.includes(t);
              return (
                <Pressable
                  key={t}
                  onPress={() => toggleTime(t)}
                  style={({ pressed }) => [s.chip, on && s.chipOn, pressed && s.pressed]}
                >
                  <Text style={[s.chipText, on && s.chipTextOn]}>{labelForTime(t)}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[s.sheetFooter, { paddingBottom: Math.max(insets.bottom, spacing(4)) }]}>
          <Text style={s.footerSummary}>
            {complete
              ? `${dates.length} date${dates.length > 1 ? 's' : ''} · ${times.length} time${times.length > 1 ? 's' : ''} each`
              : dates.length === 0
                ? 'Pick at least one date'
                : 'Pick at least one time'}
          </Text>
          <Pressable
            style={({ pressed }) => [s.doneBtn, !complete && s.doneBtnOff, pressed && complete && s.pressed]}
            disabled={!complete}
            onPress={() => onSave({ dates, times })}
          >
            <Text style={s.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
    pressed: { opacity: 0.65 },

    empty: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(2.5),
      borderWidth: 1,
      borderColor: tc.ink200,
      borderStyle: 'dashed',
      borderRadius: radius.lg,
      backgroundColor: tc.ivory,
      paddingHorizontal: spacing(4),
      paddingVertical: spacing(4),
    },
    emptyText: { flex: 1, fontSize: font(13), lineHeight: 19, color: tc.ink500 },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(3),
      minHeight: 64,
      borderWidth: 1.5,
      borderColor: tc.ink200,
      backgroundColor: tc.ivory,
      borderRadius: radius.lg,
      paddingHorizontal: spacing(3.5),
      paddingVertical: spacing(3),
    },
    rowSet: { borderColor: tc.maroon800, backgroundColor: tc.maroon50 },
    rowIcon: {
      height: 40,
      width: 40,
      borderRadius: radius.md,
      backgroundColor: tc.maroon50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowIconSet: { backgroundColor: tc.maroon900 },
    rowTitle: { fontSize: font(14.5), fontWeight: '700', color: tc.ink900 },
    rowSub: { fontSize: font(12.5), color: tc.ink500, marginTop: 2 },
    rowSubSet: { color: tc.maroon800, fontWeight: '600' },

    /* Sheet */
    sheet: { flex: 1, backgroundColor: tc.ivory },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(2),
      paddingHorizontal: spacing(4),
      paddingBottom: spacing(3),
      borderBottomWidth: 1,
      borderBottomColor: tc.ink100,
      backgroundColor: tc.white,
    },
    sheetClose: { height: 40, width: 40, alignItems: 'center', justifyContent: 'center' },
    sheetTitle: { fontSize: font(17), fontWeight: '800', color: tc.ink900 },
    sheetSub: { fontSize: font(12.5), color: tc.ink500, marginTop: 1 },
    sheetScroll: { padding: spacing(5), paddingBottom: spacing(8) },

    blockHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    blockTitle: {
      fontSize: font(11.5),
      fontWeight: '800',
      letterSpacing: 1.3,
      textTransform: 'uppercase',
      color: tc.ink500,
    },
    blockHint: { fontSize: font(12.5), color: tc.ink500, marginTop: spacing(1.5) },
    clear: { fontSize: font(12.5), fontWeight: '700', color: tc.maroon800 },

    calendar: {
      backgroundColor: tc.white,
      borderWidth: 1,
      borderColor: tc.ink100,
      borderRadius: radius.xl,
      padding: spacing(3),
      marginTop: spacing(3),
    },
    monthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing(1),
    },
    monthBtn: {
      height: 38,
      width: 38,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthBtnOff: { opacity: 0.35 },
    monthLabel: { fontSize: font(15.5), fontWeight: '800', color: tc.ink900 },

    weekRow: { flexDirection: 'row', marginTop: spacing(2) },
    weekday: { flex: 1, textAlign: 'center', fontSize: font(11), fontWeight: '700', color: tc.ink500 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing(1) },
    dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
    day: {
      height: '84%',
      aspectRatio: 1,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayOn: { backgroundColor: tc.maroon900 },
    dayText: { fontSize: font(14.5), fontWeight: '600', color: tc.ink900 },
    dayTextOn: { color: tc.onBrand, fontWeight: '800' },
    dayTextOff: { color: tc.ink300 },

    bandRow: { flexDirection: 'row', gap: spacing(2), marginTop: spacing(3.5) },
    band: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: 38,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: tc.ink200,
      backgroundColor: tc.white,
    },
    bandOn: { backgroundColor: tc.maroon50, borderColor: tc.maroon800 },
    bandText: { fontSize: font(13), fontWeight: '700', color: tc.ink500 },
    bandTextOn: { color: tc.maroon800 },

    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginTop: spacing(3.5) },
    chip: {
      minWidth: 82,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: tc.ink200,
      backgroundColor: tc.white,
      borderRadius: radius.md,
      paddingHorizontal: spacing(3),
      paddingVertical: spacing(2.5),
    },
    chipOn: { backgroundColor: tc.maroon900, borderColor: tc.maroon900 },
    chipText: { fontSize: font(13), fontWeight: '600', color: tc.ink900 },
    chipTextOn: { color: tc.onBrand, fontWeight: '800' },

    sheetFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(3),
      backgroundColor: tc.white,
      borderTopWidth: 1,
      borderTopColor: tc.ink100,
      paddingHorizontal: spacing(5),
      paddingTop: spacing(3.5),
    },
    footerSummary: { flex: 1, fontSize: font(12.5), color: tc.ink500, lineHeight: 17 },
    doneBtn: {
      minWidth: 116,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tc.maroon900,
      borderRadius: radius.lg,
    },
    doneBtnOff: { backgroundColor: tc.ink200 },
    doneBtnText: { fontSize: font(15), fontWeight: '800', color: tc.onBrand },
  });
