import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import Constants from 'expo-constants';
import { Img } from '../components/Img';
import { font, colors, radius, spacing } from '../theme';
import { fetchUniversities, type UniversityPin } from '../api/schools';
import { guidesApi, communityGuideToGuide, type Guide } from '../api/guides';
import { SchoolRowSkeleton, GuideCardSkeleton } from '../components/Skeleton';
import { FadeInView } from '../components/FadeInView';
import { GuideCard } from './guide/GuideCard';
import { GuideDetail } from './guide/GuideDetail';
import { useStyles, useThemeColors } from '../theme-context';
import type { Palette } from '../theme';

// Continental-US default region until the schools load / a pin is picked.
const US_REGION = { latitude: 39.5, longitude: -98.35, latitudeDelta: 45, longitudeDelta: 55 };

// A map region that comfortably frames the given pins (centred, with padding).
function regionForPins(pins: UniversityPin[]) {
  const lats = pins.map((p) => p.lat as number);
  const lngs = pins.map((p) => p.lng as number);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.4),
    longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.4),
  };
}

/**
 * Android renders react-native-maps through the Google Maps SDK, which throws during
 * native init when no API key is present — that takes the whole app down the moment the
 * map tab is opened. iOS falls back to Apple Maps and needs no key.
 *
 * Set the key in app.json under `expo.android.config.googleMaps.apiKey` (then rebuild:
 * `npx expo prebuild --clean`). Until then the map degrades to a message instead of
 * crashing.
 */
const MAPS_KEY = (
  Constants.expoConfig?.android?.config?.googleMaps?.apiKey ?? ''
).trim();
const MAPS_AVAILABLE = Platform.OS !== 'android' || (!!MAPS_KEY && !MAPS_KEY.startsWith('$'));

