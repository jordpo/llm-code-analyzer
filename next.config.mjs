/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@/components', '@/lib', '@/utils'],
  },

  // Configure webpack for better TypeScript support
  webpack: (config, { isServer }) => {
    // Add any custom webpack configurations here
    return config;
  },

  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors. Set to false for strict type checking.
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Run ESLint on these directories during production builds
    dirs: ['src', 'app'],
    ignoreDuringBuilds: false,
  },

  // Output configuration
  output: 'standalone',
};

export default nextConfig;
