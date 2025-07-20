/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://quickshare-backend:8000/:path*',
        },
      ];
    },
  }
  module.exports = nextConfig
  