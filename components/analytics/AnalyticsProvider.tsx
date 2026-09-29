'use client';

import { VercelInsights } from '@/components/analytics/VercelInsights';
import AnalyticsScripts from '@/components/analytics/AnalyticsScripts';
import CookieConsentBanner from '@/components/analytics/CookieConsentBanner';
import { captureUtmFromUrl } from '@/lib/analytics/attribution';
import { isNativeWebViewClient } from '@/lib/native-webview-bootstrap';
import { useEffect, useState } from 'react';

export default function AnalyticsProvider() {
  const [nativeShell, setNativeShell] = useState(false);

  useEffect(() => {
    captureUtmFromUrl();
    setNativeShell(isNativeWebViewClient());
  }, []);

  return (
    <>
      {!nativeShell ? <VercelInsights /> : null}
      <AnalyticsScripts />
      <CookieConsentBanner />
    </>
  );
}
