// Root navigation: branded splash → auth (sign in / sign up) → main app tabs.
// The web and mobile flows mirror each other.
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { VerifyEmailScreen } from '../screens/VerifyEmailScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { BecomeGuideScreen } from '../screens/guide/BecomeGuideScreen';
import { BecomeCounselorScreen } from '../screens/counselor/BecomeCounselorScreen';
import { BuyerTabs, type BuyerTabParamList } from './tabs';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  // token is populated when opened via a deep link (ucpt://verify-email?token=…).
  VerifyEmail: { token?: string } | undefined;
  Onboarding: { token?: string } | undefined;
  // The two applications live on the ROOT stack, not inside the tabs: they're a
  // focused task with their own back button, and onboarding pushes straight into
  // one of them before the tab bar has ever been shown.
  BecomeGuide: undefined;
  // `edit: true` opens the form on an already-submitted profile, instead of the
  // status screen — the mobile stand-in for the website's edit modal.
  BecomeCounselor: { edit?: boolean } | undefined;
  Main: NavigatorScreenParams<BuyerTabParamList> | undefined;
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
      <Stack.Screen name="BecomeGuide" component={BecomeGuideScreen} />
      <Stack.Screen name="BecomeCounselor" component={BecomeCounselorScreen} />
      <Stack.Screen name="Main" component={BuyerTabs} />
    </Stack.Navigator>
  );
}
