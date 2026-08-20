import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Img } from '../../components/Img';
import { font, radius, spacing } from '../../theme';
import { serviceLabel } from '../../api/guides';
import { counselorWebsiteUrl, type Counselor } from '../../api/counselors';
import { useStyles, useThemeColors } from '../../theme-context';
import type { Palette } from '../../theme';

/**
 * A counselor's public profile. Deliberately read-only for now: booking a
 * counselor goes through the same booking surface a guide uses, which mobile
 * doesn't expose yet, so this screen shows everything the listing holds without
 * pretending a checkout exists.
 */
export function CounselorDetail({ counselor: c, onBack }: { counselor: Counselor; onBack: () => void }) {
  const tc = useThemeColors();
  const styles = useStyles(makeStyles);
  const website = counselorWebsiteUrl(c.website);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <View style={styles.navBar}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={tc.ink900} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>
          {c.name}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {c.photo ? (
            <Img source={{ uri: c.photo }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="person" size={34} color={tc.maroon800} />
            </View>
          )}
          <Text style={styles.name}>{c.name}</Text>
          <Text style={styles.headline}>{c.headline}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={15} color={tc.gold500} />
            <Text style={styles.rating}>{(c.rating ?? 5).toFixed(1)}</Text>
            <Text style={styles.reviews}>
              ({c.reviews} review{c.reviews === 1 ? '' : 's'})
            </Text>
          </View>
        </View>

        {c.services.length > 0 && (
          <View style={styles.chipRow}>
            {c.services.map((s) => (
              <View key={s} style={styles.serviceChip}>
                <Ionicons
                  name={s === 'CAMPUS_TOUR' ? 'walk' : s === 'VIDEO_CONSULTATION' ? 'videocam' : 'chatbubbles'}
                  size={13}
                  color={tc.maroon800}
                />
                <Text style={styles.serviceChipText}>{serviceLabel(s)}</Text>
              </View>
            ))}
          </View>
        )}

        {!!c.bio && (
          <Section title="About">
            <Text style={styles.body}>{c.bio}</Text>
          </Section>
        )}

        {c.specialties.length > 0 && (
          <Section title="Specialties">
            <View style={styles.badges}>
              {c.specialties.map((s) => (
                <View key={s} style={styles.specialty}>
                  <Text style={styles.specialtyText}>{s}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {(c.organization || c.yearsExperience || c.credentials || website) && (
          <Section title="Background">
            {!!c.organization && <Fact icon="business-outline" label="Practice" value={c.organization} />}
            {!!c.yearsExperience && (
              <Fact icon="ribbon-outline" label="Experience" value={`${c.yearsExperience} years in admissions`} />
            )}
            {!!c.credentials && <Fact icon="school-outline" label="Credentials" value={c.credentials} />}
            {!!website && (
              <Pressable onPress={() => Linking.openURL(website)}>
                <Fact icon="link-outline" label="Website" value={c.website} link />
              </Pressable>
            )}
          </Section>
        )}

        {c.reviewList.length > 0 && (
          <Section title={`Reviews (${c.reviewList.length})`}>
            {c.reviewList.map((r, i) => (
              <View key={`${r.name}-${i}`} style={styles.review}>
                <View style={styles.reviewHead}>
                  <Text style={styles.reviewName}>{r.name}</Text>
                  <View style={styles.ratingRowSmall}>
                    <Ionicons name="star" size={12} color={tc.gold500} />
                    <Text style={styles.reviewRating}>{r.rating.toFixed(1)}</Text>
                  </View>
                </View>
                {!!r.text && <Text style={styles.reviewText}>{r.text}</Text>}
              </View>
            ))}
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Fact({
  icon,
  label,
  value,
  link,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  link?: boolean;
}) {
  const tc = useThemeColors();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={16} color={tc.ink500} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={[styles.factValue, link && styles.factLink]}>{value}</Text>
      </View>
    </View>
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: tc.white },
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing(4),
      paddingVertical: spacing(3),
      borderBottomWidth: 1,
      borderBottomColor: tc.ink100,
    },
    backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    navTitle: { flex: 1, textAlign: 'center', fontSize: font(16), fontWeight: '700', color: tc.ink900 },
    content: { padding: spacing(4), paddingBottom: spacing(10) },
    header: { alignItems: 'center', gap: spacing(1) },
    avatar: { height: 96, width: 96, borderRadius: 48, backgroundColor: tc.ink100 },
    avatarFallback: { alignItems: 'center', justifyContent: 'center' },
    name: { fontSize: font(20), fontWeight: '800', color: tc.ink900, marginTop: spacing(3) },
    headline: { fontSize: font(14), color: tc.ink600, textAlign: 'center', lineHeight: 20 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1), marginTop: spacing(1) },
    ratingRowSmall: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    rating: { fontSize: font(14), fontWeight: '700', color: tc.ink900 },
    reviews: { fontSize: font(13), color: tc.ink500 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), justifyContent: 'center', marginTop: spacing(4) },
    serviceChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(1),
      backgroundColor: tc.maroon50,
      borderRadius: radius.pill,
      paddingHorizontal: spacing(3),
      paddingVertical: 6,
    },
    serviceChipText: { fontSize: font(12), fontWeight: '700', color: tc.maroon800 },
    section: { marginTop: spacing(6) },
    sectionTitle: { fontSize: font(15), fontWeight: '800', color: tc.ink900, marginBottom: spacing(3) },
    body: { fontSize: font(14), lineHeight: 21, color: tc.ink600 },
    badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
    specialty: {
      backgroundColor: tc.maroon50,
      borderRadius: radius.pill,
      paddingHorizontal: spacing(3),
      paddingVertical: 5,
    },
    specialtyText: { fontSize: font(12), fontWeight: '700', color: tc.maroon800 },
    fact: { flexDirection: 'row', gap: spacing(3), marginBottom: spacing(3) },
    factLabel: { fontSize: font(12), color: tc.ink500 },
    factValue: { fontSize: font(14), color: tc.ink900, marginTop: 1 },
    factLink: { color: tc.maroon800, fontWeight: '600' },
    review: { borderTopWidth: 1, borderTopColor: tc.ink100, paddingTop: spacing(3), marginBottom: spacing(3) },
    reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    reviewName: { fontSize: font(14), fontWeight: '700', color: tc.ink900 },
    reviewRating: { fontSize: font(12), fontWeight: '700', color: tc.ink900 },
    reviewText: { fontSize: font(14), lineHeight: 20, color: tc.ink600, marginTop: spacing(1) },
  });
