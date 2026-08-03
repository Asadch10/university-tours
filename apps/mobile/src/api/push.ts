// Expo push notifications for the mobile app.
//
// Flow: after login we ask for permission, get this device's Expo push token,
// store it locally, and register it with the backend (POST /devices). The token
// is re-registered on every app open (idempotent upsert) so it stays tied to the
// current user and refreshes if Expo rotates it. On logout we unregister it.
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { api } from './client';
import { session } from './auth';

// Expo Go (SDK 53+) dropped remote push support — a dev/standalone build is
// required. Detecting it lets us skip cleanly instead of throwing a scary error.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const PUSH_TOKEN_KEY = 'expoPushToken';

// Show a banner + play a sound even when a notification arrives with the app open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const devicesApi = {
  register: (pushToken: string, platform: 'IOS' | 'ANDROID') =>
    api.request<{ ok: true }>('POST', '/devices', { pushToken, platform }),
  unregister: (pushToken: string) => api.request<{ ok: true }>('DELETE', '/devices', { pushToken }),
};

// Expo needs a project id to mint a push token. Prefer the EAS project id from
// app config; falls back to the legacy easConfig slot. Undefined in a plain repo
// with no EAS project — registration then no-ops gracefully (see below).
function getProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

/** Ask for notification permission (needed for both remote and local). */
async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Make sure the Android channel exists (no-op on iOS). MAX importance so
 *  notifications show as a heads-up banner + sound (matches the reference app). */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#cf9526', // brand gold
    });
  }
}

/**
 * Raise a LOCAL notification on this device (fires immediately). Local
 * notifications DO work in Expo Go, unlike remote push — so this is how you can
 * see a notification render while testing without a development build.
 */
export async function presentLocalNotification(
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  try {
    if (!(await ensurePermission())) return;
    await ensureAndroidChannel();
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default', ...(data ? { data } : {}) },
      trigger: null, // fire now
    });
  } catch (err) {
    console.warn('[push] local notification failed:', (err as Error)?.message);
  }
}

/**
 * Request permission, obtain the Expo push token, and register it with the
 * backend. Idempotent and defensive — never throws, and no-ops on a simulator,
 * when permission is denied, or when no EAS project id is configured.
 */
export async function registerForPush(): Promise<void> {
  try {
    if (isExpoGo) {
      // Remote push isn't available in Expo Go. Show a LOCAL notification instead
      // so notifications are visible during testing. Real server-triggered push
      // (booking/approval/broadcast, incl. background) works in a dev build.
      await presentLocalNotification(
        'Notifications are on 🎉',
        'This is a local test in Expo Go. Booking & broadcast push arrive once you install a dev build.',
        { type: 'test' },
      );
      return;
    }
    if (!Device.isDevice) return; // push tokens aren't issued on simulators
    if (!(await session.isSignedIn())) return;

    await ensureAndroidChannel();
    if (!(await ensurePermission())) return; // user declined

    const projectId = getProjectId();
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    if (!token) return;

    const platform: 'IOS' | 'ANDROID' = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
    await devicesApi.register(token, platform); // cheap upsert — always (re)tie to current user
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
  } catch (err) {
    // Push must never crash the app — most commonly a missing EAS projectId in dev.
    console.warn('[push] registration skipped:', (err as Error)?.message);
  }
}

/** Remove this device's token from the backend + local store (called on logout). */
export async function unregisterForPush(): Promise<void> {
  try {
    const stored = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (!stored) return;
    await devicesApi.unregister(stored).catch(() => undefined);
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  } catch {
    // ignore
  }
}
