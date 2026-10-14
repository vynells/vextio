import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives inside another repo; keep tracing and linting scoped to this folder.
  outputFileTracingRoot: path.join(__dirname),
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