export function ExploreScreen() {
  const tc = useThemeColors();
  const styles = useStyles(makeStyles);
  const [universities, setUniversities] = useState<UniversityPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [selected, setSelected] = useState<UniversityPin | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    fetchUniversities()
      .then(setUniversities)
      .catch(() => setUniversities([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return universities;
    return universities.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q) ||
        u.state.toLowerCase().includes(q),
    );
  }, [search, universities]);

  // Pins reflect the search: only the matching schools that have coordinates.
  const pinned = useMemo(() => filtered.filter((u) => u.lat != null && u.lng != null), [filtered]);

  // When searching in map view, glide the map to frame the current matches.
  useEffect(() => {
    if (view !== 'map' || pinned.length === 0) return;
    mapRef.current?.animateToRegion(regionForPins(pinned), 450);
  }, [pinned, view]);

  // Full-screen school detail (replaces the old bottom sheet).
  if (selected) return <SchoolDetail school={selected} onBack={() => setSelected(null)} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Explore schools</Text>
        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={tc.ink300} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search schools or cities…"
            placeholderTextColor={tc.ink300}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={tc.ink300} />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.list}>
          {Array.from({ length: 8 }).map((_, i) => (
            <SchoolRowSkeleton key={i} />
          ))}
        </View>
      ) : view === 'list' ? (
        <FlatList
          data={filtered}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => <SchoolRow school={item} onPress={() => setSelected(item)} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={10}
          windowSize={11}
          ListHeaderComponent={
            <Text style={styles.count}>
              {filtered.length} school{filtered.length !== 1 ? 's' : ''}
            </Text>
          }
          ListEmptyComponent={<Text style={styles.emptyText}>No schools found</Text>}
        />
      ) : !MAPS_AVAILABLE ? (
        <View style={[styles.map, { alignItems: 'center', justifyContent: 'center', padding: spacing(8) }]}>
          <Ionicons name="map-outline" size={40} color={tc.ink300} />
          <Text style={[styles.emptyText, { marginTop: spacing(3), textAlign: 'center' }]}>
            Map needs a Google Maps API key on Android.{'\n'}Browse the list instead.
          </Text>
        </View>
      ) : (
        <MapView ref={mapRef} provider={PROVIDER_DEFAULT} style={styles.map} initialRegion={US_REGION}>
          {pinned.map((u) => (
            <Marker
              key={u.id}
              coordinate={{ latitude: u.lat as number, longitude: u.lng as number }}
              title={u.name}
              description={`${u.city}${u.state ? `, ${u.state}` : ''}`}
              pinColor={tc.maroon900}
              onCalloutPress={() => setSelected(u)}
              onPress={() => setSelected(u)}
            />
          ))}
        </MapView>
      )}

      {/* List / Map toggle */}
      <Pressable style={styles.toggle} onPress={() => setView((v) => (v === 'list' ? 'map' : 'list'))}>
        <Ionicons name={view === 'list' ? 'map' : 'list'} size={16} color={tc.white} />
        <Text style={styles.toggleText}>{view === 'list' ? 'Map' : 'List'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

/* ═══ School list row (memoized for FlatList recycling) ════════════════ */

const SchoolRow = memo(function SchoolRow({ school: u, onPress }: { school: UniversityPin; onPress: () => void }) {
  const tc = useThemeColors();
  const styles = useStyles(makeStyles);
  return (
    <Pressable style={styles.row} onPress={onPress}>
      {u.image ? (
        <Img source={{ uri: u.image }} style={styles.rowImg} recyclingKey={u.id} />
      ) : (
        <View style={[styles.rowImg, styles.rowImgFallback]}>
          <Text style={styles.rowImgLetter}>{u.name.charAt(0)}</Text>
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowName} numberOfLines={1}>
          {u.name}
        </Text>
        <Text style={styles.rowLoc} numberOfLines={1}>
          {u.city}
          {u.state ? `, ${u.state}` : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={tc.ink300} />
    </Pressable>
  );
});

/* ═══ Full-screen school detail ════════════════════════════════════════ */

type TabKey = 'about' | 'guides' | 'reviews' | 'photos';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'guides', label: 'Guides' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'photos', label: 'Photos' },
];

function SchoolDetail({ school, onBack }: { school: UniversityPin; onBack: () => void }) {
  const tc = useThemeColors();
  const styles = useStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>('about');
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  useEffect(() => {
    let active = true;
    guidesApi
      .community()
      .then((r) => {
        if (!active) return;
        const all = r.data.map(communityGuideToGuide);
        setGuides(all.filter((g) => g.university && g.university.toLowerCase() === school.name.toLowerCase()));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingGuides(false);
      });
    return () => {
      active = false;
    };
  }, [school.name]);

  if (selectedGuide) return <GuideDetail preview={selectedGuide} onBack={() => setSelectedGuide(null)} />;

  const loc = `${school.city}${school.state ? `, ${school.state}` : ''}`;
  const guideCount = loadingGuides ? school.ambassadors : guides.length;

  return (
    <FadeInView style={styles.dSafe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing(10) }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.dHero}>
          {school.image ? (
            <Img source={{ uri: school.image }} style={styles.dHeroImg} />
          ) : (
            <View style={[styles.dHeroImg, styles.heroFallback]}>
              <Text style={styles.heroLetter}>{school.name.charAt(0)}</Text>
            </View>
          )}
        </View>
        <Pressable style={[styles.dBackBtn, { top: insets.top + spacing(2) }]} onPress={onBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={tc.ink900} />
        </Pressable>

        {/* Info */}
        <View style={styles.dBody}>
          <Text style={styles.dName}>{school.name}</Text>
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={14} color={tc.ink500} />
            <Text style={styles.locText}>{loc}</Text>
          </View>
          <View style={styles.dStats}>
            <Ionicons name="people-outline" size={15} color={tc.maroon800} />
            <Text style={styles.dStatsText}>
              <Text style={styles.ambStrong}>{guideCount}</Text> verified student guide{guideCount === 1 ? '' : 's'}
            </Text>
          </View>

          {/* Tabs */}
          <View style={styles.dTabs}>
            {TABS.map((t) => {
              const on = tab === t.key;
              return (
                <Pressable key={t.key} onPress={() => setTab(t.key)} style={styles.dTab}>
                  <Text style={[styles.dTabText, on && styles.dTabTextOn]}>{t.label}</Text>
                  {on && <View style={styles.dTabUnderline} />}
                </Pressable>
              );
            })}
          </View>

          {/* Tab content */}
          {tab === 'about' && (
            <View style={{ marginTop: spacing(5) }}>
              <Text style={styles.scoopLabel}>THE INSIDE SCOOP</Text>
              <Text style={styles.scoop}>
                {school.blurb || `Meet verified student guides at ${school.name} and see the campus through their eyes.`}
              </Text>
            </View>
          )}

          {tab === 'guides' && (
            <View style={{ marginTop: spacing(5), gap: spacing(4) }}>
              {loadingGuides ? (
                Array.from({ length: 3 }).map((_, i) => <GuideCardSkeleton key={i} />)
              ) : guides.length === 0 ? (
                <Text style={styles.emptyState}>No student guides at {school.name} yet.</Text>
              ) : (
                guides.map((g) => <GuideCard key={g.id} guide={g} onPress={() => setSelectedGuide(g)} />)
              )}
            </View>
          )}

          {tab === 'reviews' && (
            <View style={{ marginTop: spacing(5) }}>
              <Text style={styles.emptyState}>No reviews yet.</Text>
            </View>
          )}

          {tab === 'photos' && (
            <View style={{ marginTop: spacing(5) }}>
              {school.image ? (
                <Img source={{ uri: school.image }} style={styles.photoImg} contentFit="cover" />
              ) : (
                <Text style={styles.emptyState}>No photos yet.</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </FadeInView>
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
  safe: { flex: 1, backgroundColor: tc.white },
  header: { paddingHorizontal: spacing(5), paddingTop: spacing(2), paddingBottom: spacing(3) },
  title: { fontSize: font(28), fontWeight: '800', color: tc.ink900 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: tc.white,
    borderWidth: 1,
    borderColor: tc.ink200,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    height: 46,
    marginTop: spacing(4),
  },
  searchInput: { flex: 1, fontSize: font(15), color: tc.ink900 },
  list: { paddingHorizontal: spacing(5), paddingBottom: spacing(24) },
  count: { fontSize: font(11), fontWeight: '700', letterSpacing: 0.5, color: tc.ink300, paddingVertical: spacing(3) },
  emptyText: { fontSize: font(14), color: tc.ink500, textAlign: 'center', paddingVertical: spacing(10) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3.5),
    paddingVertical: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: tc.ink100,
  },
  rowImg: { height: 56, width: 56, borderRadius: radius.md, backgroundColor: tc.ink100 },
  rowImgFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: tc.maroon900 },
  rowImgLetter: { color: tc.ivory, fontSize: font(20), fontWeight: '800' },
  rowName: { fontSize: font(15), fontWeight: '700', color: tc.ink900 },
  rowLoc: { fontSize: font(13), color: tc.ink500, marginTop: 2 },
  map: { flex: 1 },
  toggle: {
    position: 'absolute',
    bottom: spacing(5),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: tc.ink900,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(3),
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  toggleText: { color: tc.white, fontSize: font(14), fontWeight: '700' },

  // ── Full-screen detail ──
  dSafe: { flex: 1, backgroundColor: tc.white },
  dHero: { height: 240, backgroundColor: tc.ink100 },
  dHeroImg: { height: 240, width: '100%' },
  heroFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: tc.maroon900 },
  heroLetter: { color: tc.ivory, fontSize: font(56), fontWeight: '800' },
  dBackBtn: {
    position: 'absolute',
    left: spacing(4),
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: tc.white + 'e6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  dBody: { paddingHorizontal: spacing(5), paddingTop: spacing(5) },
  dName: { fontSize: font(24), fontWeight: '800', color: tc.ink900, letterSpacing: -0.3 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), marginTop: spacing(2) },
  locText: { fontSize: font(13), color: tc.ink600 },
  dStats: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), marginTop: spacing(3) },
  dStatsText: { fontSize: font(14), color: tc.ink500 },
  ambStrong: { fontWeight: '800', color: tc.ink900 },

  // Tabs
  dTabs: { flexDirection: 'row', gap: spacing(6), marginTop: spacing(5), borderBottomWidth: 1, borderBottomColor: tc.ink100 },
  dTab: { paddingBottom: spacing(3) },
  dTabText: { fontSize: font(15), fontWeight: '700', color: tc.ink500 },
  dTabTextOn: { color: tc.maroon900 },
  dTabUnderline: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, borderRadius: 1, backgroundColor: tc.maroon900 },

  // Tab content
  scoopLabel: { fontSize: font(10), fontWeight: '800', letterSpacing: 1.5, color: tc.ink300 },
  scoop: { fontSize: font(15), color: tc.ink600, lineHeight: 23, marginTop: spacing(2) },
  emptyState: { fontSize: font(14), color: tc.ink500, paddingVertical: spacing(6), textAlign: 'center' },
  photoImg: { width: '100%', aspectRatio: 16 / 10, borderRadius: radius.lg, backgroundColor: tc.ink100 },
});
