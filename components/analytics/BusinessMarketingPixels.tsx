'use client';

import Script from 'next/script';
import { hasMarketingConsent, subscribeConsent } from '@/lib/analytics/consent';
import { useEffect, useState } from 'react';

type BusinessMarketingPixelsProps = {
  pixelFacebook?: string | null;
  pixelTiktok?: string | null;
};

/**
 * Pixels del dueño del negocio (Meta / TikTok). Solo en vitrina pública con consentimiento de analytics.
 */
export default function BusinessMarketingPixels({
  pixelFacebook,
  pixelTiktok,
}: BusinessMarketingPixelsProps) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(hasMarketingConsent());
    return subscribeConsent(() => setAllowed(hasMarketingConsent()));
  }, []);

  if (!allowed) return null;

  const fbId = pixelFacebook?.trim();
  const ttId = pixelTiktok?.trim();

  return (
    <>
      {fbId ? (
        <>
          <Script id="fb-pixel-init" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${fbId}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${fbId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      ) : null}
      {ttId ? (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${ttId}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      ) : null}
    </>
  );
}
