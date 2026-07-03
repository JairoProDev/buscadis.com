'use client';

import { useState } from 'react';
import { IconSparkles } from '@/components/Icons';

interface PublishMagicInputProps {
  value: string;
  onChange: (v: string) => void;
  onAnalyze: () => void;
  analyzing?: boolean;
  disabled?: boolean;
}

export default function PublishMagicInput({
  value,
  onChange,
  onAnalyze,
  analyzing = false,
  disabled = false,
}: PublishMagicInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="space-y-2">
      <div
        className={`rounded-2xl border transition-all ${
          focused
            ? 'border-[var(--brand-blue)] shadow-[0_0_0_3px_rgba(var(--brand-primary-rgb),0.15)]'
            : 'border-[var(--border-color)]'
        }`}
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(var(--brand-primary-rgb),0.04) 100%)' }}
      >
        <div className="flex items-center gap-2 px-3 pt-3">
          <IconSparkles size={16} color="var(--brand-blue)" />
          <span className="text-xs font-bold text-[var(--brand-blue)]">Describe tu aviso como quieras</span>
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          rows={4}
          placeholder='Ej: "Se busca mozo tiempo completo para restaurant-pollería con buena presencia y disponibilidad inmediata. Sueldo S/1200. WhatsApp 987654321"'
          className="w-full px-3 pb-2 pt-1 bg-transparent border-0 resize-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
        />
        <div className="flex justify-end px-3 pb-3">
          <button
            type="button"
            onClick={onAnalyze}
            disabled={disabled || analyzing || !value.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
            style={{ background: 'var(--brand-blue)' }}
          >
            <IconSparkles size={14} />
            {analyzing ? 'Analizando…' : 'Autorellenar con IA'}
          </button>
        </div>
      </div>
      <p className="text-[11px] text-[var(--text-tertiary)] m-0">
        Pega tu aviso tal cual, con errores y en cualquier orden. La IA lo organizará.
      </p>
    </div>
  );
}
