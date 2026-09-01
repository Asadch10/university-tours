import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { font, colors, radius, spacing } from '../theme';
import { session, friendlyError } from '../api/auth';
import { accountApi } from '../api/account';
import { INTENT_OPTIONS, intentApi, type IntentKey } from '../api/intent';
import { registerForPush } from '../api/push';
import { fetchUniversities, type UniversityPin } from '../api/schools';
import { useToast } from '../components/Toast';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useStyles, useThemeColors } from '../theme-context';
import type { Palette } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;
type Step = 'intent' | 'schools';

// Same three choices, same `key` strings, as the website's onboarding — the value
// is persisted as profileJson.intent and the backend maps it to the account role.
const OPTIONS = INTENT_OPTIONS;

/** First-run welcome: pick an intent, then (for buyers) the schools you're interested in. */
export function OnboardingScreen({ navigation }: Props) {
  const tc = useThemeColors();
  const styles = useStyles(makeStyles);
  const toast = useToast();
  const [firstName, setFirstName] = useState('');
  const [selected, setSelected] = useState<IntentKey | ''>('');
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

  /**
   * Enter the app. `to` picks where onboarding hands off, matching the website:
   * a guest lands on Browse to find someone to book, while a guide or counselor goes
   * straight into their application form.
   */
  function enterApp(to: IntentKey) {
    void registerForPush(); // new users: ask for notifications on entering the app

    if (to === 'guest') {
      // Reset rather than push, so Back can't return to onboarding.
      navigation.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Browse' } }] });
      return;
    }

    // The tabs are still reset underneath, so closing the application form leaves the
    // user in the app (on Manage listing) rather than back at the welcome screen.
    navigation.reset({
      index: 1,
      routes: [
        { name: 'Main', params: { screen: 'Listing' } },
        { name: to === 'guide' ? 'BecomeGuide' : 'BecomeCounselor' },
      ],
    });
  }

  async function finish(intent: IntentKey, chosenSchools?: string[]) {
    setSaving(true);
    try {
      const res = await intentApi.save(intent, chosenSchools);
      if (res.role) await session.setUser({ role: res.role });
      enterApp(intent);
    } catch (e) {
      toast.error('Something went wrong', friendlyError(e));
      setSaving(false);
    }
  }

  function intentContinue() {
    if (!selected) return;
    // Guests get the schools-of-interest step; guides and counselors go straight to
    // their application, where the school is asked for in context.
    if (selected === 'guest') {
      setStep('schools');
      return;
    }
    finish(selected);
  }

  function schoolsContinue() {
    const customList = custom.split(',').map((s) => s.trim()).filter(Boolean);
    finish('guest', Array.from(new Set([...schools, ...customList])));
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
              Welcome to Campus Private Tours{firstName ? `, ${firstName}` : ''}
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
                    <View style={styles.optionText}>
                      <Text style={styles.optionLabel}>{o.label}</Text>
                      <Text style={styles.optionDescription}>{o.description}</Text>
                    </View>
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
                    <Ionicons name="close" size={13} color={tc.maroon800} />
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
                      {on && <Ionicons name="checkmark" size={13} color={tc.white} />}
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
              placeholderTextColor={tc.ink300}
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
          {saving ? <ActivityIndicator color={tc.white} /> : <Text style={styles.primaryBtnText}>Continue</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
  safe: { flex: 1, backgroundColor: tc.white },
  scroll: { padding: spacing(6), paddingBottom: spacing(6) },
  heading: { fontSize: font(26), fontWeight: '800', color: tc.ink900, lineHeight: 34 },
  prompt: { fontSize: font(15), fontWeight: '700', color: tc.ink900, marginTop: spacing(7) },
  sub: { fontSize: font(14), color: tc.ink500, lineHeight: 21, marginTop: spacing(2) },

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
  // The label + its description sit in a column; flex lives on the column so the
  // radio stays pinned left and long descriptions wrap instead of overflowing.
  optionText: { flex: 1 },
  optionLabel: { fontSize: font(15), fontWeight: '600', color: tc.ink900 },
  optionDescription: { fontSize: font(13), lineHeight: 18, color: tc.ink500, marginTop: 2 },

  chosenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2), marginTop: spacing(5) },
  chosenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1.5),
    backgroundColor: tc.maroon50,
    borderRadius: radius.pill,
    paddingLeft: spacing(3),
    paddingRight: spacing(2.5),
    paddingVertical: spacing(2),
  },
  chosenChipText: { fontSize: font(13), fontWeight: '700', color: tc.maroon900 },

  fieldLabel: { fontSize: font(13), fontWeight: '700', color: tc.ink900, marginTop: spacing(6), marginBottom: spacing(2) },
  schoolList: { borderWidth: 1, borderColor: tc.ink200, borderRadius: radius.md, overflow: 'hidden' },
  schoolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3.5),
    borderBottomWidth: 1,
    borderBottomColor: tc.ink100,
  },
  check: {
    height: 20,
    width: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: tc.ink300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: tc.maroon900, borderColor: tc.maroon900 },
  schoolName: { flex: 1, fontSize: font(15), color: tc.ink900 },
  input: {
    borderWidth: 1,
    borderColor: tc.ink200,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3.5),
    fontSize: font(15),
    color: tc.ink900,
    minHeight: 70,
    textAlignVertical: 'top',
  },

  footer: {
    paddingHorizontal: spacing(6),
    paddingTop: spacing(3),
    paddingBottom: spacing(4),
    borderTopWidth: 1,
    borderTopColor: tc.ink100,
    backgroundColor: tc.white,
  },
  primaryBtn: {
    backgroundColor: tc.maroon900,
    borderRadius: radius.lg,
    paddingVertical: spacing(4),
    alignItems: 'center',
  },
  primaryBtnDisabled: { backgroundColor: tc.ink200 },
  primaryBtnText: { color: tc.white, fontSize: font(15), fontWeight: '700' },
});
