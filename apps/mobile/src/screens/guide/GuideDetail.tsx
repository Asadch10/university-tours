import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { font, colors, radius, spacing } from '../../theme';
import { Img } from '../../components/Img';
import { Skeleton } from '../../components/Skeleton';
import { FadeInView } from '../../components/FadeInView';
import {
  guidesApi,
  communityGuideToProfile,
  fromPrice,
  serviceLabel,
  type Guide,
  type GuideProfile,
} from '../../api/guides';
import { friendlyError, session } from '../../api/auth';
import { BookTour } from './BookTour';
import { useStyles, useThemeColors } from '../../theme-context';
import type { Palette } from '../../theme';

const { width } = Dimensions.get('window');
// Portrait-friendly hero so the whole photo shows (contain) without cropping the head.
const GALLERY_H = Math.round(Math.min(width * 1.05, 440));

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const tc = useThemeColors();
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={value >= n ? 'star' : 'star-outline'} size={size} color={tc.gold500} />
      ))}
    </View>
  );
}

export function GuideDetail({ preview, onBack }: { preview: Guide; onBack: () => void }) {
  const tc = useThemeColors();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<GuideProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [booking, setBooking] = useState(false);
  // A guide viewing their OWN listing can see it but can't book themselves.
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    guidesApi
      .detail(preview.id)
      .then((dto) => setProfile(communityGuideToProfile(dto)))
      .catch((e) => setError(friendlyError(e)))
      .finally(() => setLoading(false));
  }, [preview.id]);

  useEffect(() => {
    let active = true;
    session.currentUser().then((u) => {
      if (active) setIsOwner(!!u && u.id === preview.id);
    });
    return () => {
      active = false;
    };
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
    <FadeInView style={styles.safe}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing(6) }}
        showsVerticalScrollIndicator={false}
        scrollIndicatorInsets={{ right: 1 }}
      >
        {/* Safe-area spacer so the gallery clears the notch */}
        <View style={{ height: insets.top, backgroundColor: tc.cream }} />

        {/* Gallery — full photo, never cropped */}
        <View style={styles.gallery}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onGalleryScroll}
          >
            {gallery.map((uri, i) => (
              <Img key={i} source={{ uri }} style={styles.galleryImg} contentFit="contain" />
            ))}
          </ScrollView>
        </View>

        {/* Page dots (always visible below the photo) */}
        {gallery.length > 1 && (
          <View style={styles.dots}>
            {gallery.map((_, i) => (
              <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>
        )}

        {/* Content card overlapping the gallery */}
        <View style={styles.card}>
          {/* Identity */}
          <Text style={styles.name}>{preview.name}</Text>
          {!!preview.university && (
            <View style={styles.uniRow}>
              <Ionicons name="school-outline" size={15} color={tc.ink500} />
              <Text style={styles.uni}>{preview.university}</Text>
            </View>
          )}
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={14} color={tc.gold500} />
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
                  color={s === 'CAMPUS_TOUR' ? tc.maroon800 : tc.gold500}
                />
                <Text style={[styles.badgeText, { color: s === 'CAMPUS_TOUR' ? tc.maroon800 : tc.gold500 }]}>
                  {serviceLabel(s)}
                </Text>
              </View>
            ))}
          </View>

          {loading ? (
            <View style={{ marginTop: spacing(7), gap: spacing(3) }}>
              <Skeleton w={130} h={16} />
              <Skeleton w="100%" h={12} />
              <Skeleton w="90%" h={12} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2.5), marginTop: spacing(4) }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} w="47%" h={64} r={12} />
                ))}
              </View>
            </View>
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
                    <Ionicons name="bulb" size={16} color={tc.gold500} />
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
        {/* The pill sits on photography; onBrand stays a true white in both themes. */}
        <Ionicons name="arrow-back" size={22} color={tc.onBrand} />
      </Pressable>

      {/* Bottom bar — owners see a note (can't book themselves); everyone else can book. */}
      {isOwner ? (
        <View style={styles.ownerBar}>
          <View style={styles.ownerIcon}>
            <Ionicons name="eye-outline" size={18} color={tc.maroon800} />
          </View>
          <Text style={styles.ownerText} numberOfLines={1}>
            This is your listing — only others can book.
          </Text>
        </View>
      ) : (
        /* Book bar — sits above the tab bar (which already handles the bottom inset) */
        <View style={styles.bookBar}>
          <View>
            <Text style={styles.bookFrom}>From</Text>
            <Text style={styles.bookPrice}>{fromPrice(preview.price)}</Text>
          </View>
          <Pressable style={styles.bookBtn} onPress={() => setBooking(true)}>
            <Ionicons name="calendar" size={15} color={tc.white} />
            <Text style={styles.bookBtnText}>Book a tour</Text>
          </Pressable>
        </View>
      )}
    </FadeInView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const styles = useStyles(makeStyles);
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
  const styles = useStyles(makeStyles);
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

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
  safe: { flex: 1, backgroundColor: tc.white },

  // Gallery — soft framed backdrop; the photo is shown in full (contain), not cropped.
  gallery: { height: GALLERY_H, backgroundColor: tc.cream },
  galleryImg: { width, height: GALLERY_H, backgroundColor: tc.cream },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing(1.5),
    paddingTop: spacing(3),
    backgroundColor: tc.white,
  },
  dot: { height: 6, width: 6, borderRadius: 3, backgroundColor: tc.ink300 },
  dotActive: { width: 18, backgroundColor: tc.maroon900 },

  // Floating back button
  backBtn: {
    position: 'absolute',
    left: spacing(4),
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tc.maroon900,
  },

  // Content card
  card: {
    backgroundColor: tc.white,
    paddingHorizontal: spacing(5),
    paddingTop: spacing(5),
  },
  name: { fontSize: font(24), fontWeight: '800', color: tc.ink900, letterSpacing: -0.3 },
  uniRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), marginTop: spacing(2) },
  uni: { fontSize: font(14), fontWeight: '600', color: tc.ink600 },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing(1),
    marginTop: spacing(3),
    backgroundColor: tc.cream,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  ratingValue: { fontSize: font(14), fontWeight: '800', color: tc.ink900 },
  ratingCount: { fontSize: font(13), color: tc.ink500 },

  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginTop: spacing(4) },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: 6,
  },
  badgeMaroon: { backgroundColor: tc.maroon50 },
  badgeGold: { backgroundColor: '#faf1d8' },
  badgeText: { fontSize: font(12), fontWeight: '700' },

  // Sections
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
  sectionAccent: { width: 3, height: 16, borderRadius: 2, backgroundColor: tc.maroon800 },
  sectionTitle: { fontSize: font(17), fontWeight: '800', color: tc.ink900 },
  paragraph: { fontSize: font(15), color: tc.ink600, lineHeight: 23 },
  muted: { fontSize: font(14), color: tc.ink500 },
  error: { fontSize: font(14), color: tc.danger, marginTop: spacing(8), textAlign: 'center' },

  // Facts grid
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2.5),
    marginTop: spacing(6),
  },
  factTile: {
    width: (width - spacing(5) * 2 - spacing(2.5)) / 2,
    backgroundColor: tc.white,
    borderWidth: 1,
    borderColor: tc.ink200,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(3.5),
  },
  factLabel: { fontSize: font(10), fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', color: tc.ink500 },
  factValue: { fontSize: font(15), fontWeight: '700', color: tc.ink900, marginTop: spacing(1.5) },

  // Chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
  chip: { backgroundColor: tc.cream, borderRadius: radius.pill, paddingHorizontal: spacing(3.5), paddingVertical: spacing(2) },
  chipText: { fontSize: font(13), fontWeight: '600', color: tc.ink900 },

  // Bullets
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing(2.5), marginBottom: spacing(2) },
  dotBullet: { height: 6, width: 6, borderRadius: 3, backgroundColor: tc.maroon800, marginTop: 8 },
  bulletText: { flex: 1, fontSize: font(15), color: tc.ink600, lineHeight: 22 },

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
  tipText: { flex: 1, fontSize: font(14), color: tc.ink600, lineHeight: 21 },

  // Reviews
  reviewCard: {
    borderWidth: 1,
    borderColor: tc.ink200,
    borderRadius: radius.lg,
    backgroundColor: tc.white,
    padding: spacing(4),
    marginBottom: spacing(3),
  },
  reviewText: { fontSize: font(14), color: tc.ink600, lineHeight: 21, fontStyle: 'italic', marginTop: spacing(2) },
  reviewMeta: { fontSize: font(13), fontWeight: '600', color: tc.ink900, marginTop: spacing(3) },

  // Book bar
  bookBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  bookFrom: { fontSize: font(10), fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', color: tc.ink300 },
  bookPrice: { fontSize: font(19), fontWeight: '800', color: tc.maroon900, marginTop: 1 },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    backgroundColor: tc.maroon900,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2.5),
  },
  bookBtnText: { color: tc.white, fontSize: font(14), fontWeight: '700' },

  // Owner bar (viewing your own listing)
  ownerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(3.5),
    borderTopWidth: 1,
    borderTopColor: tc.ink200,
    backgroundColor: tc.white,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  ownerIcon: {
    height: 40,
    width: 40,
    borderRadius: radius.md,
    backgroundColor: tc.maroon50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerText: { flex: 1, fontSize: font(13), fontWeight: '700', color: tc.ink900 },
});
