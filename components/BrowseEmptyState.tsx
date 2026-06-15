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
    <div
      className="brand-mesh-glass"
      style={{
        margin: '1.5rem 0 2rem',
        padding: 'clamp(1.25rem, 4vw, 2rem)',
        borderRadius: '20px',
        border: '1px solid rgba(var(--brand-primary-rgb), 0.15)',
        textAlign: 'center',
        maxWidth: '520px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          margin: '0 auto 1rem',
          borderRadius: '16px',
          background: 'rgba(var(--brand-primary-rgb), 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isForeignCountry ? (
          <CountryFlag code={countryCode} size={36} title={country?.name} />
        ) : (
          <IconSearch size={28} color="var(--brand-blue)" />
        )}
      </div>

      <h2
        style={{
          margin: '0 0 0.5rem',
          fontSize: '1.2rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          lineHeight: 1.3,
        }}
      >
        {headline}
      </h2>
      <p
        style={{
          margin: '0 0 1.25rem',
          fontSize: '0.92rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          maxWidth: '420px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {subline}
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'stretch',
        }}
      >
        {(hasSearch || variant === 'filtered' || variant === 'location') && (
          <button
            type="button"
            onClick={handlePublishSeek}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px 18px',
              borderRadius: '14px',
              border: 'none',
              background: 'var(--brand-blue)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(83, 172, 197, 0.35)',
            }}
          >
            <IconMegaphone size={18} color="white" />
            Publicar lo que busco
          </button>
        )}

        {variant === 'location' && isForeignCountry && (
          <button
            type="button"
            onClick={handleBeFirst}
            style={{
              padding: '12px 18px',
              borderRadius: '14px',
              border: '2px solid var(--brand-yellow)',
              background: 'rgba(var(--brand-yellow-rgb), 0.12)',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Ser el primero en publicar en {country?.name}
          </button>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
          {activeFilterCount > 0 && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              style={secondaryBtnStyle}
            >
              Limpiar filtros
            </button>
          )}
          {onChangeLocation && (
            <button type="button" onClick={onChangeLocation} style={secondaryBtnStyle}>
              Cambiar ubicación
            </button>
          )}
          <Link href="/publicar" style={{ ...secondaryBtnStyle, textDecoration: 'none' }}>
            Publicar aviso
          </Link>
        </div>

        {isForeignCountry && (
          <p
            style={{
              margin: '0.75rem 0 0',
              fontSize: '0.8rem',
              color: 'var(--text-tertiary)',
              lineHeight: 1.5,
            }}
          >
            <IconShare size={12} color="var(--text-tertiary)" />{' '}
            ¿Conoces vendedores en {country?.name}? Invítalos a Buscadis — juntos llenamos el mapa de tu país.
          </p>
        )}
      </div>
    </div>
  );
}

const secondaryBtnStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  fontSize: '0.85rem',
  cursor: 'pointer',
};
