import type { NextConfig } from "next";

import { join } from "path";

const nextConfig: NextConfig = {
  turbopack: { root: join(__dirname, "..") },

  cacheComponents: true,
  partialPrefetching: true,

  async redirects() {
    return [];
  },
};

export default nextConfig;
