// Shared API SDK for mobile. Bearer token is read from SecureStore (Part V §2, §11).
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { createClient } from '@ucpt/sdk';

const baseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'http://localhost:4000';

export const api = createClient({
  baseUrl,
  getAccessToken: () => SecureStore.getItemAsync('accessToken'),
});
