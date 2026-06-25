'use client';

import { VercelInsights } from '@/components/analytics/VercelInsights';
import AnalyticsScripts from '@/components/analytics/AnalyticsScripts';
import CookieConsentBanner from '@/components/analytics/CookieConsentBanner';
import { captureUtmFromUrl } from '@/lib/analytics/attribution';
import { useEffect } from 'react';

export default function AnalyticsProvider() {
  useEffect(() => {
    captureUtmFromUrl();
  }, []);

  return (
    <>
      <VercelInsights />
      <AnalyticsScripts />
      <CookieConsentBanner />
    </>
  );
}
