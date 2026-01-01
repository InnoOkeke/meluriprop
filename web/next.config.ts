import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true,

  // Set an empty turbopack config to silence the error and maintain webpack compatibility
  // as suggested by the Next.js build error message.
  turbopack: {
    resolveAlias: {
      'thread-stream': 'false',
      'tap': 'false',
      'tape': 'false',
      'why-is-node-running': 'false',
      'pino': 'pino/dist/browser.js',
    }
  },

  // These packages should be transpiled to handle potential ESM/CJS mismatches
  transpilePackages: [
    "@meluriprop/api",
    "@meluriprop/contracts",
    "framer-motion",
    "lucide-react"
  ],

  serverExternalPackages: [
    'pino',
    'thread-stream',
    '@reown/appkit',
    '@reown/appkit-utils',
    '@reown/appkit-controllers',
    '@walletconnect/universal-provider',
    '@walletconnect/ethereum-provider',
    '@walletconnect/logger',
    '@privy-io/react-auth',
    'viem'
  ],

  webpack: (config, { isServer, webpack }) => {
    // Provide fallbacks for Node.js modules that might be required by dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      os: false,
      path: false,
      stream: false,
      dns: false,
      child_process: false,
      worker_threads: false,
    };

    // Alias problematic modules to empty objects or browser-compatible versions
    config.resolve.alias = {
      ...config.resolve.alias,
      'thread-stream': false,
      'tap': false,
      'tape': false,
      'why-is-node-running': false,
      'pino': 'pino/dist/browser.js',
    };

    // Completely ignore test-related files in node_modules to prevent them from being bundled
    config.plugins.push(
      new webpack.IgnorePlugin({
        checkResource(resource: string) {
          // Ignore anything that looks like a test or is one of the problematic modules
          return (
            resource.includes('/test/') ||
            resource.endsWith('.test.js') ||
            resource.endsWith('.test.mjs') ||
            /^(tap|tape|why-is-node-running)$/.test(resource)
          );
        }
      })
    );

    return config;
  },
};

export default nextConfig;
