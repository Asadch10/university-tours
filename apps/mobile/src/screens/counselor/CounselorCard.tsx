import { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Img } from '../../components/Img';
import { font, radius, spacing } from '../../theme';
import { serviceLabel } from '../../api/guides';
import type { Counselor } from '../../api/counselors';
import { useStyles, useThemeColors } from '../../theme-context';
import type { Palette } from '../../theme';

// Memoized for the same reason GuideCard is: these render in a long list and
// shouldn't re-render when the parent updates for unrelated reasons.
export const CounselorCard = memo(function CounselorCard({
  counselor: c,
  onPress,
}: {
  counselor: Counselor;
  onPress: () => void;
}) {
  const tc = useThemeColors();
  const styles = useStyles(makeStyles);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.top}>
        {c.photo ? (
          <Img source={{ uri: c.photo }} style={styles.avatar} contentFit="cover" recyclingKey={c.id} />
        ) : (
          // No uploaded photo — initials keep the row height stable.
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>{initials(c.name)}</Text>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>
            {c.name}
          </Text>
          <Text style={styles.org} numberOfLines={1}>
            {c.organization || 'Independent counselor'}
          </Text>
          {!!c.yearsExperience && (
            <View style={styles.metaRow}>
              <Ionicons name="ribbon-outline" size={13} color={tc.ink500} />
              <Text style={styles.meta} numberOfLines={1}>
                {c.yearsExperience} years in admissions
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.headline} numberOfLines={2}>
        {c.headline}
      </Text>

      {c.specialties.length > 0 && (
        <View style={styles.badges}>
          {c.specialties.slice(0, 3).map((s) => (
            <View key={s} style={styles.specialty}>
              <Text style={styles.specialtyText} numberOfLines={1}>
                {s}
              </Text>
            </View>
          ))}
          {c.specialties.length > 3 && (
            <View style={styles.specialty}>
              <Text style={styles.specialtyText}>+{c.specialties.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color={tc.gold500} />
          <Text style={styles.rating}>{(c.rating ?? 5).toFixed(1)}</Text>
          <Text style={styles.reviews}>({c.reviews})</Text>
        </View>
        <View style={styles.services}>
          {c.services.map((s) => (
            <View key={s} style={styles.serviceChip}>
              <Ionicons
                name={s === 'CAMPUS_TOUR' ? 'walk' : s === 'VIDEO_CONSULTATION' ? 'videocam' : 'chatbubbles'}
                size={12}
                color={tc.maroon800}
              />
              <Text style={styles.serviceText}>{serviceLabel(s)}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
});

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

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
    avatarFallback: { alignItems: 'center', justifyContent: 'center' },
    avatarInitials: { fontSize: font(18), fontWeight: '800', color: tc.maroon800 },
    name: { fontSize: font(16), fontWeight: '800', color: tc.ink900 },
    org: { fontSize: font(13), color: tc.ink500, marginTop: 1 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1), marginTop: 2 },
    meta: { flex: 1, fontSize: font(12), color: tc.ink500 },
    headline: { fontSize: font(14), color: tc.ink600, lineHeight: 20, marginTop: spacing(3) },
    badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginTop: spacing(3) },
    specialty: {
      backgroundColor: tc.maroon50,
      borderRadius: radius.pill,
      paddingHorizontal: spacing(2.5),
      paddingVertical: 4,
      maxWidth: '100%',
    },
    specialtyText: { fontSize: font(12), fontWeight: '700', color: tc.maroon800 },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing(2),
      borderTopWidth: 1,
      borderTopColor: tc.ink100,
      marginTop: spacing(4),
      paddingTop: spacing(3),
    },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1) },
    rating: { fontSize: font(14), fontWeight: '700', color: tc.ink900 },
    reviews: { fontSize: font(13), color: tc.ink500 },
    services: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1.5), justifyContent: 'flex-end' },
    serviceChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    serviceText: { fontSize: font(12), fontWeight: '600', color: tc.maroon800 },
  });
