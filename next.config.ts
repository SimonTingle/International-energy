import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Prevent Next.js from bundling ws — webpack strips the native buffer
  // masking operations ws needs, causing "b.mask is not a function" at runtime.
  // Listed here so Next.js loads ws directly from node_modules at runtime.
  serverExternalPackages: ['ws'],

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.module.rules.push({
        test: /\.node$/,
        use: "node-loader",
      });
    }
    return config;
  },

  // Allow external images from common data-source domains
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.eia.gov" },
      { protocol: "https", hostname: "ourworldindata.org" },
    ],
  },
};

export default nextConfig;
