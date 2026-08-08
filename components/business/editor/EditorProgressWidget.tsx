'use client';

import CompletitudMeter from '@/components/business/creator/CompletitudMeter';
import type { BusinessProfile } from '@/types/business';
import { cn } from '@/lib/utils';

interface EditorProgressWidgetProps {
  profile: Partial<BusinessProfile>;
  productCount?: number;
  className?: string;
  /** Barra compacta para el header del editor */
  compact?: boolean;
}

/**
 * §17 — Medidor de completitud (una sola siguiente acción como beneficio).
 * Reemplaza la lista de “te falta…” del progress antiguo.
 */
export default function EditorProgressWidget({
  profile,
  productCount = 0,
  className,
  compact = false,
}: EditorProgressWidgetProps) {
  return (
    <CompletitudMeter
      profile={profile}
      productCount={productCount}
      className={cn(className)}
      compact={compact}
      slug={profile.slug}
    />
  );
}
