import { tokens } from '@buscadis/tokens';

/** Inline HTML email — resolved hex from design tokens at send time. */
export const emailBrand = {
  ink: tokens['--bs-color-neutral-800'],
  muted: tokens['--bs-color-neutral-500'],
  action: tokens['--bs-action'],
  onAction: tokens['--bs-color-neutral-0'],
} as const;
