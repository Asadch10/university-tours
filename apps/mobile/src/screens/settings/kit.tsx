// Shared building blocks for the mobile Settings sections (mirrors the web's shared.ts + Button).
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';

export type IoniconName = keyof typeof Ionicons.glyphMap;

export const GREEN_BG = '#e4f3ec';
export const GREEN_FG = '#137a4d';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing(5) }}>
      <Text style={kit.label}>{label}</Text>
      {children}
    </View>
  );
}

export function SInput(props: TextInputProps & { style?: TextInputProps['style'] }) {
  return <TextInput placeholderTextColor={colors.ink300} {...props} style={[kit.input, props.style]} />;
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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[kit.primaryBtn, (disabled || loading) && kit.btnDisabled]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={16} color={colors.white} />}
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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[kit.outlineBtn, (disabled || loading) && kit.btnDisabled]}
    >
      {loading ? (
        <ActivityIndicator color={colors.maroon900} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={16} color={colors.maroon900} />}
          <Text style={kit.outlineBtnText}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Loading() {
  return (
    <View style={{ paddingVertical: spacing(24), alignItems: 'center' }}>
      <ActivityIndicator color={colors.maroon800} size="large" />
    </View>
  );
}

export const kit = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', color: colors.ink900, marginBottom: spacing(2) },
  input: {
    borderWidth: 1,
    borderColor: colors.ink200,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3.5),
    fontSize: 15,
    color: colors.ink900,
  },
  inputDisabled: { backgroundColor: colors.ink100, color: colors.ink500 },
  hint: { fontSize: 12, color: colors.ink500, marginTop: spacing(2) },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    backgroundColor: colors.maroon900,
    borderRadius: radius.lg,
    paddingVertical: spacing(4),
  },
  primaryBtnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    borderWidth: 1,
    borderColor: colors.ink200,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingVertical: spacing(3.5),
  },
  outlineBtnText: { color: colors.maroon900, fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), marginTop: spacing(2.5) },
  verifiedText: { fontSize: 14, fontWeight: '600', color: colors.maroon800 },
});
