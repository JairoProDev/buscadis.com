'use client';

import { useState } from 'react';
import type { AvisoEmpleo } from '@/lib/empleo/model';
import { AvisoCartel } from './AvisoCartel';
import styles from './creador.module.css';

export function AvisoPublico({
  aviso,
  url,
  activa,
}: {
  aviso: AvisoEmpleo;
  url: string;
  activa: boolean;
}) {
  const [abierta, setAbierta] = useState(false);
  const [nombre, setNombre] = useState('');
  const [zona, setZona] = useState('');
  const [experiencia, setExperiencia] = useState('');

  function enviar() {
    const texto = [
      `Hola, vi el aviso de ${aviso.puesto} en ${aviso.negocio} por Buscadis.`,
      `Me llamo ${nombre.trim()}.`,
      `Vivo en ${zona.trim()}.`,
      experiencia.trim() ? `Experiencia o disponibilidad: ${experiencia.trim()}.` : '',
    ]
      .filter(Boolean)
      .join('\n');
    window.location.href = `https://wa.me/51${aviso.whatsapp}?text=${encodeURIComponent(texto)}`;
  }

  return (
    <div className={styles.public}>
      <main className={styles.publicMain}>
        <AvisoCartel aviso={aviso} format="a4" url={url} cubierta={!activa} />
        <p className={styles.hint}>No pedimos CV ni edad. La postulación llega al WhatsApp del negocio.</p>
      </main>
      <div className={styles.bar}>
        <button className={styles.primary} type="button" disabled={!activa} onClick={() => setAbierta(true)}>
          {activa ? 'Postular' : 'Convocatoria cubierta'}
        </button>
      </div>
      {abierta ? (
        <div className={styles.ficha}>
          <form
            className={styles.sheetForm}
            onSubmit={(e) => {
              e.preventDefault();
              enviar();
            }}
          >
            <h2>Tu ficha</h2>
            <p className={styles.hint}>Tres datos. Se abre WhatsApp con el mensaje listo.</p>
            <label className={styles.field}>Nombre</label>
            <input className={styles.control} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            <label className={styles.field}>Dónde vives</label>
            <input className={styles.control} value={zona} onChange={(e) => setZona(e.target.value)} required />
            <label className={styles.field}>Experiencia o disponibilidad</label>
            <textarea className={styles.control} rows={3} value={experiencia} onChange={(e) => setExperiencia(e.target.value)} />
            <div className={styles.presets}>
              <button type="button" className={styles.ghost} onClick={() => setAbierta(false)}>
                Cerrar
              </button>
              <button className={styles.primary} type="submit">
                Enviar por WhatsApp
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
