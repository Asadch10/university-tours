import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { font, colors, radius, spacing } from '../../theme';
import { accountApi } from '../../api/account';
import { session, friendlyError } from '../../api/auth';
import { useToast } from '../../components/Toast';

export function ManageAccountSection({ onSignedOut }: { onSignedOut: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  async function del() {
    if (!confirm) return;
    setDeleting(true);
    try {
      await accountApi.deleteAccount();
      await session.clear();
      onSignedOut();
    } catch (e) {
      toast.error('Could not delete account', friendlyError(e));
      setDeleting(false);
    }
  }

  return (
    <View>
      <Pressable style={styles.confirmRow} onPress={() => setConfirm((v) => !v)}>
        <View style={[styles.checkbox, confirm && styles.checkboxOn]}>
          {confirm && <Ionicons name="checkmark" size={14} color={colors.white} />}
        </View>
        <Text style={styles.confirmText}>Delete my account</Text>
      </Pressable>

      <Text style={styles.warning}>
        Deleting your account will permanently remove your personal data. This action cannot be undone.
      </Text>

      <Pressable
        onPress={del}
        disabled={!confirm || deleting}
        style={[styles.deleteBtn, (!confirm || deleting) && styles.deleteBtnDisabled]}
      >
        <Ionicons name="trash-outline" size={16} color={confirm && !deleting ? colors.white : colors.ink300} />
        <Text style={[styles.deleteText, !(confirm && !deleting) && { color: colors.ink300 }]}>
          {deleting ? 'Deleting…' : 'Delete account'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2.5), marginTop: spacing(1) },
  checkbox: {
    height: 20,
    width: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.ink300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.danger, borderColor: colors.danger },
  confirmText: { fontSize: font(15), fontWeight: '700', color: colors.ink900 },
  warning: { fontSize: font(14), color: colors.ink600, marginTop: spacing(5), lineHeight: 20 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    backgroundColor: colors.danger,
    borderRadius: radius.lg,
    paddingVertical: spacing(4),
    marginTop: spacing(10),
  },
  deleteBtnDisabled: { backgroundColor: colors.ink100 },
  deleteText: { fontSize: font(15), fontWeight: '700', color: colors.white },
});
