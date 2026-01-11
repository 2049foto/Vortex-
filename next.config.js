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

  // Skip page collection during build if needed
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],

  // Configure allowed image domains (token logos)
  images: {
    remotePatterns: [
      // CoinGecko (token logos)
      { protocol: 'https', hostname: 'assets.coingecko.com', pathname: '/coins/images/**' },
      // Trust Wallet assets
      { protocol: 'https', hostname: 'raw.githubusercontent.com', pathname: '/trustwallet/assets/**' },
      // Moralis token logos
      { protocol: 'https', hostname: 'logo.moralis.io', pathname: '/**' },
      // 1inch token logos
      { protocol: 'https', hostname: 'tokens.1inch.io', pathname: '/**' },
      // Token lists
      { protocol: 'https', hostname: 'tokens.coingecko.com', pathname: '/**' },
      // Local development
      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Content Security Policy for token logo images
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + inline for Next.js + wallet connect
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://client.warpcast.com",
              // Styles: self + inline for CSS-in-JS
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com https://fonts.reown.com",
              // Images: trusted sources only
              "img-src 'self' data: blob: https://assets.coingecko.com https://raw.githubusercontent.com https://logo.moralis.io https://tokens.1inch.io https://tokens.coingecko.com",
              // Connect: APIs
              "connect-src 'self' https://*.moralis.io https://*.alchemy.com https://*.helius.xyz https://api.coingecko.com https://api.dexscreener.com https://api.gopluslabs.io https://api.honeypot.is https://api.relay.link https://api.1inch.dev https://*.walletconnect.com wss://*.walletconnect.com https://pulse.walletconnect.org",
              // Frames
              "frame-src 'self' https://challenges.cloudflare.com https://verify.walletconnect.com",
              // Frame ancestors for Farcaster
              "frame-ancestors 'self' https://warpcast.com https://*.farcaster.xyz",
            ].join('; '),
          },
          // Prevent XSS
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Referrer policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions policy
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

