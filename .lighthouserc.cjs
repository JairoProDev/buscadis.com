module.exports = {
  ci: {
    collect: {
      url: ['http://127.0.0.1:3000/v/demo'],
      numberOfRuns: 1,
      settings: {
        // Presupuesto doc 08: Moto G / 4G → LCP < 1.8s
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
        'interactive': ['warn', { maxNumericValue: 3500 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
