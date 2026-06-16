// Shared SDK instance for the website. Server components fetch SEO data with this.
import { createClient } from '@ucpt/sdk';

export const api = createClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000',
});
