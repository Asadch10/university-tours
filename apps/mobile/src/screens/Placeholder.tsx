import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { font } from '../theme';

/** Reusable placeholder used by scaffolded screens (kept inside the safe area). */
export function Placeholder({ title, note }: { title: string; note?: string }) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8, backgroundColor: '#ffffff' },
  title: { fontSize: font(22), fontWeight: '700', color: '#1a2b4a' },
  note: { fontSize: font(14), color: '#667', textAlign: 'center' },
});
