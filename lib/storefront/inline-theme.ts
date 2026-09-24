import { tokens } from '@buscadis/tokens';

/** Fallbacks para páginas storefront sin CSS de tenant cargado. */
export const sfInline = {
  base: tokens['--bs-color-neutral-25'],
  ink: tokens['--bs-color-neutral-700'],
  strong: tokens['--bs-color-neutral-950'],
  muted: tokens['--bs-color-neutral-500'],
  faint: tokens['--bs-color-neutral-400'],
  border: tokens['--bs-color-neutral-200'],
  action: tokens['--bs-action'],
  danger: tokens['--bs-danger-fg'],
  warning: tokens['--bs-cat-vehiculos-fg'],
  placeholder: tokens['--bs-color-neutral-200'],
  onAction: tokens['--bs-color-neutral-0'],
} as const;
