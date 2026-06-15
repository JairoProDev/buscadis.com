/** CTA Publicar: fondo turquesa + icono/label amarillo (variante invertida para comparar). */
export const publishCta = {
  iconColor: 'var(--brand-yellow)',
  labelColor: 'var(--brand-yellow)',
  background: 'linear-gradient(145deg, #6ebfd4 0%, var(--brand-blue) 52%, #3d96ad 100%)',
  backgroundActive:
    'linear-gradient(145deg, #5bb5cc 0%, var(--brand-blue) 55%, #358fa5 100%)',
  shadow: '0 6px 18px rgba(var(--brand-primary-rgb), 0.42)',
  shadowActive:
    '0 6px 20px rgba(var(--brand-primary-rgb), 0.5), 0 0 0 3px rgba(var(--brand-yellow-rgb), 0.35)',
} as const;
