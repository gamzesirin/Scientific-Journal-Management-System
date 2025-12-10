import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Disable type checking during build - will be handled by IDE
    ignoreBuildErrors: true,
  },
  turbopack: {
    // Empty config to use Turbopack (default in Next.js 16)
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Allow larger file uploads for PDFs
    },
  },
};

export default nextConfig;
