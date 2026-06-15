import { BrowseLocationFilter } from './types';
import { DEFAULT_COUNTRY_CODE, getCountryByCode } from './countries-data';

export function getLocationFlag(filter?: BrowseLocationFilter | null): string {
  const code = filter?.countryCode || DEFAULT_COUNTRY_CODE;
  return getCountryByCode(code)?.flag || '🌍';
}

/** Texto corto para header / pills */
export function formatLocationShort(filter?: BrowseLocationFilter | null): string {
  if (!filter) {
    return getCountryByCode(DEFAULT_COUNTRY_CODE)?.name || 'Perú';
  }
  const leaf = filter.distrito || filter.provincia || filter.departamento;
  if (leaf) return leaf;
  const country = getCountryByCode(filter.countryCode || DEFAULT_COUNTRY_CODE);
  return country?.name || filter.country || 'Perú';
}

/** Texto completo con jerarquía */
export function formatLocationFull(filter?: BrowseLocationFilter | null): string {
  if (!filter) return getCountryByCode(DEFAULT_COUNTRY_CODE)?.name || 'Perú';
  const parts = [filter.distrito, filter.provincia, filter.departamento].filter(Boolean);
  const country = getCountryByCode(filter.countryCode || DEFAULT_COUNTRY_CODE);
  if (parts.length) {
    const local = parts.join(', ');
    if (filter.countryCode && filter.countryCode !== DEFAULT_COUNTRY_CODE && country) {
      return `${local}, ${country.name}`;
    }
    return local;
  }
  return country?.name || filter.country || 'Perú';
}

export function filterToBrowseLocation(
  filter?: BrowseLocationFilter | null,
): BrowseLocationFilter | undefined {
  if (!filter) return undefined;
  const has =
    filter.countryCode ||
    filter.departamento ||
    filter.provincia ||
    filter.distrito ||
    filter.radioKm;
  return has ? filter : undefined;
}
