import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Required for Railway.app: binds to $PORT env variable
  // Railway sets PORT automatically; Next.js reads it when starting.
  // Start command: npm start  (which runs: next start -p ${PORT:-3000})

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
