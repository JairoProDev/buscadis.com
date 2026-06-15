'use client';

import React, { useCallback, useEffect, useState } from 'react';
import LocationCombobox, { ComboboxOption } from './LocationCombobox';
import {
  COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  getCountryByCode,
  getCountryLevelLabels,
} from '@/lib/geo/countries-data';
import type { BrowseLocationFilter, GeoSearchResult } from '@/lib/geo/types';
import CountryFlag from '@/components/location/CountryFlag';
import { IconLocation, IconSearch } from '@/components/Icons';
import { FaCrosshairs } from 'react-icons/fa';

interface LocationPickerProps {
  value: BrowseLocationFilter;
  onChange: (value: BrowseLocationFilter) => void;
  showRadius?: boolean;
  radioKm?: number;
  onRadioChange?: (km: number) => void;
  autoDetectOnMount?: boolean;
}

export default function LocationPicker({
  value,
  onChange,
  showRadius = false,
  radioKm = 5,
  onRadioChange,
  autoDetectOnMount = true,
}: LocationPickerProps) {
  const countryCode = value.countryCode || DEFAULT_COUNTRY_CODE;
  const labels = getCountryLevelLabels(countryCode);
  const depth = labels.depth;

  const [level1Options, setLevel1Options] = useState<ComboboxOption[]>([]);
  const [level2Options, setLevel2Options] = useState<ComboboxOption[]>([]);
  const [level3Options, setLevel3Options] = useState<ComboboxOption[]>([]);
  const [loadingL1, setLoadingL1] = useState(false);
  const [loadingL2, setLoadingL2] = useState(false);
  const [loadingL3, setLoadingL3] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(false);

  const countryOptions: ComboboxOption[] = COUNTRIES.map((c) => ({
    value: c.code,
    label: c.name,
    countryCode: c.code,
    sublabel: c.nameEn !== c.name ? c.nameEn : undefined,
  }));

  const fetchSubdivisions = useCallback(
    async (level: 1 | 2 | 3, level1?: string, level2?: string) => {
      const params = new URLSearchParams({ country: countryCode });
      if (level1) params.set('level1', level1);
      if (level2) params.set('level2', level2);
      const res = await fetch(`/api/geo/subdivisions?${params}`);
      const data = await res.json();
      return (data.options as string[]) || [];
    },
    [countryCode],
  );

  useEffect(() => {
    let cancelled = false;
    setLoadingL1(true);
    fetchSubdivisions(1)
      .then((opts) => {
        if (!cancelled) {
          setLevel1Options(opts.map((o) => ({ value: o, label: o })));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingL1(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode, fetchSubdivisions]);

  useEffect(() => {
    if (!value.departamento) {
      setLevel2Options([]);
      setLevel3Options([]);
      return;
    }
    let cancelled = false;
    setLoadingL2(true);
    fetchSubdivisions(2, value.departamento)
      .then((opts) => {
        if (!cancelled) {
          setLevel2Options(opts.map((o) => ({ value: o, label: o })));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingL2(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode, value.departamento, fetchSubdivisions]);

  useEffect(() => {
    if (!value.departamento || !value.provincia || depth < 3) {
      setLevel3Options([]);
      return;
    }
    let cancelled = false;
    setLoadingL3(true);
    fetchSubdivisions(3, value.departamento, value.provincia)
      .then((opts) => {
        if (!cancelled) {
          setLevel3Options(opts.map((o) => ({ value: o, label: o })));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingL3(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode, value.departamento, value.provincia, depth, fetchSubdivisions]);

  useEffect(() => {
    if (!autoDetectOnMount || detected) return;
    const stored = sessionStorage.getItem('buscadis-geo-detected');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (!value.countryCode && !value.departamento) {
          onChange({ ...value, ...parsed });
        }
        setDetected(true);
        return;
      } catch {
        /* ignore */
      }
    }
    fetch('/api/geo/detect')
      .then((r) => r.json())
      .then((data) => {
        sessionStorage.setItem('buscadis-geo-detected', JSON.stringify(data));
        if (!value.countryCode && !value.departamento) {
          onChange({
            countryCode: data.countryCode,
            country: data.countryName,
            departamento: data.departamento,
            provincia: data.provincia,
            distrito: data.distrito,
            latitud: data.latitud,
            longitud: data.longitud,
          });
        }
        setDetected(true);
      })
      .catch(() => setDetected(true));
  }, [autoDetectOnMount, detected, onChange, value]);

  useEffect(() => {
    if (globalQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      setSearching(true);
      const params = new URLSearchParams({ q: globalQuery, limit: '12' });
      if (countryCode) params.set('country', countryCode);
      fetch(`/api/geo/search?${params}`)
        .then((r) => r.json())
        .then((data) => setSearchResults(data.results || []))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [globalQuery, countryCode]);

  const handleCountryChange = (code: string) => {
    const country = getCountryByCode(code);
    onChange({
      countryCode: code,
      country: country?.name,
      departamento: undefined,
      provincia: undefined,
      distrito: undefined,
    });
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/geo/detect?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`,
          );
          const data = await res.json();
          sessionStorage.setItem('buscadis-geo-detected', JSON.stringify(data));
          onChange({
            countryCode: data.countryCode,
            country: data.countryName,
            departamento: data.departamento,
            provincia: data.provincia,
            distrito: data.distrito,
            latitud: data.latitud,
            longitud: data.longitud,
          });
        } finally {
          setDetecting(false);
        }
      },
      () => setDetecting(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const applySearchResult = (r: GeoSearchResult) => {
    onChange({
      countryCode: r.countryCode,
      country: r.countryName,
      departamento: r.departamento,
      provincia: r.provincia,
      distrito: r.distrito,
    });
    setGlobalQuery('');
    setSearchResults([]);
  };

  const country = getCountryByCode(countryCode);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Búsqueda global */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <IconSearch size={16} color="var(--brand-blue)" />
          <input
            type="text"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            placeholder="Busca país, ciudad o distrito…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
            }}
          />
          {country && (
            <CountryFlag code={country.code} size={22} title={country.name} />
          )}
        </div>

        {(searching || searchResults.length > 0) && globalQuery.length >= 2 && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 1300,
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
              maxHeight: '240px',
              overflowY: 'auto',
              padding: '6px',
            }}
          >
            {searching ? (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                Buscando…
              </div>
            ) : (
              searchResults.map((r) => (
                <button
                  key={`${r.countryCode}-${r.path}`}
                  type="button"
                  onClick={() => applySearchResult(r)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    border: 'none',
                    borderRadius: '10px',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <CountryFlag code={r.countryCode} size={20} title={r.countryName} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {r.label}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{r.path}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Detectar ubicación */}
      <button
        type="button"
        onClick={handleDetectGPS}
        disabled={detecting}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          borderRadius: '12px',
          border: '1px dashed rgba(var(--brand-primary-rgb), 0.45)',
          backgroundColor: 'rgba(var(--brand-primary-rgb), 0.06)',
          color: 'var(--brand-blue)',
          cursor: detecting ? 'wait' : 'pointer',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <FaCrosshairs size={18} />
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem' }}>
            {detecting ? 'Detectando ubicación…' : 'Usar mi ubicación'}
          </span>
          <span style={{ fontSize: '0.78rem', opacity: 0.85 }}>
            GPS o ubicación aproximada por red
          </span>
        </span>
      </button>

      <LocationCombobox
        label="País"
        placeholder="Seleccionar país"
        value={countryCode}
        options={countryOptions}
        onChange={handleCountryChange}
        showFlag
      />

      <LocationCombobox
        label={labels.level1}
        placeholder={`Seleccionar ${labels.level1.toLowerCase()}`}
        value={value.departamento || ''}
        options={level1Options}
        onChange={(v) =>
          onChange({
            ...value,
            departamento: v || undefined,
            provincia: undefined,
            distrito: undefined,
          })
        }
        loading={loadingL1}
        disabled={!countryCode}
      />

      {value.departamento && (
        <LocationCombobox
          label={labels.level2}
          placeholder={`Seleccionar ${labels.level2.toLowerCase()}`}
          value={value.provincia || ''}
          options={level2Options}
          onChange={(v) =>
            onChange({
              ...value,
              provincia: v || undefined,
              distrito: undefined,
            })
          }
          loading={loadingL2}
        />
      )}

      {value.provincia && depth >= 3 && level3Options.length > 0 && (
        <LocationCombobox
          label={labels.level3 || 'Distrito'}
          placeholder={`Seleccionar ${(labels.level3 || 'distrito').toLowerCase()}`}
          value={value.distrito || ''}
          options={level3Options}
          onChange={(v) => onChange({ ...value, distrito: v || undefined })}
          loading={loadingL3}
        />
      )}

      {showRadius && (value.distrito || value.provincia) && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Radio de búsqueda</span>
            <span
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--brand-blue)',
                padding: '4px 12px',
                backgroundColor: 'rgba(var(--brand-primary-rgb), 0.1)',
                borderRadius: '8px',
              }}
            >
              {radioKm} km
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={radioKm}
            onChange={(e) => onRadioChange?.(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--brand-blue)' }}
          />
        </div>
      )}
    </div>
  );
}

export function LocationPickerHeader() {
  return (
    <div>
      <h3
        style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
          marginBottom: '0.4rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}
      >
        <IconLocation size={22} color="var(--brand-blue)" />
        Ubicación de búsqueda
      </h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
        Encuentra anuncios cerca de ti. Elige tu país con orgullo y afina la zona.
      </p>
    </div>
  );
}
