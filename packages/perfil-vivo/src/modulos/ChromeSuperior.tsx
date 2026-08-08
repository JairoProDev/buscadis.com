'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { usePerfil } from './PerfilContext';
import { useChromeUI } from './ChromeUIContext';
import { resolverModulos } from './resolver';
import {
  construirMenuSecciones,
  isFollowingNegocio,
  navegarAtrasBuscadis,
  perfilPublicUrl,
  scrollToAncla,
  setFollowingNegocio,
} from './chrome-nav';

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMore() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="5" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="19" r="1.6" fill="currentColor" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="pv-sheet" role="presentation">
      <button
        type="button"
        className="pv-sheet__scrim"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className="pv-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="pv-sheet__head">
          <h2 id={titleId} className="pv-sheet__title">
            {title}
          </h2>
          <button
            type="button"
            className="pv-sheet__close"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <IconClose />
          </button>
        </header>
        <div className="pv-sheet__body">{children}</div>
      </div>
    </div>
  );
}

function MenuSecciones() {
  const { payload } = usePerfil();
  const { panel, close } = useChromeUI();
  const secciones = useMemo(
    () => construirMenuSecciones(resolverModulos(payload.negocio), payload),
    [payload]
  );
  const [abiertas, setAbiertas] = useState<Record<string, boolean>>({});

  function ir(ancla: string) {
    close();
    // Deja cerrar el sheet antes de scrollear
    requestAnimationFrame(() => scrollToAncla(ancla));
  }

  return (
    <Sheet open={panel === 'secciones'} title="Secciones" onClose={close}>
      <ul className="pv-menu-sec">
        {secciones.map((s) => {
          const hasSubs = s.subitems.length > 0;
          const open = !!abiertas[s.tipo];
          return (
            <li key={s.tipo} className="pv-menu-sec__item">
              <div className="pv-menu-sec__row">
                <button
                  type="button"
                  className="pv-menu-sec__main"
                  onClick={() => ir(s.ancla)}
                >
                  <span className="pv-menu-sec__label">{s.titulo}</span>
                  {!open && s.resumen ? (
                    <span className="pv-menu-sec__resumen">{s.resumen}</span>
                  ) : null}
                </button>
                {hasSubs ? (
                  <button
                    type="button"
                    className="pv-menu-sec__chev"
                    aria-expanded={open}
                    aria-label={open ? 'Ocultar detalle' : 'Ver detalle'}
                    onClick={() =>
                      setAbiertas((prev) => ({
                        ...prev,
                        [s.tipo]: !prev[s.tipo],
                      }))
                    }
                  >
                    {open ? '−' : '+'}
                  </button>
                ) : null}
              </div>
              {hasSubs && open ? (
                <ul className="pv-menu-sec__subs">
                  {s.subitems.map((sub) => (
                    <li key={sub.id}>
                      <button
                        type="button"
                        className="pv-menu-sec__sub"
                        onClick={() => ir(s.ancla)}
                      >
                        {sub.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

function MenuMas() {
  const { payload } = usePerfil();
  const { panel, close } = useChromeUI();
  const slug = payload.negocio.slug;
  const [copied, setCopied] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followMsg, setFollowMsg] = useState<string | null>(null);

  useEffect(() => {
    setFollowing(isFollowingNegocio(slug));
  }, [slug]);

  const url = perfilPublicUrl(slug);

  async function onShare() {
    const title = payload.negocio.nombre;
    const text = `Mira el perfil de ${title} en Buscadis`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        close();
        return;
      }
    } catch {
      /* cancelado */
    }
    await onCopy();
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function onToggleFollow() {
    const next = !following;
    setFollowing(next);
    setFollowingNegocio(slug, next);
    if (!next) {
      setFollowMsg('Dejaste de seguir las novedades de este negocio.');
      return;
    }
    setFollowMsg(
      'Listo. Te avisaremos en este dispositivo cuando publique novedades.'
    );
    try {
      if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
        if (Notification.permission === 'granted') {
          setFollowMsg(
            'Campanita activada. Recibirás avisos cuando publique en Buscadis.'
          );
        }
      }
    } catch {
      /* permiso denegado: igual guardamos preferencia local */
    }
  }

  return (
    <Sheet open={panel === 'mas'} title="Más opciones" onClose={close}>
      <div className="pv-menu-mas">
        <button type="button" className="pv-menu-mas__btn" onClick={onShare}>
          <span className="pv-menu-mas__title">Compartir perfil</span>
          <span className="pv-menu-mas__hint">WhatsApp, redes u otras apps</span>
        </button>
        <button type="button" className="pv-menu-mas__btn" onClick={onCopy}>
          <span className="pv-menu-mas__title">
            {copied ? 'Enlace copiado' : 'Copiar enlace'}
          </span>
          <span className="pv-menu-mas__hint">{url}</span>
        </button>
        <button
          type="button"
          className="pv-menu-mas__btn"
          onClick={onToggleFollow}
          aria-pressed={following}
        >
          <span className="pv-menu-mas__title">
            {following ? 'Campanita activada' : 'Activar campanita'}
          </span>
          <span className="pv-menu-mas__hint">
            Avisos de lo que publique este negocio
          </span>
        </button>
        {followMsg ? <p className="pv-menu-mas__toast">{followMsg}</p> : null}
      </div>
    </Sheet>
  );
}

/** Chrome superior: atrás + hamburguesa + más (compartir / copiar / avisos). */
export function ChromeSuperior() {
  const { payload } = usePerfil();
  const { openSecciones, openMas } = useChromeUI();
  const [solid, setSolid] = useState(false);
  const slug = payload.negocio.slug;

  useEffect(() => {
    const hero = document.getElementById('identidad');
    if (!hero || typeof IntersectionObserver === 'undefined') {
      setSolid(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setSolid(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-8px 0px 0px 0px' }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <header
        className={`pv-chrome${solid ? ' pv-chrome--solid' : ''}`}
        data-solid={solid ? '1' : '0'}
      >
        <button
          type="button"
          className="pv-chrome__btn"
          aria-label="Volver a Buscadis"
          onClick={() => navegarAtrasBuscadis(slug)}
        >
          <IconBack />
        </button>
        <div className="pv-chrome__mid" aria-hidden={!solid}>
          {solid ? (
            <span className="pv-chrome__name">{payload.negocio.nombre}</span>
          ) : null}
        </div>
        <div className="pv-chrome__right">
          <button
            type="button"
            className="pv-chrome__btn"
            aria-label="Secciones del perfil"
            onClick={openSecciones}
          >
            <IconMenu />
          </button>
          <button
            type="button"
            className="pv-chrome__btn"
            aria-label="Más opciones"
            onClick={openMas}
          >
            <IconMore />
          </button>
        </div>
      </header>
      <MenuSecciones />
      <MenuMas />
    </>
  );
}
