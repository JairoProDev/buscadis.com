'use client';

import React, { useState, useRef, useEffect, useCallback, useLayoutEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { useHeaderIdentity } from '@/hooks/useHeaderIdentity';
import { useUI } from '@/contexts/UIContext';
import {
  IconStore,
  IconChevronDown,
  IconHeartOutline,
  IconSettings,
  IconSignOut,
  IconVerified,
  IconPlus,
  IconMegaphone,
  IconMotorcycle,
  IconInfluencer,
} from './Icons';
import { FaChartLine } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import ModeIndicator, { ModeSubtitle } from '@/components/profile/ModeIndicator';
import BuscadisSocialLinksRow from '@/components/BuscadisSocialLinksRow';
import { semantic } from '@/lib/bs-tokens';

interface UserMenuProps {
  onProgressClick?: () => void;
  onSidebarToggle?: () => void;
}

function UserMenuFallback() {
  return <div className="h-9 w-20 shrink-0 animate-pulse rounded-xl bg-[var(--hover-bg)]" />;
}

function UserMenuContent({ onProgressClick }: UserMenuProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isPlatformAdmin } = useUser();
  const identity = useHeaderIdentity();
  const { t } = useTranslation();
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(300, window.innerWidth - margin * 2);
    let left = rect.right - width;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    const maxHeight = Math.max(160, window.innerHeight - rect.bottom - margin);
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left,
      width,
      zIndex: 1101,
      maxHeight: `min(85dvh, ${maxHeight}px)`,
    });
  }, []);

  useEffect(() => {
    setMenuMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mostrarMenu) return;
    updateMenuPosition();
  }, [mostrarMenu, updateMenuPosition]);

  useEffect(() => {
    if (!mostrarMenu) return;
    const onReposition = () => updateMenuPosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [mostrarMenu, updateMenuPosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setMostrarMenu(false);
    };
    if (mostrarMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mostrarMenu]);

  useEffect(() => {
    if (!mostrarMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMostrarMenu(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mostrarMenu]);

  const goTo = (tab?: string) => {
    setMostrarMenu(false);
    router.push(tab ? `/perfil?tab=${tab}` : '/perfil');
  };

  const handleSignOut = async () => {
    await signOut();
    setMostrarMenu(false);
  };

  const navItems = [
    {
      icon: <IconMegaphone size={16} color="var(--brand-blue)" />,
      iconBg: 'bg-[rgba(var(--brand-primary-rgb),0.12)]',
      label: 'Publicar un adiso',
      onClick: () => {
        setMostrarMenu(false);
        router.push('/publicar');
      },
    },
    {
      icon: <IconMotorcycle size={20} color="var(--brand-blue)" />,
      iconBg: 'bg-[rgba(var(--brand-primary-rgb),0.12)]',
      label: 'Hacer delivery',
      onClick: () => {
        setMostrarMenu(false);
        router.push('/delivery');
      },
    },
    {
      icon: <IconInfluencer size={16} color="var(--brand-yellow)" />,
      iconBg: 'bg-[rgba(var(--brand-yellow-rgb),0.15)]',
      label: 'Ser influencer',
      onClick: () => {
        setMostrarMenu(false);
        router.push('/perfil/creator');
      },
    },
    {
      icon: <IconStore size={16} color="var(--brand-yellow)" />,
      iconBg: 'bg-[rgba(var(--brand-yellow-rgb),0.15)]',
      label: 'Mi negocio',
      onClick: () => {
        setMostrarMenu(false);
        router.push('/mi-negocio');
      },
    },
    {
      icon: <IconPlus size={16} color="var(--brand-blue)" />,
      iconBg: 'bg-[rgba(var(--brand-primary-rgb),0.12)]',
      label: 'Crear otro negocio',
      onClick: () => {
        setMostrarMenu(false);
        router.push('/mi-negocio?new=1');
      },
    },
    {
      icon: <IconHeartOutline size={16} color="var(--brand-blue)" />,
      iconBg: 'bg-[rgba(var(--brand-primary-rgb),0.12)]',
      label: 'Guardados',
      onClick: () => goTo('guardados'),
    },
    {
      icon: <IconSettings size={16} color="var(--text-secondary)" />,
      iconBg: 'bg-[var(--bg-tertiary)]',
      label: 'Ajustes',
      onClick: () => goTo('ajustes'),
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setMostrarMenu(!mostrarMenu)}
        aria-expanded={mostrarMenu}
        aria-haspopup="menu"
        aria-label={`Menú de ${identity.displayName}`}
        className={`flex max-w-[210px] items-center gap-2 rounded-xl px-1 py-1 transition-colors duration-150 sm:max-w-[240px] ${
          mostrarMenu ? 'bg-[var(--hover-bg)]' : 'hover:bg-[var(--hover-bg)]'
        }`}
      >
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[rgba(var(--brand-primary-rgb),0.1)]">
          {identity.avatarUrl ? (
            <img src={identity.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-[var(--brand-blue)]">
              {identity.initials}
            </span>
          )}
          {identity.isVerificado && (
            <span
              className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--bg-primary)]"
              title="Cuenta verificada"
            >
              <IconVerified size={14} color={semantic.successFg} />
            </span>
          )}
        </div>

        <div className="hidden min-w-0 flex-1 sm:block">
          <p className="flex items-center gap-1 truncate text-[13px] font-semibold leading-tight text-[var(--text-primary)]">
            <span className="truncate">{identity.displayName}</span>
          </p>
          <ModeSubtitle display={identity.modeDisplay} />
        </div>

        <IconChevronDown
          size={12}
          className={`shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 ${
            mostrarMenu ? 'rotate-180' : ''
          }`}
        />
      </button>

      {mostrarMenu && menuMounted && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 z-[1100] bg-black/25 sm:bg-transparent"
            aria-hidden
            onClick={() => setMostrarMenu(false)}
          />
          <div
            ref={menuRef}
            role="menu"
            style={menuStyle}
            className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-[var(--popover-shadow)]"
          >
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
          >
          {/* Cabecera */}
          <div className="border-b border-[var(--border-color)] p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => goTo()}
              aria-label="Ir a mi perfil"
              className="flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-[var(--hover-bg)]"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[rgba(var(--brand-primary-rgb),0.1)]">
                {identity.avatarUrl ? (
                  <img src={identity.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-bold text-[var(--brand-blue)]">
                    {identity.initials}
                  </span>
                )}
                {identity.isVerificado && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--bg-primary)]">
                    <IconVerified size={16} color={semantic.successFg} />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                  {identity.displayName}
                </p>
                <div className="mt-1">
                  <ModeIndicator display={identity.modeDisplay} size="md" />
                </div>
                <p className="mt-1 truncate text-[11px] text-[var(--text-tertiary)]">
                  {user?.email}
                </p>
              </div>
            </button>
          </div>

          {/* Navegación */}
          <div className="p-1.5">
            {navItems.map((item) => (
              <MenuItem
                key={item.label}
                icon={item.icon}
                iconBg={item.iconBg}
                label={item.label}
                onClick={item.onClick}
              />
            ))}
            {onProgressClick && (
              <MenuItem
                icon={<FaChartLine size={15} color="var(--brand-blue)" />}
                iconBg="bg-[rgba(var(--brand-primary-rgb),0.12)]"
                label={t('header.progress')}
                onClick={() => {
                  setMostrarMenu(false);
                  onProgressClick();
                }}
              />
            )}
          </div>

          {isPlatformAdmin && (
            <>
              <div className="mx-3 h-px bg-[var(--border-color)]" />
              <div className="px-3 pb-1 pt-2">
                <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Equipo Buscadis
                </p>
              </div>
              <div className="p-1.5 pt-0">
                <MenuItem
                  icon={<FaChartLine size={15} color="var(--brand-yellow)" />}
                  iconBg="bg-[rgba(var(--brand-yellow-rgb),0.15)]"
                  label="CRM Comercial"
                  onClick={() => {
                    setMostrarMenu(false);
                    router.push('/admin/comercial');
                  }}
                />
                <MenuItem
                  icon={<FaChartLine size={15} color="var(--brand-blue)" />}
                  iconBg="bg-[rgba(var(--brand-primary-rgb),0.12)]"
                  label="Intelligence"
                  onClick={() => {
                    setMostrarMenu(false);
                    router.push('/admin/intelligence');
                  }}
                />
              </div>
            </>
          )}

          <div className="mx-3 h-px bg-[var(--border-color)]" />

          <div className="px-4 py-3">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Buscadis en redes
            </p>
            <BuscadisSocialLinksRow
              iconSize={17}
              buttonSize={38}
              onLinkClick={() => setMostrarMenu(false)}
            />
          </div>

          <div className="mx-3 h-px bg-[var(--border-color)]" />

          {/* Preferencias */}
          <div className="px-4 py-3">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Preferencias
            </p>
            <div className="flex flex-col gap-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>

          <div className="mx-3 h-px bg-[var(--border-color)]" />

          <div className="p-1.5 pb-2">
            <MenuItem
              icon={<IconSignOut size={16} color={semantic.dangerFg} />}
              iconBg="bg-red-500/8"
              label="Cerrar sesión"
              onClick={handleSignOut}
              danger
            />
          </div>
          </div>
        </div>
        </>,
        document.body,
      )}
    </div>
  );
}

export default function UserMenu(props: UserMenuProps) {
  const { openAuthModal } = useUI();
  const { user } = useAuth();

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => void openAuthModal('login')}
        className="rounded-xl bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Entrar
      </button>
    );
  }

  return (
    <Suspense fallback={<UserMenuFallback />}>
      <UserMenuContent {...props} />
    </Suspense>
  );
}

function MenuItem({
  icon,
  iconBg,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm font-medium transition-colors ${
        danger
          ? 'text-red-500 hover:bg-red-500/5'
          : 'text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}
