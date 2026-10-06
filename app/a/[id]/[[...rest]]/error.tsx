'use client';

import SeoRouteError from '@/components/seo/SeoRouteError';

export default function AdisoRouteError({ reset }: { error: Error; reset: () => void }) {
  return <SeoRouteError title="No pudimos mostrar este adiso" reset={reset} />;
}
