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
    ],
  },
  async headers() {
    return [
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
    return [
      {
        source: '/negocio/:slug*',
        destination: '/:slug*',
        permanent: true,
      },
      {
        source: '/feed',
        destination: '/deals',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    // Custom client landings (static HTML in public/{slug}/)
    return {
      beforeFiles: [
        { source: '/villachaco', destination: '/villachaco/index.html' },
        { source: '/villachaco/', destination: '/villachaco/index.html' },
      ],
    };
  },
  transpilePackages: ['@imgly/background-removal', 'onnxruntime-web'],
  webpack: (config, { isServer }) => {
    // Si estamos en el cliente, ignoramos onnxruntime-node
    if (!isServer) {
        config.resolve.alias = {
            ...config.resolve.alias,
            'onnxruntime-node': false,
        };
    } else {
        // En el servidor, ignoramos onnxruntime-web y sus sub-rutas (como webgpu)
        config.resolve.alias = {
            ...config.resolve.alias,
            'onnxruntime-web': false,
            'onnxruntime-web/webgpu': false,
        };
    }

    // Manejo de archivos .mjs para evitar errores de import.meta en algunos entornos
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    return config;
  },
}

const withPwa = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
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

module.exports = withPwa(nextConfig);
