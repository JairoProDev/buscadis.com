'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useHeaderIdentity } from '@/hooks/useHeaderIdentity';
import AuthModal from './AuthModal';
import {
  IconStore,
  IconChevronDown,
  IconUser,
  IconMessages,
  IconHeartOutline,
  IconSettings,
  IconSignOut,
  IconVerified,
} from './Icons';
import { FaChartLine } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import ModeIndicator, { ModeSubtitle } from '@/components/profile/ModeIndicator';

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
  const identity = useHeaderIdentity();
  const { t } = useTranslation();
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMostrarMenu(false);
      }
    };
    if (mostrarMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      icon: <IconStore size={16} color="var(--brand-yellow)" />,
      iconBg: 'bg-[rgba(var(--brand-yellow-rgb),0.15)]',
      label: 'Mi negocio',
      onClick: () => {
        setMostrarMenu(false);
        router.push('/mi-negocio');
      },
    },
    {
      icon: <IconUser size={16} color="var(--brand-blue)" />,
      iconBg: 'bg-[rgba(var(--brand-primary-rgb),0.12)]',
      label: 'Mi perfil',
      onClick: () => goTo(),
    },
    {
      icon: <IconMessages size={16} color="var(--brand-yellow)" />,
      iconBg: 'bg-[rgba(var(--brand-yellow-rgb),0.15)]',
      label: 'Mensajes',
      onClick: () => goTo('mensajes'),
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
              <IconVerified size={14} color="#22c55e" />
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

      {mostrarMenu && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[1001] w-[min(100vw-1.5rem,300px)] overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-[0_16px_48px_rgba(15,23,42,0.12)]"
        >
          {/* Cabecera */}
          <div className="border-b border-[var(--border-color)] px-4 py-3.5">
            <button
              type="button"
              onClick={() => goTo()}
              className="flex w-full items-start gap-3 text-left"
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
                    <IconVerified size={16} color="#22c55e" />
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

          <div className="p-1.5">
            <MenuItem
              icon={<IconSignOut size={16} color="#ef4444" />}
              iconBg="bg-red-500/8"
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
          className="rounded-xl bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
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
