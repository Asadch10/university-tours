import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { font, colors, radius, spacing } from '../theme';
import { accountApi, type SellerReview } from '../api/account';
import { friendlyError } from '../api/auth';
import { useToast } from '../components/Toast';
import { Skeleton } from '../components/Skeleton';
import { Field, SInput, PrimaryButton, kit } from './settings/kit';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U'
  );
}

/** Mobile profile — mirrors the website /profile page (identity, bio, reviews). */
export function ProfileScreen({ onBack, onSaved }: { onBack: () => void; onSaved?: (name: string) => void }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  // Everything else in profileJson is preserved verbatim on save.
  const extraRef = useRef<Record<string, unknown>>({});
  // Baseline so "Save changes" only shows once something actually differs.
  const [initial, setInitial] = useState({ firstName: '', lastName: '', bio: '' });

  useEffect(() => {
    let active = true;
    accountApi
      .getMe()
      .then((me) => {
        if (!active) return null;
        const p = (me.profileJson ?? {}) as Record<string, unknown>;
        extraRef.current = p;
        const parts = (me.name ?? '').trim().split(/\s+/).filter(Boolean);
        const fn = parts[0] ?? '';
        const ln = parts.slice(1).join(' ');
        const b = typeof p.bio === 'string' ? p.bio : '';
        setFirstName(fn);
        setLastName(ln);
        setEmail(me.email ?? '');
        setBio(b);
        if (typeof p.photo === 'string' && /^https?:\/\//.test(p.photo)) setPhoto(p.photo);
        setInitial({ firstName: fn, lastName: ln, bio: b });
        return accountApi.reviews(me.id).catch(() => null);
      })
      .then((res) => {
        if (active && res) setReviews(res.data);
      })
      .catch((e) => {
        if (active) toast.error('Could not load profile', friendlyError(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fullName = `${firstName} ${lastName}`.trim();
  const dirty = firstName !== initial.firstName || lastName !== initial.lastName || bio !== initial.bio;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  async function save() {
    setSaving(true);
    const name = fullName;
    const profileJson: Record<string, unknown> = { ...extraRef.current, name, bio };
    try {
      const me = await accountApi.updateMe({ name, profileJson });
      extraRef.current = (me.profileJson ?? profileJson) as Record<string, unknown>;
      setInitial({ firstName, lastName, bio });
      onSaved?.(me.name);
      toast.success('Profile saved', 'Your changes have been updated.');
    } catch (e) {
      toast.error('Could not save profile', friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink900} />
        </Pressable>
        <Text style={styles.headerTitle}>My profile</Text>
      </View>

      {loading ? (
        <View style={styles.scroll}>
          {/* Hero */}
          <View style={{ alignItems: 'center', paddingVertical: spacing(3), gap: spacing(3) }}>
            <Skeleton w={88} h={88} r={44} />
            <Skeleton w={170} h={20} />
            <Skeleton w={210} h={12} />
          </View>
          <Skeleton w={170} h={16} style={{ marginTop: spacing(7) }} />
          <View style={{ flexDirection: 'row', gap: spacing(3), marginTop: spacing(4) }}>
            <Skeleton w="47%" h={46} r={12} />
            <Skeleton w="47%" h={46} r={12} />
          </View>
          <Skeleton w="100%" h={46} r={12} style={{ marginTop: spacing(5) }} />
          <Skeleton w="100%" h={110} r={12} style={{ marginTop: spacing(5) }} />
          <Skeleton w={140} h={16} style={{ marginTop: spacing(9) }} />
          <View style={{ gap: spacing(3), marginTop: spacing(4) }}>
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} w="100%" h={92} r={16} />
            ))}
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <View style={styles.hero}>
              <View style={styles.avatar}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarText}>{initialsOf(fullName)}</Text>
                )}
              </View>
              <Text style={styles.name}>{fullName || 'Your name'}</Text>
              {!!email && (
                <View style={styles.emailRow}>
                  <Ionicons name="mail-outline" size={14} color={colors.ink500} />
                  <Text style={styles.email}>{email}</Text>
                </View>
              )}
              {reviews.length > 0 && (
                <View style={styles.ratingPill}>
                  <Ionicons name="star" size={14} color={colors.gold500} />
                  <Text style={styles.ratingValue}>{avg.toFixed(1)}</Text>
                  <Text style={styles.ratingCount}>
                    · {reviews.length} review{reviews.length === 1 ? '' : 's'}
                  </Text>
                </View>
              )}
            </View>

            {/* Personal information */}
            <Text style={styles.sectionTitle}>Personal information</Text>
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Field label="First name">
                  <SInput value={firstName} onChangeText={setFirstName} placeholder="Asad" autoCapitalize="words" />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Last name">
                  <SInput value={lastName} onChangeText={setLastName} placeholder="Naeem" autoCapitalize="words" />
                </Field>
              </View>
            </View>
            <Field label="Email">
              <SInput value={email} editable={false} style={kit.inputDisabled} />
              <Text style={kit.hint}>Your email is used to sign in and can’t be changed here.</Text>
            </Field>

            {/* About you */}
            <Field label="About you">
              <SInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us a little bit about yourself…"
                multiline
                style={styles.textarea}
              />
            </Field>

            {dirty && (
              <View style={{ marginTop: spacing(6) }}>
                <PrimaryButton
                  label={saving ? 'Saving…' : 'Save changes'}
                  onPress={save}
                  loading={saving}
                  icon="checkmark"
                />
              </View>
            )}

            {/* Reviews */}
            <Text style={[styles.sectionTitle, { marginTop: spacing(9) }]}>Reviews ({reviews.length})</Text>
            {reviews.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No reviews yet.</Text>
              </View>
            ) : (
              <View style={{ gap: spacing(3), marginTop: spacing(3) }}>
                {reviews.map((r) => (
                  <View key={r.id} style={styles.reviewCard}>
                    <View style={styles.reviewHead}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>{initialsOf(r.buyer?.name ?? 'Guest')}</Text>
                      </View>
                      <Text style={styles.reviewName}>{r.buyer?.name ?? 'Guest'}</Text>
                      <View style={styles.stars}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Ionicons key={n} name={r.rating >= n ? 'star' : 'star-outline'} size={13} color={colors.gold500} />
                        ))}
                      </View>
                    </View>
                    {!!r.text && <Text style={styles.reviewText}>“{r.text}”</Text>}
                    <Text style={styles.reviewDate}>{fmtDate(r.createdAt)}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.ink100,
  },
  backBtn: { height: 36, width: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: font(20), fontWeight: '800', color: colors.ink900 },
  scroll: { padding: spacing(5), paddingBottom: spacing(12) },

  // Hero
  hero: { alignItems: 'center', paddingVertical: spacing(3) },
  avatar: {
    height: 88,
    width: 88,
    borderRadius: 44,
    backgroundColor: colors.maroon900,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { height: 88, width: 88 },
  avatarText: { color: colors.white, fontSize: font(30), fontWeight: '800' },
  name: { fontSize: font(22), fontWeight: '800', color: colors.ink900, marginTop: spacing(3.5) },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), marginTop: spacing(1.5) },
  email: { fontSize: font(14), color: colors.ink500 },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    marginTop: spacing(3),
    backgroundColor: colors.cream,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  ratingValue: { fontSize: font(14), fontWeight: '800', color: colors.ink900 },
  ratingCount: { fontSize: font(13), color: colors.ink500 },

  // Sections
  sectionTitle: { fontSize: font(17), fontWeight: '800', color: colors.ink900, marginTop: spacing(7) },
  nameRow: { flexDirection: 'row', gap: spacing(3) },
  textarea: { minHeight: 110, paddingTop: spacing(3), textAlignVertical: 'top' },

  // Reviews
  emptyCard: {
    marginTop: spacing(3),
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.ink200,
    borderRadius: radius.lg,
    paddingVertical: spacing(8),
    alignItems: 'center',
  },
  emptyText: { fontSize: font(14), color: colors.ink500 },
  reviewCard: {
    borderWidth: 1,
    borderColor: colors.ink200,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing(4),
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: spacing(2.5) },
  reviewAvatar: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: colors.maroon50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: { fontSize: font(12), fontWeight: '800', color: colors.maroon800 },
  reviewName: { flex: 1, fontSize: font(14), fontWeight: '700', color: colors.ink900 },
  stars: { flexDirection: 'row', gap: 1 },
  reviewText: { fontSize: font(14), color: colors.ink600, lineHeight: 21, fontStyle: 'italic', marginTop: spacing(3) },
  reviewDate: { fontSize: font(12), color: colors.ink500, marginTop: spacing(3) },
});
