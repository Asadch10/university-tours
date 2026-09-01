// Barrel for screens — each root-tab screen lives in its own file.
// Buyer tabs: Home / Explore / Browse / Manage listing / Settings.
// Browse holds BOTH marketplaces behind a segmented switch, so adding
// counselors didn't cost a sixth bottom tab.
export { HomeScreen } from './HomeScreen';
export { ExploreScreen } from './ExploreScreen';
export { BrowseScreen } from './BrowseScreen';
export { ManageListingScreen } from './ManageListingScreen';
export { SettingsScreen } from './SettingsScreen';
// No longer a tab — Settings hosts it as "My bookings".
export { MyToursScreen } from './MyToursScreen';

// The two applications, pushed from onboarding and from Manage listing.
export { BecomeGuideScreen } from './guide/BecomeGuideScreen';
export { BecomeCounselorScreen } from './counselor/BecomeCounselorScreen';

// Ambassador tabs: Requests / Listings / Earnings / Messages / Settings.
export { RequestsScreen } from './RequestsScreen';
export { ListingsScreen } from './ListingsScreen';
export { EarningsScreen } from './EarningsScreen';
export { MessagesScreen } from './MessagesScreen';
