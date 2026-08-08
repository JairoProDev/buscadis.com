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

/** Hybrid 3.0 — Quiénes somos editorial (tipografía de sitio, no panel genérico). */
export function NosotrosShell({ titulo }: { titulo: string }) {
  const { payload } = usePerfil();
  const nosotros = payload.nosotros;
  const esloganNegocio = payload.negocio.eslogan?.trim();
  const [abierto, setAbierto] = useState(false);
  const foto = nosotros?.fotoUrl?.trim();

  const textoRaw = nosotros?.texto?.trim() ?? '';
  const esloganNosotros = nosotros?.eslogan?.trim() ?? '';
  const esloganRaw =
    esloganNosotros &&
    (!esloganNegocio || !similar(esloganNosotros, esloganNegocio))
      ? esloganNosotros
      : '';

  let eslogan: string | null = null;
  let texto: string | null = null;
  if (esloganRaw && textoRaw && similar(esloganRaw, textoRaw)) {
    texto = textoRaw.length >= esloganRaw.length ? textoRaw : esloganRaw;
  } else {
    eslogan = esloganRaw || null;
    texto = textoRaw || null;
  }

  if (!eslogan && !texto) return null;
  if (!eslogan && texto && texto.length < 28) return null;

  const cuerpo = texto ?? '';
  const corto = !cuerpo || cuerpo.length <= 220;
  const visible =
    !cuerpo ? '' : abierto || corto ? cuerpo : `${cuerpo.slice(0, 220).trim()}…`;

  return (
    <section className="pv-modulo pv-nosotros" id="nosotros">
      <h2 className="pv-store-head__title" style={{ marginBottom: 12 }}>
        {titulo || 'Quiénes somos'}
      </h2>
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={foto}
          alt=""
          className="pv-nosotros__foto"
          width={480}
          height={240}
          loading="lazy"
        />
      ) : null}
      {eslogan ? <p className="pv-nosotros__lead">{eslogan}</p> : null}
      {visible ? <p className="pv-nosotros__body">{visible}</p> : null}
      {texto && !corto ? (
        <button
          type="button"
          className="pv-nosotros__more"
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? 'Ver menos' : 'Leer más'}
        </button>
      ) : null}
    </section>
  );
}
