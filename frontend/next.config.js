/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    domains: ['tendermarketing.uz', 'augz.uz', 'localhost'],
    unoptimized: true,
  },
}
module.exports = nextConfig