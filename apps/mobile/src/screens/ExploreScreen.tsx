import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { font, colors, radius, spacing } from '../theme';
import { fetchUniversities, type UniversityPin } from '../api/schools';
import { SchoolRowSkeleton } from '../components/Skeleton';

// Continental-US default region until the schools load / a pin is picked.
const US_REGION = { latitude: 39.5, longitude: -98.35, latitudeDelta: 45, longitudeDelta: 55 };

export function ExploreScreen() {
  const nav = useNavigation<any>();
  const [universities, setUniversities] = useState<UniversityPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [selected, setSelected] = useState<UniversityPin | null>(null);

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

  const pinned = universities.filter((u) => u.lat != null && u.lng != null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Explore schools</Text>
        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={colors.ink300} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search schools or cities…"
            placeholderTextColor={colors.ink300}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.ink300} />
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
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.count}>
            {filtered.length} school{filtered.length !== 1 ? 's' : ''}
          </Text>
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>No schools found</Text>
          ) : (
            filtered.map((u) => (
              <Pressable key={u.id} style={styles.row} onPress={() => setSelected(u)}>
                {u.image ? (
                  <Image source={{ uri: u.image }} style={styles.rowImg} />
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
                <Ionicons name="chevron-forward" size={18} color={colors.ink300} />
              </Pressable>
            ))
          )}
        </ScrollView>
      ) : (
        <MapView provider={PROVIDER_DEFAULT} style={styles.map} initialRegion={US_REGION}>
          {pinned.map((u) => (
            <Marker
              key={u.id}
              coordinate={{ latitude: u.lat as number, longitude: u.lng as number }}
              title={u.name}
              description={`${u.city}${u.state ? `, ${u.state}` : ''}`}
              pinColor={colors.maroon900}
              onCalloutPress={() => setSelected(u)}
              onPress={() => setSelected(u)}
            />
          ))}
        </MapView>
      )}

      {/* List / Map toggle */}
      <Pressable style={styles.toggle} onPress={() => setView((v) => (v === 'list' ? 'map' : 'list'))}>
        <Ionicons name={view === 'list' ? 'map' : 'list'} size={16} color={colors.white} />
        <Text style={styles.toggleText}>{view === 'list' ? 'Map' : 'List'}</Text>
      </Pressable>

      {/* School detail sheet */}
      <SchoolDetail
        school={selected}
        onClose={() => setSelected(null)}
        onViewGuides={() => {
          setSelected(null);
          nav.navigate('Guide');
        }}
      />
    </SafeAreaView>
  );
}

function SchoolDetail({
  school,
  onClose,
  onViewGuides,
}: {
  school: UniversityPin | null;
  onClose: () => void;
  onViewGuides: () => void;
}) {
  return (
    <Modal visible={!!school} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        {school && (
          <View style={styles.sheet}>
            {/* Hero */}
            <View style={styles.hero}>
              {school.image ? (
                <Image source={{ uri: school.image }} style={styles.heroImg} />
              ) : (
                <View style={[styles.heroImg, styles.heroFallback]}>
                  <Text style={styles.heroLetter}>{school.name.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.heroScrim} />
              <Text style={styles.heroName}>{school.name}</Text>
              <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={18} color={colors.ink900} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.sheetBody}>
              <View style={styles.locRow}>
                <Ionicons name="location-outline" size={14} color={colors.ink300} />
                <Text style={styles.locText}>
                  {school.city}
                  {school.state ? `, ${school.state}` : ''}
                  {school.ranking ? `  ·  ${school.ranking}` : ''}
                </Text>
              </View>

              <Text style={styles.scoopLabel}>THE INSIDE SCOOP</Text>
              <Text style={styles.scoop}>{school.blurb}</Text>

              <View style={styles.ambRow}>
                <Ionicons name="people-outline" size={15} color={colors.ink500} />
                <Text style={styles.ambText}>
                  <Text style={styles.ambStrong}>{school.ambassadors}</Text> verified student guide
                  {school.ambassadors === 1 ? '' : 's'}
                </Text>
              </View>

              <Pressable style={styles.viewGuidesBtn} onPress={onViewGuides}>
                <Ionicons name="people" size={16} color={colors.white} />
                <Text style={styles.viewGuidesText}>View student guides</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: spacing(5), paddingTop: spacing(2), paddingBottom: spacing(3) },
  title: { fontSize: font(28), fontWeight: '800', color: colors.ink900 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    height: 46,
    marginTop: spacing(4),
  },
  searchInput: { flex: 1, fontSize: font(15), color: colors.ink900 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing(5), paddingBottom: spacing(24) },
  count: { fontSize: font(11), fontWeight: '700', letterSpacing: 0.5, color: colors.ink300, paddingVertical: spacing(3) },
  emptyText: { fontSize: font(14), color: colors.ink500, textAlign: 'center', paddingVertical: spacing(10) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3.5),
    paddingVertical: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.ink100,
  },
  rowImg: { height: 56, width: 56, borderRadius: radius.md, backgroundColor: colors.ink100 },
  rowImgFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.maroon900 },
  rowImgLetter: { color: colors.ivory, fontSize: font(20), fontWeight: '800' },
  rowName: { fontSize: font(15), fontWeight: '700', color: colors.ink900 },
  rowLoc: { fontSize: font(13), color: colors.ink500, marginTop: 2 },
  map: { flex: 1 },
  toggle: {
    position: 'absolute',
    bottom: spacing(5),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.ink900,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(3),
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  toggleText: { color: colors.white, fontSize: font(14), fontWeight: '700' },

  // Detail sheet
  sheetBackdrop: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '82%', overflow: 'hidden' },
  hero: { height: 200 },
  heroImg: { height: 200, width: '100%', backgroundColor: colors.ink100 },
  heroFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.maroon900 },
  heroLetter: { color: colors.ivory, fontSize: font(56), fontWeight: '800' },
  heroScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  heroName: { position: 'absolute', left: spacing(5), right: spacing(12), bottom: spacing(4), color: colors.white, fontSize: font(20), fontWeight: '800', textShadowColor: '#000000aa', textShadowRadius: 8 },
  closeBtn: {
    position: 'absolute',
    right: spacing(3),
    top: spacing(3),
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: '#ffffffe6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: { padding: spacing(5) },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5) },
  locText: { fontSize: font(13), color: colors.ink600 },
  scoopLabel: { fontSize: font(10), fontWeight: '800', letterSpacing: 1.5, color: colors.ink300, marginTop: spacing(4) },
  scoop: { fontSize: font(14), color: colors.ink600, lineHeight: 21, marginTop: spacing(2) },
  ambRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), marginTop: spacing(4) },
  ambText: { fontSize: font(14), color: colors.ink500 },
  ambStrong: { fontWeight: '800', color: colors.ink900 },
  viewGuidesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    backgroundColor: colors.maroon900,
    borderRadius: radius.lg,
    paddingVertical: spacing(4),
    marginTop: spacing(6),
  },
  viewGuidesText: { color: colors.white, fontSize: font(15), fontWeight: '700' },
});
