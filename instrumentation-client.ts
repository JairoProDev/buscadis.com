import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  telemetry: false,
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    'AbortError',
  ],
  beforeSend(event) {
    const message = event.exception?.values?.[0]?.value || '';
    if (/chrome-extension:\/\//i.test(message)) return null;
    return event;
  },
});
