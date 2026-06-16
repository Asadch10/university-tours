// Typed API SDK shared by the public website, admin panel, and mobile app so the
// contract matches everywhere (Part V §2). Thin fetch wrapper over /api/v1.
import type {
  ApiError,
  AppConfigDto,
  AuthTokens,
  CurrentUser,
  EarningsSummary,
} from '@ucpt/types';

export interface SdkOptions {
  baseUrl: string;
  /** Returns the current access token (from cookie/SecureStore), if any. */
  getAccessToken?: () => string | null | undefined | Promise<string | null | undefined>;
  /** Custom fetch (e.g. for React Native or SSR). Defaults to global fetch. */
  fetch?: typeof fetch;
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public payload: ApiError,
  ) {
    super(payload.error);
    this.name = 'ApiClientError';
  }
}

export function createClient(opts: SdkOptions) {
  const doFetch = opts.fetch ?? globalThis.fetch;
  const base = opts.baseUrl.replace(/\/$/, '');

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    init?: RequestInit,
  ): Promise<T> {
    const token = (await opts.getAccessToken?.()) ?? undefined;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((init?.headers as Record<string, string>) ?? {}),
    };
    const res = await doFetch(`${base}/api/v1${path}`, {
      ...init,
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : undefined;
    if (!res.ok) {
      throw new ApiClientError(res.status, json as ApiError);
    }
    return json as T;
  }

  return {
    request,
    auth: {
      register: (b: { email: string; password: string; role: 'BUYER' | 'SELLER' }) =>
        request<AuthTokens>('POST', '/auth/register', b),
      login: (b: { email: string; password: string }) =>
        request<AuthTokens>('POST', '/auth/login', b),
      refresh: (b: { refreshToken: string }) => request<AuthTokens>('POST', '/auth/refresh', b),
      logout: () => request<void>('POST', '/auth/logout'),
      me: () => request<CurrentUser>('GET', '/auth/me'),
    },
    schools: {
      list: () => request('GET', '/schools'),
      autocomplete: (q: string) =>
        request('GET', `/schools/autocomplete?q=${encodeURIComponent(q)}`),
      detail: (slug: string) => request('GET', `/schools/${slug}`),
    },
    search: {
      guides: (params: Record<string, string>) =>
        request('GET', `/search/guides?${new URLSearchParams(params).toString()}`),
    },
    bookings: {
      create: (b: unknown) => request('POST', '/bookings', b),
      list: () => request('GET', '/bookings'),
      detail: (id: string) => request('GET', `/bookings/${id}`),
      accept: (id: string) => request('POST', `/bookings/${id}/accept`),
      decline: (id: string) => request('POST', `/bookings/${id}/decline`),
      cancel: (id: string) => request('POST', `/bookings/${id}/cancel`),
    },
    sellers: {
      earnings: () => request<EarningsSummary>('GET', '/sellers/me/earnings'),
      payouts: () => request('GET', '/sellers/me/payouts'),
    },
    config: {
      app: () => request<AppConfigDto>('GET', '/app-config'),
    },
  };
}

export type ApiSdk = ReturnType<typeof createClient>;
export type { AppConfigDto, AuthTokens, CurrentUser, EarningsSummary } from '@ucpt/types';
