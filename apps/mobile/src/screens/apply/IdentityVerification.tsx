/**
 * Stripe Identity check inside the two application forms — the mobile counterpart of
 * apps/website/components/verification/identity-verification.tsx.
 *
 * The copy is deliberately the same as the website's: this verifies WHO someone is, not
 * that they are enrolled. Stripe confirms a government ID is genuine and matches a
 * selfie; enrolment is established separately by the student-ID photo and admin review.
 * Implying otherwise would mislead both the applicant and the admin reviewing them.
 *
 * WHY THE HOSTED PAGE, not a native sheet: Stripe Identity's React Native SDK
 * (stripe-identity-react-native) is a native module that Expo Go cannot load, and it is
 * not part of @stripe/stripe-react-native. The backend already returns Stripe's hosted
 * URL for exactly this case, so mobile opens that in an in-app browser. No document
 * touches our servers either way.
 */
import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { font, radius, spacing, type Palette } from '../../theme';
import { useStyles, useThemeColors } from '../../theme-context';
import { useToast } from '../../components/Toast';
import { friendlyError } from '../../api/auth';
import type { ApplicantKind } from '../../api/applications';
import {
  verificationApi,
  type VerificationDto,
  type VerificationStatus,
} from '../../api/verification';

type IoniconName = keyof typeof Ionicons.glyphMap;

/** Matches the redirect our /verification-done page fires. See `start()` below. */
const RETURN_SCHEME = 'ucpt://verification-done';

const STATE: Record<
  Exclude<VerificationStatus, 'PENDING'>,
  { icon: IoniconName; tone: 'ok' | 'warn' | 'bad' | 'muted'; title: string; body: string }
> = {
  VERIFIED: {
    icon: 'shield-checkmark',
    tone: 'ok',
    title: 'Identity verified',
    body: 'Your government ID has been confirmed. Our team still reviews your enrolment document separately.',
  },
  PROCESSING: {
    icon: 'time',
    tone: 'warn',
    title: 'Checking your ID',
    body: 'This usually takes under a minute — we’ll update this automatically.',
  },
  FAILED: {
    icon: 'alert-circle',
    tone: 'bad',
    title: 'We couldn’t verify that',
    body: 'Try again with a clearer photo, or continue — an admin can verify you manually.',
  },
  CANCELED: {
    icon: 'alert-circle',
    tone: 'muted',
    title: 'Verification cancelled',
    body: 'You can start it again whenever you’re ready.',
  },
};

