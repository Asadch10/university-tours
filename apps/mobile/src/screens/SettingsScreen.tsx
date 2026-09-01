import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { font, colors, radius, spacing } from '../theme';
import { accountApi, type MyProfileDto } from '../api/account';
import { session } from '../api/auth';
import { unregisterForPush } from '../api/push';
import { Skeleton } from '../components/Skeleton';
import { ProfileScreen } from './ProfileScreen';
import { MyToursScreen } from './MyToursScreen';
import { ContactInformationSection } from './settings/ContactInformationSection';
import { PasswordSection } from './settings/PasswordSection';
import { PayoutsSection } from './settings/PayoutsSection';
import { PaymentsSection } from './settings/PaymentsSection';
import { CollegeStatusSection } from './settings/CollegeStatusSection';
import { ManageAccountSection } from './settings/ManageAccountSection';
import { useStyles, useThemeColors } from '../theme-context';
import type { Palette } from '../theme';

type IoniconName = keyof typeof Ionicons.glyphMap;
type SectionKey = 'contact' | 'password' | 'payouts' | 'payments' | 'college' | 'manage';

/**
 * My bookings moved here when Manage listing took its bottom-tab slot, mirroring the
 * website's header. It is a whole screen, not a settings form, so it renders full-bleed
 * (like the profile card) instead of inside the section detail's ScrollView.
 */
const SECTIONS: { key: SectionKey; label: string; icon: IoniconName }[] = [
  { key: 'contact', label: 'Contact information', icon: 'mail-outline' },
  { key: 'password', label: 'Password', icon: 'lock-closed-outline' },
  { key: 'payouts', label: 'Payouts', icon: 'cash-outline' },
  { key: 'payments', label: 'Payments', icon: 'card-outline' },
  { key: 'college', label: 'College status', icon: 'school-outline' },
  { key: 'manage', label: 'Manage account', icon: 'shield-checkmark-outline' },
];

