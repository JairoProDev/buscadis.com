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
  const [mapFailed, setMapFailed] = useState(false);

  if (!u && !h) return null;

  const osmEmbed =
    u &&
    `https://www.openstreetmap.org/export/embed.html?bbox=${u.lng - 0.01}%2C${u.lat - 0.008}%2C${u.lng + 0.01}%2C${u.lat + 0.008}&layer=mapnik&marker=${u.lat}%2C${u.lng}`;

  const horarioDetalle = (() => {
    if (!h) return null;
    if (estadoVivo.abierto && estadoVivo.cierraEn) {
      return `Hoy hasta las ${estadoVivo.cierraEn}`;
    }
    if (!estadoVivo.abierto) {
      const rest = estadoVivo.mensaje.replace(/^Cerrado(\s*·\s*)?/i, '').trim();
      if (!rest || /^cerrado$/i.test(rest)) {
        return estadoVivo.abreEn ? `abre ${estadoVivo.abreEn}` : null;
      }
      return rest;
    }
    return null;
  })();

  return (
    <section className="pv-modulo" id="ubicacion">
      {u ? (
        <div className="pv-panel">
          <h2 style={{ margin: '0 0 12px', font: 'var(--ts-modulo)', color: 'var(--tx-strong)' }}>
            Ubicación
          </h2>
          {!mapFailed && osmEmbed ? (
            <div className="pv-map">
              <iframe
                title={`Mapa de ${u.direccion}`}
                src={osmEmbed}
                width="100%"
                height="168"
                style={{ border: 0, display: 'block' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onError={() => setMapFailed(true)}
              />
            </div>
          ) : (
            <div
              className="pv-map"
              style={{
                display: 'grid',
                placeItems: 'center',
                font: 'var(--ts-meta)',
                color: 'var(--tx-muted)',
                height: 120,
              }}
            >
              {u.distrito}, {u.provincia}
            </div>
          )}
          <p style={{ margin: '0 0 4px', font: 'var(--ts-cuerpo)', color: 'var(--tx-strong)' }}>
            {u.mostrarDireccionExacta ? u.direccion : `${u.distrito}, ${u.provincia}`}
          </p>
          <p style={{ margin: '0 0 12px', font: 'var(--ts-meta)', color: 'var(--tx-muted)' }}>
            {[u.distrito, u.provincia].filter(Boolean).join(', ')}
            {u.referencia &&
            u.referencia !== u.distrito &&
            u.referencia !== u.provincia &&
            !u.direccion.toLowerCase().includes(u.referencia.toLowerCase())
              ? ` · ${u.referencia}`
              : ''}
          </p>
          <div className="pv-btn-row">
            {handoffs.ruta ? (
              <a href={handoffs.ruta} className="pv-btn-row__primary">
                Cómo llegar
              </a>
            ) : null}
            <a
              href={`https://www.openstreetmap.org/?mlat=${u.lat}&mlon=${u.lng}#map=17/${u.lat}/${u.lng}`}
              target="_blank"
              rel="noreferrer"
              className="pv-btn-row__ghost"
            >
              Ver en mapa
            </a>
          </div>
        </div>
      ) : null}

      {h ? (
        <div className="pv-panel" id="horario" style={{ marginTop: u ? 12 : 0 }}>
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
            {horarioDetalle ? (
              <>
                <span style={{ color: 'var(--tx-faint)' }}> · </span>
                <span style={{ color: 'var(--tx-base)' }}>{horarioDetalle}</span>
              </>
            ) : null}
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
              fontWeight: 600,
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
