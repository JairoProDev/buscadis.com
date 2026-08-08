module.exports = {
  ci: {
    collect: {
      url: ['http://127.0.0.1:3000/v/demo'],
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 1200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
        'total-byte-weight': ['warn', { maxNumericValue: 600000 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