export function IdentityVerification({ kind = 'GUIDE' }: { kind?: ApplicantKind }) {
  const s = useStyles(makeStyles);
  const tc = useThemeColors();
  const toast = useToast();
  // undefined = still loading, null = never started.
  const [record, setRecord] = useState<VerificationDto | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRecord(await verificationApi.mine(kind));
    } catch {
      // An unreachable check should read as "not started", never break the form.
      setRecord(null);
    }
  }, [kind]);

  useEffect(() => {
    void load();
  }, [load]);

  // While Stripe is still checking, poll: the webhook updates the row server-side and the
  // applicant shouldn't have to leave and come back to see the result.
  useEffect(() => {
    if (record?.status !== 'PROCESSING') return;
    const t = setInterval(() => {
      void verificationApi.refresh(kind).then(setRecord).catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, [record?.status, kind]);

  async function start() {
    setBusy(true);
    try {
      const session = await verificationApi.startStripe(kind);
      if (!session.url) {
        toast.error('Verification is unavailable right now.');
        return;
      }

      // Stripe's hosted flow ends on our /verification-done page, which redirects to
      // `ucpt://` — openAuthSessionAsync watches for that scheme and closes the browser
      // by itself, so a standalone build returns to the app with no manual step.
      //
      // In Expo Go the scheme isn't ours to claim, so nothing intercepts and the user
      // closes the browser themselves. This resolves on dismissal too, so BOTH paths end
      // up on the same line below. Stripe is the source of truth either way — nothing is
      // inferred from how the browser was closed.
      await WebBrowser.openAuthSessionAsync(session.url, RETURN_SCHEME, {
        toolbarColor: tc.white,
        controlsColor: tc.maroon900,
        dismissButtonStyle: 'close',
      });
      setRecord(await verificationApi.refresh(kind));
    } catch (e) {
      toast.error('Could not start verification', friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  if (record === undefined) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="small" color={tc.ink300} />
        <Text style={s.loadingText}>Checking verification status…</Text>
      </View>
    );
  }

  const state = record && record.status !== 'PENDING' ? STATE[record.status] : undefined;
  const retryable =
    !record ||
    record.status === 'PENDING' ||
    record.status === 'FAILED' ||
    record.status === 'CANCELED';

  const toneColors = (tone: 'ok' | 'warn' | 'bad' | 'muted') =>
    tone === 'ok'
      ? { bg: tc.successBg, fg: tc.successFg }
      : tone === 'warn'
        ? { bg: tc.warnBg, fg: tc.warnFg }
        : tone === 'bad'
          ? { bg: tc.dangerBg, fg: tc.dangerFg }
          : { bg: tc.cream, fg: tc.ink600 };

  // ── Settled (verified / still processing): status only, no call to action ──
  if (!retryable && state) {
    const c = toneColors(state.tone);
    return (
      <View style={[s.banner, { backgroundColor: c.bg }]}>
        <Ionicons name={state.icon} size={19} color={c.fg} />
        <View style={{ flex: 1 }}>
          <Text style={[s.bannerTitle, { color: c.fg }]}>{state.title}</Text>
          <Text style={s.bannerBody}>{state.body}</Text>
        </View>
        {record?.status === 'PROCESSING' && (
          <Pressable
            onPress={() => void verificationApi.refresh(kind).then(setRecord).catch(() => {})}
            hitSlop={10}
            accessibilityLabel="Refresh status"
          >
            <Ionicons name="refresh" size={17} color={c.fg} />
          </Pressable>
        )}
      </View>
    );
  }

  // ── Not started, or worth another go ──
  return (
    <View>
      {state && (
        <View style={[s.banner, { backgroundColor: toneColors(state.tone).bg, marginBottom: spacing(3) }]}>
          <Ionicons name={state.icon} size={19} color={toneColors(state.tone).fg} />
          <View style={{ flex: 1 }}>
            <Text style={[s.bannerTitle, { color: toneColors(state.tone).fg }]}>{state.title}</Text>
            <Text style={s.bannerBody}>{record?.lastError || state.body}</Text>
          </View>
        </View>
      )}

      <View style={s.card}>
        <View style={s.head}>
          <View style={s.icon}>
            <Ionicons name="shield-checkmark-outline" size={19} color={tc.onBrand} />
          </View>
          <Text style={s.title}>Verify your identity</Text>
        </View>
        <Text style={s.body}>
          Confirm a government ID and take a selfie. This proves who you are — your
          enrolment is checked separately from the document you upload. Your ID is handled
          by Stripe and is never stored on our servers.
        </Text>
        <Pressable
          style={({ pressed }) => [s.btn, busy && s.btnOff, pressed && !busy && s.pressed]}
          onPress={start}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator size="small" color={tc.onBrand} />
          ) : (
            <>
              <Text style={s.btnText}>{record ? 'Try again' : 'Start verification'}</Text>
              <Ionicons name="open-outline" size={15} color={tc.onBrand} />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
    pressed: { opacity: 0.7 },

    loading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(2.5),
      borderWidth: 1,
      borderColor: tc.ink200,
      borderRadius: radius.lg,
      backgroundColor: tc.ivory,
      paddingHorizontal: spacing(4),
      paddingVertical: spacing(4),
    },
    loadingText: { fontSize: font(13), color: tc.ink500 },

    banner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing(3),
      borderRadius: radius.lg,
      padding: spacing(4),
    },
    bannerTitle: { fontSize: font(14), fontWeight: '800' },
    bannerBody: { fontSize: font(12.5), lineHeight: 18, color: tc.ink600, marginTop: 2 },

    card: {
      borderWidth: 1,
      borderColor: tc.ink200,
      borderRadius: radius.lg,
      backgroundColor: tc.ivory,
      padding: spacing(4),
    },
    head: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
    icon: {
      height: 38,
      width: 38,
      borderRadius: 19,
      backgroundColor: tc.maroon900,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: { flex: 1, fontSize: font(14.5), fontWeight: '800', color: tc.ink900 },
    body: { fontSize: font(12.5), lineHeight: 19, color: tc.ink500, marginTop: spacing(3) },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(2),
      height: 46,
      backgroundColor: tc.maroon900,
      borderRadius: radius.md,
      marginTop: spacing(4),
    },
    btnOff: { opacity: 0.6 },
    btnText: { fontSize: font(14.5), fontWeight: '800', color: tc.onBrand },
  });
