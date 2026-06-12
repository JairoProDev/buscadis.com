/** WhatsApp de soporte Buscadis (Perú +51) */
export const SOPORTE_WHATSAPP_NUMERO = '51937054328';

export type MotivoAyuda = 'sugerencia' | 'problema' | 'duda' | 'publicar';

export const MOTIVOS_AYUDA: Array<{
  id: MotivoAyuda;
  label: string;
  descripcion: string;
  mensaje: string;
}> = [
  {
    id: 'sugerencia',
    label: 'Enviar una sugerencia',
    descripcion: 'Ideas para mejorar la plataforma',
    mensaje: 'Hola, tengo una sugerencia para Buscadis: ',
  },
  {
    id: 'problema',
    label: 'Reportar un problema',
    descripcion: 'Algo no funciona como debería',
    mensaje: 'Hola, encontré un problema en Buscadis: ',
  },
  {
    id: 'duda',
    label: 'Hacer una consulta',
    descripcion: 'Dudas sobre cómo usar Buscadis',
    mensaje: 'Hola, tengo una duda sobre Buscadis: ',
  },
  {
    id: 'publicar',
    label: 'Ayuda para publicar',
    descripcion: 'Necesito apoyo con mi anuncio',
    mensaje: 'Hola, necesito ayuda para publicar mi anuncio en Buscadis: ',
  },
];

export function getSoporteWhatsAppUrl(motivo: MotivoAyuda, extra?: string): string {
  const plantilla = MOTIVOS_AYUDA.find((m) => m.id === motivo)?.mensaje ?? 'Hola, necesito ayuda con Buscadis: ';
  const texto = extra?.trim() ? `${plantilla}${extra.trim()}` : plantilla;
  return `https://wa.me/${SOPORTE_WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;
}
