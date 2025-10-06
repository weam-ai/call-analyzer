/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '/call-analyzer',
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || '/call-analyzer',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/call-analyzer-api',
    NEXT_PUBLIC_COOKIE_NAME: process.env.NEXT_PUBLIC_COOKIE_NAME || 'weam',
    NEXT_PUBLIC_COOKIE_PASSWORD: process.env.NEXT_PUBLIC_COOKIE_PASSWORD || 'YczgOhDJQj0RRDR3ASnvOVoQUBV0PtSz',
  },
}

module.exports = nextConfig
