'use client';

import SeoRouteError from '@/components/seo/SeoRouteError';

export default function CuscoHubRouteError({ reset }: { error: Error; reset: () => void }) {
  return <SeoRouteError title="No pudimos cargar avisos en Cusco" reset={reset} />;
}
