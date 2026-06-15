import { Adiso, TamañoPaquete } from '@/types';
import { featuresForTier } from './tiers';

export function applyPaidTierToAdiso(
  adiso: Adiso,
  packageTier: TamañoPaquete,
  privateData?: Record<string, unknown>
): Adiso {
  const features = featuresForTier('paid', packageTier);
  return {
    ...adiso,
    publishTier: 'paid',
    esGratuito: false,
    features: features as unknown as Record<string, unknown>,
    privateData: {
      precio: adiso.precio,
      moneda: adiso.moneda,
      tipoPrecio: adiso.tipoPrecio,
      ubicacion: adiso.ubicacion,
      imagenesUrls: adiso.imagenesUrls,
      ...privateData,
    },
    expiresAt: undefined,
  };
}
