import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { font, colors, radius, spacing } from '../../theme';
import { fromPrice, serviceLabel, type Guide } from '../../api/guides';

export function GuideCard({ guide, onPress }: { guide: Guide; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.top}>
        <Image source={{ uri: guide.photo }} style={styles.avatar} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>
            {guide.name}
          </Text>
          <Text style={styles.uni} numberOfLines={1}>
            {guide.university || 'Student guide'}
          </Text>
          {!!guide.focus && (
            <View style={styles.focusRow}>
              <Ionicons name="school-outline" size={13} color={colors.ink500} />
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
              color={s === 'CAMPUS_TOUR' ? colors.maroon800 : colors.gold500}
            />
            <Text style={[styles.badgeText, { color: s === 'CAMPUS_TOUR' ? colors.maroon800 : colors.gold500 }]}>
              {serviceLabel(s)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color={colors.gold500} />
          <Text style={styles.rating}>{guide.rating.toFixed(1)}</Text>
          <Text style={styles.reviews}>({guide.reviews})</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.fromLabel}>FROM</Text>
          <Text style={styles.price}>{fromPrice(guide.price)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: radius.xl,
    padding: spacing(4),
  },
  top: { flexDirection: 'row', gap: spacing(3) },
  avatar: { height: 56, width: 56, borderRadius: 28, backgroundColor: colors.ink100 },
  name: { fontSize: font(16), fontWeight: '800', color: colors.ink900 },
  uni: { fontSize: font(13), color: colors.ink500, marginTop: 1 },
  focusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1), marginTop: 2 },
  focus: { flex: 1, fontSize: font(12), color: colors.ink500 },
  headline: { fontSize: font(14), color: colors.ink600, lineHeight: 20, marginTop: spacing(3) },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginTop: spacing(3) },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing(1), borderRadius: radius.pill, paddingHorizontal: spacing(2.5), paddingVertical: 4 },
  badgeMaroon: { backgroundColor: colors.maroon50 },
  badgeGold: { backgroundColor: '#faf1d8' },
  badgeText: { fontSize: font(12), fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.ink100,
    marginTop: spacing(4),
    paddingTop: spacing(3),
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
  rating: { fontSize: font(14), fontWeight: '700', color: colors.ink900 },
  reviews: { fontSize: font(13), color: colors.ink500 },
  fromLabel: { fontSize: font(10), fontWeight: '700', letterSpacing: 0.5, color: colors.ink300 },
  price: { fontSize: font(18), fontWeight: '800', color: colors.maroon900 },
});
