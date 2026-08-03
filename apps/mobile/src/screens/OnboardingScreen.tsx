import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { font, colors, radius, spacing } from '../theme';
import { session, friendlyError } from '../api/auth';
import { accountApi } from '../api/account';
import { registerForPush } from '../api/push';
import { fetchUniversities, type UniversityPin } from '../api/schools';
import { useToast } from '../components/Toast';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;
type Step = 'intent' | 'schools';

const OPTIONS = [
  { key: 'book', label: 'Book a private tour' },
  { key: 'guide', label: 'Become a guide and host tours' },
  { key: 'other', label: 'Other' },
];

/** First-run welcome: pick an intent, then (for buyers) the schools you're interested in. */
export function OnboardingScreen({ navigation }: Props) {
  const toast = useToast();
  const [firstName, setFirstName] = useState('');
  const [selected, setSelected] = useState('');
  const [step, setStep] = useState<Step>('intent');
  const [saving, setSaving] = useState(false);

  const [allSchools, setAllSchools] = useState<UniversityPin[]>([]);
  const [schools, setSchools] = useState<string[]>([]);
  const [custom, setCustom] = useState('');

  useEffect(() => {
    session.currentUser().then((u) => {
      if (u?.name) setFirstName(u.name.trim().split(/\s+/)[0]);
    });
    fetchUniversities().then(setAllSchools).catch(() => {});
  }, []);

  function goMain() {
    void registerForPush(); // new users: ask for notifications on entering the app
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  }

  async function finish(intent: string, chosenSchools?: string[]) {
    setSaving(true);
    try {
      const res = await accountApi.completeOnboarding(intent, chosenSchools);
      if (res.role) await session.setUser({ role: res.role });
      goMain();
    } catch (e) {
      toast.error('Something went wrong', friendlyError(e));
      setSaving(false);
    }
  }

  function intentContinue() {
    if (selected === 'book') {
      setStep('schools');
      return;
    }
    finish(selected);
  }

  function schoolsContinue() {
    const customList = custom.split(',').map((s) => s.trim()).filter(Boolean);
    finish('book', Array.from(new Set([...schools, ...customList])));
  }

  const toggleSchool = (name: string) =>
    setSchools((cur) => (cur.includes(name) ? cur.filter((s) => s !== name) : [...cur, name]));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {step === 'intent' ? (
          <>
            <Text style={styles.heading}>
              Welcome to University Campus Private Tours{firstName ? `, ${firstName}` : ''}
            </Text>
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
          </>
        ) : (
          <>
            <Text style={styles.heading}>What schools are you interested in?</Text>
            <Text style={styles.sub}>
              This helps us personalize your experience. You can change this later.
            </Text>

            {schools.length > 0 && (
              <View style={styles.chosenRow}>
                {schools.map((s) => (
                  <Pressable key={s} style={styles.chosenChip} onPress={() => toggleSchool(s)}>
                    <Text style={styles.chosenChipText}>{s}</Text>
                    <Ionicons name="close" size={13} color={colors.maroon800} />
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={styles.fieldLabel}>Add schools</Text>
            <View style={styles.schoolList}>
              {allSchools.map((u) => {
                const on = schools.includes(u.name);
                return (
                  <Pressable key={u.id} style={styles.schoolRow} onPress={() => toggleSchool(u.name)}>
                    <View style={[styles.check, on && styles.checkOn]}>
                      {on && <Ionicons name="checkmark" size={13} color={colors.white} />}
                    </View>
                    <Text style={styles.schoolName} numberOfLines={1}>
                      {u.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Don’t see yours? Type it</Text>
            <TextInput
              value={custom}
              onChangeText={setCustom}
              placeholder="Enter school name(s), separated by commas"
              placeholderTextColor={colors.ink300}
              style={styles.input}
              multiline
            />
          </>
        )}
      </ScrollView>

      {/* Continue */}
      <View style={styles.footer}>
        <Pressable
          onPress={step === 'intent' ? intentContinue : schoolsContinue}
          disabled={(step === 'intent' && !selected) || saving}
          style={[styles.primaryBtn, ((step === 'intent' && !selected) || saving) && styles.primaryBtnDisabled]}
        >
          {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Continue</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { padding: spacing(6), paddingBottom: spacing(6) },
  heading: { fontSize: font(26), fontWeight: '800', color: colors.ink900, lineHeight: 34 },
  prompt: { fontSize: font(15), fontWeight: '700', color: colors.ink900, marginTop: spacing(7) },
  sub: { fontSize: font(14), color: colors.ink500, lineHeight: 21, marginTop: spacing(2) },

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
  optionLabel: { flex: 1, fontSize: font(15), fontWeight: '600', color: colors.ink900 },

  chosenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginTop: spacing(5) },
  chosenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    backgroundColor: colors.maroon50,
    borderRadius: radius.pill,
    paddingLeft: spacing(3),
    paddingRight: spacing(2.5),
    paddingVertical: spacing(2),
  },
  chosenChipText: { fontSize: font(13), fontWeight: '700', color: colors.maroon900 },

  fieldLabel: { fontSize: font(13), fontWeight: '700', color: colors.ink900, marginTop: spacing(6), marginBottom: spacing(2) },
  schoolList: { borderWidth: 1, borderColor: colors.ink200, borderRadius: radius.md, overflow: 'hidden' },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3.5),
    borderBottomWidth: 1,
    borderBottomColor: colors.ink100,
  },
  check: {
    height: 20,
    width: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.ink300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.maroon900, borderColor: colors.maroon900 },
  schoolName: { flex: 1, fontSize: font(15), color: colors.ink900 },
  input: {
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3.5),
    fontSize: font(15),
    color: colors.ink900,
    minHeight: 70,
    textAlignVertical: 'top',
  },

  footer: {
    paddingHorizontal: spacing(6),
    paddingTop: spacing(3),
    paddingBottom: spacing(4),
    borderTopWidth: 1,
    borderTopColor: colors.ink100,
    backgroundColor: colors.white,
  },
  primaryBtn: {
    backgroundColor: colors.maroon900,
    borderRadius: radius.lg,
    paddingVertical: spacing(4),
    alignItems: 'center',
  },
  primaryBtnDisabled: { backgroundColor: colors.ink200 },
  primaryBtnText: { color: colors.white, fontSize: font(15), fontWeight: '700' },
});
