'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { AvisoEmpleo } from '@/lib/empleo/model';
import styles from './creador.module.css';

export function AvisoCartel({
  aviso,
  format,
  url,
  cubierta,
}: {
  aviso: AvisoEmpleo;
  format: 'a4' | 'story';
  url: string;
  cubierta?: boolean;
}) {
  const [qr, setQr] = useState('');

  useEffect(() => {
    let cancel = false;
    QRCode.toDataURL(url, { margin: 0, width: 180 }).then((data) => {
      if (!cancel) setQr(data);
    });
    return () => {
      cancel = true;
    };
  }, [url]);

  const corto = url.replace(/^https?:\/\//, '');

  return (
    <article className={`${styles.sheet} ${format === 'story' ? styles.story : ''}`} id="aviso-cartel">
      <header className={styles.head}>
        <div className={styles.logo}>
          <b>Busca</b>dis
        </div>
        <div className={cubierta ? styles.closed : styles.open}>
          {cubierta ? 'CUBIERTA' : 'CONVOCATORIA ABIERTA'}
        </div>
      </header>
      <h1 className={styles.role}>{aviso.puesto || 'El puesto'}</h1>
      <div className={styles.biz}>{aviso.negocio || 'Tu negocio'}</div>
      <div className={styles.zone}>{aviso.zona || 'Cusco'}</div>
      <div className={styles.pay}>
        <small>PAGO</small>
        <strong>{aviso.pago || 'El sueldo se dice en la entrevista'}</strong>
      </div>
      {aviso.horario ? (
        <div className={styles.block}>
          <h3>Horario</h3>
          <p>{aviso.horario}</p>
        </div>
      ) : null}
      {aviso.beneficios.length ? (
        <div className={styles.block}>
          <h3>Incluye</h3>
          <ul>
            {aviso.beneficios.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {aviso.requisitos.length ? (
        <div className={styles.block}>
          <h3>Piden</h3>
          <ul>
            {aviso.requisitos.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <footer className={styles.footer}>
        <div>
          <p>Postula en el enlace. El papel no lleva teléfono.</p>
          <strong>{corto}</strong>
        </div>
        {qr ? <img className={styles.qr} src={qr} alt="Código para postular" /> : <div className={styles.qr} />}
      </footer>
      {format === 'a4' ? (
        <div className={styles.strips}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div className={styles.strip} key={i}>
              <b>{aviso.puesto || 'Puesto'}</b>
              {aviso.pago || 'Consulta el pago'}
              <br />
              {corto}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
