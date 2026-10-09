'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import styles from './aviso-empleo.module.css';
import {
  AVISO_PUCARA,
  AVISOS_CERCA,
  type AvisoCerca,
  type AvisoEmpleo,
  type Hecho,
  HECHO_LABEL,
  type TurnoAviso,
  digitsOnly,
  fichaTexto,
  formatPhone,
  loadAviso,
  saveAviso,
  textoGrupo,
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

export default function AvisoEmpleoStudio({ className }: { className?: string }) {
  const [aviso, setAviso] = useState<AvisoEmpleo>(AVISO_PUCARA);
  const [ready, setReady] = useState(false);
  const [vista, setVista] = useState<Vista>('aviso');
  const [turnoId, setTurnoId] = useState(AVISO_PUCARA.turnos[0].id);
  const [qr, setQr] = useState('');
  const [toast, setToast] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fichaAbierta, setFichaAbierta] = useState(false);
  const [ficha, setFicha] = useState<{ nombre: string; zona: string; hecho: Hecho | '' }>({
    nombre: '',
    zona: '',
    hecho: '',
  });
  const [vecino, setVecino] = useState<AvisoCerca | null>(null);
  const [stats, setStats] = useState({ vistas: 0, fichas: 0 });
  const fichaContada = useRef(false);
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

  useEffect(() => {
    if (!ready) return;
    const key = 'buscadis-aviso-stats';
    const seen = sessionStorage.getItem('buscadis-aviso-vista');
    const prev = JSON.parse(sessionStorage.getItem(key) || '{"vistas":0,"fichas":0}') as {
      vistas: number;
      fichas: number;
    };
    const next = seen ? prev : { ...prev, vistas: prev.vistas + 1 };
    if (!seen) sessionStorage.setItem('buscadis-aviso-vista', '1');
    sessionStorage.setItem(key, JSON.stringify(next));
    setStats(next);
  }, [ready]);

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
    const text = encodeURIComponent(textoGrupo(aviso, pageUrl));
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  async function copyGrupo() {
    try {
      await navigator.clipboard.writeText(textoGrupo(aviso, pageUrl));
      flash('Texto del grupo copiado');
    } catch {
      flash('No se pudo copiar el texto');
    }
  }

  async function downloadImage(format: 'feed' | 'estado') {
    try {
      const probe = document.querySelector('[data-aviso-root]');
      const computed = probe ? getComputedStyle(probe) : null;
      const display = computed?.getPropertyValue('--font-aviso').trim() || 'system-ui, sans-serif';
      const body = computed?.getPropertyValue('--font-aviso-body').trim() || 'system-ui, sans-serif';
      const blob = await renderAvisoPng(aviso, { display, body }, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${aviso.puesto.toLowerCase().replace(/\s+/g, '-')}-${format}.png`;
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

  const fichaLista = Boolean(ficha.nombre.trim().length > 1 && ficha.zona.trim() && ficha.hecho && turno);
  const applyHref =
    wa && turno && ficha.hecho
      ? `https://wa.me/${wa}?text=${encodeURIComponent(
          fichaTexto(aviso, turno, {
            nombre: ficha.nombre,
            zona: ficha.zona,
            hecho: ficha.hecho,
          }),
        )}`
      : undefined;

  function abrirFicha() {
    setVecino(null);
    setFichaAbierta(true);
    if (fichaContada.current) return;
    fichaContada.current = true;
    const key = 'buscadis-aviso-stats';
    const prev = JSON.parse(sessionStorage.getItem(key) || '{"vistas":0,"fichas":0}') as {
      vistas: number;
      fichas: number;
    };
    const next = { ...prev, fichas: prev.fichas + 1 };
    sessionStorage.setItem(key, JSON.stringify(next));
    setStats(next);
  }

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
              {vecino ? (
                <Vecino aviso={vecino} onBack={() => setVecino(null)} />
              ) : (
                <>
                  <Cartel aviso={aviso} turnoId={turno?.id} onSelect={setTurnoId} choosing />
                  <section className={styles.cerca}>
                    <h3>Otros avisos cerca</h3>
                    <p>
                      Quien escanea este cartel ya está buscando. Al terminar, ve más vacantes sin volver a Facebook.
                    </p>
                    {AVISOS_CERCA.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={styles.cercaCard}
                        onClick={() => {
                          setFichaAbierta(false);
                          setVecino(item);
                        }}
                      >
                        <strong>{item.puesto}</strong>
                        <span>
                          {item.negocio} · S/ {item.pago}
                        </span>
                        <span>{item.zona}</span>
                      </button>
                    ))}
                  </section>
                </>
              )}
            </div>
            {!vecino && (
              <div className={`${styles.bar} ${styles.noPrint}`}>
                <button
                  type="button"
                  className={styles.wa}
                  disabled={aviso.cubierta || !wa}
                  onClick={abrirFicha}
                >
                  {aviso.cubierta ? 'Vacante cubierta' : `Postular · ${turno?.nombre || 'este horario'}`}
                </button>
                <p>Primero tu nombre y de dónde vienes. El local no recibe un “info”.</p>
              </div>
            )}
            {fichaAbierta && !aviso.cubierta && wa && turno && (
              <FichaSheet
                turnoNombre={turno.nombre}
                ficha={ficha}
                setFicha={setFicha}
                lista={fichaLista}
                href={applyHref}
                onClose={() => setFichaAbierta(false)}
              />
            )}
          </>
        )}

        {vista === 'compartir' && (
          <div className={styles.panel}>
            <h1>Listo para pegar y pasar</h1>
            <p>
              El papel no lleva tu número. Quien postula llega con nombre, zona y horario. En este celular: {stats.vistas} {stats.vistas === 1 ? 'apertura' : 'aperturas'} y {stats.fichas} {stats.fichas === 1 ? 'ficha' : 'fichas'}.
            </p>
            <div className={styles.grid}>
              <button type="button" className={styles.action} onClick={shareWhatsApp}>
                <strong>WhatsApp</strong>
                <span>Texto para un grupo, con el enlace</span>
              </button>
              <button type="button" className={styles.action} onClick={copyGrupo}>
                <strong>Texto del grupo</strong>
                <span>Para pegarlo en Facebook</span>
              </button>
              <button type="button" className={styles.action} onClick={copyLink}>
                <strong>Copiar enlace</strong>
                <span>Para pegarlo donde quieras</span>
              </button>
              <button type="button" className={styles.action} onClick={() => downloadImage('estado')}>
                <strong>Estado</strong>
                <span>Imagen vertical para WhatsApp</span>
              </button>
              <button type="button" className={styles.action} onClick={() => downloadImage('feed')}>
                <strong>Imagen</strong>
                <span>Para un post, sin abrir otro programa</span>
              </button>
              <button type="button" className={styles.action} onClick={() => window.print()}>
                <strong>Imprimir</strong>
                <span>Afiche con QR y tiras para arrancar</span>
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
        <PrintSheet aviso={aviso} qr={qr} url={pageUrl.replace(/^https?:\/\//, '')} />
      </div>
    </div>
  );
}

function FichaSheet({
  turnoNombre,
  ficha,
  setFicha,
  lista,
  href,
  onClose,
}: {
  turnoNombre: string;
  ficha: { nombre: string; zona: string; hecho: Hecho | '' };
  setFicha: (next: { nombre: string; zona: string; hecho: Hecho | '' }) => void;
  lista: boolean;
  href?: string;
  onClose: () => void;
}) {
  return (
    <form
      className={styles.sheet}
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <div className={styles.turnoHead}>
        <h2>Tu ficha, en un mensaje</h2>
        <button type="button" onClick={onClose}>
          Cerrar
        </button>
      </div>
      <p>Horario elegido: {turnoNombre}. El local lee esto en vez de un “info”.</p>
      <label className={styles.field}>
        <span>Tu nombre</span>
        <input
          value={ficha.nombre}
          autoComplete="name"
          onChange={(e) => setFicha({ ...ficha, nombre: e.target.value })}
        />
      </label>
      <label className={styles.field}>
        <span>De dónde vienes</span>
        <input
          value={ficha.zona}
          placeholder="San Sebastián, Wanchaq…"
          onChange={(e) => setFicha({ ...ficha, zona: e.target.value })}
        />
      </label>
      <div className={styles.choices}>
        {(Object.keys(HECHO_LABEL) as Hecho[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={ficha.hecho === key}
            onClick={() => setFicha({ ...ficha, hecho: key })}
          >
            {HECHO_LABEL[key]}
          </button>
        ))}
      </div>
      {lista && href ? (
        <a className={styles.wa} href={href} target="_blank" rel="noopener noreferrer">
          Enviar por WhatsApp
        </a>
      ) : (
        <button type="button" className={styles.wa} disabled>
          Completa los tres datos
        </button>
      )}
    </form>
  );
}

function Vecino({ aviso, onBack }: { aviso: AvisoCerca; onBack: () => void }) {
  return (
    <article className={styles.body}>
      <button type="button" className={styles.ghost} onClick={onBack}>
        Volver a este aviso
      </button>
      <p className={styles.seeking}>Otro aviso cerca</p>
      <h2 className={styles.puesto}>{aviso.puesto}</h2>
      <p className={styles.zona}>
        {aviso.negocio} · {aviso.zona}
      </p>
      <p className={styles.pago}>
        <small>S/</small>
        {aviso.pago}
      </p>
      <p className={styles.complemento}>{aviso.horario}</p>
      <p className={styles.presentarse}>
        En el marketplace este aviso tiene su propia página, su QR y su ficha. Aquí es una muestra para ver el recorrido.
      </p>
    </article>
  );
}

function PrintSheet({ aviso, qr, url }: { aviso: AvisoEmpleo; qr: string; url: string }) {
  const pago = aviso.turnos[0]?.pago || '';
  return (
    <section className={styles.printSheet} aria-hidden="true">
      <p className={styles.printKicker}>{aviso.cubierta ? 'Vacante cubierta' : 'Se busca'}</p>
      <h1>{aviso.puesto}</h1>
      <p className={styles.printMeta}>
        {aviso.negocio} · {aviso.zona}
      </p>
      {aviso.turnos.map((turno) => (
        <p key={turno.id} className={styles.printTurno}>
          {turno.nombre}: S/ {turno.pago} · {turno.horario}
        </p>
      ))}
      <div className={styles.printQr}>
        {qr ? <img src={qr} alt="" /> : null}
        <p>Postula escaneando. No escribas solo “info”: el aviso ya dice sueldo y horario.</p>
      </div>
      <div className={styles.strips}>
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className={styles.strip}>
            <span>{aviso.puesto}</span>
            <span>S/ {pago}</span>
            <span>{url}</span>
          </div>
        ))}
      </div>
    </section>
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
