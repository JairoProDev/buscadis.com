import type { Adiso } from '@/types';

function pickPrivateString(privateData: Adiso['privateData'], key: string): string {
  if (!privateData || typeof privateData !== 'object') return '';
  const v = (privateData as Record<string, unknown>)[key];
  return typeof v === 'string' ? v : '';
}

/** Texto usado para coincidencia de búsqueda (título, descripción, marca del anunciante). */
export function adisoSearchableText(adiso: Adiso): string {
  const ubic =
    typeof adiso.ubicacion === 'string'
      ? adiso.ubicacion
      : [
          adiso.ubicacion?.distrito,
          adiso.ubicacion?.provincia,
          adiso.ubicacion?.departamento,
          adiso.ubicacion?.direccion,
        ]
          .filter(Boolean)
          .join(' ');

  const attrs = adiso.atributos as Record<string, unknown> | undefined;
  const negocioAttr = attrs && typeof attrs.negocio === 'string' ? attrs.negocio : '';

  return [
    adiso.titulo,
    adiso.descripcion,
    negocioAttr,
    adiso.vendedor?.nombre,
    adiso.vendedor?.negocio,
    pickPrivateString(adiso.privateData, 'advertiser_name'),
    pickPrivateString(adiso.privateData, 'business_name'),
    pickPrivateString(adiso.privateData, 'brand_name'),
    pickPrivateString(adiso.privateData, 'client_name'),
    ubic,
  ]
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .join(' ')
    .toLowerCase();
}
