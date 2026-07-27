import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { guidesApi, communityGuideToGuide, type Guide } from '../api/guides';
import { GuideCard } from './guide/GuideCard';
import { GuideDetail } from './guide/GuideDetail';

export function GuideScreen() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Guide | null>(null);

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

  if (selected) return <GuideDetail preview={selected} onBack={() => setSelected(null)} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Browse guides</Text>
        <Text style={styles.subtitle}>Real student guides, ready to show you around.</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.maroon800} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load({ refresh: true })} tintColor={colors.maroon800} />
          }
        >
          {guides.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={26} color={colors.maroon800} />
              </View>
              <Text style={styles.emptyTitle}>No guides yet</Text>
              <Text style={styles.emptyText}>
                Approved student guides will show up here. Pull down to refresh.
              </Text>
            </View>
          ) : (
            guides.map((g) => <GuideCard key={g.id} guide={g} onPress={() => setSelected(g)} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: spacing(5), paddingTop: spacing(2), paddingBottom: spacing(3) },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink900 },
  subtitle: { fontSize: 14, color: colors.ink500, marginTop: spacing(1) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing(5), paddingTop: spacing(2), gap: spacing(4), flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing(20), gap: spacing(2) },
  emptyIcon: {
    height: 56,
    width: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.maroon50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(1),
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.ink900 },
  emptyText: { fontSize: 14, color: colors.ink500, textAlign: 'center', maxWidth: 280 },
});
