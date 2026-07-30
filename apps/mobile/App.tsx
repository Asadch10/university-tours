import { NavigationContainer, DefaultTheme, type Theme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ToastProvider } from './src/components/Toast';
import { colors } from './src/theme';

const queryClient = new QueryClient();

// White canvas for every scene (covers screens that don't set their own background).
const navTheme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.white },
};

export default function App() {
  // On launch, real app fetches /app-config and enforces force-update / maintenance (Part V §9).
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <NavigationContainer theme={navTheme}>
            <RootNavigator />
            <StatusBar style="auto" />
          </NavigationContainer>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
