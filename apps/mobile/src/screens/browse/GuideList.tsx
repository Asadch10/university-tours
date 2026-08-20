import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { font, radius, spacing } from '../../theme';
import { guidesApi, communityGuideToGuide, type Guide } from '../../api/guides';
import { GuideCardSkeleton } from '../../components/Skeleton';
import { GuideCard } from '../guide/GuideCard';
import { useStyles, useThemeColors } from '../../theme-context';
import type { Palette } from '../../theme';

/**
 * The guides half of Browse. Owns its own fetch so the counselor list isn't
 * loaded until you switch to it; selection is lifted to BrowseScreen, which
 * swaps in the full-screen detail view.
 */
export function GuideList({ onSelect }: { onSelect: (guide: Guide) => void }) {
  const tc = useThemeColors();
  const styles = useStyles(makeStyles);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback((opts?: { refresh?: boolean }) => {
    if (opts?.refresh) setRefreshing(true);
    else setLoading(true);
    guidesApi
      .community()
      .then((res) => setGuides(res.data.map(communityGuideToGuide)))
      .catch(() => setGuides([]))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => load(), [load]);

  if (loading) {
    return (
      <View style={styles.list}>
        {Array.from({ length: 5 }).map((_, i) => (
          <GuideCardSkeleton key={i} />
        ))}
      </View>
    );
  }

  return (
    <FlatList
      data={guides}
      keyExtractor={(g) => g.id}
      renderItem={({ item }) => <GuideCard guide={item} onPress={() => onSelect(item)} />}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      initialNumToRender={6}
      windowSize={11}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load({ refresh: true })} tintColor={tc.maroon800} />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="people-outline" size={26} color={tc.maroon800} />
          </View>
          <Text style={styles.emptyTitle}>No guides yet</Text>
          <Text style={styles.emptyText}>Approved student guides will show up here. Pull down to refresh.</Text>
        </View>
      }
    />
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
    list: { padding: spacing(5), paddingTop: spacing(2), gap: spacing(4), flexGrow: 1 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing(20), gap: spacing(2) },
    emptyIcon: {
      height: 56,
      width: 56,
      borderRadius: radius.lg,
      backgroundColor: tc.maroon50,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing(1),
    },
    emptyTitle: { fontSize: font(17), fontWeight: '800', color: tc.ink900 },
    emptyText: { fontSize: font(14), color: tc.ink500, textAlign: 'center', maxWidth: 280 },
  });
