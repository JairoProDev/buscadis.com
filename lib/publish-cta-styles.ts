/** CTA Publicar: warm fill + dark ink (AA). Never brand-blue on yellow. */
export const publishCta = {
  iconColor: 'var(--bs-fg-on-warm)',
  labelColor: 'var(--bs-fg-on-warm)',
  background:
    'linear-gradient(145deg, var(--bs-color-sol-300) 0%, var(--bs-publish-bg) 50%, var(--bs-color-sol-500) 100%)',
  backgroundActive:
    'linear-gradient(145deg, var(--bs-color-sol-400) 0%, var(--bs-color-sol-500) 55%, var(--bs-color-sol-600) 100%)',
  shadow: '0 6px 18px color-mix(in srgb, var(--bs-publish-bg) 45%, transparent)',
  shadowActive:
    '0 6px 20px color-mix(in srgb, var(--bs-publish-bg) 55%, transparent), 0 0 0 3px color-mix(in srgb, var(--bs-action) 25%, transparent)',
} as const;
