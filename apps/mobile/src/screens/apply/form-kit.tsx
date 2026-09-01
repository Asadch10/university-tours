/**
 * Form primitives for Become a guide / Become a college counselor.
 *
 * These deliberately do NOT mirror the website's markup. The web form is a single tall
 * column of bare labels and inputs, which works on a desktop but reads as an endless wall
 * on a phone. Here the same fields are grouped into cards, choices become full-width
 * tappable rows with 56pt targets, the long option lists open as bottom sheets, and the
 * submit action is pinned above the home indicator instead of buried at the end of the
 * scroll. The DATA each control produces is identical — only the presentation is native.
 */
import { useState, type ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, radius, spacing, type Palette } from '../../theme';
import { useStyles, useThemeColors } from '../../theme-context';
import type { QuestionnaireQuestion } from '../../api/applications';

export type IoniconName = keyof typeof Ionicons.glyphMap;

/* ─── Layout ──────────────────────────────────────────────────────────────── */

/** A grouped white card. Related fields sit together so the form reads in chunks. */
export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const s = useStyles(makeForm);
  return <View style={[s.card, style]}>{children}</View>;
}

/** Small uppercase heading above a card, naming the group of fields below it. */
export function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  const s = useStyles(makeForm);
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {hint ? <Text style={s.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

/** Hairline between rows inside a card. */
export function Divider() {
  const s = useStyles(makeForm);
  return <View style={s.divider} />;
}

/* ─── Field wrapper ───────────────────────────────────────────────────────── */

export function Field({
  label,
  desc,
  required,
  error,
  children,
  first,
}: {
  label?: string;
  desc?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  /** Drops the top spacing for the first field in a card. */
  first?: boolean;
}) {
  const s = useStyles(makeForm);
  const tc = useThemeColors();
  return (
    <View style={first ? undefined : s.field}>
      {label ? (
        <Text style={s.fieldLabel}>
          {label}
          {required && <Text style={s.required}> *</Text>}
        </Text>
      ) : null}
      {desc ? <Text style={s.fieldDesc}>{desc}</Text> : null}
      <View style={label || desc ? { marginTop: spacing(2.5) } : undefined}>{children}</View>
      {error ? (
        <View style={s.errorRow}>
          <Ionicons name="alert-circle" size={13} color={tc.dangerFg} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

/* ─── Text input ──────────────────────────────────────────────────────────── */

export function Input({
  multiline,
  error,
  ...props
}: TextInputProps & { error?: boolean }) {
  const s = useStyles(makeForm);
  const tc = useThemeColors();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={tc.ink300}
      multiline={multiline}
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      style={[
        s.input,
        multiline && s.inputMultiline,
        focused && s.inputFocused,
        error && s.inputError,
        props.style,
      ]}
    />
  );
}

/* ─── Choice rows ─────────────────────────────────────────────────────────── */

/**
 * A full-width choice row: icon, title, optional subtitle, and a check on the right.
 * Replaces the web form's 16px checkboxes, which are well under the 44pt minimum
 * comfortable touch target on a phone.
 */
export function OptionRow({
  title,
  subtitle,
  icon,
  selected,
  onPress,
  /** 'check' for multi-select, 'radio' for single-select. */
  control = 'check',
}: {
  title: string;
  subtitle?: string;
  icon?: IoniconName;
  selected: boolean;
  onPress: () => void;
  control?: 'check' | 'radio';
}) {
  const s = useStyles(makeForm);
  const tc = useThemeColors();
  return (
    <Pressable
      style={({ pressed }) => [s.optionRow, selected && s.optionRowOn, pressed && s.pressed]}
      onPress={onPress}
      accessibilityRole={control === 'radio' ? 'radio' : 'checkbox'}
      accessibilityState={{ checked: selected }}
    >
      {icon ? (
        <View style={[s.optionIcon, selected && s.optionIconOn]}>
          <Ionicons name={icon} size={19} color={selected ? tc.onBrand : tc.maroon800} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[s.optionTitle, selected && s.optionTitleOn]}>{title}</Text>
        {subtitle ? <Text style={s.optionSubtitle}>{subtitle}</Text> : null}
      </View>
      <View
        style={[
          control === 'radio' ? s.radio : s.check,
          selected && (control === 'radio' ? s.radioOn : s.checkOn),
        ]}
      >
        {selected &&
          (control === 'radio' ? (
            <View style={s.radioDot} />
          ) : (
            <Ionicons name="checkmark" size={14} color={tc.onBrand} />
          ))}
      </View>
    </Pressable>
  );
}

/** Compact checkbox line, for multi-choice questionnaire answers. */
export function CheckRow({
  label,
  checked,
  onToggle,
  children,
}: {
  label?: string;
  checked: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  const s = useStyles(makeForm);
  const tc = useThemeColors();
  return (
    <Pressable
      style={({ pressed }) => [s.checkRow, pressed && s.pressed]}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View style={[s.check, checked && s.checkOn]}>
        {checked && <Ionicons name="checkmark" size={13} color={tc.onBrand} />}
      </View>
      {children ?? <Text style={s.checkLabel}>{label}</Text>}
    </Pressable>
  );
}

export function CheckboxList({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <View>
      {options.map((o) => (
        <CheckRow
          key={o}
          label={o}
          checked={value.includes(o)}
          onToggle={() =>
            onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o])
          }
        />
      ))}
    </View>
  );
}

/* ─── Select (bottom sheet) ───────────────────────────────────────────────── */

/**
 * Single-choice picker. A native `<select>` has no phone equivalent worth copying, and
 * the school list runs to a couple of hundred entries — so this opens a bottom sheet
 * with a search box, which is how a phone is expected to handle a long list.
 */
export function Select({
  value,
  options,
  placeholder = 'Select…',
  searchable,
  title,
  error,
  onChange,
}: {
  value: string;
  options: string[];
  placeholder?: string;
  searchable?: boolean;
  title?: string;
  error?: boolean;
  onChange: (v: string) => void;
}) {
  const s = useStyles(makeForm);
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const shown = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <>
      <Pressable
        style={({ pressed }) => [s.select, error && s.inputError, pressed && s.pressed]}
        onPress={() => setOpen(true)}
      >
        <Text style={[s.selectText, !value && s.selectPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={17} color={tc.ink300} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={s.sheetBackdrop} onPress={() => setOpen(false)} />
        <View style={[s.sheet, { paddingBottom: insets.bottom + spacing(4) }]}>
          <View style={s.sheetHandle} />
          {title ? <Text style={s.sheetTitle}>{title}</Text> : null}
          {searchable && (
            <View style={s.searchWrap}>
              <Ionicons name="search" size={16} color={tc.ink300} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search…"
                placeholderTextColor={tc.ink300}
                style={s.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={tc.ink300} />
                </Pressable>
              )}
            </View>
          )}
          <ScrollView keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }}>
            {shown.length === 0 && <Text style={s.sheetEmpty}>No matches</Text>}
            {shown.map((o) => (
              <Pressable
                key={o}
                style={({ pressed }) => [s.sheetRow, pressed && s.pressed]}
                onPress={() => {
                  onChange(o);
                  setQuery('');
                  setOpen(false);
                }}
              >
                <Text style={[s.sheetRowText, o === value && s.sheetRowTextOn]} numberOfLines={2}>
                  {o}
                </Text>
                {o === value && <Ionicons name="checkmark" size={19} color={tc.maroon800} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

/* ─── Admin-managed question ──────────────────────────────────────────────── */

/** Renders one questionnaire question by its type. */
export function QuestionInput({
  q,
  value,
  error,
  onChange,
}: {
  q: QuestionnaireQuestion;
  value: string | string[] | undefined;
  error?: boolean;
  onChange: (v: string | string[]) => void;
}) {
  if (q.type === 'LONG_TEXT') {
    return (
      <Input
        multiline
        error={error}
        value={(value as string) ?? ''}
        onChangeText={onChange}
        placeholder="Write your answer here…"
      />
    );
  }
  if (q.type === 'SINGLE_CHOICE') {
    return (
      <Select
        value={(value as string) ?? ''}
        options={q.options}
        title={q.label}
        error={error}
        // Anything longer than a short list gets a search box.
        searchable={q.options.length > 8}
        onChange={onChange}
      />
    );
  }
  if (q.type === 'MULTI_CHOICE') {
    return (
      <CheckboxList
        options={q.options}
        value={Array.isArray(value) ? value : []}
        onChange={onChange}
      />
    );
  }
  return (
    <Input
      error={error}
      value={(value as string) ?? ''}
      onChangeText={onChange}
      placeholder="Write your answer here…"
    />
  );
}

/* ─── Uploads ─────────────────────────────────────────────────────────────── */

/**
 * Wide upload row for a single document (the student ID).
 *
 * The web form uses a large square dashed box; on a phone that eats most of a viewport
 * for one field, so this is a normal-height row that swaps to a thumbnail + filename
 * once something is attached.
 */
export function UploadRow({
  uri,
  uploading,
  onPress,
  onRemove,
  title,
  hint,
  icon = 'card-outline',
  error,
}: {
  uri?: string | null;
  uploading?: boolean;
  onPress: () => void;
  onRemove?: () => void;
  title: string;
  hint: string;
  icon?: IoniconName;
  error?: boolean;
}) {
  const s = useStyles(makeForm);
  const tc = useThemeColors();

  if (uri && !uploading) {
    return (
      <View style={s.uploadDone}>
        <Image source={{ uri }} style={s.uploadThumb} contentFit="cover" transition={150} />
        <View style={{ flex: 1 }}>
          <View style={s.uploadDoneTitleRow}>
            <Ionicons name="checkmark-circle" size={15} color={tc.successFg} />
            <Text style={s.uploadDoneTitle}>Uploaded</Text>
          </View>
          <Text style={s.uploadDoneHint} numberOfLines={1}>
            Tap replace to choose a different photo
          </Text>
        </View>
        <View style={s.uploadActions}>
          <Pressable onPress={onPress} hitSlop={8} style={s.uploadAction}>
            <Ionicons name="swap-horizontal" size={17} color={tc.maroon800} />
          </Pressable>
          {onRemove && (
            <Pressable onPress={onRemove} hitSlop={8} style={s.uploadAction}>
              <Ionicons name="trash-outline" size={16} color={tc.dangerFg} />
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [s.uploadRow, error && s.inputError, pressed && s.pressed]}
      onPress={onPress}
      disabled={uploading}
    >
      <View style={s.uploadIcon}>
        {uploading ? (
          <ActivityIndicator size="small" color={tc.maroon800} />
        ) : (
          <Ionicons name={icon} size={20} color={tc.maroon800} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.uploadTitle}>{uploading ? 'Uploading…' : title}</Text>
        <Text style={s.uploadHint}>{hint}</Text>
      </View>
      {!uploading && <Ionicons name="chevron-forward" size={18} color={tc.ink300} />}
    </Pressable>
  );
}

/** Square photo tile for the gallery grid: an image with a remove badge, or an add tile. */
export function PhotoTile({
  uri,
  size,
  uploading,
  onPress,
  onRemove,
}: {
  uri?: string | null;
  size: number;
  uploading?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
}) {
  const s = useStyles(makeForm);
  const tc = useThemeColors();

  if (uri) {
    return (
      <View style={{ width: size, height: size }}>
        <Image source={{ uri }} style={s.photo} contentFit="cover" transition={150} />
        {onRemove && (
          <Pressable style={s.photoRemove} onPress={onRemove} hitSlop={8}>
            <Ionicons name="close" size={14} color={tc.onBrand} />
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [s.photoAdd, { width: size, height: size }, pressed && s.pressed]}
      onPress={onPress}
      disabled={uploading}
    >
      {uploading ? (
        <ActivityIndicator size="small" color={tc.maroon800} />
      ) : (
        <>
          <Ionicons name="add" size={22} color={tc.maroon800} />
          <Text style={s.photoAddText}>Add</Text>
        </>
      )}
    </Pressable>
  );
}

/* ─── Actions ─────────────────────────────────────────────────────────────── */

/**
 * Action bar pinned to the bottom of the screen, clear of the home indicator.
 *
 * On the web the submit button sits at the end of the page; on a phone that can be
 * thirty screens down, so the primary action stays permanently in reach instead.
 */
export function StickyFooter({ children }: { children: ReactNode }) {
  const s = useStyles(makeForm);
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, spacing(3)) }]}>{children}</View>
  );
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
  const s = useStyles(makeForm);
  const tc = useThemeColors();
  const off = disabled || loading;
  return (
    <Pressable
      style={({ pressed }) => [s.primaryBtn, off && s.btnDisabled, pressed && !off && s.btnPressed]}
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color={tc.onBrand} />
      ) : (
        <>
          <Text style={s.primaryBtnText}>{label}</Text>
          {icon && <Ionicons name={icon} size={17} color={tc.onBrand} />}
        </>
      )}
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const s = useStyles(makeForm);
  return (
    <Pressable
      style={({ pressed }) => [s.ghostBtn, pressed && s.pressed]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={s.ghostBtnText}>{label}</Text>
    </Pressable>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

export const makeForm = (tc: Palette) =>
  StyleSheet.create({
    pressed: { opacity: 0.65 },

    card: {
      backgroundColor: tc.white,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: tc.ink100,
      paddingHorizontal: spacing(4.5),
      paddingVertical: spacing(4.5),
    },
    sectionHeader: { marginTop: spacing(7), marginBottom: spacing(3), paddingHorizontal: spacing(1) },
    sectionTitle: {
      fontSize: font(11.5),
      fontWeight: '800',
      letterSpacing: 1.3,
      textTransform: 'uppercase',
      color: tc.ink500,
    },
    sectionHint: { fontSize: font(12.5), lineHeight: 18, color: tc.ink500, marginTop: spacing(1.5) },
    divider: { height: 1, backgroundColor: tc.ink100, marginVertical: spacing(4) },

    field: { marginTop: spacing(5) },
    fieldLabel: { fontSize: font(14.5), fontWeight: '700', color: tc.ink900 },
    required: { color: tc.dangerFg },
    fieldDesc: { fontSize: font(12.5), lineHeight: 18, color: tc.ink500, marginTop: spacing(1) },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5), marginTop: spacing(2) },
    errorText: { flex: 1, fontSize: font(12.5), fontWeight: '600', color: tc.dangerFg, lineHeight: 17 },

    input: {
      borderWidth: 1.5,
      borderColor: tc.ink200,
      backgroundColor: tc.ivory,
      borderRadius: radius.md,
      paddingHorizontal: spacing(4),
      paddingVertical: spacing(3.5),
      fontSize: font(15),
      color: tc.ink900,
      minHeight: 50,
    },
    inputMultiline: { minHeight: 104, paddingTop: spacing(3.5), textAlignVertical: 'top' },
    inputFocused: { borderColor: tc.maroon800, backgroundColor: tc.white },
    inputError: { borderColor: tc.danger },

    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(3),
      minHeight: 62,
      borderWidth: 1.5,
      borderColor: tc.ink200,
      backgroundColor: tc.ivory,
      borderRadius: radius.lg,
      paddingHorizontal: spacing(3.5),
      paddingVertical: spacing(3),
      marginBottom: spacing(2.5),
    },
    optionRowOn: { borderColor: tc.maroon800, backgroundColor: tc.maroon50 },
    optionIcon: {
      height: 40,
      width: 40,
      borderRadius: radius.md,
      backgroundColor: tc.maroon50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionIconOn: { backgroundColor: tc.maroon900 },
    optionTitle: { fontSize: font(14.5), fontWeight: '700', color: tc.ink900 },
    optionTitleOn: { color: tc.maroon800 },
    optionSubtitle: { fontSize: font(12), lineHeight: 17, color: tc.ink500, marginTop: 2 },

    checkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(3),
      minHeight: 44,
      paddingVertical: spacing(1.5),
    },
    checkLabel: { flex: 1, fontSize: font(14.5), color: tc.ink900, lineHeight: 20 },
    check: {
      height: 22,
      width: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: tc.ink300,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkOn: { backgroundColor: tc.maroon900, borderColor: tc.maroon900 },
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

    select: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(2),
      minHeight: 50,
      borderWidth: 1.5,
      borderColor: tc.ink200,
      backgroundColor: tc.ivory,
      borderRadius: radius.md,
      paddingHorizontal: spacing(4),
      paddingVertical: spacing(3),
    },
    selectText: { flex: 1, fontSize: font(15), color: tc.ink900 },
    selectPlaceholder: { color: tc.ink300 },

    sheetBackdrop: { flex: 1, backgroundColor: '#00000080' },
    sheet: {
      maxHeight: '78%',
      backgroundColor: tc.white,
      borderTopLeftRadius: radius.xl + 6,
      borderTopRightRadius: radius.xl + 6,
      paddingHorizontal: spacing(5),
      paddingTop: spacing(3),
    },
    sheetHandle: {
      alignSelf: 'center',
      height: 4,
      width: 42,
      borderRadius: 2,
      backgroundColor: tc.ink200,
      marginBottom: spacing(4),
    },
    sheetTitle: { fontSize: font(17), fontWeight: '800', color: tc.ink900, marginBottom: spacing(4) },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(2),
      backgroundColor: tc.ivory,
      borderRadius: radius.md,
      paddingHorizontal: spacing(3.5),
      height: 46,
      marginBottom: spacing(2),
    },
    searchInput: { flex: 1, fontSize: font(15), color: tc.ink900 },
    sheetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(3),
      minHeight: 52,
      paddingVertical: spacing(3),
      borderBottomWidth: 1,
      borderBottomColor: tc.ink100,
    },
    sheetRowText: { flex: 1, fontSize: font(15), color: tc.ink900 },
    sheetRowTextOn: { fontWeight: '800', color: tc.maroon800 },
    sheetEmpty: { fontSize: font(14), color: tc.ink500, paddingVertical: spacing(8), textAlign: 'center' },

    uploadRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(3.5),
      minHeight: 68,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: tc.ink200,
      backgroundColor: tc.ivory,
      borderRadius: radius.lg,
      paddingHorizontal: spacing(4),
      paddingVertical: spacing(3.5),
    },
    uploadIcon: {
      height: 42,
      width: 42,
      borderRadius: radius.md,
      backgroundColor: tc.maroon50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    uploadTitle: { fontSize: font(14.5), fontWeight: '700', color: tc.ink900 },
    uploadHint: { fontSize: font(12), lineHeight: 17, color: tc.ink500, marginTop: 2 },

    uploadDone: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(3.5),
      borderWidth: 1,
      borderColor: tc.ink200,
      backgroundColor: tc.ivory,
      borderRadius: radius.lg,
      padding: spacing(3),
    },
    uploadThumb: { height: 52, width: 52, borderRadius: radius.md },
    uploadDoneTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(1.5) },
    uploadDoneTitle: { fontSize: font(14), fontWeight: '700', color: tc.ink900 },
    uploadDoneHint: { fontSize: font(12), color: tc.ink500, marginTop: 2 },
    uploadActions: { flexDirection: 'row', gap: spacing(1) },
    uploadAction: {
      height: 38,
      width: 38,
      borderRadius: radius.md,
      backgroundColor: tc.white,
      borderWidth: 1,
      borderColor: tc.ink200,
      alignItems: 'center',
      justifyContent: 'center',
    },

    photo: { height: '100%', width: '100%', borderRadius: radius.lg },
    photoRemove: {
      position: 'absolute',
      top: 6,
      right: 6,
      height: 26,
      width: 26,
      borderRadius: 13,
      backgroundColor: '#000000a8',
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoAdd: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(1),
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: tc.ink200,
      backgroundColor: tc.ivory,
      borderRadius: radius.lg,
    },
    photoAddText: { fontSize: font(12), fontWeight: '700', color: tc.maroon800 },

    footer: {
      backgroundColor: tc.white,
      borderTopWidth: 1,
      borderTopColor: tc.ink100,
      paddingHorizontal: spacing(5),
      paddingTop: spacing(3),
      gap: spacing(1),
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(2),
      height: 52,
      backgroundColor: tc.maroon900,
      borderRadius: radius.lg,
    },
    primaryBtnText: { color: tc.onBrand, fontSize: font(15.5), fontWeight: '800' },
    btnPressed: { backgroundColor: tc.maroon800 },
    btnDisabled: { backgroundColor: tc.ink200 },
    ghostBtn: { alignItems: 'center', justifyContent: 'center', height: 44 },
    ghostBtnText: { fontSize: font(14), fontWeight: '700', color: tc.ink500 },
  });
