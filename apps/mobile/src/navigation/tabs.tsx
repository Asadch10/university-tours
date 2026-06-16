// Role-aware bottom tabs (Part V §6). Buyer: Discover/Bookings/Messages/Profile.
// Ambassador: Requests/Listings/Earnings/Messages/Profile.
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  DiscoverScreen,
  BookingsScreen,
  MessagesScreen,
  ProfileScreen,
  RequestsScreen,
  ListingsScreen,
  EarningsScreen,
} from '../screens';

const Tab = createBottomTabNavigator();

export function BuyerTabs() {
  return (
    <Tab.Navigator initialRouteName="Discover">
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AmbassadorTabs() {
  return (
    <Tab.Navigator initialRouteName="Requests">
      <Tab.Screen name="Requests" component={RequestsScreen} />
      <Tab.Screen name="Listings" component={ListingsScreen} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
