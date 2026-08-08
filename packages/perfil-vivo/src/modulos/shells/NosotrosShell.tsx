'use client';

import { useState } from 'react';
import { usePerfil } from '../PerfilContext';

function similar(a: string, b: string): boolean {
  const na = a.toLowerCase().replace(/\W+/g, '');
  const nb = b.toLowerCase().replace(/\W+/g, '');
  if (!na || !nb) return false;
  if (na === nb || na.includes(nb) || nb.includes(na)) return true;
  const STOP = new Set([
    'de',
    'del',
    'la',
    'las',
    'el',
    'los',
    'por',
    'para',
    'y',
    'en',
    'un',
    'una',
  ]);
  const tokens = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .split(/\W+/)
        .filter((t) => t.length > 2 && !STOP.has(t))
    );
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size || !tb.size) return false;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  const union = ta.size + tb.size - inter;
  return union > 0 && inter / union >= 0.55;
}

/** §18 — Quiénes somos: historia del negocio (el eslogan vive en el hero). */
export function NosotrosShell({ titulo }: { titulo: string }) {
  const { payload } = usePerfil();
  const nosotros = payload.nosotros;
  const esloganNegocio = payload.negocio.eslogan?.trim();
  const [abierto, setAbierto] = useState(false);

  const textoRaw = nosotros?.texto?.trim() ?? '';
  // Evitar duplicar el eslogan del hero: solo mostrar eslogan aquí si es distinto
  // al del negocio y aporta información (p. ej. variante editorial en nosotros).
  const esloganNosotros = nosotros?.eslogan?.trim() ?? '';
  const esloganRaw =
    esloganNosotros &&
    (!esloganNegocio || !similar(esloganNosotros, esloganNegocio))
      ? esloganNosotros
      : '';

  // Una sola voz: si eslogan ≈ descripción, mostrar solo el más completo
  let eslogan: string | null = null;
  let texto: string | null = null;
  if (esloganRaw && textoRaw && similar(esloganRaw, textoRaw)) {
    texto = textoRaw.length >= esloganRaw.length ? textoRaw : esloganRaw;
  } else {
    eslogan = esloganRaw || null;
    texto = textoRaw || null;
  }

  if (!eslogan && !texto) return null;
  // Evitar módulo vacío de una sola frase corta idéntica al meta
  if (!eslogan && texto && texto.length < 28) return null;

  const cuerpo = texto ?? '';
  const corto = !cuerpo || cuerpo.length <= 160;
  const visible =
    !cuerpo ? '' : abierto || corto ? cuerpo : `${cuerpo.slice(0, 160).trim()}…`;

  return (
    <section className="pv-modulo" id="nosotros">
      <h2 style={{ margin: '0 0 10px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
        {titulo || 'Quiénes somos'}
      </h2>
      {eslogan ? (
        <p
          style={{
            margin: texto ? '0 0 8px' : 0,
            font: 'var(--ts-cuerpo)',
            fontWeight: 600,
            color: 'var(--tx-base)',
          }}
        >
          {eslogan}
        </p>
      ) : null}
      {visible ? (
        <p
          style={{
            margin: 0,
            font: 'var(--ts-cuerpo)',
            color: 'var(--tx-muted)',
            lineHeight: 1.45,
          }}
        >
          {visible}
        </p>
      ) : null}
      {texto && !corto ? (
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          style={{
            marginTop: 8,
            minHeight: 44,
            padding: '0 4px',
            border: 'none',
            background: 'transparent',
            color: 'var(--mk-accion)',
            font: 'var(--ts-meta)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {abierto ? 'Ver menos' : 'Leer más'}
        </button>
      ) : null}
    </section>
  );
}
