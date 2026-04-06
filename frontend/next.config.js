const path = require('path');
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    domains: ['tendermarketing.uz', 'localhost'],
    unoptimized: true,
  },

  experimental: {
    serverActions: {
      allowedOrigins: ['tendermarketing.uz', 'localhost:3000'],
    },
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://tendermarketing.uz/api/:path*',
      },
    ];
  },

  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};

module.exports = nextConfig;