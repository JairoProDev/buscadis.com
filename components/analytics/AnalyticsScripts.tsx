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

function GoogleTagManager({ containerId }: { containerId: string }) {
  return (
    <>
      <Script id="gtm-init" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${containerId}');
        `}
      </Script>
      <noscript>
        <iframe
          title="Google Tag Manager"
          src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  );
}

export default function AnalyticsScripts() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    captureUtmFromUrl();
    setConsent(getConsent());
    return subscribeConsent(setConsent);
  }, []);

  const analyticsAllowed = hasAnalyticsConsent() && consent !== null;
  const skipThirdParty = isNativeWebViewClient();

  const useGtm = Boolean(gtmId?.trim());

  return (
    <>
      {!skipThirdParty && analyticsAllowed && useGtm && gtmId ? (
        <GoogleTagManager containerId={gtmId.trim()} />
      ) : null}
      {!skipThirdParty && analyticsAllowed && !useGtm && gaId ? (
        <GoogleAnalytics gaId={gaId} />
      ) : null}
      {!skipThirdParty && analyticsAllowed && clarityId ? <ClarityScript projectId={clarityId} /> : null}
    </>
  );
}
