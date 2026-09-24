import { tokens } from '@buscadis/tokens';

export const THEME_COLORS = {
  light: tokens['--bs-color-neutral-0'],
  dark: tokens['--bs-color-neutral-900'],
} as const;

export function isDarkThemeActive(root: HTMLElement = document.documentElement): boolean {
  return root.classList.contains('dark-mode') || root.classList.contains('dark');
}

export function syncThemeColorMeta(isDark?: boolean): void {
  if (typeof document === 'undefined') return;
  const dark = isDark ?? isDarkThemeActive();
  const meta = document.querySelector('meta[name="theme-color"]');
  const color = dark ? THEME_COLORS.dark : THEME_COLORS.light;
  if (meta) meta.setAttribute('content', color);
}

/** Aplica cambio de tema con transición suave en colores de superficie */
export function withThemeTransition(apply: () => void): void {
  const root = document.documentElement;
  root.classList.add('theme-transitioning');
  apply();
  syncThemeColorMeta();
  window.setTimeout(() => root.classList.remove('theme-transitioning'), 320);
}
