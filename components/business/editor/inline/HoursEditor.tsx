'use client';

import { useState } from 'react';
import type { BusinessHours, BusinessProfile } from '@/types/business';
import { IconCheck } from '@/components/Icons';

interface HoursEditorProps {
  profile: Partial<BusinessProfile>;
  onPatch: (patch: Partial<BusinessProfile>) => void;
  onClose: () => void;
}

const DAYS: { key: string; label: string }[] = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
];

function initialHours(hours?: BusinessHours): BusinessHours {
  const base: BusinessHours = {};
  for (const { key } of DAYS) {
    const existing = hours?.[key];
    base[key] = existing
      ? { open: existing.open || '09:00', close: existing.close || '18:00', closed: !!existing.closed }
      : { open: '09:00', close: '18:00', closed: false };
  }
  return base;
}

export default function HoursEditor({ profile, onPatch, onClose }: HoursEditorProps) {
  const [hours, setHours] = useState<BusinessHours>(initialHours(profile.business_hours));

  const setDay = (key: string, patch: Partial<BusinessHours[string]>) => {
    setHours((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const handleSave = () => {
    onPatch({ business_hours: hours });
    onClose();
  };

  return (
    <div>
      <div className="space-y-2 mb-4">
        {DAYS.map(({ key, label }) => {
          const day = hours[key];
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-sm font-semibold text-slate-700">{label}</span>
              {day.closed ? (
                <span className="flex-1 text-sm text-red-500 font-medium">Cerrado</span>
              ) : (
                <div className="flex-1 flex items-center gap-1.5">
                  <input
                    type="time"
                    value={day.open}
                    onChange={(e) => setDay(key, { open: e.target.value })}
                    className="flex-1 min-w-0 px-2 py-1.5 border-2 border-slate-200 rounded-lg text-sm outline-none focus:border-[var(--brand-blue)]"
                  />
                  <span className="text-slate-400 text-xs">a</span>
                  <input
                    type="time"
                    value={day.close}
                    onChange={(e) => setDay(key, { close: e.target.value })}
                    className="flex-1 min-w-0 px-2 py-1.5 border-2 border-slate-200 rounded-lg text-sm outline-none focus:border-[var(--brand-blue)]"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => setDay(key, { closed: !day.closed })}
                className={
                  'shrink-0 text-xs font-bold px-2 py-1.5 rounded-lg transition-colors ' +
                  (day.closed
                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                }
              >
                {day.closed ? 'Abrir' : 'Cerrar'}
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all"
        style={{ backgroundColor: 'var(--brand-blue)' }}
      >
        <IconCheck size={18} />
        Guardar horarios
      </button>
    </div>
  );
}
