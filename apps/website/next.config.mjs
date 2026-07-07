/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages are shipped as TS source; let Next transpile them.
  transpilePackages: ['@ucpt/sdk', '@ucpt/types', '@ucpt/validation'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      // School photos uploaded via the admin console are served by the local backend.
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
};

export default nextConfig;
