'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaChartLine,
} from 'react-icons/fa';
import UserMenu from './UserMenu';
import HeaderIconButton from './HeaderIconButton';
import NotificationsPopover from './NotificationsPopover';
import MessagesPopover from './MessagesPopover';
import HeaderPopoverPanel from './HeaderPopoverPanel';
import { useUI } from '@/contexts/UIContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useConversations } from '@/hooks/useConversations';
import { useNotifications } from '@/hooks/useNotifications';
import { SeccionSidebar } from './SidebarDesktop';
import { MAIN_NAV_ITEMS, isMainNavActive, type MainNavId } from '@/lib/main-nav';
import { publishCta } from '@/lib/publish-cta-styles';
import CountryFlag from '@/components/location/CountryFlag';
import {
  IconChevronDown,
  IconBell,
  IconMoon,
  IconSun,
  IconMessages,
  IconMegaphone,
} from './Icons';
import { useAuth } from '@/hooks/useAuth';
import { Categoria } from '@/types';
import { getCategoriaLabel } from '@/lib/adiso-display';

interface HeaderProps {
  onChangelogClick?: () => void;
  seccionActiva?: SeccionSidebar;
  onSeccionChange?: (seccion: SeccionSidebar) => void;
  onToggleLeftSidebar?: () => void;
  ubicacion?: string;
  ubicacionCountryCode?: string;
  onUbicacionClick?: () => void;
  categoria?: Categoria | 'todos';
}

const LOGO_FONT = '"Plus Jakarta Sans", "Avenir Next", "Segoe UI", sans-serif';

