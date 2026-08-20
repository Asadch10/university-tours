import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { font, radius, spacing } from '../../theme';
import { counselorsApi, counselorFromDto, type Counselor } from '../../api/counselors';
import { GuideCardSkeleton } from '../../components/Skeleton';
import { CounselorCard } from '../counselor/CounselorCard';
import { useStyles, useThemeColors } from '../../theme-context';
import type { Palette } from '../../theme';

/** The counselors half of Browse — the exact counterpart of GuideList. */
export function CounselorList({ onSelect }: { onSelect: (counselor: Counselor) => void }) {
  const tc = useThemeColors();
  const styles = useStyles(makeStyles);
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback((opts?: { refresh?: boolean }) => {
    if (opts?.refresh) setRefreshing(true);
    else setLoading(true);
    counselorsApi
      .list()
      .then((res) => setCounselors(res.data.map(counselorFromDto)))
      .catch(() => setCounselors([]))
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
      data={counselors}
      keyExtractor={(c) => c.id}
      renderItem={({ item }) => <CounselorCard counselor={item} onPress={() => onSelect(item)} />}
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
            <Ionicons name="ribbon-outline" size={26} color={tc.maroon800} />
          </View>
          <Text style={styles.emptyTitle}>No counselors yet</Text>
          <Text style={styles.emptyText}>
            Approved college counselors will show up here. Pull down to refresh.
          </Text>
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
