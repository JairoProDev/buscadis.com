'use client';

import Link from 'next/link';
import { IconArrowLeft, IconEdit, IconQrcode, IconShareAlt } from '@/components/Icons';
import ProfileChromeMenu, { type ProfileMenuItem } from '@/components/profile/ProfileChromeMenu';
import { cn } from '@/lib/utils';

export type ProfileEditAccess = 'allowed' | 'login_required' | 'denied';

interface ProfileChromeProps {
  handle: string;
  siteLabel?: string;
  onShare?: () => void;
  onOpenQr?: () => void;
  editAccess?: ProfileEditAccess;
  onEditRequest?: () => void;
  menuItems?: ProfileMenuItem[];
  className?: string;
  /** Dentro del banner redondeado (no flota fuera del contenedor). */
  variant?: 'overlay' | 'fixed';
}

export default function ProfileChrome({
  handle,
  siteLabel = 'Buscadis.com',
  onShare,
  onOpenQr,
  editAccess = 'login_required',
  onEditRequest,
  menuItems = [],
  className,
  variant = 'fixed',
}: ProfileChromeProps) {
  const profileUrl = `${siteLabel}/@${handle}`;
  const editEnabled = editAccess === 'allowed';
  const editBlocked = editAccess === 'denied';
  const isOverlay = variant === 'overlay';

  return (
    <header
      className={cn(
        'print:hidden',
        isOverlay
          ? 'relative w-full z-20'
          : 'absolute top-0 inset-x-0 z-50',
        className
      )}
      style={
        isOverlay
          ? undefined
          : { paddingTop: 'max(env(safe-area-inset-top, 0px), 0.5rem)' }
      }
    >
      <div
        className={cn(
          'flex items-center gap-2',
          isOverlay ? 'w-full px-2 sm:px-3 h-11' : 'max-w-[960px] mx-auto px-3 h-11'
        )}
      >
        <Link
          href="/?utm_source=profile&utm_medium=back"
          className="flex items-center gap-1 shrink-0 text-white/95 hover:text-white drop-shadow-md transition-colors"
          aria-label="Volver a Buscadis"
        >
          <IconArrowLeft size={18} />
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold tracking-tight">
            <span className="w-5 h-5 rounded-md bg-[var(--brand-color)] flex items-center justify-center text-[10px] text-white font-black">
              B
            </span>
          </span>
        </Link>

        <div className="flex-1 min-w-0 text-center">
          <p className="text-[11px] sm:text-xs font-medium text-white/90 truncate drop-shadow-md m-0">
            {profileUrl}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onEditRequest && editAccess !== 'denied' && (
            <button
              type="button"
              onClick={onEditRequest}
              className={cn(
                'h-9 w-9 flex items-center justify-center rounded-lg backdrop-blur-md transition-colors shadow-md',
                editEnabled
                  ? 'bg-white/95 text-slate-900 hover:bg-white'
                  : editBlocked
                    ? 'bg-white/40 text-white/70'
                    : 'bg-white/90 text-slate-800 hover:bg-white'
              )}
              aria-label={
                editEnabled
                  ? 'Editar página'
                  : editBlocked
                    ? 'Sin permiso para editar'
                    : 'Iniciar sesión para editar'
              }
              title={
                editEnabled
                  ? 'Editar página'
                  : editBlocked
                    ? 'Este perfil no te pertenece'
                    : 'Inicia sesión para editar'
              }
            >
              <IconEdit size={16} />
            </button>
          )}
          {onOpenQr && (
            <button
              type="button"
              onClick={onOpenQr}
              className="h-9 w-9 flex items-center justify-center rounded-lg bg-black/30 backdrop-blur-md text-white hover:bg-black/50 transition-colors"
              aria-label="Código QR"
            >
              <IconQrcode size={18} />
            </button>
          )}
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="h-9 w-9 hidden sm:flex items-center justify-center rounded-lg bg-black/30 backdrop-blur-md text-white hover:bg-black/50 transition-colors"
              aria-label="Compartir"
            >
              <IconShareAlt size={16} />
            </button>
          )}
          <ProfileChromeMenu items={menuItems} />
        </div>
      </div>
    </header>
  );
}
