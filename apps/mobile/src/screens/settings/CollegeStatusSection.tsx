import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { font, colors, radius, spacing } from '../../theme';
import { accountApi, type MyProfileDto } from '../../api/account';
import { friendlyError } from '../../api/auth';
import { useToast } from '../../components/Toast';
import { PrimaryButton } from './kit';

const OPTIONS = [
  { key: 'book', label: 'Book a private tour' },
  { key: 'guide', label: 'Become a guide and host tours' },
  { key: 'other', label: 'Other' },
];

export function CollegeStatusSection({
  profile,
  onSaved,
}: {
  profile: MyProfileDto | null;
  onSaved?: (next: { role: MyProfileDto['role']; intent: string }) => void;
}) {
  const [selected, setSelected] = useState('book');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!profile) return;
    const p = (profile.profileJson ?? {}) as Record<string, unknown>;
    if (p.intent === 'book' || p.intent === 'guide' || p.intent === 'other') setSelected(p.intent);
    else if (profile.role === 'SELLER') setSelected('guide');
    else if (profile.role === 'BUYER') setSelected('book');
  }, [profile]);

  async function save() {
    setSaving(true);
    try {
      const res = await accountApi.completeOnboarding(selected);
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
              <Text style={styles.optionLabel}>{o.label}</Text>
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

const styles = StyleSheet.create({
  prompt: { fontSize: font(14), fontWeight: '600', color: colors.ink600, marginTop: spacing(1) },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    borderWidth: 1,
    borderColor: colors.ink200,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing(5),
    paddingVertical: spacing(4),
  },
  optionActive: { borderColor: colors.maroon800, backgroundColor: colors.maroon50 },
  radio: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.ink300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.maroon800 },
  radioDot: { height: 10, width: 10, borderRadius: 5, backgroundColor: colors.maroon800 },
  optionLabel: { fontSize: font(15), fontWeight: '600', color: colors.ink900 },
});
