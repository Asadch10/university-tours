import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { font, colors, radius, spacing } from '../../theme';
import { accountApi, DIAL_CODES, type MyProfileDto } from '../../api/account';
import { friendlyError } from '../../api/auth';
import { useToast } from '../../components/Toast';
import { Field, SInput, PrimaryButton, useKit, GREEN_FG } from './kit';
import { useStyles, useThemeColors } from '../../theme-context';
import type { Palette } from '../../theme';

export function ContactInformationSection({
  profile,
  onUpdated,
}: {
  profile: MyProfileDto | null;
  onUpdated?: (patch: { phone: string; promo: boolean }) => void;
}) {
  const tc = useThemeColors();
  const kit = useKit();
  const styles = useStyles(makeStyles);
  const [email, setEmail] = useState('');
  const [dial, setDial] = useState('+92');
  const [phone, setPhone] = useState('');
  const [promo, setPromo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!profile) return;
    setEmail(profile.email ?? '');
    const p = (profile.profileJson ?? {}) as Record<string, unknown>;
    if (typeof p.phone === 'string') setPhone(p.phone);
    if (typeof p.promo === 'boolean') setPromo(p.promo);
  }, [profile]);

  const dialFlag = DIAL_CODES.find((c) => c.code === dial)?.flag ?? '🏳️';

  async function save() {
    setSaving(true);
    try {
      const trimmed = phone.trim();
      await accountApi.updateContact({ phone: trimmed, promo });
      // Push the saved values up so the parent's cached profile stays in sync —
      // otherwise re-opening this section shows the stale (pre-save) phone.
      onUpdated?.({ phone: trimmed, promo });
      toast.success('Contact info updated', 'Your changes have been saved.');
    } catch (e) {
      toast.error('Could not save', friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      {/* Email (read-only) */}
      <Field label="Email address">
        <SInput value={email} editable={false} style={kit.inputDisabled} />
        <View style={kit.verifiedRow}>
          <Ionicons name="checkmark-circle" size={16} color={GREEN_FG} />
          <Text style={kit.verifiedText}>Your email address is verified</Text>
        </View>
      </Field>

      {/* Phone */}
      <Field label="Phone number">
        <View style={styles.phoneRow}>
          <Pressable style={styles.dialBtn} onPress={() => setPickerOpen(true)}>
            <Text style={styles.dialText}>
              {dialFlag} {dial}
            </Text>
            <Ionicons name="chevron-down" size={14} color={tc.ink300} />
          </Pressable>
          <SInput
            value={phone}
            onChangeText={setPhone}
            placeholder="307 6718155"
            keyboardType="phone-pad"
            style={styles.phoneInput}
          />
        </View>
      </Field>

      {/* Promo */}
      <Pressable style={styles.promoRow} onPress={() => setPromo((v) => !v)}>
        <View style={[styles.checkbox, promo && styles.checkboxOn]}>
          {promo && <Ionicons name="checkmark" size={14} color={tc.white} />}
        </View>
        <Text style={styles.promoText}>
          I&apos;d like to receive promotional messages from Campus Private Tours. Message and data rates
          may apply. Text STOP to cancel.
        </Text>
      </Pressable>

      <View style={{ marginTop: spacing(8) }}>
        <PrimaryButton label={saving ? 'Saving…' : 'Save changes'} onPress={save} loading={saving} />
      </View>

      {/* Dial-code picker */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Country code</Text>
            {DIAL_CODES.map((c) => {
              const on = c.code === dial && DIAL_CODES.find((x) => x.code === dial)?.label === c.label;
              return (
                <Pressable
                  key={c.label}
                  style={styles.modalRow}
                  onPress={() => {
                    setDial(c.code);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={styles.modalRowText}>
                    {c.flag}  {c.label}  ·  {c.code}
                  </Text>
                  {on && <Ionicons name="checkmark" size={18} color={tc.maroon800} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tc.ink200,
    borderRadius: radius.md,
    backgroundColor: tc.white,
  },
  dialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3.5),
    borderRightWidth: 1,
    borderRightColor: tc.ink200,
  },
  dialText: { fontSize: font(15), fontWeight: '600', color: tc.ink900 },
  phoneInput: { flex: 1, borderWidth: 0 },
  promoRow: { flexDirection: 'row', gap: spacing(2.5), marginTop: spacing(5), alignItems: 'flex-start' },
  checkbox: {
    height: 20,
    width: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: tc.ink300,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: tc.maroon900, borderColor: tc.maroon900 },
  promoText: { flex: 1, fontSize: font(13), color: tc.ink600, lineHeight: 19 },
  modalBackdrop: { flex: 1, backgroundColor: '#00000055', justifyContent: 'center', padding: spacing(8) },
  modalCard: { backgroundColor: tc.white, borderRadius: radius.xl, padding: spacing(3) },
  modalTitle: { fontSize: font(13), fontWeight: '700', color: tc.ink500, padding: spacing(3) },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(3.5),
    paddingHorizontal: spacing(3),
    borderRadius: radius.md,
  },
  modalRowText: { fontSize: font(15), color: tc.ink900 },
});
