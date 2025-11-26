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
      '@coinbase/wallet-sdk': false,
      '@metamask/sdk': false,
      '@walletconnect/ethereum-provider': false,
    };
    return config;
  },
};

export default nextConfig;

