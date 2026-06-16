// Root navigation: auth stack vs. role-aware main tabs. A user holding both roles can
// switch context, re-rooting navigation to the matching tab set (Part V §6).
import { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BuyerTabs, AmbassadorTabs } from './tabs';
import { LoginScreen } from '../screens';

type Mode = 'buyer' | 'ambassador';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  // Scaffold session state; replace with real auth + SecureStore-backed session.
  const [isAuthed] = useState(true);
  const [mode] = useState<Mode>('buyer');

  if (!isAuthed) {
    return (
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign in' }} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {mode === 'buyer' ? (
        <Stack.Screen name="BuyerHome" component={BuyerTabs} />
      ) : (
        <Stack.Screen name="AmbassadorHome" component={AmbassadorTabs} />
      )}
    </Stack.Navigator>
  );
}
