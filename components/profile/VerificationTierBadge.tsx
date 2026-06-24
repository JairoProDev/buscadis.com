'use client';

import { IconVerified } from '@/components/Icons';
import { cn } from '@/lib/utils';

export type VerificationTier = 'none' | 'basic' | 'identity' | 'business' | 'premium';

const TIER_STYLES: Record<
  Exclude<VerificationTier, 'none'>,
  { color: string; label: string; title: string }
> = {
  basic: {
    color: 'text-slate-400',
    label: 'Perfil básico',
    title: 'Cuenta verificada con email',
  },
  identity: {
    color: 'text-sky-500',
    label: 'Identidad verificada',
    title: 'Identidad del administrador confirmada',
  },
  business: {
    color: 'text-[var(--brand-color,#53acc5)]',
    label: 'Negocio verificado',
    title: 'Documentación del negocio validada',
  },
  premium: {
    color: 'text-amber-500',
    label: 'Perfil premium',
    title: 'Máximo nivel de confianza Buscadis',
  },
};

interface VerificationTierBadgeProps {
  tier?: VerificationTier | null;
  /** Legacy boolean fallback */
  isVerified?: boolean;
  size?: number;
  className?: string;
}

export function resolveVerificationTier(
  tier?: VerificationTier | null,
  isVerified?: boolean
): VerificationTier {
  if (tier && tier !== 'none') return tier;
  if (isVerified) return 'business';
  return 'none';
}

export default function VerificationTierBadge({
  tier,
  isVerified,
  size = 20,
  className,
}: VerificationTierBadgeProps) {
  const resolved = resolveVerificationTier(tier, isVerified);
  if (resolved === 'none') return null;

  const meta = TIER_STYLES[resolved];

  return (
    <span title={meta.title} className={cn('inline-flex shrink-0', className)}>
      <IconVerified size={size} className={cn(meta.color)} aria-label={meta.label} />
    </span>
  );
}
