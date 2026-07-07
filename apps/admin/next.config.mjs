/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Served under /admin on the shared domain (behind the reverse proxy).
  // basePath makes every route + asset live under /admin automatically.
  basePath: '/admin',
  transpilePackages: ['@ucpt/sdk', '@ucpt/types', '@ucpt/validation'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
};

export default nextConfig;
