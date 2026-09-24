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
    iconColor: 'color-mix(in srgb, var(--bs-color-sol-500, #e5a82e) 85%, #5c4208)',
    hoverBorder: 'color-mix(in srgb, var(--brand-yellow) 45%, var(--border-color))',
  },
  sugerencia: {
    iconBg: 'color-mix(in srgb, var(--brand-blue) 10%, #b8e6c8 55%)',
    iconColor: 'color-mix(in srgb, #2d8a5c 75%, var(--brand-blue))',
    hoverBorder: 'color-mix(in srgb, #6bc49a 40%, var(--border-color))',
  },
  problema: {
    iconBg: 'color-mix(in srgb, var(--bs-danger-fg) 12%, var(--bg-secondary))',
    iconColor: 'color-mix(in srgb, var(--bs-danger-fg) 88%, #8b3a3a)',
    hoverBorder: 'color-mix(in srgb, var(--bs-danger-fg) 28%, var(--border-color))',
  },
};
