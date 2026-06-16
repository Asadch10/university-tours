import { View, Text, StyleSheet } from 'react-native';

/** Reusable placeholder used by scaffolded screens. */
export function Placeholder({ title, note }: { title: string; note?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a2b4a' },
  note: { fontSize: 14, color: '#667', textAlign: 'center' },
});
