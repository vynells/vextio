import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.trybloom.ai",
      },
    ],
  },
};

export default nextConfig;
