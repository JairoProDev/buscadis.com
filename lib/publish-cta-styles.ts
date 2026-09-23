/** CTA Publicar en nav: círculo azul + etiqueta legible. Amarillo solo para upsell promocionado. */
export const publishCta = {
  iconColor: '#ffffff',
  labelColor: 'var(--brand-blue)',
  background:
    'linear-gradient(145deg, var(--bs-action, var(--brand-blue)) 0%, color-mix(in srgb, var(--bs-action, var(--brand-blue)) 85%, #0a1628) 100%)',
  backgroundActive:
    'linear-gradient(145deg, color-mix(in srgb, var(--bs-action, var(--brand-blue)) 90%, white) 0%, var(--bs-action, var(--brand-blue)) 100%)',
  shadow: '0 6px 18px color-mix(in srgb, var(--bs-action, var(--brand-blue)) 40%, transparent)',
  shadowActive:
    '0 6px 20px color-mix(in srgb, var(--bs-action, var(--brand-blue)) 50%, transparent), 0 0 0 3px color-mix(in srgb, var(--bs-color-sol-400, #FFC24A) 35%, transparent)',
} as const;

/** Acento warm solo para “Destacar / promocionado”. */
export const publishPromoteAccent = {
  iconColor: 'var(--bs-fg-on-warm)',
  labelColor: 'var(--bs-fg-on-warm)',
  background:
    'linear-gradient(145deg, var(--bs-color-sol-300) 0%, var(--bs-publish-bg, #FFC24A) 50%, var(--bs-color-sol-500) 100%)',
} as const;
