/**
 * Repara títulos cortados al inicio (importación Rueda / OCR).
 * Síntoma: titulo y descripcion comparten el mismo prefijo pero el título empieza a mitad de palabra
 * (ej. "Idad) + Propina" en lugar de "Antigüedad) + Propina").
 */

const FRAGMENT_REPAIRS: Array<{ re: RegExp; fix: (m: RegExpMatchArray) => string }> = [
  {
    re: /^Idad\)(\s*\+\s*Propina)?/i,
    fix: (m) => `Antigüedad)${m[1] || ''}`,
  },
  {
    re: /^Istrar\s+tu\s+tiempo/i,
    fix: () => 'Administramos tu tiempo',
  },
  { re: /^Oras\)/i, fix: () => 'Horas)' },
  { re: /^Ina\s+y\s+Lava/i, fix: () => 'Lina y Lava' },
  { re: /^CONOMICOS/i, fix: () => 'ECONÓMICOS' },
  { re: /^conomic/i, fix: () => 'Económico' },
];

const STRONG_START =
  /(?:^|[\s.])(SE\s+NECESITA|SE\s+REQUIERE|SE\s+SOLICITA|SE\s+VENDE|SE\s+ALQUILA|VENDO|ALQUILO|BUSCAMOS|REQUIERE|NECESITO|ANTIGÜEDAD|ADMINISTRAMOS|ADMINISTRAR|RESTAURANTE|HOTEL|EMPRESA|IMPORTANTE|OPORTUNIDAD|ÚNETE|INGRESO|PERSONAS|ECONÓMICOS|ECONOMICOS|LIMPIA|LINA|HORAS)\b/i;

function normalizeWs(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/** Título empieza a mitad de palabra o con fragmento inválido. */
export function isMidWordTitleFragment(titulo: string): boolean {
  const t = titulo.trim();
  if (!t) return false;
  const first = t.split(/\s+/)[0] || '';
  if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{1,10}\)/.test(first) && !/^(Se|De|En|El|La|Un|Al|No)\)/i.test(first)) {
    return true;
  }
  if (/^(idad|istrar|oras|conomic)\b/i.test(first)) return true;
  if (/^[A-ZÁÉÍÓÚÑ]{1}[,.)]$/.test(first)) return true;
  if (/^Ina$/i.test(first) && /^y\s+Lava/i.test(t.split(/\s+/).slice(1).join(' '))) return true;
  return FRAGMENT_REPAIRS.some(({ re }) => re.test(t));
}

function applyFragmentRepairs(t: string): string {
  for (const { re, fix } of FRAGMENT_REPAIRS) {
    const m = t.match(re);
    if (m) return t.replace(re, () => fix(m));
  }
  return t;
}

function pickStrongStartFromText(blob: string, fallback: string): string {
  const flat = normalizeWs(blob);
  const m = flat.match(STRONG_START);
  if (!m || m.index === undefined) return fallback;
  let start = m.index + (m[0].startsWith(' ') || m[0].startsWith('.') ? 1 : 0);
  const slice = flat.slice(start).trim();
  if (slice.length < 18) return fallback;
  if (slice.length > 96) {
    const cut = slice.lastIndexOf(' ', 96);
    return `${slice.slice(0, cut > 40 ? cut : 96).trimEnd()}…`;
  }
  return slice;
}

function alignTitleInBlob(blob: string, brokenTitulo: string): string | null {
  const flat = normalizeWs(blob);
  const needle = brokenTitulo.slice(0, Math.min(20, brokenTitulo.length));
  if (needle.length < 6) return null;
  const idx = flat.toLowerCase().indexOf(needle.toLowerCase());
  if (idx <= 0) return null;

  let start = idx;
  const floor = Math.max(0, idx - 55);
  while (start > floor) {
    const prev = flat[start - 1];
    if (start === 0) break;
    if (/[.!?]/.test(prev) && flat[start] !== ' ') {
      break;
    }
    if (prev === ' ' && /[A-ZÁÉÍÓÚÑ¡¿]/.test(flat[start])) {
      break;
    }
    start--;
  }
  while (start > 0 && flat[start - 1] === ' ') start--;

  let end = Math.min(flat.length, idx + brokenTitulo.length + 8);
  const sentenceEnd = flat.slice(idx, end).search(/[.!?]\s/);
  if (sentenceEnd > 25 && sentenceEnd < 110) {
    end = idx + sentenceEnd + 1;
  } else if (end - start > 100) {
    const cut = flat.lastIndexOf(' ', start + 96);
    end = cut > start + 30 ? cut : start + 96;
  }

  const candidate = flat.slice(start, end).trim();
  return candidate.length > brokenTitulo.length + 2 ? candidate : null;
}

export function repairMidWordTitle(
  titulo: string,
  opts?: { descripcion?: string | null; textoRaw?: string | null },
): string {
  let t = normalizeWs(titulo);
  if (!isMidWordTitleFragment(t)) return t;

  t = applyFragmentRepairs(t);

  if (!isMidWordTitleFragment(t)) return t;

  const blob = normalizeWs(
    [opts?.textoRaw, opts?.descripcion, titulo].filter(Boolean).join(' '),
  );
  const aligned = alignTitleInBlob(blob, titulo);
  if (aligned && !isMidWordTitleFragment(aligned)) return aligned;

  const fromStrong = pickStrongStartFromText(blob, t);
  if (fromStrong !== t && !isMidWordTitleFragment(fromStrong)) return fromStrong;

  return t;
}

export function resolveAdisoDisplayTitle(
  titulo: string | null | undefined,
  opts?: { descripcion?: string | null; textoRaw?: string | null },
): string {
  const raw = (titulo ?? '').trim();
  if (!raw) return '';
  return repairMidWordTitle(raw, opts);
}