export default function Header({
  onChangelogClick,
  onToggleLeftSidebar,
  ubicacion = 'Perú',
  ubicacionCountryCode = 'PE',
  onUbicacionClick,
  categoria = 'todos',
}: HeaderProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const notificationsAnchorRef = useRef<HTMLDivElement>(null);
  const messagesAnchorRef = useRef<HTMLDivElement>(null);
  const [activePopover, setActivePopover] = useState<'notifications' | 'messages' | null>(null);
  const [hoveredItem, setHoveredItem] = useState<MainNavId | null>(null);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>('auto');
  const { user } = useAuth();
  const { openChat } = useUI();
  const { unreadCount: unreadMessages } = useConversations();
  const { unreadCount: unreadNotifications } = useNotifications();
  const isAuthenticated = !!user;

  const categoriaLabel =
    categoria !== 'todos' ? getCategoriaLabel(categoria as Categoria) : 'Todas las categorías';
  const contextLine =
    categoria !== 'todos' ? `${categoriaLabel} · ${ubicacion}` : ubicacion;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      if (currentScrollY < 60) {
        setHeaderVisible(true);
      } else if (delta > 4) {
        setHeaderVisible(false);
      } else if (delta < -4) {
        setHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.style.setProperty('--header-height', headerVisible ? '72px' : '0px');
    return () => {
      document.documentElement.style.setProperty('--header-height', '72px');
    };
  }, [headerVisible, mounted]);

  const applyTheme = (mode: 'light' | 'dark' | 'auto') => {
    const root = document.documentElement;
    root.classList.remove('light-mode', 'dark-mode', 'dark');
    if (mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark-mode' : 'light-mode');
      if (prefersDark) root.classList.add('dark');
      return;
    }
    root.classList.add(mode === 'dark' ? 'dark-mode' : 'light-mode');
    if (mode === 'dark') root.classList.add('dark');
  };

  useEffect(() => {
    if (!mounted) return;
    const saved = (localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null) || 'auto';
    setThemeMode(saved);
  }, [mounted]);

  const toggleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    localStorage.setItem('theme', next);
    applyTheme(next);
  };

  const brandBlock = (
    <button
      type="button"
      onClick={onUbicacionClick}
      disabled={!onUbicacionClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isDesktop ? '10px' : '8px',
        background: 'none',
        border: '1px solid transparent',
        cursor: onUbicacionClick ? 'pointer' : 'default',
        padding: isDesktop ? '6px 10px 6px 6px' : '4px 8px 4px 4px',
        borderRadius: '12px',
        transition: 'background-color 0.2s, border-color 0.2s',
        textAlign: 'left',
        minWidth: 0,
        maxWidth: isDesktop ? '280px' : '100%',
      }}
      className={onUbicacionClick ? 'hover:bg-[var(--hover-bg)] hover:border-[var(--border-color)]' : undefined}
      aria-label="Cambiar ubicación y contexto de búsqueda"
    >
      <img
        src="/logo.png"
        alt=""
        aria-hidden
        style={{
          height: isDesktop ? '36px' : '32px',
          width: 'auto',
          objectFit: 'contain',
          flexShrink: 0,
        }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: isDesktop ? '1.15rem' : '1rem',
              fontWeight: 800,
              color: 'var(--brand-blue)',
              letterSpacing: '0.01em',
              lineHeight: 1.1,
              fontFamily: LOGO_FONT,
              whiteSpace: 'nowrap',
            }}
          >
            Buscadis
          </span>
          {onUbicacionClick && (
            <IconChevronDown size={12} className="text-[var(--text-tertiary)] shrink-0" />
          )}
        </div>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            lineHeight: 1.2,
            marginTop: '2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: isDesktop ? '200px' : '160px',
          }}
        >
          <CountryFlag code={ubicacionCountryCode} size={14} />
          <span
            style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
            suppressHydrationWarning
          >
            {contextLine}
          </span>
        </span>
      </div>
    </button>
  );

  const navItems = MAIN_NAV_ITEMS;

  const actionButtons = (
    <div className="flex items-center gap-0.5">
      <HeaderIconButton
        onClick={toggleTheme}
        accent="neutral"
        title={themeMode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        aria-label={themeMode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {themeMode === 'dark' ? (
          <IconSun size={17} color="var(--brand-yellow)" />
        ) : (
          <IconMoon size={17} color="var(--brand-blue)" />
        )}
      </HeaderIconButton>

      {mounted && isAuthenticated && (
        <>
          {onChangelogClick && isDesktop && (
            <HeaderIconButton
              onClick={onChangelogClick}
              accent="blue"
              title={t('header.progress')}
              aria-label={t('header.progress')}
            >
              <FaChartLine size={16} color="var(--brand-blue)" />
            </HeaderIconButton>
          )}

          <div ref={notificationsAnchorRef}>
            <HeaderIconButton
              onClick={() =>
                setActivePopover(activePopover === 'notifications' ? null : 'notifications')
              }
              active={activePopover === 'notifications'}
              accent="blue"
              badge={unreadNotifications}
              badgeAccent="blue"
              aria-label="Notificaciones"
            >
              <IconBell
                size={16}
                color={
                  activePopover === 'notifications'
                    ? 'var(--brand-blue)'
                    : 'var(--text-secondary)'
                }
              />
            </HeaderIconButton>
          </div>
          <HeaderPopoverPanel
            open={activePopover === 'notifications'}
            anchorRef={notificationsAnchorRef}
            onClose={() => setActivePopover(null)}
          >
            <NotificationsPopover onClose={() => setActivePopover(null)} />
          </HeaderPopoverPanel>

          <div ref={messagesAnchorRef}>
            <HeaderIconButton
              onClick={() => setActivePopover(activePopover === 'messages' ? null : 'messages')}
              active={activePopover === 'messages'}
              accent="yellow"
              badge={unreadMessages}
              badgeAccent="yellow"
              aria-label="Mensajes"
            >
              <IconMessages
                size={17}
                color={
                  activePopover === 'messages'
                    ? 'var(--brand-yellow)'
                    : 'var(--text-secondary)'
                }
              />
            </HeaderIconButton>
          </div>
          <HeaderPopoverPanel
            open={activePopover === 'messages'}
            anchorRef={messagesAnchorRef}
            onClose={() => setActivePopover(null)}
          >
            <MessagesPopover
              onClose={() => setActivePopover(null)}
              onOpenConversation={(id) => {
                setActivePopover(null);
                openChat(id);
              }}
            />
          </HeaderPopoverPanel>
        </>
      )}
    </div>
  );

  return (
    <header
      className="brand-header-sheen"
      style={{
        borderBottom: '1px solid var(--border-color)',
        borderRadius: '0 0 25px 25px',
        height: '72px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        display: 'grid',
        gridTemplateColumns: isDesktop ? '1fr auto 1fr' : 'minmax(0, 1fr) auto',
        alignItems: 'center',
        padding: isDesktop ? '0 1.25rem' : '0 0.65rem',
        columnGap: '12px',
        transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* LEFT: marca + contexto (botón de ubicación) */}
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, justifySelf: 'start' }}>
        {brandBlock}
      </div>

      {/* CENTER: navegación desktop — columna auto = centrada en la grilla */}
      {mounted && isDesktop && (
        <nav style={{ display: 'flex', gap: '4px', height: '100%', alignItems: 'stretch' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isMainNavActive(pathname, item.href);

            const isHovered = hoveredItem === item.id;
            const isPublishCta = item.id === 'publicar';
            const accentColor = 'var(--brand-blue)';

            if (isPublishCta) {
              return (
                <Link
                  href={item.href}
                  key={item.id}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    height: '100%',
                    padding: '0 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1px',
                      boxSizing: 'border-box',
                      padding: '2px',
                      height: 'calc(100% - 6px)',
                      aspectRatio: '1',
                      borderRadius: '14px',
                      background: isActive ? publishCta.backgroundActive : publishCta.background,
                      boxShadow: isActive ? publishCta.shadowActive : publishCta.shadow,
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                  >
                    <IconMegaphone size={30} color={publishCta.iconColor} />
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: publishCta.labelColor,
                        lineHeight: 1,
                        letterSpacing: '-0.02em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t(item.labelKey)}
                    </span>
                  </span>
                </Link>
              );
            }

            return (
              <Link
                href={item.href}
                key={item.id}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  height: '100%',
                  padding: '0 20px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isActive || isHovered ? accentColor : 'var(--text-secondary)',
                  transition: 'color 0.2s ease',
                  textDecoration: 'none',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '26px',
                    marginBottom: '2px',
                    transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 0.2s',
                  }}
                >
                  <Icon
                    size={22}
                    color={isActive || isHovered ? accentColor : undefined}
                  />
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: isActive ? 600 : 500,
                    opacity: isActive || isHovered ? 1 : 0.85,
                  }}
                >
                  {t(item.labelKey)}
                </span>
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '12px',
                    right: '12px',
                    height: '3px',
                    backgroundColor: accentColor,
                    opacity: isActive ? 1 : 0,
                    transition: 'opacity 0.2s',
                    borderTopLeftRadius: '3px',
                    borderTopRightRadius: '3px',
                  }}
                />
              </Link>
            );
          })}
        </nav>
      )}

      {/* RIGHT: acciones + usuario */}
      <div
        className="flex min-w-0 items-center justify-end justify-self-end"
        style={{ gap: isDesktop ? '4px' : '2px' }}
      >
        {actionButtons}
        {mounted && isAuthenticated && (
          <span
            className="mx-1 hidden h-6 w-px shrink-0 bg-[var(--border-color)] sm:block"
            aria-hidden
          />
        )}
        {mounted ? (
          <UserMenu onProgressClick={onChangelogClick} onSidebarToggle={onToggleLeftSidebar} />
        ) : (
          <div style={{ width: 36, height: 36, flexShrink: 0 }} aria-hidden />
        )}
      </div>
    </header>
  );
}
