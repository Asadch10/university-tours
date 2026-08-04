// Shared building blocks for the mobile Settings sections (mirrors the web's shared.ts + Button).
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { font, radius, spacing, type Palette } from '../../theme';
import { useStyles, useThemeColors } from '../../theme-context';

export type IoniconName = keyof typeof Ionicons.glyphMap;

// Chip colours now live on the palette so they follow the theme.
export const GREEN_BG = '#e4f3ec';
export const GREEN_FG = '#137a4d';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const kit = useKit();
  const tc = useThemeColors();
  return (
    <View style={{ marginTop: spacing(5) }}>
      <Text style={kit.label}>{label}</Text>
      {children}
    </View>
  );
}

export function SInput(props: TextInputProps & { style?: TextInputProps['style'] }) {
  const kit = useKit();
  const tc = useThemeColors();
  return <TextInput placeholderTextColor={tc.ink300} {...props} style={[kit.input, props.style]} />;
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: IoniconName;
}) {
  const kit = useKit();
  const tc = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[kit.primaryBtn, (disabled || loading) && kit.btnDisabled]}
    >
      {loading ? (
        <ActivityIndicator color={tc.white} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={16} color={tc.white} />}
          <Text style={kit.primaryBtnText}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function OutlineButton({
  label,
  onPress,
  loading,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: IoniconName;
}) {
  const kit = useKit();
  const tc = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[kit.outlineBtn, (disabled || loading) && kit.btnDisabled]}
    >
      {loading ? (
        <ActivityIndicator color={tc.maroon900} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={16} color={tc.maroon900} />}
          <Text style={kit.outlineBtnText}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Loading() {
  const tc = useThemeColors();
  return (
    <View style={{ paddingVertical: spacing(24), alignItems: 'center' }}>
      <ActivityIndicator color={tc.maroon800} size="large" />
    </View>
  );
}

export const makeKit = (tc: Palette) =>
  StyleSheet.create({
  label: { fontSize: font(13), fontWeight: '700', color: tc.ink900, marginBottom: spacing(2) },
  input: {
    borderWidth: 1,
    borderColor: tc.ink200,
    backgroundColor: tc.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3.5),
    fontSize: font(15),
    color: tc.ink900,
  },
  inputDisabled: { backgroundColor: tc.ink100, color: tc.ink500 },
  hint: { fontSize: font(12), color: tc.ink500, marginTop: spacing(2) },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    backgroundColor: tc.maroon900,
    borderRadius: radius.lg,
    paddingVertical: spacing(4),
  },
  primaryBtnText: { color: tc.white, fontSize: font(15), fontWeight: '700' },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    borderWidth: 1,
    borderColor: tc.ink200,
    backgroundColor: tc.white,
    borderRadius: radius.lg,
    paddingVertical: spacing(3.5),
  },
  outlineBtnText: { color: tc.maroon900, fontSize: font(15), fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), marginTop: spacing(2.5) },
  verifiedText: { fontSize: font(14), fontWeight: '600', color: tc.maroon800 },
});

/** Themed settings stylesheet. Screens call this instead of importing a static sheet. */
export function useKit() {
  return useStyles(makeKit);
}
