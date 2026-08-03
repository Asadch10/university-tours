import { useEffect } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  createNavigationContainerRef,
  type Theme,
  type LinkingOptions,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { RootNavigator, type RootStackParamList } from './src/navigation/RootNavigator';
import { ToastProvider } from './src/components/Toast';
import { registerForPush } from './src/api/push';
import { session } from './src/api/auth';
import { colors } from './src/theme';

// Container ref so a tapped notification can navigate from outside React tree.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Route a tapped notification to the right place based on its `data.type`.
function routeFromNotification(data: unknown) {
  if (!navigationRef.isReady() || !data || typeof data !== 'object') return;
  const type = (data as { type?: string }).type;
  if (type === 'booking') {
    navigationRef.navigate('Main', { screen: 'My Tours' } as never);
  } else {
    navigationRef.navigate('Main' as never);
  }
}

const queryClient = new QueryClient();

// White canvas for every scene (covers screens that don't set their own background).
const navTheme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.white },
};

// Deep links: the email-verification link can open the app directly, e.g.
//   ucpt://verify-email?token=…   →  VerifyEmail screen (with route.params.token)
// The https prefix is here for a future universal-link setup on the web domain.
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['ucpt://', 'https://phpstack-1510285-6494046.cloudwaysapps.com'],
  config: {
    screens: {
      VerifyEmail: 'verify-email',
      Onboarding: 'onboarding',
    },
  },
};

export default function App() {
  useEffect(() => {
    // Re-register the push token if a session already exists (app reopened).
    session.isSignedIn().then((yes) => {
      if (yes) void registerForPush();
    });

    // Handle taps while the app is running (foreground or background).
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      routeFromNotification(resp.notification.request.content.data);
    });
    // Handle a cold start where the app was opened by tapping a notification.
    Notifications.getLastNotificationResponseAsync().then((resp) => {
      if (resp) setTimeout(() => routeFromNotification(resp.notification.request.content.data), 500);
    });

    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking}>
            <RootNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
