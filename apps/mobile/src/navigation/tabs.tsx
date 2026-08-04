// Role-aware bottom tabs (Part V §6).
// Buyer: Home / Browse / Guide / My Tours / Profile.
// Ambassador: Requests / Listings / Earnings / Messages / Profile.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import {
  HomeScreen,
  ExploreScreen,
  GuideScreen,
  MyToursScreen,
  SettingsScreen,
  MessagesScreen,
  RequestsScreen,
  ListingsScreen,
  EarningsScreen,
} from '../screens';
import { font, type Palette } from '../theme';
import { useThemeColors } from '../theme-context';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const Tab = createBottomTabNavigator();

/** Builds the tabBarIcon renderer for a pair of (outline, filled) Ionicons. */
function tabIcon(outline: IoniconName, filled: IoniconName) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? filled : outline} size={size} color={color} />
  );
}

const makeScreenOptions = (tc: Palette) => ({
  headerShown: false,
  // NOTE: the bottom-tab `animation` option (e.g. 'shift'/'fade') is intentionally
  // NOT set — in RN Navigation 7 it can leave a tab screen rendering blank/white
  // until you switch away and back. Tabs swap instantly (standard iOS behaviour);
  // smooth slide animations still apply to stack pushes (see RootNavigator).
  tabBarActiveTintColor: tc.maroon900,
  tabBarInactiveTintColor: tc.ink500,
  tabBarStyle: { borderTopColor: tc.ink200, backgroundColor: tc.white },
  tabBarLabelStyle: { fontSize: font(11), fontWeight: '600' as const },
});

export function BuyerTabs() {
  return (
    <Tab.Navigator initialRouteName="Home" screenOptions={makeScreenOptions(useThemeColors())}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: tabIcon('home-outline', 'home') }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ tabBarIcon: tabIcon('compass-outline', 'compass') }}
      />
      <Tab.Screen
        name="Guide"
        component={GuideScreen}
        options={{ tabBarIcon: tabIcon('school-outline', 'school') }}
      />
      <Tab.Screen
        name="My Tours"
        component={MyToursScreen}
        options={{ tabBarIcon: tabIcon('calendar-outline', 'calendar') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: tabIcon('settings-outline', 'settings') }}
      />
    </Tab.Navigator>
  );
}

export function AmbassadorTabs() {
  return (
    <Tab.Navigator initialRouteName="Requests" screenOptions={makeScreenOptions(useThemeColors())}>
      <Tab.Screen
        name="Requests"
        component={RequestsScreen}
        options={{ tabBarIcon: tabIcon('albums-outline', 'albums') }}
      />
      <Tab.Screen
        name="Listings"
        component={ListingsScreen}
        options={{ tabBarIcon: tabIcon('list-outline', 'list') }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ tabBarIcon: tabIcon('wallet-outline', 'wallet') }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ tabBarIcon: tabIcon('chatbubble-outline', 'chatbubble') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: tabIcon('settings-outline', 'settings') }}
      />
    </Tab.Navigator>
  );
}
