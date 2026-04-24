import type { NextConfig } from "next";

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || "http://localhost:5001";
console.log('INTERNAL_API_URL:', INTERNAL_API_URL);

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${INTERNAL_API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
