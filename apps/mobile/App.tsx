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
import { ThemeProvider, useTheme } from './src/theme-context';

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

/** Scene background for screens that don't set their own — follows the active theme. */
function useNavTheme(): Theme {
  const { colors } = useTheme();
  return { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.ivory } };
}

// Deep links: the email-verification link can open the app directly, e.g.
//   ucpt://verify-email?token=…   →  VerifyEmail screen (with route.params.token)
// The https prefix is here for a future universal-link setup on the web domain.
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['ucpt://', 'https://www.university.tours'],
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
        <ThemeProvider>
          <ToastProvider>
            <Themed />
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

/** Inside ThemeProvider so the nav container and status bar can read the active theme. */
function Themed() {
  const { theme } = useTheme();
  const navTheme = useNavTheme();
  return (
    <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking}>
      <RootNavigator />
      {/* Light glyphs on the dark canvas, dark glyphs on the light one. */}
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}
