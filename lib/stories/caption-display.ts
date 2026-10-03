import type { Story } from '@/types';
import { isOgGeneratedStoryMedia } from '@/lib/stories/media-url';

/** Evita título triplicado cuando el arte ya incluye el copy (OG / plantilla). */
export function shouldShowStoryCaptionOverlay(story: Story): boolean {
  if (isOgGeneratedStoryMedia(story.media_url)) return false;
  if (story.source === 'adiso_auto' && story.adiso_id) return false;
  return Boolean(story.caption?.trim());
}

export function storyCaptionSubtitle(story: Story): string | null {
  if (!story.categoria) return null;
  const labels: Record<string, string> = {
    empleos: 'Empleos',
    inmuebles: 'Inmuebles',
    vehiculos: 'Vehículos',
    servicios: 'Servicios',
    productos: 'Productos',
    eventos: 'Eventos',
    negocios: 'Negocios',
    comunidad: 'Comunidad',
  };
  return labels[story.categoria] || story.categoria;
}
