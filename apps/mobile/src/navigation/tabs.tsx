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
import { font, colors } from '../theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const Tab = createBottomTabNavigator();

/** Builds the tabBarIcon renderer for a pair of (outline, filled) Ionicons. */
function tabIcon(outline: IoniconName, filled: IoniconName) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? filled : outline} size={size} color={color} />
  );
}

const screenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.maroon900,
  tabBarInactiveTintColor: colors.ink500,
  tabBarStyle: { borderTopColor: colors.ink200, backgroundColor: colors.white },
  tabBarLabelStyle: { fontSize: font(11), fontWeight: '600' as const },
};

export function BuyerTabs() {
  return (
    <Tab.Navigator initialRouteName="Home" screenOptions={screenOptions}>
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
    <Tab.Navigator initialRouteName="Requests" screenOptions={screenOptions}>
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
