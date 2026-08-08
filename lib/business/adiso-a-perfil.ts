/**
 * Mapea un aviso clasificado → campos de business_profiles + semillas de catálogo.
 */
import type { Adiso } from '@/types';
import type { BusinessProfile } from '@/types/business';

export interface PrefillDesdeAdiso {
  profile: Partial<BusinessProfile>;
  productosSemilla: Array<{
    title: string;
    description?: string;
    price?: number | null;
    images: string[];
  }>;
}

function ubicacionTexto(ubicacion: Adiso['ubicacion']): string {
  if (!ubicacion) return '';
  if (typeof ubicacion === 'string') return ubicacion;
  const parts = [
    ubicacion.direccion,
    ubicacion.distrito,
    ubicacion.provincia,
    ubicacion.departamento,
  ].filter(Boolean);
  return parts.join(', ');
}

function telefonoDesdeAdiso(adiso: Adiso): string {
  const raw = adiso.contacto?.trim() || '';
  if (raw) return raw.replace(/[^\d+]/g, '');
  const multi = adiso.contactosMultiples?.[0];
  if (multi && typeof multi === 'object' && 'valor' in multi) {
    return String((multi as { valor?: string }).valor || '').replace(/[^\d+]/g, '');
  }
  return '';
}

export function mapAdisoAPerfil(adiso: Adiso): PrefillDesdeAdiso {
  const images = [
    ...(adiso.imagenesUrls || []),
    ...(adiso.imagenUrl ? [adiso.imagenUrl] : []),
  ].filter(Boolean);

  const phone = telefonoDesdeAdiso(adiso);
  const address = ubicacionTexto(adiso.ubicacion);

  const profile: Partial<BusinessProfile> = {
    name: adiso.titulo?.slice(0, 80) || 'Mi negocio',
    description: adiso.descripcion?.slice(0, 2000) || '',
    tagline: adiso.categoria ? String(adiso.categoria).slice(0, 80) : undefined,
    contact_whatsapp: phone || undefined,
    contact_phone: phone || undefined,
    contact_address: address || undefined,
    logo_url: images[0] || undefined,
    banner_url: images[1] || images[0] || undefined,
    profile_hashtags: adiso.categoria
      ? [String(adiso.categoria).toLowerCase().replace(/\s+/g, '')]
      : undefined,
  };

  const productosSemilla =
    images.length > 0
      ? images.slice(0, 10).map((url, i) => ({
          title:
            i === 0
              ? adiso.titulo?.slice(0, 80) || 'Producto'
              : `Producto ${i + 1}`,
          description: i === 0 ? adiso.descripcion?.slice(0, 500) : undefined,
          price: i === 0 && typeof adiso.precio === 'number' ? adiso.precio : null,
          images: [url],
        }))
      : [];

  return { profile, productosSemilla };
}
