/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },
  serverExternalPackages: ['@sentry/node', '@sentry/nextjs', 'canvas', 'sharp', 'jsdom'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/canvas/build/Release/*'],
  },
  async headers() {
    return [
      {
        source: '/og/categories/:file.png',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Content-Type', value: 'image/png' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, X-Mobile-Ingest-Secret',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400',
          },
        ],
      },
    ];
  },
  async redirects() {
    const playStoreUrl =
      process.env.PLAY_STORE_ANDROID_URL ||
      'https://play.google.com/store/apps/details?id=com.adisplatforms.buscadis';

    const redirects = [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'app.buscadis.com' }],
        destination: playStoreUrl,
        permanent: false,
      },
      {
        source: '/app',
        destination: playStoreUrl,
        permanent: false,
      },
      {
        source: '/negocio/:slug',
        destination: '/@:slug',
        permanent: true,
      },
      {
        source: '/feed',
        destination: '/deals',
        permanent: true,
      },
    ];

    return redirects;
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/@:slug', destination: '/negocio/:slug' },
      ],
    };
  },
  transpilePackages: [
    '@buscadis/profile-engine',
    '@buscadis/storefront-kit',
    '@buscadis/ui',
    '@buscadis/tokens',
    '@imgly/background-removal',
    'onnxruntime-web',
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': false,
      };
    } else {
      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-web': false,
        'onnxruntime-web/webgpu': false,
      };
    }

    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /onnxruntime-web/ },
      { module: /@apm-js-collab\/tracing-hooks/ },
      { module: /@sentry\/server-utils/ },
      /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
    ];

    return config;
  },
};

const withPwa = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
    runtimeCaching: [
      {
        urlPattern: ({ url }) =>
          /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\//i.test(url.href),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-catalog-images',
          networkTimeoutSeconds: 8,
          expiration: {
            maxEntries: 500,
            maxAgeSeconds: 24 * 60 * 60,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
});

const baseConfig = withPwa(nextConfig);
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const sentryUpload = Boolean(process.env.SENTRY_AUTH_TOKEN);

if (!sentryDsn) {
  module.exports = baseConfig;
} else {
  const { withSentryConfig } = require('@sentry/nextjs');
  module.exports = withSentryConfig(baseConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: true,
    telemetry: false,
    webpack: {
      treeshake: {
        removeDebugLogging: true,
      },
      ...(sentryUpload
        ? {}
        : {
            automaticVercelMonitors: false,
          }),
    },
    ...(sentryUpload
      ? { widenClientFileUpload: true }
      : {
          sourcemaps: { disable: true },
          release: { create: false, finalize: false },
          disableServerWebpackPlugin: true,
          disableClientWebpackPlugin: true,
        }),
  });
}
