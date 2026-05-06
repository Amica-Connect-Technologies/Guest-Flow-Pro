import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "srv1630621.hstgr.cloud",
      },
    ],
  },
};

export default nextConfig;
