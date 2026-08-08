'use client';

import React from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePathname, useRouter } from 'next/navigation';
import { SeccionSidebar } from './SidebarDesktop';
import { IconMegaphone } from './Icons';
import { MAIN_NAV_ITEMS, isMainNavActive } from '@/lib/main-nav';
import { publishCta } from '@/lib/publish-cta-styles';
import { useTranslation } from '@/hooks/useTranslation';

interface NavbarMobileProps {
  seccionActiva: SeccionSidebar | null;
  onCambiarSeccion: (seccion: SeccionSidebar) => void;
  tieneAdisoAbierto: boolean;
}

/** Mobile tab bar — 56px + safe-area, always visible (Sprint 7). */
export default function NavbarMobile({
  seccionActiva,
  onCambiarSeccion,
  tieneAdisoAbierto,
}: NavbarMobileProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [mounted, setMounted] = React.useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (isDesktop) return null;

  return (
    <nav
      className="brand-nav-sheen"
      aria-label="Navegación principal"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(var(--bs-nav-height, 56px) + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'stretch',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
        zIndex: 1500,
      }}
    >
      {MAIN_NAV_ITEMS.map((seccion) => {
        const IconComponent = seccion.icon;
        const pathActive = isMainNavActive(pathname, seccion.href);
        const sidebarActive =
          pathname === '/' && !!seccion.sidebarId && seccionActiva === seccion.sidebarId;
        const estaActiva = pathActive || sidebarActive;

        const esPublicar = seccion.id === 'publicar';
        const tieneNotificacion = seccion.id === 'inicio' && tieneAdisoAbierto && !estaActiva;

        const handleClick = () => {
          router.push(seccion.href);
          if (seccion.sidebarId && pathname === '/') {
            onCambiarSeccion(seccion.sidebarId);
          }
        };

        if (esPublicar) {
          return (
            <button
              key={seccion.id}
              type="button"
              onClick={handleClick}
              aria-label="Publicar aviso"
              aria-current={estaActiva ? 'page' : undefined}
              className="navbar-item navbar-item--cta"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                padding: '4px 0.25rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                position: 'relative',
                minHeight: 'var(--bs-nav-height, 56px)',
              }}
            >
              <span
                className="flex items-center justify-center transition-transform duration-150 ease-out active:scale-[0.94]"
                style={{
                  width: '44px',
                  height: '44px',
                  marginTop: '-10px',
                  borderRadius: '50%',
                  background: estaActiva ? publishCta.backgroundActive : publishCta.background,
                  boxShadow: estaActiva ? publishCta.shadowActive : publishCta.shadow,
                }}
              >
                <IconMegaphone size={22} color={publishCta.iconColor} />
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: publishCta.labelColor,
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                }}
              >
                {t(seccion.labelKey)}
              </span>
            </button>
          );
        }

        return (
          <button
            key={seccion.id}
            type="button"
            onClick={handleClick}
            aria-label={t(seccion.labelKey)}
            aria-current={estaActiva ? 'page' : undefined}
            className="navbar-item"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              padding: '4px 0.35rem',
              border: 'none',
              backgroundColor: 'transparent',
              color: estaActiva ? 'var(--brand-blue)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              fontSize: '0.65rem',
              fontWeight: estaActiva ? 600 : 500,
              transition: 'color 0.2s',
              position: 'relative',
              minHeight: 'var(--bs-nav-height, 56px)',
            }}
          >
            <span
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconComponent size={22} color={estaActiva ? 'var(--brand-blue)' : undefined} />
              {tieneNotificacion && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--text-primary)',
                    border: '2px solid var(--bg-primary)',
                  }}
                />
              )}
            </span>
            <span style={{ lineHeight: 1 }}>{t(seccion.labelKey)}</span>
            {estaActiva && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '28px',
                  height: '3px',
                  backgroundColor: 'var(--brand-blue)',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
