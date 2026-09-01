/**
 * The status pill in the home header, and the sheet behind it.
 *
 * Shows how the account is currently using the marketplace — Guest, Guide or Counselor —
 * The pill renders ON the maroon home header, so it is a translucent white chip rather
 * than a brand-coloured one; the sheet below it is a normal surface and uses the usual
 * maroon accents.
 *
 * It lets the status be changed on the spot. It is the same choice as onboarding and as
 * Settings → College status: the same three options, the same `intent` value persisted,
 * and the same hand-off afterwards (a guest goes to Browse; a guide or counselor goes
 * into their application). Putting it in the header just means a guest who decides to
 * start earning doesn't have to go hunting through Settings to say so.
 */
import { useCallback, useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, radius, spacing, type Palette } from '../theme';
import { useStyles, useThemeColors } from '../theme-context';
import { useToast } from './Toast';
import { accountApi } from '../api/account';
import { friendlyError, session } from '../api/auth';
import { INTENT_OPTIONS, intentApi, intentOptionFor, type IntentKey } from '../api/intent';

const ICON: Record<IntentKey, keyof typeof Ionicons.glyphMap> = {
  guide: 'school-outline',
  counselor: 'compass-outline',
  guest: 'search-outline',
};

export function StatusSwitcher() {
  const s = useStyles(makeStyles);
  const tc = useThemeColors();
  const toast = useToast();
  const nav = useNavigation<any>();

  const [current, setCurrent] = useState<IntentKey | null>(null);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<IntentKey>('guest');
  const [saving, setSaving] = useState(false);

  // Re-read on focus: the same status can be changed from Settings → College status, and
  // the pill must not sit there showing a stale value.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      accountApi
        .getMe()
        .then((me) => {
          if (cancelled) return;
          const p = (me.profileJson ?? {}) as Record<string, unknown>;
          setCurrent(intentOptionFor(p.intent, me.role).key);
        })
        .catch(() => {
          /* leave the pill in its loading state rather than showing a wrong status */
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  function openSheet() {
    setPicked(current ?? 'guest');
    setOpen(true);
  }

  async function save() {
    // Choosing what you already are is just a dismissal — don't spend a request on it.
    if (picked === current) {
      setOpen(false);
      return;
    }
    setSaving(true);
    try {
      const res = await intentApi.save(picked);
      if (res.role) await session.setUser({ role: res.role });
      setCurrent(picked);
      setOpen(false);
      toast.success('Status updated', INTENT_OPTIONS.find((o) => o.key === picked)!.statusText);

      // Same destinations as onboarding and Settings → College status.
      if (picked === 'guest') nav.navigate('Browse');
      else {
        const root = nav.getParent() ?? nav;
        root.navigate(picked === 'guide' ? 'BecomeGuide' : 'BecomeCounselor');
      }
    } catch (e) {
      toast.error('Could not update status', friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  const option = current ? INTENT_OPTIONS.find((o) => o.key === current) : undefined;

  return (
    <>
      <Pressable
        style={({ pressed }) => [s.pill, pressed && s.pressed]}
        onPress={openSheet}
        disabled={!current}
        accessibilityRole="button"
        accessibilityLabel={
          option ? `Status: ${option.shortLabel}. Tap to change.` : 'Loading status'
        }
      >
        {option ? (
          <>
            <Ionicons name={ICON[option.key]} size={14} color={tc.onBrand} />
            <Text style={s.pillText} numberOfLines={1}>
              {option.shortLabel}
            </Text>
            <Ionicons name="chevron-down" size={13} color={tc.onBrand} style={s.pillChevron} />
          </>
        ) : (
          <ActivityIndicator size="small" color={tc.onBrand} />
        )}
      </Pressable>

      <StatusSheet
        visible={open}
        picked={picked}
        saving={saving}
        onPick={setPicked}
        onClose={() => !saving && setOpen(false)}
        onSave={save}
      />
    </>
  );
}

function StatusSheet({
  visible,
  picked,
  saving,
  onPick,
  onClose,
  onSave,
}: {
  visible: boolean;
  picked: IntentKey;
  saving: boolean;
  onPick: (k: IntentKey) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const s = useStyles(makeStyles);
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, spacing(4)) }]}>
        <View style={s.handle} />
        <Text style={s.sheetTitle}>I want to…</Text>
        <Text style={s.sheetSub}>
          You can change this at any time, here or in Settings.
        </Text>

        <View style={{ gap: spacing(2.5), marginTop: spacing(5) }}>
          {INTENT_OPTIONS.map((o) => {
            const on = picked === o.key;
            return (
              <Pressable
                key={o.key}
                style={({ pressed }) => [s.option, on && s.optionOn, pressed && s.pressed]}
                onPress={() => onPick(o.key)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
              >
                <View style={[s.optionIcon, on && s.optionIconOn]}>
                  <Ionicons name={ICON[o.key]} size={19} color={on ? tc.onBrand : tc.maroon800} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.optionLabel, on && s.optionLabelOn]}>{o.label}</Text>
                  <Text style={s.optionDesc}>{o.description}</Text>
                </View>
                <View style={[s.radio, on && s.radioOn]}>{on && <View style={s.radioDot} />}</View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={({ pressed }) => [s.saveBtn, saving && s.saveBtnOff, pressed && !saving && s.pressed]}
          onPress={onSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={tc.onBrand} />
          ) : (
            <Text style={s.saveBtnText}>Continue</Text>
          )}
        </Pressable>
      </View>
    </Modal>
  );
}

const makeStyles = (tc: Palette) =>
  StyleSheet.create({
    pressed: { opacity: 0.7 },

    // The pill sits ON the maroon header, so it can't be a maroon fill — it would
    // disappear. A translucent white lifts it off the bar and stays correct in both
    // themes for free: it tints whatever maroon is behind it (#6b1521 light,
    // #a32741 dark) rather than hard-coding a colour of its own.
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(1.5),
      minHeight: 34,
      maxWidth: 170,
      backgroundColor: '#ffffff26',
      borderWidth: 1,
      borderColor: '#ffffff40',
      borderRadius: radius.pill,
      paddingLeft: spacing(3.5),
      paddingRight: spacing(2.5),
      paddingVertical: spacing(1.5),
    },
    pillText: { flexShrink: 1, fontSize: font(13), fontWeight: '800', color: tc.onBrand },
    // The chevron is a hint, not a label — softened so it doesn't compete with the status.
    pillChevron: { opacity: 0.75 },

    backdrop: { flex: 1, backgroundColor: '#00000080' },
    sheet: {
      backgroundColor: tc.white,
      borderTopLeftRadius: radius.xl + 6,
      borderTopRightRadius: radius.xl + 6,
      paddingHorizontal: spacing(5),
      paddingTop: spacing(3),
    },
    handle: {
      alignSelf: 'center',
      height: 4,
      width: 42,
      borderRadius: 2,
      backgroundColor: tc.ink200,
      marginBottom: spacing(5),
    },
    sheetTitle: { fontSize: font(20), fontWeight: '800', color: tc.ink900 },
    sheetSub: { fontSize: font(13), lineHeight: 19, color: tc.ink500, marginTop: spacing(1.5) },

    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(3),
      minHeight: 68,
      borderWidth: 1.5,
      borderColor: tc.ink200,
      backgroundColor: tc.ivory,
      borderRadius: radius.lg,
      paddingHorizontal: spacing(3.5),
      paddingVertical: spacing(3),
    },
    optionOn: { borderColor: tc.maroon800, backgroundColor: tc.maroon50 },
    optionIcon: {
      height: 40,
      width: 40,
      borderRadius: radius.md,
      backgroundColor: tc.maroon50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionIconOn: { backgroundColor: tc.maroon900 },
    optionLabel: { fontSize: font(14.5), fontWeight: '700', color: tc.ink900 },
    optionLabelOn: { color: tc.maroon800 },
    optionDesc: { fontSize: font(12), lineHeight: 17, color: tc.ink500, marginTop: 2 },
    radio: {
      height: 22,
      width: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: tc.ink300,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOn: { borderColor: tc.maroon800 },
    radioDot: { height: 11, width: 11, borderRadius: 6, backgroundColor: tc.maroon800 },

    saveBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 52,
      backgroundColor: tc.maroon900,
      borderRadius: radius.lg,
      marginTop: spacing(6),
    },
    saveBtnOff: { opacity: 0.6 },
    saveBtnText: { fontSize: font(15.5), fontWeight: '800', color: tc.onBrand },
  });
