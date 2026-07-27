import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import {
  connectApi,
  money,
  payoutDate,
  COUNTRIES,
  type ConnectStatus,
  type PayoutSummary,
} from '../../api/account';
import { friendlyError } from '../../api/auth';
import { Field, OutlineButton, PrimaryButton, Loading, kit, GREEN_BG, GREEN_FG } from './kit';

export function PayoutsSection() {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<null | 'connect' | 'cashout' | 'dashboard'>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([connectApi.status(), connectApi.payouts()])
      .then(([s, sum]) => {
        setStatus(s);
        setSummary(sum);
      })
      .catch(() => {
        setStatus({ connected: false, payoutsEnabled: false, detailsSubmitted: false, bank: null });
        setSummary({ currency: 'usd', availableCents: 0, pendingCents: 0, completeCents: 0, payouts: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  async function connect() {
    setWorking('connect');
    try {
      const { url } = await connectApi.onboard(country || undefined);
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Couldn’t start bank setup', friendlyError(e));
    } finally {
      setWorking(null);
    }
  }

  async function cashOut() {
    setWorking('cashout');
    try {
      const { amountCents } = await connectApi.cashOut();
      Alert.alert('Cash out started', `${money(amountCents, cur)} is on its way to your bank.`);
      load();
    } catch (e) {
      Alert.alert('Couldn’t cash out', friendlyError(e));
    } finally {
      setWorking(null);
    }
  }

  async function openDashboard() {
    setWorking('dashboard');
    try {
      const { url } = await connectApi.dashboard();
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Couldn’t open Stripe dashboard', friendlyError(e));
    } finally {
      setWorking(null);
    }
  }

  if (loading) return <Loading />;

  const cur = summary?.currency ?? 'usd';
  const available = summary?.availableCents ?? 0;
  const stats = [
    { label: 'Available', value: money(available, cur) },
    { label: 'Pending', value: money(summary?.pendingCents ?? 0, cur) },
    { label: 'Complete', value: money(summary?.completeCents ?? 0, cur) },
  ];

  return (
    <View>
      {/* Balance summary */}
      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: spacing(5) }}>
        <OutlineButton
          label={`Cash out ${money(available, cur)}`}
          onPress={cashOut}
          loading={working === 'cashout'}
          disabled={available <= 0 || working !== null}
        />
      </View>

      {/* Bank account */}
      <View style={styles.section}>
        <View style={styles.bankHeader}>
          <Text style={styles.h2}>Bank account</Text>
          <View style={styles.stripeBadge}>
            <Ionicons name="lock-closed" size={10} color={colors.white} />
            <Text style={styles.stripeBadgeText}>Powered by Stripe</Text>
          </View>
        </View>
        <Text style={styles.bodyText}>
          University Campus Private Tours uses Stripe to securely send your earnings to your bank account. Stripe
          encrypts and protects your personal data.
        </Text>

        {status?.payoutsEnabled ? (
          <View style={styles.bankCard}>
            <View style={styles.bankCheck}>
              <Ionicons name="checkmark-circle" size={22} color={GREEN_FG} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.bankName}>
                {status.bank ? `${status.bank.bankName ?? 'Bank account'} ···· ${status.bank.last4}` : 'Bank account connected'}
              </Text>
              <Text style={styles.bankSub}>
                {status.bank ? `${status.bank.currency.toUpperCase()} · ${status.bank.country}` : 'Ready to receive payouts.'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ marginTop: spacing(5) }}>
            <Field label="Country">
              <Pressable style={styles.select} onPress={() => setPickerOpen(true)}>
                <Text style={[styles.selectText, !country && { color: colors.ink300 }]}>
                  {country || 'Select your country…'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.ink300} />
              </Pressable>
            </Field>
          </View>
        )}

        <View style={{ marginTop: spacing(4) }}>
          {status?.payoutsEnabled ? (
            <OutlineButton
              label="Manage on Stripe"
              icon="open-outline"
              onPress={openDashboard}
              loading={working === 'dashboard'}
              disabled={working !== null}
            />
          ) : (
            <PrimaryButton
              label={status?.connected ? 'Finish bank setup' : 'Connect bank account'}
              onPress={connect}
              loading={working === 'connect'}
              disabled={working !== null}
            />
          )}
        </View>
      </View>

      {/* Completed payouts */}
      <View style={styles.section}>
        <Text style={styles.h3}>Completed payouts</Text>
        <View style={styles.tableHead}>
          <Text style={[styles.th, { flex: 1 }]}>Amount</Text>
          <Text style={[styles.th, { flex: 1 }]}>Bank</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Date</Text>
        </View>
        {summary && summary.payouts.length > 0 ? (
          summary.payouts.map((p, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.td, styles.tdBold, { flex: 1 }]}>{money(p.amountCents, p.currency)}</Text>
              <Text style={[styles.td, { flex: 1 }]}>
                {p.last4 ? `···· ${p.last4}` : '—'}
                {p.status !== 'paid' ? ` (${p.status})` : ''}
              </Text>
              <Text style={[styles.td, { flex: 1, textAlign: 'right' }]}>{payoutDate(p.arrivalDate)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyRow}>No completed payouts yet</Text>
        )}
      </View>

      {/* Country picker */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select your country</Text>
            <ScrollView>
              {COUNTRIES.map((c) => (
                <Pressable
                  key={c}
                  style={styles.modalRow}
                  onPress={() => {
                    setCountry(c);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={styles.modalRowText}>{c}</Text>
                  {country === c && <Ionicons name="checkmark" size={18} color={colors.maroon800} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: spacing(6), marginTop: spacing(2) },
  stat: {},
  statValue: { fontSize: 22, fontWeight: '800', color: colors.ink900 },
  statLabel: { fontSize: 13, color: colors.ink500, marginTop: 2 },
  section: { marginTop: spacing(8) },
  bankHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), flexWrap: 'wrap' },
  h2: { fontSize: 18, fontWeight: '800', color: colors.ink900 },
  h3: { fontSize: 16, fontWeight: '800', color: colors.ink900 },
  stripeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    backgroundColor: '#635bff',
    borderRadius: radius.sm,
    paddingHorizontal: spacing(2),
    paddingVertical: 3,
  },
  stripeBadgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  bodyText: { fontSize: 14, color: colors.ink600, lineHeight: 20, marginTop: spacing(3) },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: radius.lg,
    padding: spacing(4),
    marginTop: spacing(5),
  },
  bankCheck: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: GREEN_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankName: { fontSize: 15, fontWeight: '700', color: colors.ink900 },
  bankSub: { fontSize: 13, color: colors.ink600, marginTop: 2 },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.ink200,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3.5),
  },
  selectText: { fontSize: 15, color: colors.ink900 },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.ink200,
    paddingBottom: spacing(2),
    marginTop: spacing(4),
  },
  th: { fontSize: 11, fontWeight: '700', color: colors.ink500, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.ink100, paddingVertical: spacing(3) },
  td: { fontSize: 13, color: colors.ink600 },
  tdBold: { fontWeight: '700', color: colors.ink900 },
  emptyRow: { fontSize: 14, color: colors.ink500, paddingVertical: spacing(4), borderBottomWidth: 1, borderBottomColor: colors.ink100 },
  modalBackdrop: { flex: 1, backgroundColor: '#00000055', justifyContent: 'center', padding: spacing(8) },
  modalCard: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing(3), maxHeight: '70%' },
  modalTitle: { fontSize: 13, fontWeight: '700', color: colors.ink500, padding: spacing(3) },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(3.5),
    paddingHorizontal: spacing(3),
  },
  modalRowText: { fontSize: 15, color: colors.ink900 },
});
