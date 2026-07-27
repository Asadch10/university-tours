import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import {
  guidesApi,
  communityGuideToProfile,
  fromPrice,
  serviceLabel,
  type Guide,
  type GuideProfile,
} from '../../api/guides';
import { friendlyError } from '../../api/auth';
import { BookTour } from './BookTour';

const { width } = Dimensions.get('window');
const GALLERY_H = 280;

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={value >= n ? 'star' : 'star-outline'} size={size} color={colors.gold500} />
      ))}
    </View>
  );
}

export function GuideDetail({ preview, onBack }: { preview: Guide; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<GuideProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    guidesApi
      .detail(preview.id)
      .then((dto) => setProfile(communityGuideToProfile(dto)))
      .catch((e) => setError(friendlyError(e)))
      .finally(() => setLoading(false));
  }, [preview.id]);

  const g = profile;
  const fn = preview.name.split(' ')[0];
  const gallery = g?.gallery.length ? g.gallery : [preview.photo];
  const facts = g
    ? [
        { label: 'Year', value: g.year },
        { label: 'Admission', value: g.admission },
        { label: 'Gender', value: g.gender },
        { label: 'Hometown', value: g.hometown },
        { label: 'Age', value: g.age ? String(g.age) : '' },
      ].filter((f) => f.value)
    : [];
  const activeExtras = g?.extracurriculars.filter((e) => e.active) ?? [];
  const activeHousing = g?.housing.filter((h) => h.active) ?? [];

  const onGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  if (booking) {
    return (
      <BookTour
        guide={preview}
        availability={g?.availability ?? {}}
        onBack={() => setBooking(false)}
      />
    );
  }

  return (
    <View style={styles.safe}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing(6) }}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ right: 1 }}
      >
        {/* Safe-area spacer so the gallery clears the notch */}
        <View style={{ height: insets.top, backgroundColor: colors.white }} />

        {/* Gallery */}
        <View style={styles.gallery}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onGalleryScroll}
          >
            {gallery.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.galleryImg} resizeMode="cover" />
            ))}
          </ScrollView>
          {gallery.length > 1 && (
            <View style={styles.dots} pointerEvents="none">
              {gallery.map((_, i) => (
                <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>

        {/* Content card overlapping the gallery */}
        <View style={styles.card}>
          {/* Identity */}
          <Text style={styles.name}>{preview.name}</Text>
          {!!preview.university && (
            <View style={styles.uniRow}>
              <Ionicons name="school-outline" size={15} color={colors.ink500} />
              <Text style={styles.uni}>{preview.university}</Text>
            </View>
          )}
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={14} color={colors.gold500} />
            <Text style={styles.ratingValue}>{preview.rating.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>
              · {preview.reviews} review{preview.reviews === 1 ? '' : 's'}
            </Text>
          </View>

          {/* Services */}
          <View style={styles.badges}>
            {preview.services.map((s) => (
              <View key={s} style={[styles.badge, s === 'CAMPUS_TOUR' ? styles.badgeMaroon : styles.badgeGold]}>
                <Ionicons
                  name={s === 'CAMPUS_TOUR' ? 'walk' : s === 'VIDEO_CONSULTATION' ? 'videocam' : 'chatbubbles'}
                  size={13}
                  color={s === 'CAMPUS_TOUR' ? colors.maroon800 : colors.gold500}
                />
                <Text style={[styles.badgeText, { color: s === 'CAMPUS_TOUR' ? colors.maroon800 : colors.gold500 }]}>
                  {serviceLabel(s)}
                </Text>
              </View>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator color={colors.maroon800} size="large" style={{ marginTop: spacing(10) }} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : g ? (
            <>
              {/* About */}
              <Section title={`About ${fn}`}>
                <Text style={styles.paragraph}>{g.intro}</Text>
              </Section>

              {/* Quick facts */}
              {facts.length > 0 && (
                <View style={styles.factsGrid}>
                  {facts.map((f) => (
                    <View key={f.label} style={styles.factTile}>
                      <Text style={styles.factLabel}>{f.label}</Text>
                      <Text style={styles.factValue} numberOfLines={2}>
                        {f.value}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Majors */}
              {g.majors.length > 0 && (
                <Section title="Studying">
                  <Chips items={g.majors} />
                </Section>
              )}

              {/* Extracurriculars */}
              {activeExtras.length > 0 && (
                <Section title="Involved in">
                  <Chips items={activeExtras.map((e) => e.label)} />
                </Section>
              )}

              {/* Clubs */}
              {g.clubs.length > 0 && (
                <Section title="Clubs & roles">
                  {g.clubs.map((c) => (
                    <View key={c} style={styles.bullet}>
                      <View style={styles.dotBullet} />
                      <Text style={styles.bulletText}>{c}</Text>
                    </View>
                  ))}
                </Section>
              )}

              {/* Housing */}
              {activeHousing.length > 0 && (
                <Section title="Housing">
                  <Chips items={activeHousing.map((h) => h.label)} />
                </Section>
              )}

              {/* College experience */}
              {g.collegeExperience.length > 0 && (
                <Section title="My college experience">
                  {g.collegeExperience.map((p, i) => (
                    <Text key={i} style={[styles.paragraph, i > 0 && { marginTop: spacing(3) }]}>
                      {p}
                    </Text>
                  ))}
                </Section>
              )}

              {/* Tip */}
              {!!g.tip && (
                <View style={styles.tipCard}>
                  <View style={styles.tipIcon}>
                    <Ionicons name="bulb" size={16} color={colors.gold500} />
                  </View>
                  <Text style={styles.tipText}>{g.tip}</Text>
                </View>
              )}

              {/* Favorite class */}
              {g.favoriteClass.length > 0 && (
                <Section title="Favorite class">
                  {g.favoriteClass.map((p, i) => (
                    <Text key={i} style={[styles.paragraph, i > 0 && { marginTop: spacing(3) }]}>
                      {p}
                    </Text>
                  ))}
                </Section>
              )}

              {/* Career goals */}
              {g.careerGoals.length > 0 && (
                <Section title="Career goals">
                  {g.careerGoals.map((p, i) => (
                    <Text key={i} style={[styles.paragraph, i > 0 && { marginTop: spacing(3) }]}>
                      {p}
                    </Text>
                  ))}
                </Section>
              )}

              {/* Reviews */}
              <Section title={`Reviews (${g.reviewList.length})`}>
                {g.reviewList.length === 0 ? (
                  <Text style={styles.muted}>No reviews yet.</Text>
                ) : (
                  g.reviewList.map((r, i) => (
                    <View key={i} style={styles.reviewCard}>
                      <Stars value={r.rating} size={13} />
                      <Text style={styles.reviewText}>“{r.text}”</Text>
                      <Text style={styles.reviewMeta}>
                        {r.name} · {r.date}
                      </Text>
                    </View>
                  ))
                )}
              </Section>
            </>
          ) : null}
        </View>
      </ScrollView>

      {/* Floating back button */}
      <Pressable onPress={onBack} hitSlop={8} style={[styles.backBtn, { top: insets.top + spacing(2) }]}>
        <Ionicons name="arrow-back" size={22} color={colors.white} />
      </Pressable>

      {/* Book bar */}
      <View style={[styles.bookBar, { paddingBottom: Math.max(insets.bottom, spacing(3)) }]}>
        <View>
          <Text style={styles.bookFrom}>From</Text>
          <Text style={styles.bookPrice}>{fromPrice(preview.price)}</Text>
        </View>
        <Pressable style={styles.bookBtn} onPress={() => setBooking(true)}>
          <Ionicons name="calendar" size={16} color={colors.white} />
          <Text style={styles.bookBtnText}>Book a tour</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing(7) }}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={{ marginTop: spacing(3) }}>{children}</View>
    </View>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <View style={styles.chips}>
      {items.map((it) => (
        <View key={it} style={styles.chip}>
          <Text style={styles.chipText}>{it}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },

  // Gallery
  gallery: { height: GALLERY_H, backgroundColor: colors.white },
  galleryImg: { width, height: GALLERY_H, backgroundColor: colors.white },
  dots: {
    position: 'absolute',
    bottom: spacing(9),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing(1.5),
  },
  dot: { height: 6, width: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotActive: { width: 18, backgroundColor: colors.white },

  // Floating back button
  backBtn: {
    position: 'absolute',
    left: spacing(4),
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
  },

  // Content card
  card: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing(5),
    paddingTop: spacing(5),
  },
  name: { fontSize: 26, fontWeight: '800', color: colors.ink900, letterSpacing: -0.3 },
  uniRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), marginTop: spacing(1.5) },
  uni: { fontSize: 14, color: colors.ink600 },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing(1),
    marginTop: spacing(3),
    backgroundColor: colors.cream,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  ratingValue: { fontSize: 14, fontWeight: '800', color: colors.ink900 },
  ratingCount: { fontSize: 13, color: colors.ink500 },

  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginTop: spacing(4) },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: 6,
  },
  badgeMaroon: { backgroundColor: colors.maroon50 },
  badgeGold: { backgroundColor: '#faf1d8' },
  badgeText: { fontSize: 13, fontWeight: '700' },

  // Sections
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
  sectionAccent: { width: 3, height: 18, borderRadius: 2, backgroundColor: colors.maroon800 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.ink900 },
  paragraph: { fontSize: 15, color: colors.ink600, lineHeight: 23 },
  muted: { fontSize: 14, color: colors.ink500 },
  error: { fontSize: 14, color: colors.danger, marginTop: spacing(8), textAlign: 'center' },

  // Facts grid
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2.5),
    marginTop: spacing(6),
  },
  factTile: {
    width: (width - spacing(5) * 2 - spacing(2.5)) / 2,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(3),
  },
  factLabel: { fontSize: 11, color: colors.ink500 },
  factValue: { fontSize: 15, fontWeight: '600', color: colors.ink900, marginTop: spacing(1) },

  // Chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
  chip: { backgroundColor: colors.cream, borderRadius: radius.pill, paddingHorizontal: spacing(3.5), paddingVertical: spacing(2) },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.ink900 },

  // Bullets
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing(2.5), marginBottom: spacing(2) },
  dotBullet: { height: 6, width: 6, borderRadius: 3, backgroundColor: colors.maroon800, marginTop: 8 },
  bulletText: { flex: 1, fontSize: 15, color: colors.ink600, lineHeight: 22 },

  // Tip
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    backgroundColor: '#faf1d8',
    borderRadius: radius.lg,
    padding: spacing(4),
    marginTop: spacing(6),
  },
  tipIcon: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(207,149,38,0.16)',
  },
  tipText: { flex: 1, fontSize: 14, color: colors.ink600, lineHeight: 21 },

  // Reviews
  reviewCard: {
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing(4),
    marginBottom: spacing(3),
  },
  reviewText: { fontSize: 14, color: colors.ink600, lineHeight: 21, fontStyle: 'italic', marginTop: spacing(2) },
  reviewMeta: { fontSize: 13, fontWeight: '600', color: colors.ink900, marginTop: spacing(3) },

  // Book bar
  bookBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(5),
    paddingTop: spacing(3),
    borderTopWidth: 1,
    borderTopColor: colors.ink200,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  bookFrom: { fontSize: 11, color: colors.ink500 },
  bookPrice: { fontSize: 20, fontWeight: '800', color: colors.maroon900 },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.maroon900,
    borderRadius: radius.lg,
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(3.5),
  },
  bookBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
});
