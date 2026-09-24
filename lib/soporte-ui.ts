import type { MotivoAyuda } from '@/lib/soporte';

/** Acentos alineados a celeste / ámbar de marca + verde y rojo suaves */
export const MOTIVO_AYUDA_VISUAL: Record<
  MotivoAyuda,
  { iconBg: string; iconColor: string; hoverBorder: string }
> = {
  duda: {
    iconBg: 'color-mix(in srgb, var(--brand-blue) 14%, var(--bg-secondary))',
    iconColor: 'var(--brand-blue)',
    hoverBorder: 'color-mix(in srgb, var(--brand-blue) 35%, var(--border-color))',
  },
  publicar: {
    iconBg: 'rgba(var(--brand-yellow-rgb), 0.28)',
    iconColor: 'color-mix(in srgb, var(--bs-color-sol-500) 85%, var(--bs-color-sol-900))',
    hoverBorder: 'color-mix(in srgb, var(--brand-yellow) 45%, var(--border-color))',
  },
  sugerencia: {
    iconBg: 'color-mix(in srgb, var(--brand-blue) 10%, var(--bs-color-success-bg) 55%)',
    iconColor: 'color-mix(in srgb, var(--bs-color-success-fg) 75%, var(--brand-blue))',
    hoverBorder: 'color-mix(in srgb, var(--bs-color-success-fg) 40%, var(--border-color))',
  },
  problema: {
    iconBg: 'color-mix(in srgb, var(--bs-danger-fg) 12%, var(--bg-secondary))',
    iconColor: 'color-mix(in srgb, var(--bs-danger-fg) 88%, var(--bs-color-danger-fg))',
    hoverBorder: 'color-mix(in srgb, var(--bs-danger-fg) 28%, var(--border-color))',
  },
};
