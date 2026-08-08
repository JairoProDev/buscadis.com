'use client';

import { useState } from 'react';
import type { DiaSemana } from '../../types';
import { usePerfil } from '../PerfilContext';

const DIAS_LABEL: Record<DiaSemana, string> = {
  lun: 'Lun',
  mar: 'Mar',
  mie: 'Mié',
  jue: 'Jue',
  vie: 'Vie',
  sab: 'Sáb',
  dom: 'Dom',
};

const ORDEN: DiaSemana[] = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];

export function UbicacionHorarioShell() {
  const { payload, handoffs } = usePerfil();
  const { negocio, estadoVivo } = payload;
  const u = negocio.ubicacion;
  const h = negocio.horario;
  const [openWeek, setOpenWeek] = useState(false);

  if (!u && !h) return null;

  const staticMap =
    u &&
    `https://staticmap.openstreetmap.de/staticmap.php?center=${u.lat},${u.lng}&zoom=15&size=440x160&markers=${u.lat},${u.lng},red-pushpin`;

  return (
    <section className="pv-modulo" id="ubicacion">
      {u ? (
        <>
          <h2 style={{ margin: '0 0 12px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
            Ubicación
          </h2>
          {staticMap ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={staticMap}
              alt={`Mapa de ${u.direccion}`}
              width={440}
              height={160}
              style={{
                width: '100%',
                height: 160,
                objectFit: 'cover',
                borderRadius: 'var(--rd-md)',
                background: 'var(--sf-sunk)',
                marginBottom: 12,
              }}
            />
          ) : null}
          <p style={{ margin: '0 0 4px', font: 'var(--ts-cuerpo)', color: 'var(--tx-strong)' }}>
            {u.mostrarDireccionExacta ? u.direccion : `${u.distrito}, ${u.provincia}`}
          </p>
          {u.referencia ? (
            <p style={{ margin: '0 0 12px', font: 'var(--ts-meta)', color: 'var(--tx-muted)' }}>
              {u.referencia}
            </p>
          ) : (
            <div style={{ height: 12 }} />
          )}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {handoffs.ruta ? (
              <a
                href={handoffs.ruta}
                style={{
                  flex: 1,
                  minHeight: 44,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 'var(--rd-md)',
                  background: 'var(--mk-accion)',
                  color: 'var(--mk-sobre)',
                  textDecoration: 'none',
                  font: 'var(--ts-card)',
                }}
              >
                Cómo llegar
              </a>
            ) : null}
            {u ? (
              <a
                href={`https://www.openstreetmap.org/?mlat=${u.lat}&mlon=${u.lng}#map=17/${u.lat}/${u.lng}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  minHeight: 44,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 'var(--rd-md)',
                  border: '1px solid var(--bd-soft)',
                  color: 'var(--tx-base)',
                  textDecoration: 'none',
                  font: 'var(--ts-card)',
                }}
              >
                Ver en mapa
              </a>
            ) : null}
          </div>
        </>
      ) : null}

      {h ? (
        <div id="horario">
          <h2 style={{ margin: '0 0 8px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
            Horario
          </h2>
          <p style={{ margin: '0 0 8px', font: 'var(--ts-cuerpo)' }}>
            <span
              style={{
                color: estadoVivo.abierto ? 'var(--ok)' : 'var(--err)',
                fontWeight: 600,
              }}
            >
              {estadoVivo.abierto ? 'Abierto ahora' : 'Cerrado'}
            </span>
            <span style={{ color: 'var(--tx-faint)' }}> · </span>
            {estadoVivo.mensaje}
          </p>
          <button
            type="button"
            onClick={() => setOpenWeek((v) => !v)}
            style={{
              minHeight: 44,
              border: 'none',
              background: 'transparent',
              color: 'var(--mk-texto)',
              font: 'var(--ts-meta)',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            {openWeek ? 'Ocultar semana' : 'Ver toda la semana'}
          </button>
          {openWeek ? (
            <table
              style={{
                width: '100%',
                marginTop: 12,
                font: 'var(--ts-meta)',
                borderCollapse: 'collapse',
              }}
            >
              <tbody>
                {ORDEN.map((d) => {
                  const franjas = h.semana[d] ?? [];
                  return (
                    <tr key={d}>
                      <th
                        scope="row"
                        style={{
                          textAlign: 'left',
                          padding: '6px 0',
                          color: 'var(--tx-muted)',
                          fontWeight: 500,
                        }}
                      >
                        {DIAS_LABEL[d]}
                      </th>
                      <td style={{ padding: '6px 0', fontFamily: 'var(--ff-data)' }}>
                        {franjas.length
                          ? franjas.map((f) => `${f.desde}–${f.hasta}`).join(', ')
                          : 'Cerrado'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
