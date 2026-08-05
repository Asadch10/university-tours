import { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Img } from '../../components/Img';
import { font, colors, radius, spacing } from '../../theme';
import { serviceLabel, type Guide } from '../../api/guides';
import { useStyles, useThemeColors } from '../../theme-context';
import type { Palette } from '../../theme';

// Memoized: guide cards render in long lists, so skip re-rendering every card
// when the parent screen re-renders for unrelated reasons (search text, etc.).
export const GuideCard = memo(function GuideCard({ guide, onPress }: { guide: Guide; onPress: () => void }) {
  const tc = useThemeColors();
  const styles = useStyles(makeStyles);
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.top}>
        <Img source={{ uri: guide.photo }} style={styles.avatar} contentFit="contain" recyclingKey={guide.id} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>
            {guide.name}
          </Text>
          <Text style={styles.uni} numberOfLines={1}>
            {guide.university || 'Student guide'}
          </Text>
          {!!guide.focus && (
            <View style={styles.focusRow}>
              <Ionicons name="school-outline" size={13} color={tc.ink500} />
              <Text style={styles.focus} numberOfLines={1}>
                {guide.focus}
                {guide.year ? ` · ${guide.year}` : ''}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.headline} numberOfLines={2}>
        {guide.headline}
      </Text>

      <View style={styles.badges}>
        {guide.services.map((s) => (
          <View key={s} style={[styles.badge, s === 'CAMPUS_TOUR' ? styles.badgeMaroon : styles.badgeGold]}>
            <Ionicons
              name={s === 'CAMPUS_TOUR' ? 'walk' : s === 'VIDEO_CONSULTATION' ? 'videocam' : 'chatbubbles'}
              size={12}
              color={s === 'CAMPUS_TOUR' ? tc.maroon800 : tc.gold500}
            />
            <Text style={[styles.badgeText, { color: s === 'CAMPUS_TOUR' ? tc.maroon800 : tc.gold500 }]}>
              {serviceLabel(s)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color={tc.gold500} />
          <Text style={styles.rating}>{guide.rating.toFixed(1)}</Text>
          <Text style={styles.reviews}>({guide.reviews})</Text>
        </View>
      </View>
    </Pressable>
  );
});

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
  card: {
    backgroundColor: tc.white,
    borderWidth: 1,
    borderColor: tc.ink200,
    borderRadius: radius.xl,
    padding: spacing(4),
  },
  top: { flexDirection: 'row', gap: spacing(3) },
  avatar: { height: 56, width: 56, borderRadius: 28, backgroundColor: tc.ink100 },
  name: { fontSize: font(16), fontWeight: '800', color: tc.ink900 },
  uni: { fontSize: font(13), color: tc.ink500, marginTop: 1 },
  focusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1), marginTop: 2 },
  focus: { flex: 1, fontSize: font(12), color: tc.ink500 },
  headline: { fontSize: font(14), color: tc.ink600, lineHeight: 20, marginTop: spacing(3) },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginTop: spacing(3) },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing(1), borderRadius: radius.pill, paddingHorizontal: spacing(2.5), paddingVertical: 4 },
  badgeMaroon: { backgroundColor: tc.maroon50 },
  badgeGold: { backgroundColor: '#faf1d8' },
  badgeText: { fontSize: font(12), fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    // Only the rating lives here now that the price is gone.
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: tc.ink100,
    marginTop: spacing(4),
    paddingTop: spacing(3),
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
  rating: { fontSize: font(14), fontWeight: '700', color: tc.ink900 },
  reviews: { fontSize: font(13), color: tc.ink500 },
});
