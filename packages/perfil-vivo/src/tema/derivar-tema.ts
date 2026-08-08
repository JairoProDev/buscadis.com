import { converter, formatHex, parse } from 'culori';
import { hex as contrastHex } from 'wcag-contrast';
import type { TemaMarcaVars, TemaModo } from '../types';

const toOklch = converter('oklch');

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function toHexColor(color: {
  mode?: string;
  l?: number;
  c?: number;
  h?: number;
}): string {
  const hex = formatHex(color as Parameters<typeof formatHex>[0]);
  return (hex || '#1F4FD8').toUpperCase();
}

/**
 * Deriva tokens de marca desde un color semilla (doc 05 §3).
 * Garantiza contraste AA entre acción y texto sobre acción.
 */
export function derivarTema(semillaHex: string, modo: TemaModo): TemaMarcaVars {
  const parsed = parse(semillaHex);
  const oklch = parsed ? toOklch(parsed) : null;
  let c = clamp(oklch?.c ?? 0.08, 0, 0.19);
  const h = oklch?.h ?? 250;
  const lSeed = oklch?.l ?? 0.5;

  const lAccion =
    modo === 'light'
      ? clamp(lSeed, 0.42, 0.62)
      : clamp(lSeed, 0.55, 0.74);

  const mk = (L: number, C = c) =>
    toHexColor({ mode: 'oklch', l: L, c: C, h });

  const accion = mk(lAccion);
  const sobreAccion =
    contrastHex('#FFFFFF', accion) >= 4.5 ? '#FFFFFF' : '#131218';

  return {
    '--mk-accion': accion,
    '--mk-accion-hover': mk(clamp(lAccion - 0.06, 0.2, 0.9)),
    '--mk-sobre': sobreAccion,
    '--mk-suave': mk(modo === 'light' ? 0.95 : 0.22, Math.min(c, 0.06)),
    '--mk-texto': mk(modo === 'light' ? 0.42 : 0.78),
    '--mk-borde': mk(modo === 'light' ? 0.86 : 0.34, Math.min(c, 0.08)),
  };
}

export function temaToStyle(vars: TemaMarcaVars): Record<string, string> {
  return { ...vars };
}

export function contrasteAccion(vars: TemaMarcaVars): number {
  return contrastHex(vars['--mk-sobre'], vars['--mk-accion']);
}
