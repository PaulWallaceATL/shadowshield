/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Ignore problematic dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      'aws-sdk': false,
      'mock-aws-s3': false,
      'nock': false,
    };

    if (!isServer) {
      // Client-side polyfills for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/'),
        buffer: require.resolve('buffer/'),
        fs: false,
        net: false,
        tls: false,
        path: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        url: false,
        os: false,
      };
    }

    return config;
  },
  
  // Add redirect from root to admin dashboard
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin',
        permanent: false,
      },
    ];
  },
  
  poweredByHeader: false,
};

module.exports = nextConfig; 