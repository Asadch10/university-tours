import { useState, type ReactElement } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { font, colors, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { session, friendlyError } from '../api/auth';
import { registerForPush } from '../api/push';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;
type Mode = 'signin' | 'signup';

export function AuthScreen({ navigation }: Props) {
  const [mode, setMode] = useState<Mode>('signin');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === 'signup';
  const signupComplete =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    phone.trim().length >= 7 &&
    password.length >= 8;
  const canSubmit = email.trim().length > 3 && (isSignup ? signupComplete : password.length >= 6);

  async function submit() {
    if (!canSubmit || loading) return;
    setError(null);
    setLoading(true);
    try {
      if (isSignup) {
        const name = `${firstName.trim()} ${lastName.trim()}`.trim();
        await session.register(email.trim(), password, name);
        // Register takes no phone — save it right after, mirroring the website.
        if (phone.trim()) {
          try {
            await session.updateContact({ phone: phone.trim() });
          } catch {
            // Non-fatal: the account exists; phone can be set later in Profile.
          }
        }
        // New sign-ups verify their email, then onboard — same flow as the website.
        navigation.replace('VerifyEmail');
      } else {
        await session.login(email.trim(), password);
        void registerForPush(); // ask for notifications + register this device
        navigation.replace('Main');
      }
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.badge}>
              <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            </View>
            <Text style={styles.brandName}>University Campus Private Tours</Text>
          </View>

          <Text style={styles.heading}>{isSignup ? 'Create your account' : 'Welcome back'}</Text>
          <Text style={styles.sub}>
            {isSignup ? 'Sign up to book tours or become a guide.' : 'Sign in to continue.'}
          </Text>

          {/* Segmented toggle */}
          <View style={styles.segment}>
            {(['signin', 'signup'] as Mode[]).map((m) => {
              const active = mode === m;
              return (
                <Pressable key={m} onPress={() => switchMode(m)} style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {m === 'signin' ? 'Login' : 'Sign Up'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Fields */}
          {isSignup && (
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Field label="First name">
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Jane"
                    placeholderTextColor={colors.ink300}
                    autoCapitalize="words"
                    autoComplete="name-given"
                    style={styles.input}
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Last name">
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Doe"
                    placeholderTextColor={colors.ink300}
                    autoCapitalize="words"
                    autoComplete="name-family"
                    style={styles.input}
                  />
                </Field>
              </View>
            </View>
          )}

          <Field label="Email">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@college.edu"
              placeholderTextColor={colors.ink300}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              style={styles.input}
            />
          </Field>

          {isSignup && (
            <Field label="Phone number">
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 555 123 4567"
                placeholderTextColor={colors.ink300}
                keyboardType="phone-pad"
                autoComplete="tel"
                style={styles.input}
              />
            </Field>
          )}

          <Field label="Password">
            <View style={styles.passwordRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.ink300}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={[styles.input, { flex: 1, borderWidth: 0, paddingHorizontal: 0 }]}
              />
              <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                <Text style={styles.showText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
          </Field>

          {isSignup && <Text style={styles.hint}>Use at least 8 characters.</Text>}

          {!isSignup && (
            <Pressable style={styles.forgot}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={submit}
            disabled={!canSubmit || loading}
            style={[styles.submit, (!canSubmit || loading) && styles.submitDisabled]}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitText}>{isSignup ? 'Sign Up' : 'Login'}</Text>
            )}
          </Pressable>

          <Text style={styles.switch}>
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <Text style={styles.switchLink} onPress={() => switchMode(isSignup ? 'signin' : 'signup')}>
              {isSignup ? 'Login' : 'Sign up'}
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: ReactElement }) {
  return (
    <View style={{ marginTop: spacing(4) }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { padding: spacing(6), paddingTop: spacing(8), flexGrow: 1 },
  brand: { alignItems: 'center', marginBottom: spacing(6) },
  badge: {
    height: 64,
    width: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.ink200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { height: 52, width: 52 },
  brandName: { marginTop: spacing(3), fontSize: font(13), fontWeight: '700', color: colors.maroon900, textAlign: 'center' },
  heading: { fontSize: font(26), fontWeight: '800', color: colors.ink900 },
  sub: { fontSize: font(14), color: colors.ink500, marginTop: spacing(1) },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderRadius: radius.pill,
    padding: 4,
    marginTop: spacing(6),
  },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing(2.5), borderRadius: radius.pill },
  segmentBtnActive: { backgroundColor: colors.white, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  segmentText: { fontSize: font(14), fontWeight: '600', color: colors.ink500 },
  segmentTextActive: { color: colors.maroon900 },
  label: { fontSize: font(13), fontWeight: '700', color: colors.ink900, marginBottom: spacing(1.5) },
  nameRow: { flexDirection: 'row', gap: spacing(3) },
  hint: { fontSize: font(12), color: colors.ink500, marginTop: spacing(1.5) },
  error: {
    marginTop: spacing(5),
    marginBottom: -spacing(2),
    color: colors.maroon900,
    fontSize: font(13),
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ink200,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3.5),
    fontSize: font(15),
    color: colors.ink900,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ink200,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
  },
  showText: { fontSize: font(13), fontWeight: '700', color: colors.maroon800, paddingLeft: spacing(3) },
  forgot: { alignSelf: 'flex-end', marginTop: spacing(3) },
  forgotText: { fontSize: font(13), fontWeight: '600', color: colors.maroon800 },
  submit: {
    marginTop: spacing(6),
    backgroundColor: colors.maroon900,
    borderRadius: radius.lg,
    paddingVertical: spacing(4),
    alignItems: 'center',
  },
  submitDisabled: { backgroundColor: colors.ink200 },
  submitText: { color: colors.white, fontSize: font(16), fontWeight: '700' },
  switch: { marginTop: spacing(6), textAlign: 'center', fontSize: font(14), color: colors.ink500 },
  switchLink: { color: colors.maroon800, fontWeight: '700' },
});
