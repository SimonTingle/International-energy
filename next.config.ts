import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: false,
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
