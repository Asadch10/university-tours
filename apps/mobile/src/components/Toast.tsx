import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { font, colors, radius, spacing } from '../theme';

// Approximate bottom tab-bar height (content only; the safe-area inset is added on top).
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 49 : 56;

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastApi {
  show: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const META: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { icon: 'checkmark-circle', color: '#188a4e' },
  error: { icon: 'alert-circle', color: colors.danger },
  info: { icon: 'information-circle', color: colors.maroon800 },
};

/** App-wide lightweight toast — a small card that slides in from the top and auto-dismisses. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const hide = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [anim]);

  const show = useCallback(
    (type: ToastType, title: string, message?: string) => {
      if (timer.current) clearTimeout(timer.current);
      idRef.current += 1;
      setToast({ id: idRef.current, type, title, message });
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      timer.current = setTimeout(hide, 2800);
    },
    [anim, hide],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (t, m) => show('success', t, m),
      error: (t, m) => show('error', t, m),
      info: (t, m) => show('info', t, m),
    }),
    [show],
  );

  const meta = toast ? META[toast.type] : null;

  return (
    <ToastContext.Provider value={api}>
      <View style={{ flex: 1 }}>
        {children}
        {toast && meta && (
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.wrap,
              {
                // Sit just above the bottom tab bar.
                bottom: insets.bottom + TAB_BAR_HEIGHT + spacing(2),
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
              },
            ]}
          >
            <Pressable style={styles.toast} onPress={hide}>
              <Ionicons name={meta.icon} size={22} color={meta.color} />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{toast.title}</Text>
                {!!toast.message && <Text style={styles.message}>{toast.message}</Text>}
              </View>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing(4), right: spacing(4) },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink200,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3.5),
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  title: { fontSize: font(14), fontWeight: '800', color: colors.ink900 },
  message: { fontSize: font(12), color: colors.ink600, marginTop: 2, lineHeight: 17 },
});
