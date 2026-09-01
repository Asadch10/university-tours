// Role-aware bottom tabs (Part V §6).
// Buyer: Home / Explore / Browse / Manage listing / Settings.
// Ambassador: Requests / Listings / Earnings / Messages / Profile.
//
// "Manage listing" sits where "My Tours" used to, matching the website header, where
// Manage listing became its own top-level item and My tours was renamed My bookings and
// folded into Settings. Bookings are still one tap away — Settings → My bookings.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import {
  HomeScreen,
  ExploreScreen,
  BrowseScreen,
  ManageListingScreen,
  SettingsScreen,
  MessagesScreen,
  RequestsScreen,
  ListingsScreen,
  EarningsScreen,
} from '../screens';
import { font, type Palette } from '../theme';
import { useThemeColors } from '../theme-context';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Buyer tab routes. `tab` opens Manage listing straight on one of its two profiles. */
export type BuyerTabParamList = {
  Home: undefined;
  Explore: undefined;
  Browse: undefined;
  'Manage listing': { tab?: 'guide' | 'counselor' } | undefined;
  Settings: undefined;
};

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
        name="Browse"
        component={BrowseScreen}
        options={{ tabBarIcon: tabIcon('search-outline', 'search') }}
      />
      <Tab.Screen
        name="Manage listing"
        component={ManageListingScreen}
        options={{ tabBarIcon: tabIcon('briefcase-outline', 'briefcase') }}
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
