/** CTA Publicar en nav: ámbar de marca (sol) + icono legible. */
export const publishCta = {
  iconColor: 'var(--bs-fg-on-warm)',
  labelColor: 'color-mix(in srgb, var(--bs-color-sol-500, #e5a82e) 75%, var(--text-primary))',
  background:
    'linear-gradient(145deg, var(--bs-color-sol-300) 0%, var(--bs-publish-bg, var(--brand-yellow)) 48%, var(--bs-color-sol-500) 100%)',
  backgroundActive:
    'linear-gradient(145deg, var(--bs-color-sol-200, #ffe08a) 0%, var(--bs-publish-bg, var(--brand-yellow)) 55%, var(--bs-color-sol-600, #d99520) 100%)',
  shadow:
    '0 6px 18px color-mix(in srgb, var(--brand-yellow) 45%, transparent)',
  shadowActive:
    '0 6px 20px color-mix(in srgb, var(--brand-yellow) 55%, transparent), 0 0 0 3px color-mix(in srgb, var(--brand-blue) 22%, transparent)',
} as const;

/** Acento warm para “Destacar / promocionado”. */
export const publishPromoteAccent = {
  iconColor: 'var(--bs-fg-on-warm)',
  labelColor: 'var(--bs-fg-on-warm)',
  background:
    'linear-gradient(145deg, var(--bs-color-sol-300) 0%, var(--bs-publish-bg, #FFC24A) 50%, var(--bs-color-sol-500) 100%)',
} as const;
