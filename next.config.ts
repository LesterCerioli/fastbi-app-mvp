import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true,
  },
  images: {
    domains: ['images.unsplash.com'],
  },
  serverExternalPackages: ['oracledb'],
}

export default nextConfig