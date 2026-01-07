/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress warnings for optional wallet connector dependencies
  webpack: (config, { isServer }) => {
    // Resolve path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };

    if (!isServer) {
      // These are optional peer dependencies from @wagmi/connectors
      // They're only needed if you use those specific connectors
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@react-native-async-storage/async-storage': false,
        '@base-org/account': false,
        '@gemini-wallet/core': false,
        'porto': false,
        'porto/internal': false,
      };
    }

    // Ignore build warnings for missing optional dependencies
    config.ignoreWarnings = [
      { module: /@wagmi\/connectors/ },
      { module: /@metamask\/sdk/ },
      /Can't resolve '@react-native-async-storage\/async-storage'/,
      /Can't resolve '@base-org\/account'/,
      /Can't resolve '@gemini-wallet\/core'/,
      /Can't resolve 'porto'/,
    ];

    return config;
  },

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },

  // Configure image domains if needed
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;

