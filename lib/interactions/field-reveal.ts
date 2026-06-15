export type RevealField = 'precio' | 'ubicacion' | 'descripcion' | 'fotos' | string;

export const FIELD_QUESTIONS: Record<string, string> = {
  precio: '¿Cuál es el precio?',
  ubicacion: '¿Dónde puedo verlo o recogerlo?',
  descripcion: '¿Me puedes contar más detalles?',
  fotos: '¿Tienes más fotos?',
};

export function fieldQuestion(field: RevealField, index?: number): string {
  if (field === 'fotos' && index != null && index > 0) {
    return '¿Me puedes mostrar la siguiente foto?';
  }
  return FIELD_QUESTIONS[field] || `¿Me das más información sobre ${field}?`;
}

export function buildAutoReply(
  field: RevealField,
  adiso: {
    precio?: number;
    moneda?: string;
    tipoPrecio?: string;
    ubicacion?: unknown;
    descripcion?: string;
    imagenesUrls?: string[];
  },
  photoIndex?: number
): string | null {
  switch (field) {
    case 'precio': {
      if (adiso.tipoPrecio === 'a_convenir') return 'El precio es a convenir. ¿Te parece si coordinamos?';
      if (adiso.tipoPrecio === 'gratis') return '¡Es gratis!';
      if (adiso.precio != null) {
        const sym = adiso.moneda === 'USD' ? '$' : 'S/';
        return `El precio es ${sym} ${adiso.precio}.`;
      }
      return null;
    }
    case 'ubicacion': {
      if (typeof adiso.ubicacion === 'string' && adiso.ubicacion) {
        return `Está en ${adiso.ubicacion}.`;
      }
      if (adiso.ubicacion && typeof adiso.ubicacion === 'object') {
        const u = adiso.ubicacion as Record<string, string>;
        const parts = [u.distrito, u.provincia, u.departamento].filter(Boolean);
        if (parts.length) return `Está en ${parts.join(', ')}.`;
      }
      return null;
    }
    case 'descripcion':
      return adiso.descripcion?.trim() || null;
    case 'fotos': {
      const urls = adiso.imagenesUrls || [];
      const idx = photoIndex ?? 1;
      if (urls[idx]) return 'Aquí tienes otra foto 📷';
      return null;
    }
    default:
      return null;
  }
}

export function photoReplyContent(
  imagenesUrls: string[] | undefined,
  index: number
): { text: string; imageUrl?: string } {
  const urls = imagenesUrls || [];
  if (urls[index]) {
    return { text: 'Aquí tienes otra foto 📷', imageUrl: urls[index] };
  }
  return { text: 'Te envío más fotos en un momento 📷' };
}
