import type { Metadata } from 'next';
import { Suspense } from 'react';
import DealsPageClient from './DealsPageClient';
import { withDefaultShareImage, getSiteUrl } from '@/lib/seo/og-image';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: 'Deals — Promos y ofertas en video',
  description:
    'Descubre promociones, descuentos y oportunidades en formato vertical. La red social comercial de Buscadis.',
  alternates: { canonical: `${siteUrl}/deals` },
  ...withDefaultShareImage({
    title: 'Deals | Buscadis',
    description: 'Promos, ofertas y oportunidades en video',
    url: `${siteUrl}/deals`,
  }),
};

export default function DealsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-black text-white">Cargando Deals...</div>
      }
    >
      <DealsPageClient />
    </Suspense>
  );
}
