import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { accountApi } from '../../api/account';
import { friendlyError } from '../../api/auth';
import { useToast } from '../../components/Toast';
import { Field, SInput, PrimaryButton, useKit } from './kit';
import { useStyles, useThemeColors } from '../../theme-context';
import type { Palette } from '../../theme';

export function PasswordSection() {
  const tc = useThemeColors();
  const kit = useKit();
  const styles = useStyles(makeStyles);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function save() {
    if (password.length < 8) {
      toast.error('Password too short', 'Use at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      await accountApi.changePassword(password);
      setPassword('');
      toast.success('Password updated', 'Your new password is saved.');
    } catch (e) {
      toast.error('Could not update password', friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      <Field label="New password">
        <View style={styles.row}>
          <SInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your new password"
            secureTextEntry={!show}
            autoCapitalize="none"
            autoComplete="new-password"
            style={styles.input}
          />
          <Pressable onPress={() => setShow((s) => !s)} hitSlop={8} style={styles.eye}>
            <Ionicons name={show ? 'eye-off' : 'eye'} size={18} color={tc.ink300} />
          </Pressable>
        </View>
        <Text style={kit.hint}>Use at least 8 characters.</Text>
      </Field>

      <View style={{ marginTop: spacing(8) }}>
        <PrimaryButton
          label={saving ? 'Saving…' : 'Save changes'}
          onPress={save}
          loading={saving}
          disabled={password.length < 8}
        />
      </View>
    </View>
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
  row: { position: 'relative', justifyContent: 'center' },
  input: { paddingRight: spacing(12) },
  eye: { position: 'absolute', right: spacing(3) },
});
