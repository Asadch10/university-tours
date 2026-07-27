// Self-contained API client for the mobile app.
//
// This app is intentionally standalone — it does NOT depend on the monorepo's
// shared packages (@ucpt/sdk, @ucpt/types, @ucpt/validation) so it can be lifted
// into its own repository as-is. The thin fetch wrapper below mirrors the shared
// SDK's contract (a `request` over `<baseUrl>/api/v1`), the Bearer token is read
// from SecureStore, and the base URL is resolved for both simulator and device.
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const DEV_API_PORT = 4000;

/** Error payload shape the backend returns on failures. */
export interface ApiError {
  error: string;
  code?: string;
}

/** Thrown for any non-2xx API response, carrying the HTTP status + payload. */
export class ApiClientError extends Error {
  constructor(
    public status: number,
    public payload: ApiError,
  ) {
    super(payload?.error ?? 'Request failed');
    this.name = 'ApiClientError';
  }
}

/**
 * Resolve the backend base URL.
 *
 * On a physical device (Expo Go), `localhost` points at the phone, not the Mac
 * running the backend — so a hard-coded `http://localhost:4000` fails with
 * "Can't reach the server" even though it works in the simulator. In dev we
 * instead reuse the LAN IP Expo is already serving Metro from (e.g.
 * `192.168.18.43:8081`) and swap in the API port, so the same code works on
 * both the simulator and a real device with no manual config. A non-localhost
 * URL (e.g. a deployed API) is always used verbatim.
 */
function resolveBaseUrl(): string {
  const explicit =
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined);
  const configured = explicit?.trim();

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { debuggerHost?: string }).debuggerHost;
  const lanHost = hostUri?.split(':')[0];

  if (configured) {
    if (lanHost && /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(configured)) {
      return configured.replace(/\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, `//${lanHost}:${DEV_API_PORT}`);
    }
    return configured;
  }

  return lanHost ? `http://${lanHost}:${DEV_API_PORT}` : `http://localhost:${DEV_API_PORT}`;
}

export const API_BASE_URL = resolveBaseUrl();

const base = API_BASE_URL.replace(/\/$/, '');

async function request<T>(method: string, path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const token = (await SecureStore.getItemAsync('accessToken')) ?? undefined;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  const res = await fetch(`${base}/api/v1${path}`, {
    ...init,
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    throw new ApiClientError(res.status, (json as ApiError) ?? { error: 'Request failed' });
  }
  return json as T;
}

/** Shared client used by every module in this folder. */
export const api = { request };
