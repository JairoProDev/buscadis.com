'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import styles from './aviso-empleo.module.css';
import {
  AVISO_PUCARA,
  type AvisoEmpleo,
  type TurnoAviso,
  digitsOnly,
  formatPhone,
  loadAviso,
  saveAviso,
  whatsappNumber,
} from './aviso-data';
import { renderAvisoPng } from './render-aviso-png';

type Vista = 'aviso' | 'compartir' | 'editar';

const EMPTY_TURNO = (id: string): TurnoAviso => ({
  id,
  nombre: '',
  pago: '',
  complemento: '',
  horario: '',
  detalle: '',
});

function candidateText(aviso: AvisoEmpleo, turno: TurnoAviso) {
  return `Hola, vi el aviso de ${aviso.puesto} en ${aviso.negocio}. Me interesa el horario ${turno.nombre.toLowerCase()} (${turno.horario}). ¿Siguen buscando?`;
}

function ownerText(aviso: AvisoEmpleo, url: string) {
  const pagos = aviso.turnos.map((t) => `${t.nombre}: S/ ${t.pago}`).join('. ');
  return `${aviso.negocio} busca ${aviso.puesto.toLowerCase()}. ${pagos}. ${aviso.zona}. Postula aquí: ${url}`;
}

export default function AvisoEmpleoStudio({ className }: { className?: string }) {
  const [aviso, setAviso] = useState<AvisoEmpleo>(AVISO_PUCARA);
  const [ready, setReady] = useState(false);
  const [vista, setVista] = useState<Vista>('aviso');
  const [turnoId, setTurnoId] = useState(AVISO_PUCARA.turnos[0].id);
  const [qr, setQr] = useState('');
  const [toast, setToast] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formId = useId();

  useEffect(() => {
    const stored = loadAviso();
    setAviso(stored);
    setTurnoId(stored.turnos[0]?.id || 'dia');
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveAviso(aviso);
  }, [aviso, ready]);

  const pageUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'https://buscadis.com/empleo/probar';
    return `${window.location.origin}/empleo/probar`;
  }, [ready]);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(pageUrl, {
      margin: 1,
      width: 280,
      color: { dark: '#14343F', light: '#FFFFFF' },
    }).then((url) => {
      if (!cancelled) setQr(url);
    });
    return () => {
      cancelled = true;
    };
  }, [pageUrl]);

  const turno = aviso.turnos.find((t) => t.id === turnoId) || aviso.turnos[0];
  const wa = whatsappNumber(aviso.whatsapp);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  }

  async function copyLink() {
    try {
      await Promise.race([
        navigator.clipboard.writeText(pageUrl),
        new Promise((_, reject) => {
          window.setTimeout(() => reject(new Error('timeout')), 700);
        }),
      ]);
      flash('Enlace copiado');
    } catch {
      flash(pageUrl);
    }
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(ownerText(aviso, pageUrl));
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  async function downloadImage() {
    try {
      const probe = document.querySelector('[data-aviso-root]');
      const computed = probe ? getComputedStyle(probe) : null;
      const display = computed?.getPropertyValue('--font-aviso').trim() || 'system-ui, sans-serif';
      const body = computed?.getPropertyValue('--font-aviso-body').trim() || 'system-ui, sans-serif';
      const blob = await renderAvisoPng(aviso, { display, body });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${aviso.puesto.toLowerCase().replace(/\s+/g, '-')}.png`;
      a.click();
      URL.revokeObjectURL(url);
      flash('Imagen lista');
    } catch {
      flash('No se pudo crear la imagen. Usa Imprimir.');
    }
  }

  function validate(next: AvisoEmpleo) {
    const nextErrors: Record<string, string> = {};
    if (!next.puesto.trim()) nextErrors.puesto = 'Escribe el puesto.';
    if (!next.negocio.trim()) nextErrors.negocio = 'Escribe el nombre del local.';
    if (!whatsappNumber(next.whatsapp)) nextErrors.whatsapp = 'Un celular de Perú, 9 dígitos, empieza en 9.';
    if (!next.turnos[0]?.pago.trim() || !next.turnos[0]?.horario.trim()) {
      nextErrors.turno0 = 'El primer horario necesita pago y horas.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function publishEdit() {
    if (!validate(aviso)) return;
    setVista('compartir');
    flash('Aviso actualizado');
  }

  const applyHref =
    wa && turno
      ? `https://wa.me/${wa}?text=${encodeURIComponent(candidateText(aviso, turno))}`
      : undefined;

  return (
    <div
      className={`${styles.studio} ${className || ''}`}
      data-aviso-root=""
    >
      <div className={styles.column}>
        <header className={`${styles.top} ${vista === 'aviso' ? '' : styles.noPrint}`}>
          <button type="button" className={styles.brand} onClick={() => setVista('aviso')}>
            <small>Buscadis · Empleo</small>
            <strong>{aviso.negocio}</strong>
          </button>
          <div className={styles.topActions}>
            {vista !== 'aviso' && (
              <button type="button" className={styles.ghost} onClick={() => setVista('aviso')}>
                Ver aviso
              </button>
            )}
            {vista === 'aviso' && (
              <button type="button" className={styles.ghost} onClick={() => setVista('compartir')}>
                Compartir
              </button>
            )}
          </div>
        </header>

        {vista === 'aviso' && (
          <>
            <div className={styles.scroll}>
              <Cartel
                aviso={aviso}
                turnoId={turno?.id}
                onSelect={setTurnoId}
                choosing
              />
            </div>
            <div className={`${styles.bar} ${styles.noPrint}`}>
              {aviso.cubierta || !applyHref ? (
                <button type="button" className={styles.wa} disabled>
                  {aviso.cubierta ? 'Vacante cubierta' : 'Falta un WhatsApp válido'}
                </button>
              ) : (
                <a className={styles.wa} href={applyHref} target="_blank" rel="noopener noreferrer">
                  Postular · {turno?.nombre}
                </a>
              )}
              <p>Abre WhatsApp con el horario que elegiste ya escrito.</p>
            </div>
          </>
        )}

        {vista === 'compartir' && (
          <div className={styles.panel}>
            <h1>Listo para pegar y pasar</h1>
            <p>
              El mismo aviso sale para la puerta, el estado y el grupo. Si cambias el pago o lo cierras, esta página es la que queda.
            </p>
            <div className={styles.grid}>
              <button type="button" className={styles.action} onClick={shareWhatsApp}>
                <strong>WhatsApp</strong>
                <span>Texto para un grupo o un estado</span>
              </button>
              <button type="button" className={styles.action} onClick={copyLink}>
                <strong>Copiar enlace</strong>
                <span>Para pegarlo donde quieras</span>
              </button>
              <button type="button" className={styles.action} onClick={downloadImage}>
                <strong>Imagen</strong>
                <span>Para publicar sin abrir otro programa</span>
              </button>
              <button type="button" className={styles.action} onClick={() => window.print()}>
                <strong>Imprimir</strong>
                <span>Cartel para la puerta o el mostrador</span>
              </button>
            </div>
            {toast && <p className={styles.toast}>{toast}</p>}
            <div className={styles.qrRow}>
              {qr ? <img src={qr} alt="" /> : <div />}
              <div>
                <p>El QR abre este aviso en el celular de quien lo escanea.</p>
                <p>En esta prueba guarda los cambios en este navegador. Al publicarlo de verdad, el enlace queda fijo.</p>
              </div>
            </div>
            <Cartel aviso={aviso} />
            <button type="button" className={styles.solid} onClick={() => setVista('editar')}>
              Cambiar datos
            </button>
            {aviso.cubierta ? (
              <button
                type="button"
                className={styles.danger}
                onClick={() => setAviso({ ...aviso, cubierta: false })}
              >
                Volver a recibir postulaciones
              </button>
            ) : confirmClose ? (
              <button
                type="button"
                className={styles.danger}
                onClick={() => {
                  setAviso({ ...aviso, cubierta: true });
                  setConfirmClose(false);
                  setVista('aviso');
                }}
              >
                Confirmar: el puesto ya está cubierto
              </button>
            ) : (
              <button type="button" className={styles.danger} onClick={() => setConfirmClose(true)}>
                Marcar vacante cubierta
              </button>
            )}
          </div>
        )}

        {vista === 'editar' && (
          <form
            className={styles.panel}
            onSubmit={(e) => {
              e.preventDefault();
              publishEdit();
            }}
          >
            <p className={styles.previewLabel}>Así se ve</p>
            <Cartel aviso={aviso} />
            <h1>Datos del aviso</h1>
            <div className={styles.form}>
              <label className={styles.field}>
                <span>Local</span>
                <input
                  value={aviso.negocio}
                  onChange={(e) => setAviso({ ...aviso, negocio: e.target.value })}
                  autoComplete="organization"
                  aria-invalid={Boolean(errors.negocio)}
                />
                {errors.negocio && <small>{errors.negocio}</small>}
              </label>
              <label className={styles.field}>
                <span>Puesto</span>
                <input
                  value={aviso.puesto}
                  onChange={(e) => setAviso({ ...aviso, puesto: e.target.value })}
                  aria-invalid={Boolean(errors.puesto)}
                  aria-describedby={errors.puesto ? `${formId}-puesto` : undefined}
                />
                {errors.puesto && <small id={`${formId}-puesto`}>{errors.puesto}</small>}
              </label>
              <label className={styles.field}>
                <span>Dónde</span>
                <input
                  value={aviso.zona}
                  onChange={(e) => setAviso({ ...aviso, zona: e.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span>WhatsApp del local</span>
                <input
                  inputMode="numeric"
                  autoComplete="tel"
                  value={formatPhone(aviso.whatsapp)}
                  onChange={(e) => setAviso({ ...aviso, whatsapp: digitsOnly(e.target.value) })}
                  aria-invalid={Boolean(errors.whatsapp)}
                />
                {errors.whatsapp && <small>{errors.whatsapp}</small>}
              </label>
              {aviso.turnos.map((item, index) => (
                <fieldset key={item.id} className={styles.field}>
                  <div className={styles.turnoHead}>
                    <span>Horario {index + 1}</span>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setAviso({ ...aviso, turnos: aviso.turnos.filter((t) => t.id !== item.id) })
                        }
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <input
                    aria-label={`Nombre del horario ${index + 1}`}
                    placeholder={index === 0 ? 'Día completo' : 'Tarde'}
                    value={item.nombre}
                    onChange={(e) => updateTurno(aviso, setAviso, item.id, { nombre: e.target.value })}
                  />
                  <input
                    aria-label={`Pago del horario ${index + 1}, en soles`}
                    inputMode="decimal"
                    placeholder={index === 0 ? '1,725' : '600'}
                    value={item.pago}
                    onChange={(e) => updateTurno(aviso, setAviso, item.id, { pago: e.target.value })}
                  />
                  <input
                    aria-label={`Horas del horario ${index + 1}`}
                    placeholder={index === 0 ? '10:00 a.m. al cierre' : '5:30 p.m. al cierre'}
                    value={item.horario}
                    onChange={(e) => updateTurno(aviso, setAviso, item.id, { horario: e.target.value })}
                  />
                  {index === 0 && errors.turno0 && <small>{errors.turno0}</small>}
                </fieldset>
              ))}
              {aviso.turnos.length < 2 && (
                <button
                  type="button"
                  className={styles.ghost}
                  onClick={() =>
                    setAviso({ ...aviso, turnos: [...aviso.turnos, EMPTY_TURNO('extra')] })
                  }
                >
                  Agregar otro horario
                </button>
              )}
              <label className={styles.field}>
                <span>Cómo presentarse</span>
                <textarea
                  rows={3}
                  value={aviso.presentarse}
                  onChange={(e) => setAviso({ ...aviso, presentarse: e.target.value })}
                />
              </label>
              <button type="submit" className={styles.solid}>
                Guardar y compartir
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function updateTurno(
  aviso: AvisoEmpleo,
  setAviso: (next: AvisoEmpleo) => void,
  id: string,
  patch: Partial<TurnoAviso>,
) {
  setAviso({
    ...aviso,
    turnos: aviso.turnos.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  });
}

function Cartel({
  aviso,
  turnoId,
  onSelect,
  choosing = false,
}: {
  aviso: AvisoEmpleo;
  turnoId?: string;
  onSelect?: (id: string) => void;
  choosing?: boolean;
}) {
  return (
    <article>
      <header className={styles.mast}>
        <p className={styles.kicker}>{aviso.rubro}</p>
        <p className={styles.negocio}>{aviso.negocio}</p>
      </header>
      <div className={styles.body}>
        <p className={styles.seeking}>{aviso.cubierta ? 'Vacante cubierta' : 'Se busca'}</p>
        <h2 className={styles.puesto}>{aviso.puesto}</h2>
        <p className={styles.zona}>{aviso.zona}</p>
        {choosing && aviso.turnos.length > 1 && !aviso.cubierta && (
          <p className={styles.hint}>Elige el horario al que vas a postular.</p>
        )}
        <div className={styles.tickets}>
          {aviso.turnos.map((turno) => {
            const selected = turno.id === turnoId;
            const inner = (
              <>
                <div className={styles.ticketTop}>
                  <span>{turno.nombre || 'Horario'}</span>
                  <em>{turno.horario}</em>
                </div>
                <p className={styles.pago}>
                  <small>S/</small>
                  {turno.pago || '—'}
                </p>
                {turno.complemento && <p className={styles.complemento}>{turno.complemento}</p>}
                {turno.detalle && <p className={styles.detalle}>{turno.detalle}</p>}
              </>
            );
            if (!choosing || aviso.cubierta) {
              return (
                <div key={turno.id} className={styles.ticket}>
                  {inner}
                </div>
              );
            }
            return (
              <button
                key={turno.id}
                type="button"
                className={styles.ticket}
                aria-pressed={selected}
                onClick={() => onSelect?.(turno.id)}
              >
                {inner}
              </button>
            );
          })}
        </div>
        {aviso.condiciones.length > 0 && (
          <ul className={styles.list}>
            {aviso.condiciones.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        {aviso.presentarse && (
          <p className={styles.presentarse}>
            <strong>Presentarse</strong>
            {aviso.presentarse}
          </p>
        )}
        {aviso.cubierta && (
          <p className={styles.covered}>Este puesto ya se cubrió. El QR y el enlace dejan de recibir postulaciones.</p>
        )}
      </div>
    </article>
  );
}
