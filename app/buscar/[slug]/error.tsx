'use client';

import SeoRouteError from '@/components/seo/SeoRouteError';

export default function BuscarRouteError({ reset }: { error: Error; reset: () => void }) {
  return <SeoRouteError title="No pudimos cargar la búsqueda" reset={reset} />;
}
