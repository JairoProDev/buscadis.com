import { tokens } from '@buscadis/tokens';

/** Colores para kits SVG y defaults de render QR (sin hex sueltos en lib/qr). */
export const QR_KIT = {
  surface: tokens['--bs-color-neutral-0'],
  ink: tokens['--bs-color-neutral-900'],
  muted: tokens['--bs-color-neutral-500'],
  faint: tokens['--bs-color-neutral-400'],
  softBg: tokens['--bs-color-neutral-50'],
  panelBg: tokens['--bs-color-neutral-25'],
  border: tokens['--bs-color-neutral-200'],
  borderStrong: tokens['--bs-color-neutral-300'],
  onBrand: tokens['--bs-color-neutral-0'],
  shadow: tokens['--bs-color-neutral-900'],
  defaultTheme: tokens['--bs-color-adis-700'],
} as const;

export const QR_DEFAULTS = {
  dots: tokens['--bs-color-neutral-800'],
  dotsDark: tokens['--bs-color-neutral-900'],
  bg: tokens['--bs-color-neutral-0'],
  executive: tokens['--bs-color-adis-900'],
  mutedDots: tokens['--bs-color-neutral-700'],
  identity: tokens['--bs-identity'],
  warm: tokens['--bs-identity-warm'],
} as const;