function initials(name: string) {
  return (
    name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

export function SettingsScreen() {
  const tc = useThemeColors();
  const styles = useStyles(makeStyles);
  const nav = useNavigation<any>();
  const [active, setActive] = useState<SectionKey | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [profile, setProfile] = useState<MyProfileDto | null>(null);
  const [loading, setLoading] = useState(true);

  function goAuth() {
    const root = nav.getParent() ?? nav;
    root.reset({ index: 0, routes: [{ name: 'Auth' }] });
  }

  useEffect(() => {
    accountApi
      .getMe()
      .then(setProfile)
      .catch(() => {
        /* keep menu usable; individual sections surface their own errors */
      })
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await unregisterForPush(); // stop this device receiving pushes for the account
    await session.clear();
    goAuth();
  }

  // ── My bookings (full screen, from the row below the profile card) ──
  if (showBookings) {
    return <MyToursScreen onBack={() => setShowBookings(false)} />;
  }

  // ── Full profile screen (from the profile card) ──
  if (showProfile) {
    return (
      <ProfileScreen
        onBack={() => setShowProfile(false)}
        onSaved={(name) => setProfile((p) => (p ? { ...p, name } : p))}
      />
    );
  }

  // ── Section detail view ──
  if (active) {
    const section = SECTIONS.find((s) => s.key === active)!;
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.detailHeader}>
          <Pressable onPress={() => setActive(null)} hitSlop={8} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={tc.ink900} />
          </Pressable>
          <Text style={styles.detailTitle}>{section.label}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.detailScroll} keyboardShouldPersistTaps="handled">
          {active === 'contact' && (
            <ContactInformationSection
              profile={profile}
              onUpdated={(patch) =>
                setProfile((p) =>
                  p
                    ? { ...p, profileJson: { ...((p.profileJson as Record<string, unknown>) ?? {}), ...patch } }
                    : p,
                )
              }
            />
          )}
          {active === 'password' && <PasswordSection />}
          {active === 'payouts' && <PayoutsSection />}
          {active === 'payments' && <PaymentsSection />}
          {active === 'college' && (
            <CollegeStatusSection
              profile={profile}
              onNavigate={(key) => {
                // Same destinations as the website's College status options.
                const root = nav.getParent() ?? nav;
                if (key === 'guest') nav.navigate('Browse');
                else root.navigate(key === 'guide' ? 'BecomeGuide' : 'BecomeCounselor');
              }}
              onSaved={({ role, intent }) =>
                setProfile((p) =>
                  p
                    ? {
                        ...p,
                        role,
                        profileJson: { ...((p.profileJson as Record<string, unknown>) ?? {}), intent },
                      }
                    : p,
                )
              }
            />
          )}
          {active === 'manage' && <ManageAccountSection onSignedOut={goAuth} />}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Menu view ──
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.menuScroll}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile card → opens the full profile screen */}
        <Pressable style={styles.profileCard} onPress={() => setShowProfile(true)}>
          <View style={styles.avatar}>
            {loading ? (
              <ActivityIndicator color={tc.white} />
            ) : (
              <Text style={styles.avatarText}>{initials(profile?.name ?? '')}</Text>
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: spacing(2) }}>
            {loading ? (
              <>
                <Skeleton w={140} h={14} />
                <Skeleton w={180} h={11} />
              </>
            ) : (
              <>
                <Text style={styles.profileName} numberOfLines={1}>
                  {profile?.name ?? 'Your account'}
                </Text>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {profile?.email ?? '—'}
                </Text>
              </>
            )}
          </View>
          {profile?.role && (
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>{profile.role === 'SELLER' ? 'Guide' : 'Guest'}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color={tc.ink300} />
        </Pressable>

        {/* My bookings — its own group, so it reads as a destination not a setting */}
        <View style={styles.menu}>
          <Pressable onPress={() => setShowBookings(true)} style={styles.menuRow}>
            <View style={styles.menuIcon}>
              <Ionicons name="calendar-outline" size={19} color={tc.maroon800} />
            </View>
            <Text style={styles.menuLabel}>My bookings</Text>
            <Ionicons name="chevron-forward" size={18} color={tc.ink300} />
          </Pressable>
        </View>

        {/* Section rows */}
        <View style={styles.menu}>
          {SECTIONS.map((s, i) => (
            <Pressable
              key={s.key}
              onPress={() => setActive(s.key)}
              style={[styles.menuRow, i > 0 && styles.menuRowBorder]}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={s.icon} size={19} color={tc.maroon800} />
              </View>
              <Text style={styles.menuLabel}>{s.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={tc.ink300} />
            </Pressable>
          ))}
        </View>

        {/* Log out */}
        <Pressable style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={tc.danger} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
  safe: { flex: 1, backgroundColor: tc.white },
  title: { fontSize: font(28), fontWeight: '800', color: tc.ink900 },
  menuScroll: { padding: spacing(5), paddingBottom: spacing(10) },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    backgroundColor: tc.white,
    borderWidth: 1,
    borderColor: tc.ink200,
    borderRadius: radius.lg,
    padding: spacing(4),
    marginTop: spacing(5),
  },
  avatar: {
    height: 52,
    width: 52,
    borderRadius: 26,
    backgroundColor: tc.maroon900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: tc.white, fontSize: font(18), fontWeight: '800' },
  profileName: { fontSize: font(16), fontWeight: '800', color: tc.ink900 },
  profileEmail: { fontSize: font(13), color: tc.ink500, marginTop: 2 },
  roleChip: { backgroundColor: tc.maroon50, borderRadius: radius.pill, paddingHorizontal: spacing(2.5), paddingVertical: 3 },
  roleChipText: { fontSize: font(12), fontWeight: '700', color: tc.maroon800 },

  menu: {
    backgroundColor: tc.white,
    borderWidth: 1,
    borderColor: tc.ink200,
    borderRadius: radius.lg,
    marginTop: spacing(5),
    overflow: 'hidden',
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), paddingHorizontal: spacing(4), paddingVertical: spacing(4) },
  menuRowBorder: { borderTopWidth: 1, borderTopColor: tc.ink100 },
  menuIcon: {
    height: 36,
    width: 36,
    borderRadius: radius.md,
    backgroundColor: tc.maroon50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: font(15), fontWeight: '600', color: tc.ink900 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    borderWidth: 1,
    borderColor: tc.danger + '44',
    borderRadius: radius.lg,
    paddingVertical: spacing(4),
    marginTop: spacing(6),
  },
  logoutText: { fontSize: font(15), fontWeight: '700', color: tc.danger },

  // Detail
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: tc.ink100,
  },
  backBtn: { height: 36, width: 36, alignItems: 'center', justifyContent: 'center' },
  detailTitle: { fontSize: font(20), fontWeight: '800', color: tc.ink900 },
  detailScroll: { padding: spacing(5), paddingBottom: spacing(12) },
});
