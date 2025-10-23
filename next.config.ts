import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Fix for pdf-parse in serverless environment
      config.externals = config.externals || [];
      config.externals.push({
        'canvas': 'canvas',
        'utf-8-validate': 'utf-8-validate',
        'bufferutil': 'bufferutil',
      });

      // Handle pdf-parse native dependencies
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          fs: false,
          path: false,
          crypto: false,
        },
      };
    }
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Allow larger file uploads for PDFs
    },
  },
};

export default nextConfig;
