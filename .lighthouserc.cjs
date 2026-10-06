const baseUrl = process.env.LHCI_BASE_URL || 'http://127.0.0.1:3000';

module.exports = {
  ci: {
    collect: {
      url: [
        `${baseUrl}/`,
        `${baseUrl}/categoria/empleos`,
        `${baseUrl}/l/cusco/empleos`,
        `${baseUrl}/buscar?q=empleo`,
        `${baseUrl}/v/demo`,
      ],
      numberOfRuns: 1,
      settings: {
        preset: 'mobile',
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
      },
    },
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
        'total-byte-weight': ['warn', { maxNumericValue: 600000 }],
        interactive: ['warn', { maxNumericValue: 3500 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
