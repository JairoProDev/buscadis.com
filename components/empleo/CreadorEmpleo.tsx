'use client';

import { useEffect, useState } from 'react';
import { AVISO_VACIO, PRESETS, lineas, textoGrupo, type AvisoEmpleo } from '@/lib/empleo/model';
import { AvisoCartel } from './AvisoCartel';
import styles from './creador.module.css';

const DRAFT_KEY = 'buscadis-empleo-borrador';

function cargar(): AvisoEmpleo {
  if (typeof window === 'undefined') return AVISO_VACIO;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...AVISO_VACIO, ...JSON.parse(raw) } : AVISO_VACIO;
  } catch {
    return AVISO_VACIO;
  }
}

export function CreadorEmpleo() {
  const [aviso, setAviso] = useState<AvisoEmpleo>(AVISO_VACIO);
  const [format, setFormat] = useState<'a4' | 'story'>('a4');
  const [req, setReq] = useState('');
  const [ben, setBen] = useState('');
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState('');
  const [publicado, setPublicado] = useState<{ id: string; path: string; editToken: string } | null>(null);
  const [origen, setOrigen] = useState('https://buscadis.com');

  useEffect(() => {
    const guardado = cargar();
    setAviso(guardado);
    setReq(guardado.requisitos.join('\n'));
    setBen(guardado.beneficios.join('\n'));
    setOrigen(window.location.origin);
  }, []);

  function actualizar(parcial: Partial<AvisoEmpleo>, reqTexto = req, benTexto = ben) {
    const next = {
      ...aviso,
      ...parcial,
      requisitos: lineas(reqTexto),
      beneficios: lineas(benTexto),
    };
    setAviso(next);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  }

  const url = publicado ? `${origen}${publicado.path}` : `${origen}/empleo`;

  async function publicar() {
    setError('');
    setPublicando(true);
    try {
      const res = await fetch('/api/empleo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aviso),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo publicar');
      const guardado = { id: data.id as string, path: data.path as string, editToken: data.editToken as string };
      sessionStorage.setItem(`empleo-token-${guardado.id}`, guardado.editToken);
      setPublicado(guardado);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo publicar');
    } finally {
      setPublicando(false);
    }
  }

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      setError(texto);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <div className={styles.brand}>
          <span>Busca</span>dis empleos
        </div>
        <div className={styles.formats}>
          <button className={format === 'a4' ? styles.on : ''} type="button" onClick={() => setFormat('a4')}>
            A4
          </button>
          <button className={format === 'story' ? styles.on : ''} type="button" onClick={() => setFormat('story')}>
            Historia
          </button>
        </div>
      </header>
      <div className={styles.layout}>
        <div className={styles.stage}>
          <div className={styles.sheetWrap}>
            <AvisoCartel aviso={aviso} format={format} url={url} />
          </div>
        </div>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            void publicar();
          }}
        >
          <h2>Arma el aviso</h2>
          <div className={styles.actions}>
            <button type="button" onClick={() => window.print()}>Imprimir</button>
            <button className={styles.primary} type="submit" disabled={publicando}>
              {publicando ? 'Publicando…' : 'Publicar aviso'}
            </button>
          </div>
          <p className={styles.hint}>
            Un puesto. El cartel, la historia, el QR y el texto del grupo salen de lo mismo. Canva te da una imagen;
            esto te da un aviso que se puede postular.
          </p>
          <div className={styles.presets}>
            <button
              type="button"
              onClick={() => {
                setAviso(AVISO_VACIO);
                setReq('');
                setBen('');
                localStorage.removeItem(DRAFT_KEY);
              }}
            >
              En blanco
            </button>
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => {
                  setAviso(p.aviso);
                  setReq(p.aviso.requisitos.join('\n'));
                  setBen(p.aviso.beneficios.join('\n'));
                  localStorage.setItem(DRAFT_KEY, JSON.stringify(p.aviso));
                }}
              >
                {p.nombre}
              </button>
            ))}
          </div>
          <label className={styles.field}>Puesto</label>
          <input className={styles.control} value={aviso.puesto} onChange={(e) => actualizar({ puesto: e.target.value })} required />
          <label className={styles.field}>Negocio</label>
          <input className={styles.control} value={aviso.negocio} onChange={(e) => actualizar({ negocio: e.target.value })} required />
          <label className={styles.field}>Zona</label>
          <input className={styles.control} value={aviso.zona} onChange={(e) => actualizar({ zona: e.target.value })} />
          <label className={styles.field}>Pago</label>
          <input className={styles.control} value={aviso.pago} onChange={(e) => actualizar({ pago: e.target.value })} placeholder="Si no hay cifra, dilo" />
          <label className={styles.field}>Horario</label>
          <input className={styles.control} value={aviso.horario} onChange={(e) => actualizar({ horario: e.target.value })} />
          <label className={styles.field}>Qué piden (una línea cada uno)</label>
          <textarea className={styles.control} rows={3} value={req} onChange={(e) => { setReq(e.target.value); actualizar({}, e.target.value, ben); }} />
          <label className={styles.field}>Qué incluye</label>
          <textarea className={styles.control} rows={3} value={ben} onChange={(e) => { setBen(e.target.value); actualizar({}, req, e.target.value); }} />
          <label className={styles.field}>WhatsApp del negocio (9 dígitos)</label>
          <input className={styles.control}
            inputMode="numeric"
            value={aviso.whatsapp}
            onChange={(e) => actualizar({ whatsapp: e.target.value.replace(/\D/g, '').slice(0, 9) })}
            required
          />
          {error ? <p className={styles.error}>{error}</p> : null}
          {publicado ? (
            <div className={styles.ok}>
              <p>Listo. Este enlace es el aviso:</p>
              <p>
                <a href={publicado.path}>{url}</a>
              </p>
              <div className={styles.presets}>
                <button type="button" onClick={() => copiar(url)}>Copiar enlace</button>
                <button type="button" onClick={() => copiar(textoGrupo(aviso, url))}>Texto para el grupo</button>
                <button type="button" onClick={() => window.print()}>Imprimir</button>
                <a href={publicado.path}>Ver como postulante</a>
              </div>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
