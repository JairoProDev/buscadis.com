'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { GoogleAnalytics } from '@next/third-parties/google';
import {
  getConsent,
  hasAnalyticsConsent,
  subscribeConsent,
  type ConsentState,
} from '@/lib/analytics/consent';
import { captureUtmFromUrl } from '@/lib/analytics/attribution';
import { isNativeWebViewClient } from '@/lib/native-webview-bootstrap';

function ClarityScript({ projectId }: { projectId: string }) {
  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${projectId}");
      `}
    </Script>
  );
}

export default function AnalyticsScripts() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    captureUtmFromUrl();
    setConsent(getConsent());
    return subscribeConsent(setConsent);
  }, []);

  const analyticsAllowed = hasAnalyticsConsent() && consent !== null;
  const skipThirdParty = isNativeWebViewClient();

  return (
    <>
      {!skipThirdParty && analyticsAllowed && gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      {!skipThirdParty && analyticsAllowed && clarityId ? <ClarityScript projectId={clarityId} /> : null}
    </>
  );
}
