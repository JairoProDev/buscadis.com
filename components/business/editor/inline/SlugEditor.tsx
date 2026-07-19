'use client';

import { useEffect, useState } from 'react';
import { IconCheck } from '@/components/Icons';
import { checkSlugAvailability } from '@/lib/business';
import { normalizeBusinessSlug } from '@/lib/business/normalize-slug';
import { isReservedBusinessSlug } from '@/lib/business/reserved-slugs';

interface SlugEditorProps {
  currentSlug: string;
  onSave: (slug: string) => void;
  onClose: () => void;
}

function cleanSlug(raw: string): string {
  return normalizeBusinessSlug(raw)
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

export default function SlugEditor({ currentSlug, onSave, onClose }: SlugEditorProps) {
  const [value, setValue] = useState(currentSlug);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<'idle' | 'available' | 'taken' | 'reserved' | 'invalid'>(
    'idle'
  );

  const normalized = cleanSlug(value);
  const changed = normalized !== currentSlug.toLowerCase();

  useEffect(() => {
    if (!changed) {
      setStatus('idle');
      return;
    }
    if (normalized.length < 3) {
      setStatus('invalid');
      return;
    }
    if (isReservedBusinessSlug(normalized)) {
      setStatus('reserved');
      return;
    }
    let cancelled = false;
    setChecking(true);
    const t = setTimeout(async () => {
      const available = await checkSlugAvailability(normalized);
      if (cancelled) return;
      setChecking(false);
      setStatus(available ? 'available' : 'taken');
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [normalized, changed]);

  const canSave = changed && !checking && status === 'available';

  const handleSave = () => {
    if (!canSave) return;
    onSave(normalized);
    onClose();
  };

  return (
    <div>
      <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
        Al cambiar tu usuario, el enlace público de tu perfil cambiará
        (<span className="font-semibold">buscadis.com/@{normalized || 'usuario'}</span>). Los
        enlaces anteriores dejarán de funcionar.
      </div>

      <div className="flex items-center gap-1 mb-1">
        <span className="text-slate-400 font-medium">@</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="mi-negocio"
          className="flex-1 px-3 py-2.5 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
          style={{ borderColor: 'var(--border-color)' }}
          autoFocus
        />
      </div>

      <div className="min-h-[1.25rem] mb-4 text-xs">
        {checking && <span className="text-slate-400">Comprobando disponibilidad...</span>}
        {!checking && status === 'available' && (
          <span className="text-green-600 font-semibold">Disponible</span>
        )}
        {!checking && status === 'taken' && (
          <span className="text-red-500 font-semibold">Ese usuario ya está en uso</span>
        )}
        {!checking && status === 'reserved' && (
          <span className="text-red-500 font-semibold">Ese usuario está reservado</span>
        )}
        {!checking && status === 'invalid' && (
          <span className="text-red-500 font-semibold">Usa al menos 3 caracteres (a-z, 0-9, -)</span>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--brand-blue)' }}
        >
          <IconCheck size={18} />
          Guardar
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-3 rounded-xl font-medium hover:bg-slate-100 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
