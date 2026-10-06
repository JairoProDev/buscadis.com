'use client';

import SeoRouteError from '@/components/seo/SeoRouteError';

export default function CategoriaRouteError({ reset }: { error: Error; reset: () => void }) {
  return <SeoRouteError title="No pudimos cargar esta categoría" reset={reset} />;
}
