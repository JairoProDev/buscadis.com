import { Adiso } from '@/types';
import { adisoTieneImagen } from '@/lib/adiso-display';

function textBlob(adiso: Adiso): string {
  return `${adiso.titulo} ${adiso.descripcion}`.toLowerCase();
}

function hasKeyword(adiso: Adiso, patterns: RegExp[]): boolean {
  const t = textBlob(adiso);
  return patterns.some((p) => p.test(t));
}

export function matchFacetValue(adiso: Adiso, facetId: string, value: string): boolean {
  switch (facetId) {
  case 'empleos_modalidad':
    if (value === 'remoto') return hasKeyword(adiso, [/remoto|teletrabajo|home\s*office|desde casa/i]);
    if (value === 'presencial') return hasKeyword(adiso, [/presencial|en sitio|oficina|local/i]) || !hasKeyword(adiso, [/remoto|teletrabajo/i]);
    if (value === 'hibrido') return hasKeyword(adiso, [/h[ií]brido|mixto/i]);
    return true;

  case 'empleos_jornada':
    if (value === 'completo') return hasKeyword(adiso, [/tiempo completo|full\s*time|jornada completa/i]);
    if (value === 'medio') return hasKeyword(adiso, [/medio tiempo|part\s*time|por horas/i]);
    if (value === 'practicas') return hasKeyword(adiso, [/pr[aá]ctica|pasant[ií]a|bachiller/i]);
    return true;

  case 'inmuebles_operacion':
    if (value === 'venta') return hasKeyword(adiso, [/venta|vendo|en venta|se vende/i]);
    if (value === 'alquiler') return hasKeyword(adiso, [/alquiler|alquilo|arriendo|arrendar|renta/i]);
    return true;

  case 'inmuebles_tipo':
    if (value === 'casa') return hasKeyword(adiso, [/casa|chalet|vivienda/i]);
    if (value === 'departamento') return hasKeyword(adiso, [/departamento|depto|flat|piso/i]);
    if (value === 'local') return hasKeyword(adiso, [/local comercial|local|tienda|oficina|negocio/i]);
    if (value === 'terreno') return hasKeyword(adiso, [/terreno|lote|predio/i]);
    return true;

  case 'vehiculos_tipo':
    if (value === 'auto') return hasKeyword(adiso, [/auto|carro|sed[aá]n|suv|camioneta/i]);
    if (value === 'moto') return hasKeyword(adiso, [/moto|motocicleta|scooter/i]);
    if (value === 'camioneta') return hasKeyword(adiso, [/camioneta|pickup|4x4/i]);
    return true;

  case 'servicios_modalidad':
    if (value === 'domicilio') return hasKeyword(adiso, [/a domicilio|delivery|en casa/i]);
    if (value === 'local') return hasKeyword(adiso, [/en local|en tienda|presencial/i]);
    return true;

  case 'productos_condicion':
    if (value === 'nuevo') return hasKeyword(adiso, [/nuevo|sin uso|sellado/i]);
    if (value === 'usado') return hasKeyword(adiso, [/usado|seminuevo|segunda mano/i]);
    return true;

  case 'eventos_tipo':
    if (value === 'gratis') return adiso.tipoPrecio === 'gratis' || hasKeyword(adiso, [/gratis|entrada libre|sin costo/i]);
    if (value === 'pago') return (adiso.precio != null && adiso.precio > 0) || hasKeyword(adiso, [/entrada|ticket|costo/i]);
    return true;

  case 'negocios_rubro':
    if (value === 'gastronomia') return hasKeyword(adiso, [/restaurante|caf[eé]|bar|comida|gastronom/i]);
    if (value === 'salud') return hasKeyword(adiso, [/cl[ií]nica|salud|farmacia|m[eé]dico/i]);
    if (value === 'retail') return hasKeyword(adiso, [/tienda|retail|comercio|boutique/i]);
    if (value === 'servicios') return hasKeyword(adiso, [/servicio|consultor/i]);
    return true;

  case 'comunidad_tipo':
    if (value === 'trueque') return hasKeyword(adiso, [/trueque|intercambio/i]);
    if (value === 'donacion') return hasKeyword(adiso, [/donaci[oó]n|regalo|gratis/i]);
    if (value === 'grupo') return hasKeyword(adiso, [/grupo|comunidad|club/i]);
    return true;

  default:
    return true;
  }
}

export function adisoMatchesFacets(adiso: Adiso, facets: Record<string, string | string[] | boolean>): boolean {
  for (const [facetId, raw] of Object.entries(facets)) {
    if (raw === false || raw === '' || (Array.isArray(raw) && raw.length === 0)) continue;

    if (typeof raw === 'boolean' && raw) {
      if (facetId === 'empleos_con_sueldo') {
        const ok = (adiso.precio != null && adiso.precio > 0) || /sueldo|salario|s\/\s*\d/i.test(textBlob(adiso));
        if (!ok) return false;
      }
      if (facetId === 'productos_entrega') {
        if (!hasKeyword(adiso, [/entrega|delivery|env[ií]o|a domicilio/i])) return false;
      }
      continue;
    }

    const values = Array.isArray(raw) ? raw : [raw];
    const anyMatch = values.some((v) => matchFacetValue(adiso, facetId, v));
    if (!anyMatch) return false;
  }
  return true;
}

export function adisoPublicadoDentroDe(adiso: Adiso, ventana: '24h' | '7d' | '30d'): boolean {
  if (!adiso.fechaPublicacion) return false;
  const iso = adiso.horaPublicacion
    ? `${adiso.fechaPublicacion}T${adiso.horaPublicacion}`
    : adiso.fechaPublicacion;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const hours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
  if (ventana === '24h') return hours <= 24;
  if (ventana === '7d') return hours <= 24 * 7;
  return hours <= 24 * 30;
}

export { adisoTieneImagen };
