/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages are shipped as TS source; let Next transpile them.
  transpilePackages: ['@ucpt/sdk', '@ucpt/types', '@ucpt/validation'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
