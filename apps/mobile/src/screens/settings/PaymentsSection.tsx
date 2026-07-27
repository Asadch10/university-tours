import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import { paymentMethodsApi, type SavedCard } from '../../api/account';
import { friendlyError } from '../../api/auth';
import { OutlineButton, GREEN_BG, GREEN_FG } from './kit';

const brandLabel = (b: string) => b.charAt(0).toUpperCase() + b.slice(1);

export function PaymentsSection() {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    paymentMethodsApi
      .list()
      .then((r) => setCards(r.data))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  async function remove(id: string) {
    setBusyId(id);
    try {
      await paymentMethodsApi.remove(id);
      load();
    } catch (e) {
      Alert.alert('Couldn’t remove card', friendlyError(e));
    } finally {
      setBusyId(null);
    }
  }

  async function makeDefault(id: string) {
    setBusyId(id);
    try {
      await paymentMethodsApi.setDefault(id);
      load();
    } catch (e) {
      Alert.alert('Couldn’t set default', friendlyError(e));
    } finally {
      setBusyId(null);
    }
  }

  function addCard() {
    Alert.alert(
      'Add a card on the web',
      'Secure in-app card entry is coming soon. For now, add or update your saved cards from the website — they’ll appear here automatically.',
    );
  }

  return (
    <View>
      <Text style={styles.intro}>
        Save a card so checkout is one tap next time. Cards are stored securely by Stripe — we never see your full
        card number.
      </Text>

      <View style={{ marginTop: spacing(6), gap: spacing(3) }}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.maroon800} />
            <Text style={styles.loadingText}>Loading your cards…</Text>
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No saved cards yet.</Text>
          </View>
        ) : (
          cards.map((c) => (
            <View key={c.id} style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="card" size={20} color={colors.maroon800} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>
                    {brandLabel(c.brand)} ···· {c.last4}
                  </Text>
                  {c.isDefault && (
                    <View style={styles.defaultPill}>
                      <Text style={styles.defaultPillText}>Default</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardExp}>
                  Expires {String(c.expMonth).padStart(2, '0')}/{c.expYear}
                </Text>
                {!c.isDefault && (
                  <Pressable onPress={() => makeDefault(c.id)} disabled={busyId === c.id} style={styles.makeDefault}>
                    <Ionicons name="checkmark" size={13} color={colors.maroon800} />
                    <Text style={styles.makeDefaultText}>Make default</Text>
                  </Pressable>
                )}
              </View>
              <Pressable onPress={() => remove(c.id)} disabled={busyId === c.id} hitSlop={8} style={styles.trash}>
                {busyId === c.id ? (
                  <ActivityIndicator size="small" color={colors.ink300} />
                ) : (
                  <Ionicons name="trash-outline" size={18} color={colors.ink300} />
                )}
              </Pressable>
            </View>
          ))
        )}
      </View>

      <View style={{ marginTop: spacing(6) }}>
        <OutlineButton label="Add a card" icon="add" onPress={addCard} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 14, color: colors.ink600, lineHeight: 20, marginTop: spacing(1) },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), paddingVertical: spacing(6) },
  loadingText: { fontSize: 14, color: colors.ink500 },
  emptyCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ink300,
    borderRadius: radius.lg,
    paddingVertical: spacing(6),
    alignItems: 'center',
    backgroundColor: colors.ivory,
  },
  emptyText: { fontSize: 14, color: colors.ink500 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: radius.lg,
    padding: spacing(4),
    backgroundColor: colors.white,
  },
  cardIcon: {
    height: 40,
    width: 40,
    borderRadius: radius.md,
    backgroundColor: colors.maroon50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.ink900 },
  defaultPill: { backgroundColor: GREEN_BG, borderRadius: radius.pill, paddingHorizontal: spacing(2), paddingVertical: 2 },
  defaultPillText: { fontSize: 11, fontWeight: '700', color: GREEN_FG },
  cardExp: { fontSize: 13, color: colors.ink500, marginTop: 2 },
  makeDefault: { flexDirection: 'row', alignItems: 'center', gap: spacing(1), marginTop: spacing(2) },
  makeDefaultText: { fontSize: 13, fontWeight: '600', color: colors.maroon800 },
  trash: { height: 36, width: 36, alignItems: 'center', justifyContent: 'center' },
});
