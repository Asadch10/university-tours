import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Img } from '../components/Img';
import { font, colors, radius, spacing } from '../theme';
import { session } from '../api/auth';
import { fetchUniversities, type UniversityPin } from '../api/schools';
import { guidesApi, communityGuideToGuide, type Guide } from '../api/guides';
import { GuideCardSkeleton, UniCardSkeleton } from '../components/Skeleton';
import { GuideCard } from './guide/GuideCard';
import { GuideDetail } from './guide/GuideDetail';

// Resolve `p`, but never wait longer than `ms` — a slow/broken image must not
// keep the skeleton up forever.
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([p, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);
}

export function HomeScreen() {
  const nav = useNavigation<any>();
  const [firstName, setFirstName] = useState('there');
  const [schools, setSchools] = useState<UniversityPin[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  function load(opts?: { refresh?: boolean }) {
    if (opts?.refresh) setRefreshing(true);
    else setLoading(true);
    Promise.all([
      fetchUniversities().catch(() => [] as UniversityPin[]),
      guidesApi.community().then((r) => r.data.map(communityGuideToGuide)).catch(() => [] as Guide[]),
    ])
      .then(async ([s, g]) => {
        // Warm the image cache for the cards we're about to show, so the skeleton
        // stays up until images are downloaded — cards then appear fully-formed
        // instead of flashing empty image placeholders.
        const urls = [
          ...s.slice(0, 10).map((u) => u.image),
          ...g.slice(0, 5).map((x) => x.photo),
        ].filter((u): u is string => typeof u === 'string' && !!u);
        await Promise.all(urls.map((u) => withTimeout(Img.prefetch(u).catch(() => false), 5000)));
        setSchools(s);
        setGuides(g);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    session.currentUser().then((u) => {
      if (u?.name) setFirstName(u.name.split(' ')[0]);
    });
    load();
  }, []);

  if (selectedGuide) return <GuideDetail preview={selectedGuide} onBack={() => setSelectedGuide(null)} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load({ refresh: true })} tintColor={colors.maroon800} />
        }
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable hitSlop={8} onPress={() => nav.navigate('Settings')}>
            <Ionicons name="menu" size={26} color={colors.ink900} />
          </Pressable>
          <Pressable hitSlop={8}>
            <Ionicons name="notifications-outline" size={23} color={colors.ink900} />
          </Pressable>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
        <Text style={styles.heading}>Where do you{'\n'}want to study?</Text>

        {/* Search → Explore */}
        <View style={styles.searchRow}>
          <Pressable style={styles.searchBox} onPress={() => nav.navigate('Explore')}>
            <Ionicons name="search" size={18} color={colors.ink300} />
            <Text style={styles.searchPlaceholder}>Search universities or cities</Text>
          </Pressable>
          <Pressable style={styles.filterBtn} onPress={() => nav.navigate('Explore')}>
            <Ionicons name="options-outline" size={20} color={colors.ink900} />
          </Pressable>
        </View>

        {/* Popular Universities */}
        <SectionHeader title="Popular Universities" onSeeAll={() => nav.navigate('Explore')} />
        {loading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.uniRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <UniCardSkeleton key={i} />
            ))}
          </ScrollView>
        ) : schools.length === 0 ? (
          <Text style={styles.emptyLine}>No schools yet.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.uniRow}>
            {schools.slice(0, 10).map((u) => (
              <Pressable key={u.id} style={styles.uniCard} onPress={() => nav.navigate('Explore')}>
                {u.image ? (
                  <Img source={{ uri: u.image }} style={styles.uniImage} recyclingKey={u.id} />
                ) : (
                  <View style={[styles.uniImage, styles.uniFallback]}>
                    <Text style={styles.uniLetter}>{u.name.charAt(0)}</Text>
                  </View>
                )}
                <Text style={styles.uniName} numberOfLines={2}>
                  {u.name}
                </Text>
                <View style={styles.uniMetaRow}>
                  <Ionicons name="location-outline" size={12} color={colors.ink500} />
                  <Text style={styles.uniMeta} numberOfLines={1}>
                    {u.city}
                    {u.state ? `, ${u.state}` : ''}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Featured Student Guides */}
        <SectionHeader title="Featured Student Guides" onSeeAll={() => nav.navigate('Guide')} />
        {loading ? (
          <View style={{ gap: spacing(4) }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <GuideCardSkeleton key={i} />
            ))}
          </View>
        ) : guides.length === 0 ? (
          <Text style={styles.emptyLine}>No guides yet.</Text>
        ) : (
          <View style={{ gap: spacing(4) }}>
            {guides.slice(0, 5).map((g) => (
              <GuideCard key={g.id} guide={g} onPress={() => setSelectedGuide(g)} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable hitSlop={6} onPress={onSeeAll}>
        <Text style={styles.seeAll}>See all</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing(5), paddingBottom: spacing(10) },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing(2) },
  greeting: { fontSize: font(15), color: colors.ink600, marginTop: spacing(3) },
  heading: { fontSize: font(28), fontWeight: '800', color: colors.ink900, marginTop: spacing(2), lineHeight: 34 },
  searchRow: { flexDirection: 'row', gap: spacing(3), marginTop: spacing(5) },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    height: 52,
  },
  searchPlaceholder: { fontSize: font(15), color: colors.ink300 },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink200,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing(7),
    marginBottom: spacing(3),
  },
  sectionTitle: { fontSize: font(17), fontWeight: '800', color: colors.ink900 },
  seeAll: { fontSize: font(14), fontWeight: '600', color: colors.maroon800 },
  emptyLine: { fontSize: font(14), color: colors.ink500, paddingVertical: spacing(4) },
  uniRow: { gap: spacing(3), paddingRight: spacing(2) },
  uniCard: { width: 156 },
  uniImage: { height: 120, width: 156, borderRadius: radius.md, backgroundColor: colors.ink100 },
  uniFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.maroon900 },
  uniLetter: { color: colors.ivory, fontSize: font(34), fontWeight: '800' },
  uniName: { fontSize: font(14), fontWeight: '700', color: colors.ink900, marginTop: spacing(2.5) },
  uniMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1), marginTop: spacing(1) },
  uniMeta: { flex: 1, fontSize: font(12), color: colors.ink500 },
});
