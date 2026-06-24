'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { BusinessWithRole } from '@/lib/business-access';
import { cn } from '@/lib/utils';
import { IconPlus, IconComunidad } from '@/components/Icons';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Dueño',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Lectura',
};

interface BusinessSwitcherProps {
  businesses: BusinessWithRole[];
  currentBusinessId?: string;
  /** Al cambiar de negocio (id + slug si existe) */
  onSelect?: (businessId: string, slug?: string) => void;
  className?: string;
  compact?: boolean;
  /** Oculta enlaces Nuevo / Equipo (p. ej. barra del editor en móvil) */
  hideActions?: boolean;
  /** Añade opción "+ Crear nuevo negocio" al final del select */
  combobox?: boolean;
}

export default function BusinessSwitcher({
  businesses,
  currentBusinessId,
  onSelect,
  className,
  compact = false,
  hideActions = false,
  combobox = false,
}: BusinessSwitcherProps) {
  const router = useRouter();

  const handleChange = (id: string) => {
    if (id === '__new__') {
      router.push('/mi-negocio?new=1');
      return;
    }
    const picked = businesses.find((b) => b.profile.id === id);
    if (!picked) return;
    if (onSelect) {
      onSelect(id, picked.profile.slug);
      return;
    }
    if (picked.profile.slug) {
      router.push(`/${picked.profile.slug}?edit=true`);
    } else {
      router.push(`/mi-negocio?business=${id}`);
    }
  };

  if (businesses.length === 0) {
    return (
      <Link
        href="/mi-negocio?new=1"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-blue,#53acc5)] px-3 py-1.5 text-xs font-bold text-white hover:brightness-110',
          className
        )}
      >
        <IconPlus size={14} />
        Crear negocio
      </Link>
    );
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="flex items-center gap-1.5 min-w-0">
        {!compact && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide shrink-0">
            Negocio
          </span>
        )}
        <select
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-800 max-w-[160px] sm:max-w-[200px] font-medium truncate"
          value={currentBusinessId || businesses[0]?.profile.id || ''}
          onChange={(e) => handleChange(e.target.value)}
          aria-label="Seleccionar negocio"
        >
          {businesses.map(({ profile: p, role }) => (
            <option key={p.id} value={p.id}>
              {p.name || p.slug}
              {role !== 'owner' ? ` (${ROLE_LABELS[role] || role})` : ''}
            </option>
          ))}
          {combobox && (
            <option value="__new__">+ Crear nuevo negocio</option>
          )}
        </select>
      </div>

      {!hideActions && (
        <>
          <button
            type="button"
            onClick={() => router.push('/mi-negocio?new=1')}
            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-blue,#2563eb)] hover:underline whitespace-nowrap"
          >
            <IconPlus size={12} />
            Nuevo
          </button>

          {currentBusinessId && (
            <Link
              href={`/mi-negocio/equipo?business=${currentBusinessId}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 whitespace-nowrap"
            >
              <IconComunidad size={12} />
              Equipo
            </Link>
          )}
        </>
      )}
    </div>
  );
}
