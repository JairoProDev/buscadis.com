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

export default function NavbarMobile({
  seccionActiva,
  onCambiarSeccion,
  tieneAdisoAbierto
}: NavbarMobileProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [mounted, setMounted] = React.useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [navVisible, setNavVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      if (currentScrollY < 60) {
        setNavVisible(true);
      } else if (delta > 4) {
        setNavVisible(false);
      } else if (delta < -4) {
        setNavVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  if (!mounted) return null;
  if (isDesktop) return null;

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .navbar-item--cta:active > span:first-child {
          transform: scale(0.94);
        }
        .navbar-item--cta > span:first-child {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
      `}</style>
      <nav
        className="brand-nav-sheen"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-end',
          paddingTop: '0.35rem',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
          zIndex: 1500,
          transform: navVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        {MAIN_NAV_ITEMS.map((seccion) => {
          const IconComponent = seccion.icon;
          const pathActive = isMainNavActive(pathname, seccion.href);
          const sidebarActive =
            pathname === '/' &&
            !!seccion.sidebarId &&
            seccionActiva === seccion.sidebarId;
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
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.2rem',
                  padding: '0 0.25rem 0.4rem',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  position: 'relative',
                  minHeight: '64px',
                }}
                className="navbar-item navbar-item--cta"
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '52px',
                    height: '52px',
                    marginTop: '-18px',
                    borderRadius: '50%',
                    background: estaActiva ? publishCta.backgroundActive : publishCta.background,
                    boxShadow: estaActiva ? publishCta.shadowActive : publishCta.shadow,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  <IconMegaphone size={26} color={publishCta.iconColor} />
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: publishCta.labelColor,
                    letterSpacing: '0.01em',
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
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '0.25rem',
                padding: '0 0.5rem 0.55rem',
                border: 'none',
                backgroundColor: 'transparent',
                color: estaActiva ? 'var(--brand-blue)' : 'var(--text-tertiary)',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: estaActiva ? 600 : 500,
                transition: 'color 0.2s',
                position: 'relative',
                minHeight: '64px',
              }}
              className="navbar-item"
            >
              <span
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconComponent size={24} color={estaActiva ? 'var(--brand-blue)' : undefined} />
                {tieneNotificacion && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--text-primary)',
                      border: '2px solid var(--bg-primary)',
                    }}
                  />
                )}
              </span>
              <span>{t(seccion.labelKey)}</span>
              {estaActiva && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '30px',
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
    </>
  );
}
