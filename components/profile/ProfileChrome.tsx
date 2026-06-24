'use client';

import Link from 'next/link';
import { IconArrowLeft, IconEdit, IconQrcode, IconShareAlt } from '@/components/Icons';
import ProfileChromeMenu, { type ProfileMenuItem } from '@/components/profile/ProfileChromeMenu';
import { cn } from '@/lib/utils';

interface ProfileChromeProps {
  handle: string;
  siteLabel?: string;
  onShare?: () => void;
  onOpenQr?: () => void;
  canEdit?: boolean;
  onEdit?: () => void;
  menuItems?: ProfileMenuItem[];
  className?: string;
}

export default function ProfileChrome({
  handle,
  siteLabel = 'Buscadis.com',
  onShare,
  onOpenQr,
  canEdit,
  onEdit,
  menuItems = [],
  className,
}: ProfileChromeProps) {
  const profileUrl = `${siteLabel}/@${handle}`;

  return (
    <header
      className={cn('absolute top-0 inset-x-0 z-50 print:hidden', className)}
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0.5rem)' }}
    >
      <div className="max-w-6xl mx-auto px-3 h-11 flex items-center gap-2">
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
          {canEdit && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-black/25 backdrop-blur-md text-white hover:bg-black/40 transition-colors"
              aria-label="Editar página"
            >
              <IconEdit size={17} />
            </button>
          )}
          {onOpenQr && (
            <button
              type="button"
              onClick={onOpenQr}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-black/25 backdrop-blur-md text-white hover:bg-black/40 transition-colors"
              aria-label="Código QR"
            >
              <IconQrcode size={18} />
            </button>
          )}
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="h-9 w-9 hidden sm:flex items-center justify-center rounded-full bg-black/25 backdrop-blur-md text-white hover:bg-black/40 transition-colors"
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
