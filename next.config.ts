import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Needed for GitHub Pages
  output: 'export',
  images: { unoptimized: true },
  basePath: '/HokmWeb', // ❗ Change this if your repo is NOT username.github.io

  // Keep your existing settings
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: ['**/*'],
      };
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};
export const output = 'export';
export default nextConfig;
