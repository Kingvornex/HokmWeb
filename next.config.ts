import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Needed for GitHub Pages static export
  output: 'export',
  images: { unoptimized: true },
  basePath: '/HokmWeb', // Change to your repo name

  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: ['**/*'], // disables watch on all files in dev (optional)
      };
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
