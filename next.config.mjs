/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    // Ignore optional peer dependencies that cause build issues
    config.resolve.alias = {
      ...config.resolve.alias,
      '@gemini-wallet/core': false,
      '@solana/kit': false,
      'axios': false,
      '@metamask/sdk': false,
      '@walletconnect/ethereum-provider': false,
      '@base-org/account': false,
    };
    return config;
  },
  transpilePackages: ['@coinbase/onchainkit'],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://warpcast.com https://*.warpcast.com https://farcaster.xyz https://*.farcaster.xyz;",
          },
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

