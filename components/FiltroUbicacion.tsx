'use client';

import React, { useRef, useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import LocationPicker, { LocationPickerHeader } from '@/components/location/LocationPicker';
import type { BrowseLocationFilter } from '@/lib/geo/types';
import { formatLocationFull } from '@/lib/geo/format';
import CountryFlag from '@/components/location/CountryFlag';
import { getLocationCountryCode } from '@/lib/geo/flags';
import { DEFAULT_COUNTRY_CODE } from '@/lib/geo/countries-data';
import { IconLocation } from './Icons';

export type UbicacionFiltro = BrowseLocationFilter;

interface FiltroUbicacionProps {
  value?: UbicacionFiltro;
  onChange?: (filtro: UbicacionFiltro | undefined) => void;
  onAplicar?: (filtro: UbicacionFiltro | undefined) => void;
  onCerrar?: () => void;
  filtrosActuales?: UbicacionFiltro;
}

function toFilter(raw?: UbicacionFiltro): BrowseLocationFilter {
  return {
    countryCode: raw?.countryCode || DEFAULT_COUNTRY_CODE,
    country: raw?.country,
    departamento: raw?.departamento,
    provincia: raw?.provincia,
    distrito: raw?.distrito,
    radioKm: raw?.radioKm,
    latitud: raw?.latitud,
    longitud: raw?.longitud,
  };
}

function buildResult(draft: BrowseLocationFilter): UbicacionFiltro | undefined {
  const has =
    draft.departamento ||
    draft.provincia ||
    draft.distrito ||
    (draft.countryCode && draft.countryCode !== DEFAULT_COUNTRY_CODE);
  if (!has) return undefined;
  return {
    countryCode: draft.countryCode || DEFAULT_COUNTRY_CODE,
    country: draft.country,
    departamento: draft.departamento,
    provincia: draft.provincia,
    distrito: draft.distrito,
    radioKm: draft.radioKm,
    latitud: draft.latitud,
    longitud: draft.longitud,
  };
}

export default function FiltroUbicacion({
  value,
  onChange,
  onAplicar,
  onCerrar,
  filtrosActuales,
}: FiltroUbicacionProps) {
  const initialValue = value || filtrosActuales;
  const [draft, setDraft] = useState<BrowseLocationFilter>(() => toFilter(initialValue));
  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialValue) setDraft(toFilter(initialValue));
  }, [initialValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (onCerrar && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onCerrar();
      } else if (!onCerrar && contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) {
        setMostrarFiltro(false);
      }
    };
    if (mostrarFiltro || onCerrar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mostrarFiltro, onCerrar]);

  const commit = (result: UbicacionFiltro | undefined) => {
    onAplicar?.(result);
    onChange?.(result);
  };

  const handleAplicar = () => {
    commit(buildResult(draft));
    if (onCerrar) onCerrar();
    else setMostrarFiltro(false);
  };

  const handleLimpiar = () => {
    setDraft({ countryCode: DEFAULT_COUNTRY_CODE });
    commit(undefined);
    if (onCerrar) onCerrar();
    else setMostrarFiltro(false);
  };

  const formContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <LocationPickerHeader />
      <LocationPicker
        value={draft}
        onChange={setDraft}
        showRadius={!!(draft.distrito || draft.provincia)}
        radioKm={draft.radioKm || 5}
        onRadioChange={(km) => setDraft((d) => ({ ...d, radioKm: km }))}
        autoDetectOnMount={!initialValue?.departamento && !initialValue?.countryCode}
      />
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={handleLimpiar}
          style={{
            flex: 1,
            padding: '1rem',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={handleAplicar}
          style={{
            flex: 2,
            padding: '1rem',
            border: 'none',
            borderRadius: '12px',
            backgroundColor: 'var(--brand-blue)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(83, 172, 197, 0.3)',
          }}
        >
          Aplicar Cambios
        </button>
      </div>
    </div>
  );

  if (onCerrar) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <div
          ref={modalRef}
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '20px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            width: '100%',
            maxWidth: '440px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.5rem',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            <FaTimes size={20} />
          </button>
          {formContent}
        </div>
      </div>
    );
  }

  const active = value || filtrosActuales;
  const countryCode = getLocationCountryCode(active);
  const textoFiltro = active ? formatLocationFull(active) : 'Filtrar por ubicación';

  return (
    <div ref={contenedorRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setMostrarFiltro(!mostrarFiltro)}
        aria-expanded={mostrarFiltro}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          border: active ? '1px solid var(--brand-blue)' : '1px solid var(--border-color)',
          borderRadius: '10px',
          backgroundColor: active ? 'rgba(var(--brand-primary-rgb), 0.08)' : 'var(--bg-primary)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 600,
        }}
      >
        <CountryFlag code={countryCode} size={18} />
        <IconLocation size={14} color="var(--brand-blue)" />
        <span>{textoFiltro}</span>
      </button>

      {mostrarFiltro && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
            zIndex: 1000,
            minWidth: '320px',
            maxWidth: '400px',
            padding: '1rem',
          }}
        >
          {formContent}
        </div>
      )}
    </div>
  );
}
