import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { font, colors, radius, spacing } from '../theme';
import { session, friendlyError } from '../api/auth';
import { useToast } from '../components/Toast';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useStyles, useThemeColors } from '../theme-context';
import type { Palette } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>;

/**
 * "Check your inbox" screen shown right after sign-up (mirrors the website).
 * Detects verification in two ways: a deep-link token (ucpt://verify-email?token=…)
 * that we confirm directly, and background polling of /auth/me (so tapping the
 * email link — which verifies on the backend — is picked up when the app returns).
 */
export function VerifyEmailScreen({ navigation, route }: Props) {
  const tc = useThemeColors();
  const styles = useStyles(makeStyles);
  const toast = useToast();
  const token = route.params?.token;
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [verifying, setVerifying] = useState(!!token);
  const done = useRef(false);

  const goOnboarding = useCallback(() => {
    if (done.current) return;
    done.current = true;
    navigation.replace('Onboarding');
  }, [navigation]);

  // Seed name/email from the session (present right after sign-up).
  useEffect(() => {
    session.currentUser().then((u) => {
      if (u) {
        setEmail(u.email ?? '');
        setName(u.name ?? '');
      }
    });
  }, []);

  // Arrived via a deep link with a token → confirm it directly.
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        await session.verifyEmail(token);
        await session.setUser({ emailVerified: true });
        goOnboarding();
      } catch {
        toast.error('Verification failed', 'That link is invalid or has expired.');
      } finally {
        setVerifying(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Poll the backend for verification (interval + whenever the app comes back to
  // the foreground, e.g. after the user taps the link in their mail app).
  const check = useCallback(
    async (opts?: { manual?: boolean }) => {
      try {
        const me = await session.me();
        if (me.emailVerified) {
          await session.setUser({ emailVerified: true });
          goOnboarding();
        } else if (opts?.manual) {
          toast.info('Not verified yet', 'Please tap the link in the email we sent you.');
        }
      } catch {
        /* transient — keep polling */
      }
    },
    [goOnboarding, toast],
  );

  useEffect(() => {
    const interval = setInterval(() => check(), 3500);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    check();
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [check]);

  async function resend() {
    setResendState('sending');
    try {
      await session.resendVerification();
      setResendState('sent');
      toast.success('Verification email sent', 'Check your inbox (and spam).');
    } catch (e) {
      setResendState('idle');
      toast.error('Couldn’t resend', friendlyError(e));
    }
  }

  async function fixEmail() {
    await session.clear();
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  }

  const first = (name || '').trim().split(/\s+/)[0] || 'there';

  if (verifying) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={tc.maroon900} />
          <Text style={styles.verifyingText}>Verifying your email…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <View style={styles.badge}>
          <Ionicons name="mail-outline" size={28} color={tc.maroon900} />
        </View>
        <Text style={styles.heading}>Hi {first}, check your inbox to verify your email</Text>
        <Text style={styles.sub}>
          Please tap the button in the email we sent to{' '}
          <Text style={styles.email}>{email || 'your address'}</Text> to verify your account. If you
          don’t see it, check your spam folder.
        </Text>

        <Pressable style={styles.primaryBtn} onPress={() => check({ manual: true })}>
          <Text style={styles.primaryBtnText}>I’ve verified — continue</Text>
        </Pressable>

        <View style={styles.links}>
          <Text style={styles.linkRow}>
            Didn’t get the email?{' '}
            <Text style={styles.link} onPress={resendState === 'sending' ? undefined : resend}>
              {resendState === 'sending' ? 'Resending…' : resendState === 'sent' ? 'Resend again' : 'Resend email'}
            </Text>
          </Text>
          <Text style={styles.linkRow}>
            Wrong email?{' '}
            <Text style={styles.link} onPress={fixEmail}>
              Fix it
            </Text>
          </Text>
        </View>

        <View style={styles.waiting}>
          <ActivityIndicator size="small" color={tc.ink300} />
          <Text style={styles.waitingText}>Waiting for confirmation…</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
  safe: { flex: 1, backgroundColor: tc.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing(4) },
  verifyingText: { fontSize: font(15), color: tc.ink600 },
  body: { flex: 1, paddingHorizontal: spacing(6), paddingTop: spacing(10) },
  badge: {
    height: 56,
    width: 56,
    borderRadius: radius.lg,
    backgroundColor: tc.maroon50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { fontSize: font(26), fontWeight: '800', color: tc.ink900, marginTop: spacing(6), lineHeight: 34 },
  sub: { fontSize: font(15), color: tc.ink600, lineHeight: 23, marginTop: spacing(4) },
  email: { fontWeight: '800', color: tc.ink900 },
  primaryBtn: {
    backgroundColor: tc.maroon900,
    borderRadius: radius.lg,
    paddingVertical: spacing(4),
    alignItems: 'center',
    marginTop: spacing(8),
  },
  primaryBtnText: { color: tc.white, fontSize: font(15), fontWeight: '700' },
  links: { marginTop: spacing(6), gap: spacing(2.5) },
  linkRow: { fontSize: font(14), color: tc.ink500 },
  link: { fontWeight: '800', color: tc.maroon900 },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), marginTop: spacing(8) },
  waitingText: { fontSize: font(13), color: tc.ink500 },
});
