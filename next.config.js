/** @type {import('next').NextConfig} */
const publicadisOrigin = (process.env.NEXT_PUBLIC_PUBLICADIS_URL || 'https://publicadis.com').replace(/\/$/, '');
const villachacoOnBuscadis = process.env.VILLACHACO_SERVE_ON_BUSCADIS === 'true';

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
    const redirects = [
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

    if (!villachacoOnBuscadis) {
      redirects.push(
        {
          source: '/villachaco',
          destination: `${publicadisOrigin}/p/villachaco`,
          permanent: true,
        },
        {
          source: '/villachaco/',
          destination: `${publicadisOrigin}/p/villachaco`,
          permanent: true,
        }
      );
    }

    return redirects;
  },
  async rewrites() {
    const atProfileRewrites = {
      beforeFiles: [
        { source: '/@:slug', destination: '/negocio/:slug' },
      ],
    };

    if (villachacoOnBuscadis) {
      return {
        beforeFiles: [
          ...atProfileRewrites.beforeFiles,
          { source: '/villachaco', destination: '/villachaco/index.html' },
          { source: '/villachaco/', destination: '/villachaco/index.html' },
        ],
      };
    }
    return atProfileRewrites;
  },
  transpilePackages: ['@buscadis/profile-engine', '@imgly/background-removal', 'onnxruntime-web'],
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
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'supabase-catalog-images',
          expiration: {
            maxEntries: 500,
            maxAgeSeconds: 7 * 24 * 60 * 60,
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
