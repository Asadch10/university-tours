// Root navigation: branded splash → auth (sign in / sign up) → main app tabs.
// The web and mobile flows mirror each other.
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { VerifyEmailScreen } from '../screens/VerifyEmailScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { BuyerTabs } from './tabs';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  // token is populated when opened via a deep link (ucpt://verify-email?token=…).
  VerifyEmail: { token?: string } | undefined;
  Onboarding: { token?: string } | undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        // Smooth native slide on push/pop, with swipe-back enabled.
        animation: 'slide_from_right',
        animationDuration: 320,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Main" component={BuyerTabs} />
    </Stack.Navigator>
  );
}
