import {
  NavigationContainer,
  DefaultTheme,
  type Theme,
  type LinkingOptions,
} from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator, type RootStackParamList } from './src/navigation/RootNavigator';
import { ToastProvider } from './src/components/Toast';
import { colors } from './src/theme';

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
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <NavigationContainer theme={navTheme} linking={linking}>
            <RootNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
