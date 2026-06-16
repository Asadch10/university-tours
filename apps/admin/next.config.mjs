/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ucpt/sdk', '@ucpt/types', '@ucpt/validation'],
};

export default nextConfig;
