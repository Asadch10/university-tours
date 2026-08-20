import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { font, radius, spacing } from '../theme';
import type { Guide } from '../api/guides';
import type { Counselor } from '../api/counselors';
import { GuideList } from './browse/GuideList';
import { CounselorList } from './browse/CounselorList';
import { GuideDetail } from './guide/GuideDetail';
import { CounselorDetail } from './counselor/CounselorDetail';
import { useStyles } from '../theme-context';
import type { Palette } from '../theme';

type BrowseKey = 'guides' | 'counselors';

const SEGMENTS: { key: BrowseKey; label: string }[] = [
  { key: 'guides', label: 'Guides' },
  { key: 'counselors', label: 'Counselors' },
];

/**
 * Browse — one tab, both marketplaces.
 *
 * Uses the same segmented switch as My Tours rather than a second bottom tab, so
 * the tab bar stays at five items. Selection is held here (not in the lists) so a
 * chosen profile can take over the whole screen — header and switch included —
 * exactly as it did when guides had their own tab.
 */
export function BrowseScreen() {
  const styles = useStyles(makeStyles);
  const [segment, setSegment] = useState<BrowseKey>('guides');
  const [guide, setGuide] = useState<Guide | null>(null);
  const [counselor, setCounselor] = useState<Counselor | null>(null);

  if (guide) return <GuideDetail preview={guide} onBack={() => setGuide(null)} />;
  if (counselor) return <CounselorDetail counselor={counselor} onBack={() => setCounselor(null)} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Browse</Text>
        <Text style={styles.subtitle}>
          {segment === 'guides'
            ? 'Real student guides, ready to show you around.'
            : 'Verified admissions professionals, ready to advise.'}
        </Text>

        {/* Marketplace switch — same control My Tours uses for its perspectives. */}
        <View style={styles.segment}>
          {SEGMENTS.map((s) => {
            const on = segment === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => setSegment(s.key)}
                style={[styles.segmentBtn, on && styles.segmentBtnActive]}
              >
                <Text style={[styles.segmentText, on && styles.segmentTextActive]}>{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {segment === 'guides' ? (
        <GuideList onSelect={setGuide} />
      ) : (
        <CounselorList onSelect={setCounselor} />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: tc.white },
    header: { paddingHorizontal: spacing(5), paddingTop: spacing(2), paddingBottom: spacing(3) },
    title: { fontSize: font(28), fontWeight: '800', color: tc.ink900 },
    subtitle: { fontSize: font(14), color: tc.ink500, marginTop: spacing(1) },
    segment: {
      flexDirection: 'row',
      backgroundColor: tc.cream,
      borderRadius: radius.pill,
      padding: 4,
      marginTop: spacing(4),
    },
    segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing(2.5), borderRadius: radius.pill },
    segmentBtnActive: {
      backgroundColor: tc.white,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    segmentText: { fontSize: font(14), fontWeight: '600', color: tc.ink500 },
    segmentTextActive: { color: tc.maroon900 },
  });
