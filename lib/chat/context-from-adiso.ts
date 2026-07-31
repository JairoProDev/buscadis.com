import type { Adiso } from '@/types';
import type { ChatOpenContext } from '@/contexts/UIContext';
import { formatPrecioDisplay, toDisplayTitle } from '@/lib/adiso-display';

/** Build rich chat open context from a listing the viewer has open. */
export function chatContextFromAdiso(
  adiso: Adiso,
  extras?: Partial<ChatOpenContext>
): ChatOpenContext {
  const imageUrl =
    adiso.imagenUrl ||
    (Array.isArray(adiso.imagenesUrls) ? adiso.imagenesUrls[0] : undefined) ||
    undefined;

  const sellerId = adiso.user_id || adiso.usuario_id || undefined;

  return {
    adisoId: adiso.id,
    adisoTitle: toDisplayTitle(adiso.titulo) || adiso.titulo,
    adisoImageUrl: typeof imageUrl === 'string' ? imageUrl : undefined,
    adisoPriceLabel: formatPrecioDisplay(adiso) || undefined,
    otherUser: sellerId
      ? {
          id: String(sellerId),
          nombre: adiso.vendedor?.nombre,
          avatar_url: adiso.vendedor?.avatarUrl,
        }
      : adiso.vendedor
        ? {
            id: String(adiso.vendedor.id || ''),
            nombre: adiso.vendedor.nombre,
            avatar_url: adiso.vendedor.avatarUrl,
          }
        : undefined,
    ...extras,
  };
}
