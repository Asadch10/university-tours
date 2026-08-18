import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { font, colors, radius, spacing } from '../../theme';
import { type MyProfileDto } from '../../api/account';
import { INTENT_OPTIONS, intentApi, intentOptionFor, type IntentKey } from '../../api/intent';
import { friendlyError } from '../../api/auth';
import { useToast } from '../../components/Toast';
import { PrimaryButton } from './kit';
import { useStyles } from '../../theme-context';
import type { Palette } from '../../theme';

// Shared with the onboarding screen so the two can't drift apart.
const OPTIONS = INTENT_OPTIONS;

export function CollegeStatusSection({
  profile,
  onSaved,
}: {
  profile: MyProfileDto | null;
  onSaved?: (next: { role: MyProfileDto['role']; intent: string }) => void;
}) {
  const styles = useStyles(makeStyles);
  const [selected, setSelected] = useState<IntentKey>('guest');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!profile) return;
    const p = (profile.profileJson ?? {}) as Record<string, unknown>;
    // Accounts onboarded on an older build carry the legacy intents
    // ('book' / 'other'); intentOptionFor folds those onto a current option so
    // the section never renders with nothing selected.
    setSelected(intentOptionFor(p.intent, profile.role).key);
  }, [profile]);

  async function save() {
    setSaving(true);
    try {
      const res = await intentApi.save(selected);
      // Sync BOTH the role and the saved intent up to the parent's cached profile,
      // so re-opening this section reflects the new choice instead of reverting.
      onSaved?.({ role: res.role ?? profile?.role ?? null, intent: selected });
      toast.success('College status updated', 'Your preference has been saved.');
    } catch (e) {
      toast.error('Could not save', friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      <Text style={styles.prompt}>I want to…</Text>
      <View style={{ gap: spacing(3), marginTop: spacing(3) }}>
        {OPTIONS.map((o) => {
          const active = selected === o.key;
          return (
            <Pressable
              key={o.key}
              onPress={() => setSelected(o.key)}
              style={[styles.option, active && styles.optionActive]}
            >
              <View style={[styles.radio, active && styles.radioActive]}>
                {active && <View style={styles.radioDot} />}
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{o.label}</Text>
                <Text style={styles.optionDescription}>{o.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: spacing(8) }}>
        <PrimaryButton label={saving ? 'Saving…' : 'Save'} onPress={save} loading={saving} />
      </View>
    </View>
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
  prompt: { fontSize: font(14), fontWeight: '600', color: tc.ink600, marginTop: spacing(1) },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    borderWidth: 1,
    borderColor: tc.ink200,
    backgroundColor: tc.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(4),
  },
  optionActive: { borderColor: tc.maroon800, backgroundColor: tc.maroon50 },
  radio: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: tc.ink300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: tc.maroon800 },
  radioDot: { height: 10, width: 10, borderRadius: 5, backgroundColor: tc.maroon800 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: font(15), fontWeight: '600', color: tc.ink900 },
  optionDescription: { fontSize: font(13), lineHeight: 18, color: tc.ink500, marginTop: 2 },
});
