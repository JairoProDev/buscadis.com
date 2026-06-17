'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CountryFlag from '@/components/location/CountryFlag';
import { IconMegaphone, IconSearch, IconShare } from '@/components/Icons';
import { getCountryByCode, DEFAULT_COUNTRY_CODE } from '@/lib/geo/countries-data';
import { formatLocationFull } from '@/lib/geo/format';
import { getLocationCountryCode } from '@/lib/geo/flags';
import { buildSeekDescription, buildSeekTitle, saveSeekIntent } from '@/lib/seek-intent';
import { persistDemandIntent } from '@/lib/demand-intents/client';
import { useAuth } from '@/hooks/useAuth';
import type { BrowseLocationFilter } from '@/lib/geo/types';
import type { Categoria } from '@/types';

export type BrowseEmptyVariant =
  | 'filtered'
  | 'location'
  | 'search'
  | 'category'
  | 'global';

interface BrowseEmptyStateProps {
  variant: BrowseEmptyVariant;
  busqueda?: string;
  categoria?: Categoria | 'todos';
  ubicacion?: BrowseLocationFilter;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  onChangeLocation?: () => void;
}

export default function BrowseEmptyState({
  variant,
  busqueda = '',
  categoria = 'todos',
  ubicacion,
  activeFilterCount = 0,
  onClearFilters,
  onChangeLocation,
}: BrowseEmptyStateProps) {
  const router = useRouter();
  const { user } = useAuth();
  const countryCode = getLocationCountryCode(ubicacion);
  const country = getCountryByCode(countryCode);
  const locationLabel = formatLocationFull(ubicacion);
  const isForeignCountry = countryCode !== DEFAULT_COUNTRY_CODE;
  const hasSearch = busqueda.trim().length > 0;

  const handlePublishSeek = () => {
    const titulo = buildSeekTitle(busqueda || `algo en ${locationLabel}`);
    saveSeekIntent({
      titulo,
      descripcion: buildSeekDescription(
        busqueda,
        ubicacion ? `Zona: ${locationLabel}` : undefined,
      ),
      categoria: 'comunidad',
      ubicacion: locationLabel,
      countryCode,
    });
    void persistDemandIntent({
      queryText: titulo,
      categoria: categoria !== 'todos' ? categoria : 'comunidad',
      ubicacion: ubicacion as Record<string, unknown> | undefined,
      source: 'explicit_seek',
      userId: user?.id,
    });
    router.push('/publicar');
  };

  const handleBeFirst = () => {
    router.push('/publicar');
  };

  const headline =
    variant === 'location' && isForeignCountry
      ? `Aún no hay avisos en ${country?.name || locationLabel}`
      : variant === 'search' && hasSearch
        ? `Nadie publicó «${busqueda.trim()}» todavía`
        : variant === 'category' && categoria !== 'todos'
          ? `Sin resultados en esta categoría`
          : activeFilterCount > 0
            ? 'Ningún aviso coincide con tus filtros'
            : 'Aún no hay avisos aquí';

  const subline =
    variant === 'location' && isForeignCountry
      ? `Buscadis está creciendo. Sé de los primeros en ${country?.name || 'tu país'} o cuéntanos qué buscas para que te encuentren.`
      : hasSearch
        ? 'Publica lo que necesitas y deja que los vendedores te contacten, o amplía tu búsqueda.'
        : 'Prueba quitar filtros, cambiar la zona o publica tú el primer aviso.';

  return (
    <div className="brand-mesh-glass mx-auto my-6 max-w-[520px] rounded-[20px] border border-[rgba(var(--brand-primary-rgb),0.15)] px-[clamp(1.25rem,4vw,2rem)] py-[clamp(1.25rem,4vw,2rem)] text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(var(--brand-primary-rgb),0.1)]">
        {isForeignCountry ? (
          <CountryFlag code={countryCode} size={36} title={country?.name} />
        ) : (
          <IconSearch size={28} color="var(--brand-blue)" />
        )}
      </div>

      <h2 className="mb-2 text-xl font-extrabold leading-snug text-[var(--text-primary)]">{headline}</h2>
      <p className="mx-auto mb-5 max-w-[420px] text-[0.92rem] leading-relaxed text-[var(--text-secondary)]">
        {subline}
      </p>

      <div className="flex flex-col items-stretch gap-2.5">
        {(hasSearch || variant === 'filtered' || variant === 'location') && (
          <button
            type="button"
            onClick={handlePublishSeek}
            className="flex items-center justify-center gap-2 rounded-[14px] border-none bg-[var(--brand-blue)] px-[18px] py-3.5 text-[0.95rem] font-bold text-white shadow-[0_4px_14px_rgba(var(--brand-primary-rgb),0.35)]"
          >
            <IconMegaphone size={18} color="white" />
            Publicar lo que busco
          </button>
        )}

        {variant === 'location' && isForeignCountry && (
          <button
            type="button"
            onClick={handleBeFirst}
            className="cursor-pointer rounded-[14px] border-2 border-[var(--brand-yellow)] bg-[rgba(var(--brand-yellow-rgb),0.12)] px-[18px] py-3 text-[0.9rem] font-bold text-[var(--text-primary)]"
          >
            Ser el primero en publicar en {country?.name}
          </button>
        )}

        <div className="flex flex-wrap justify-center gap-2">
          {activeFilterCount > 0 && onClearFilters && (
            <button type="button" onClick={onClearFilters} className={secondaryBtnClass}>
              Limpiar filtros
            </button>
          )}
          {onChangeLocation && (
            <button type="button" onClick={onChangeLocation} className={secondaryBtnClass}>
              Cambiar ubicación
            </button>
          )}
          <Link href="/publicar" className={secondaryBtnClass}>
            Publicar aviso
          </Link>
        </div>

        {isForeignCountry && (
          <p className="mt-3 text-[0.8rem] leading-relaxed text-[var(--text-tertiary)]">
            <IconShare size={12} color="var(--text-tertiary)" /> ¿Conoces vendedores en {country?.name}? Invítalos
            a Buscadis — juntos llenamos el mapa de tu país.
          </p>
        )}
      </div>
    </div>
  );
}

const secondaryBtnClass =
  'inline-flex cursor-pointer items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-3.5 py-2.5 text-[0.85rem] font-semibold text-[var(--text-secondary)] no-underline transition-colors hover:text-[var(--text-primary)]';
