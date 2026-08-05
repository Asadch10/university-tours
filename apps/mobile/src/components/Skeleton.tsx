import { useEffect } from 'react';
import { Animated, StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';
import { radius, spacing, type Palette } from '../theme';
import { useStyles, useThemeColors } from '../theme-context';

// One shared pulse so every skeleton on screen breathes in sync with a single loop.
const pulse = new Animated.Value(0.5);
let running = false;
function ensurePulse() {
  if (running) return;
  running = true;
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.5, duration: 650, useNativeDriver: true }),
    ]),
  ).start();
}

/** A single shimmering placeholder block. */
export function Skeleton({
  w = '100%',
  h = 12,
  r = 6,
  style,
}: {
  w?: ViewStyle['width'];
  h?: ViewStyle['height'];
  r?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const tc = useThemeColors();
  const s = useStyles(makeS);
  useEffect(ensurePulse, []);
  return (
    <Animated.View
      style={[{ width: w, height: h, borderRadius: r, backgroundColor: tc.ink100, opacity: pulse }, style]}
    />
  );
}

/* ── Composite skeletons that mirror the real list items ─────────────────── */

/** Matches GuideCard. */
export function GuideCardSkeleton() {
  const tc = useThemeColors();
  const s = useStyles(makeS);
  return (
    <View style={s.card}>
      <View style={s.row}>
        <Skeleton w={56} h={56} r={28} />
        <View style={{ flex: 1, gap: spacing(2) }}>
          <Skeleton w="60%" h={14} />
          <Skeleton w="40%" h={11} />
          <Skeleton w="50%" h={11} />
        </View>
      </View>
      <Skeleton w="100%" h={12} style={{ marginTop: spacing(3) }} />
      <Skeleton w="80%" h={12} style={{ marginTop: spacing(2) }} />
      <View style={{ flexDirection: 'row', gap: spacing(2), marginTop: spacing(3) }}>
        <Skeleton w={82} h={24} r={12} />
        <Skeleton w={70} h={24} r={12} />
      </View>
      <View style={s.footer}>
        <Skeleton w={56} h={16} />
        <Skeleton w={48} h={20} />
      </View>
    </View>
  );
}

/** Matches an Explore school row. */
export function SchoolRowSkeleton() {
  const tc = useThemeColors();
  const s = useStyles(makeS);
  return (
    <View style={s.rowItem}>
      <Skeleton w={56} h={56} r={radius.md} />
      <View style={{ flex: 1, gap: spacing(2) }}>
        <Skeleton w="65%" h={14} />
        <Skeleton w="40%" h={11} />
      </View>
    </View>
  );
}

/** Matches a My-Tours booking row. */
export function BookingCardSkeleton() {
  const tc = useThemeColors();
  const s = useStyles(makeS);
  return (
    <View style={s.card}>
      <View style={[s.row, { alignItems: 'center' }]}>
        <Skeleton w={44} h={44} r={22} />
        <View style={{ flex: 1, gap: spacing(2) }}>
          <Skeleton w="55%" h={13} />
          <Skeleton w="75%" h={11} />
        </View>
        <Skeleton w={64} h={22} r={11} />
      </View>
    </View>
  );
}

/** Matches a Home horizontal university card. */
export function UniCardSkeleton() {
  const tc = useThemeColors();
  const s = useStyles(makeS);
  return (
    <View style={{ width: 156 }}>
      <Skeleton w={156} h={120} r={radius.md} />
      <Skeleton w="80%" h={13} style={{ marginTop: spacing(2.5) }} />
      <Skeleton w="55%" h={11} style={{ marginTop: spacing(1.5) }} />
    </View>
  );
}

const makeS = (tc: Palette) =>
  StyleSheet.create({
  card: {
    backgroundColor: tc.white,
    borderWidth: 1,
    borderColor: tc.ink200,
    borderRadius: radius.xl,
    padding: spacing(4),
  },
  row: { flexDirection: 'row', gap: spacing(3) },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: tc.ink100,
    marginTop: spacing(4),
    paddingTop: spacing(3),
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingVertical: spacing(3.5),
    borderBottomWidth: 1,
    borderBottomColor: tc.ink100,
  },
});
