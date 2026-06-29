import React, { useEffect, useState } from 'react';
import { Adiso } from '@/types';
import { getAdisosCache, getAdisos } from '@/lib/storage';
import Image from 'next/image';
import Link from 'next/link';
import { getAdisoUrl } from '@/lib/url';
import { IconLocation, IconImage } from './Icons';

interface SimilarAdisosProps {
  currentAdiso: Adiso;
}

export default function SimilarAdisos({ currentAdiso }: SimilarAdisosProps) {
  const [similarAds, setSimilarAds] = useState<Adiso[]>([]);
  const [sectionTitle, setSectionTitle] = useState('También te podría interesar');

  useEffect(() => {
    const loadSimilar = async () => {
      const businessSlug = (currentAdiso.privateData as { business_slug?: string } | undefined)
        ?.business_slug;

      if (businessSlug) {
        try {
          const res = await fetch(
            `/api/catalog/by-business/${encodeURIComponent(businessSlug)}?exclude=${currentAdiso.id}&limit=8`,
          );
          if (res.ok) {
            const data = (await res.json()) as { products?: Adiso[] };
            if (data.products && data.products.length > 0) {
              setSectionTitle(
                currentAdiso.vendedor?.nombre
                  ? `Más de ${currentAdiso.vendedor.nombre}`
                  : 'Más productos de este negocio',
              );
              setSimilarAds(data.products.slice(0, 8));
              return;
            }
          }
        } catch {
          // fallback below
        }
      }

      let allAdisos = getAdisosCache();
      if (allAdisos.length === 0) {
        allAdisos = await getAdisos();
      }

      const similar = allAdisos
        .filter((a) => a.id !== currentAdiso.id)
        .filter((a) => a.categoria === currentAdiso.categoria)
        .sort((a, b) => {
          const locA = JSON.stringify(a.ubicacion);
          const locCurrent = JSON.stringify(currentAdiso.ubicacion);
          const matchA = locA === locCurrent;
          const matchB = JSON.stringify(b.ubicacion) === locCurrent;

          if (matchA && !matchB) return -1;
          if (!matchA && matchB) return 1;
          return 0;
        })
        .slice(0, 4);

      setSectionTitle('También te podría interesar');
      setSimilarAds(similar);
    };

    void loadSimilar();
  }, [currentAdiso]);

  if (similarAds.length === 0) return null;

  return (
    <section className="mt-8 border-t border-[var(--border-color)] pt-8" aria-label={sectionTitle}>
      <h3 className="mb-4 text-lg font-bold text-[var(--text-primary)]">{sectionTitle}</h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {similarAds.map((ad) => (
          <Link
            key={ad.id}
            href={getAdisoUrl(ad)}
            className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] transition-transform hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative aspect-square w-full bg-[var(--bg-secondary)]">
              {ad.imagenesUrls?.[0] || ad.imagenUrl ? (
                <Image
                  src={ad.imagenesUrls?.[0] || ad.imagenUrl || ''}
                  alt={ad.titulo}
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 640px) 50vw, 200px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[var(--text-tertiary)]">
                  <IconImage size={28} />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-1 p-2.5">
              <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)] group-hover:text-[var(--brand-blue)]">
                {ad.titulo}
              </h4>
              <div className="mt-auto flex items-center gap-1 text-[0.7rem] text-[var(--text-tertiary)]">
                <IconLocation size={11} />
                <span className="truncate">
                  {typeof ad.ubicacion === 'string'
                    ? ad.ubicacion.split(',')[0]
                    : ad.ubicacion?.distrito || 'Perú'}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
