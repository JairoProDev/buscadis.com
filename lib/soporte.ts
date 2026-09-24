/** WhatsApp de soporte Buscadis (Perú +51) */
export const SOPORTE_WHATSAPP_NUMERO = '51937054328';

export type MotivoAyuda = 'sugerencia' | 'problema' | 'duda' | 'publicar';

/** Orden: tareas frecuentes del marketplace → feedback → incidencias */
export const MOTIVOS_AYUDA: Array<{
  id: MotivoAyuda;
  label: string;
  descripcion: string;
  mensaje: string;
}> = [
  {
    id: 'duda',
    label: 'Ayuda para buscar',
    descripcion: 'No encuentro lo que necesito.',
    mensaje: 'Hola, necesito ayuda para encontrar lo que busco en Buscadis: ',
  },
  {
    id: 'publicar',
    label: 'Ayuda para publicar',
    descripcion: 'Necesito apoyo con mi anuncio',
    mensaje: 'Hola, necesito ayuda para publicar mi anuncio en Buscadis: ',
  },
  {
    id: 'sugerencia',
    label: 'Enviar una sugerencia',
    descripcion: 'Ideas para mejorar Buscadis.com',
    mensaje: 'Hola, tengo una sugerencia para mejorarBuscadis: ',
  },
  {
    id: 'problema',
    label: 'Reportar un problema',
    descripcion: 'Algo no funciona como debería',
    mensaje: 'Hola, encontré un problema en Buscadis: ',
  },
];

export function getSoporteWhatsAppUrl(motivo: MotivoAyuda, extra?: string): string {
  const plantilla = MOTIVOS_AYUDA.find((m) => m.id === motivo)?.mensaje ?? 'Hola, necesito ayuda con Buscadis: ';
  const texto = extra?.trim() ? `${plantilla}${extra.trim()}` : plantilla;
  return `https://wa.me/${SOPORTE_WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`;
}
