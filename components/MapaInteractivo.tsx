'use client';

import type { Adiso } from '@/types';
import MapExperience from '@/components/map/MapExperience';
import type { MapListing } from '@/lib/map/types';

interface MapaInteractivoProps {
  adisos?: Adiso[];
  onAbrirAdiso: (adiso: Adiso) => void;
  variant?: 'page' | 'panel';
}

/** Compatibilidad con el sidebar y el modal. Los pines salen de /api/map/listings. */
export default function MapaInteractivo({ onAbrirAdiso, variant = 'panel' }: MapaInteractivoProps) {
  return (
    <MapExperience
      variant={variant}
      onOpen={(listing: MapListing) => onAbrirAdiso({ id: listing.id } as Adiso)}
    />
  );
}
