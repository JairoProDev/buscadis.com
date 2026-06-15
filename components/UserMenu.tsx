'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { useHeaderIdentity, HeaderRoleTone } from '@/hooks/useHeaderIdentity';
import AuthModal from './AuthModal';
import { IconStore, IconChevronDown } from './Icons';
import { FaChartLine } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';

interface UserMenuProps {
  onProgressClick?: () => void;
  onSidebarToggle?: () => void;
}

const ROLE_TONE_CLASS: Record<HeaderRoleTone, string> = {
  business: 'text-[var(--brand-yellow)]',
  publisher: 'text-[var(--brand-blue)]',
  verified: 'text-emerald-600 dark:text-emerald-400',
  admin: 'text-violet-600 dark:text-violet-400',
  default: 'text-[var(--text-secondary)]',
};

function UserMenuFallback() {
  return <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--hover-bg)] animate-pulse" />;
}

function UserMenuContent({ onProgressClick }: UserMenuProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isAnunciante, isVerificado } = useUser();
  const identity = useHeaderIdentity();
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMostrarMenu(false);
      }
    };

    if (mostrarMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarMenu]);

  const goTo = (tab?: string) => {
    setMostrarMenu(false);
    router.push(tab ? `/perfil?tab=${tab}` : '/perfil');
  };

  const handleSignOut = async () => {
    await signOut();
    setMostrarMenu(false);
  };

  const roleClass = ROLE_TONE_CLASS[identity.roleTone];

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMostrarMenu(!mostrarMenu)}
        aria-expanded={mostrarMenu}
        aria-haspopup="menu"
        aria-label={`Menú de ${identity.displayName}`}
        className={`flex max-w-[200px] items-center gap-2 rounded-xl px-1 py-1 transition-colors duration-150 sm:max-w-[220px] ${
          mostrarMenu
            ? 'bg-[var(--hover-bg)]'
            : 'bg-transparent hover:bg-[var(--hover-bg)]'
        }`}
      >
        {/* Avatar — sin borde ni contenedor extra */}
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[rgba(var(--brand-primary-rgb),0.12)]">
          {identity.avatarUrl ? (
            <img
              src={identity.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-[var(--brand-blue)]">
              {identity.initials}
            </span>
          )}
          {identity.isBusinessMode && (
            <span
              className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand-yellow)] text-[8px]"
              title="Modo negocio"
            >
              🏪
            </span>
          )}
        </div>

        {/* Nombre + rol — visible desde sm */}
        <div className="hidden min-w-0 flex-1 text-left sm:block">
          <p className="truncate text-[13px] font-semibold leading-tight text-[var(--text-primary)]">
            {identity.displayName}
          </p>
          <p className={`truncate text-[10px] font-medium leading-tight ${roleClass}`}>
            {identity.roleLabel}
          </p>
        </div>

        <IconChevronDown
          size={12}
          className={`shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 ${
            mostrarMenu ? 'rotate-180' : ''
          }`}
        />
      </button>

      {mostrarMenu && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[1001] min-w-[260px] overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-[0_12px_40px_rgba(0,0,0,0.12)] animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Header del dropdown — mismo lenguaje visual */}
          <div className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3">
            <button
              type="button"
              onClick={() => goTo()}
              className="flex w-full items-center gap-3 text-left"
            >
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[rgba(var(--brand-primary-rgb),0.12)]">
                {identity.avatarUrl ? (
                  <img src={identity.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-bold text-[var(--brand-blue)]">
                    {identity.initials}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                  {identity.displayName}
                </p>
                <p className={`truncate text-xs font-medium ${roleClass}`}>
                  {identity.roleLabel}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-[var(--text-secondary)]">
                  {user?.email}
                </p>
              </div>
            </button>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {isVerificado && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                  ✓ Verificado
                </span>
              )}
              {isAnunciante && !identity.isBusinessMode && (
                <span className="rounded-full bg-[rgba(var(--brand-primary-rgb),0.15)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-blue)]">
                  Anunciante
                </span>
              )}
              {identity.isBusinessMode && (
                <span className="rounded-full bg-[rgba(var(--brand-yellow-rgb),0.2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-primary)]">
                  Modo negocio
                </span>
              )}
            </div>
          </div>

          <div className="p-1.5">
            <MenuItem
              icon={<IconStore size={18} />}
              label="Mi Negocio"
              onClick={() => {
                setMostrarMenu(false);
                router.push('/mi-negocio');
              }}
            />
            <MenuItem
              icon={<span className="text-base">👤</span>}
              label="Mi perfil"
              onClick={() => goTo()}
            />
            <MenuItem
              icon={<span className="text-base">💬</span>}
              label="Mensajes"
              onClick={() => goTo('mensajes')}
            />
            <MenuItem
              icon={<span className="text-base">♥</span>}
              label="Guardados"
              onClick={() => goTo('guardados')}
            />
            <MenuItem
              icon={<span className="text-base">⚙️</span>}
              label="Ajustes"
              onClick={() => goTo('ajustes')}
            />
            {onProgressClick && (
              <MenuItem
                icon={<FaChartLine size={16} />}
                label={t('header.progress')}
                onClick={() => {
                  setMostrarMenu(false);
                  onProgressClick();
                }}
              />
            )}

            <div className="my-1 h-px bg-[var(--border-color)]" />

            <div className="px-3 py-2">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
                Preferencias
              </p>
              <div className="flex flex-col gap-2">
                <LanguageSelector />
                <ThemeToggle />
              </div>
            </div>

            <div className="my-1 h-px bg-[var(--border-color)]" />

            <MenuItem
              icon={<span className="text-base">🚪</span>}
              label="Cerrar sesión"
              onClick={handleSignOut}
              danger
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserMenu(props: UserMenuProps) {
  const [mostrarAuthModal, setMostrarAuthModal] = useState(false);
  const { user } = useAuth();

  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setMostrarAuthModal(true)}
          className="rounded-lg bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Ingresar
        </button>
        <AuthModal abierto={mostrarAuthModal} onCerrar={() => setMostrarAuthModal(false)} />
      </>
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
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
        danger
          ? 'text-red-500 hover:bg-red-500/5'
          : 'text-[var(--text-primary)] hover:bg-[var(--hover-bg)]'
      }`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[var(--text-secondary)]">
        {icon}
      </span>
      {label}
    </button>
  );
}
