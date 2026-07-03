'use client';

import { PublishDraft, draftToAdisoPreview } from '@/lib/publish/publish-draft-types';
import { Adiso } from '@/types';
import AdisoCard from '@/components/AdisoCard';

export type PreviewVariant = 'live' | 'free' | 'paid';

function buildMockAdiso(draft: PublishDraft): Adiso {
  const preview = draftToAdisoPreview(draft);
  const now = new Date();
  return {
    id: 'preview',
    categoria: preview.categoria,
    titulo: preview.titulo,
    descripcion: preview.descripcion,
    contacto: preview.contacto || '',
    ubicacion: preview.ubicacion || 'Cusco',
    fechaPublicacion: now.toISOString().split('T')[0],
    horaPublicacion: now.toTimeString().slice(0, 5),
    imagenesUrls: preview.imagenesUrls,
    imagenUrl: preview.imagenUrl,
    precio: preview.precio,
    moneda: preview.moneda,
    tipoPrecio: preview.tipoPrecio,
    tamaño: 'mediano',
    estaActivo: true,
    esGratuito: false,
  };
}

function variantToSize(variant: PreviewVariant): Adiso['tamaño'] {
  if (variant === 'free') return 'miniatura';
  return 'mediano';
}

interface PublishPreviewCardProps {
  draft: PublishDraft;
  variant?: PreviewVariant;
  label?: string;
  compact?: boolean;
}

export default function PublishPreviewCard({
  draft,
  variant = 'live',
  label,
  compact = false,
}: PublishPreviewCardProps) {
  const mock: Adiso = {
    ...buildMockAdiso(draft),
    tamaño: variantToSize(variant),
    esGratuito: variant === 'free',
    esDestacado: variant === 'paid',
    promotionTier: variant === 'paid' ? 'destacada' : 'gratis',
  };

  const isGrayscale = variant === 'free';

  return (
    <div className={`${compact ? '' : 'w-full'}`}>
      {label && (
        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)] mb-1.5 m-0">
          {label}
        </p>
      )}
      <div
        className={`pointer-events-none mx-auto transition-all ${
          compact ? 'max-w-[200px]' : 'max-w-[240px] sm:max-w-[260px]'
        } ${isGrayscale ? 'grayscale opacity-90' : ''}`}
        style={isGrayscale ? { filter: 'grayscale(1)' } : undefined}
      >
        <AdisoCard adiso={mock} onClick={() => {}} vista="feed" />
      </div>
      {variant === 'free' && (
        <p className="text-[10px] text-center text-[var(--text-tertiary)] mt-1 m-0">Plan gratis · 24h</p>
      )}
      {variant === 'paid' && (
        <p className="text-[10px] text-center text-[var(--brand-blue)] font-semibold mt-1 m-0">Plan promocionado</p>
      )}
    </div>
  );
}
