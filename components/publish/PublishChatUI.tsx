'use client';

import { motion } from 'framer-motion';
import { FaPencilAlt, FaPaperPlane, FaCheck } from 'react-icons/fa';
import { IconAdis } from '@/components/Icons';
import PublishImagePreview from './PublishImagePreview';
import {
  CATEGORIA_OPTIONS,
  PRECIO_OPTIONS,
  PublishChatDraft,
  PublishChatStepId,
  STEP_ORDER,
} from '@/lib/publish/chat-steps';

const STEP_LABELS: Record<PublishChatStepId, string> = {
  categoria: 'Categoría',
  titulo: 'Título',
  descripcion: 'Descripción',
  precio: 'Precio',
  ubicacion: 'Ubicación',
  contacto: 'Contacto',
  foto: 'Foto',
};

export interface ChatMessageView {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  step?: PublishChatStepId;
  imageUrl?: string;
}

/* ── Header ── */
export function PublishChatHeader({
  compact,
  typing,
  currentStep,
  progress,
}: {
  compact?: boolean;
  typing: boolean;
  currentStep: PublishChatStepId | 'done';
  progress: number;
}) {
  const status =
    typing
      ? 'Pensando…'
      : currentStep === 'done'
        ? 'Listo para publicar'
        : `Paso ${STEP_ORDER.indexOf(currentStep as PublishChatStepId) + 1} de ${STEP_ORDER.length}`;

  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{ background: 'var(--brand-mesh-soft)' }}
    >
      <div className="absolute inset-0 bg-[var(--bg-primary)]/75 backdrop-blur-md" />
      <div className={`relative ${compact ? 'px-3 py-2.5' : 'px-4 py-3.5'}`}>
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <div
              className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-2xl flex items-center justify-center shadow-[0_4px_14px_rgba(var(--brand-yellow-rgb),0.35)]`}
              style={{
                background: 'linear-gradient(135deg, rgba(var(--brand-yellow-rgb),0.25) 0%, rgba(var(--brand-primary-rgb),0.2) 100%)',
              }}
            >
              <IconAdis size={compact ? 15 : 18} color="var(--brand-yellow)" />
            </div>
            {!typing && currentStep !== 'done' && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[var(--bg-primary)] shadow-sm" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`m-0 font-extrabold tracking-tight text-[var(--text-primary)] ${compact ? 'text-xs' : 'text-sm'}`}>
              ADIS
            </p>
            <p className={`m-0 text-[var(--text-tertiary)] truncate ${compact ? 'text-[10px]' : 'text-xs'}`}>
              {status}
            </p>
          </div>
        </div>
        <div className="mt-2.5 h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, var(--brand-blue), var(--brand-yellow))',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Typing indicator ── */
export function PublishChatTyping({ compact }: { compact?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-end gap-2"
    >
      <AdisAvatar compact={compact} />
      <div
        className={`inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm ring-1 ring-black/[0.04] bg-[var(--bg-primary)] ${compact ? 'py-2.5 px-3' : ''}`}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-1.5 h-1.5 rounded-full bg-[var(--brand-blue)]"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function AdisAvatar({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`${compact ? 'w-6 h-6' : 'w-7 h-7'} shrink-0 rounded-xl flex items-center justify-center`}
      style={{ background: 'linear-gradient(135deg, rgba(var(--brand-yellow-rgb),0.2), rgba(var(--brand-primary-rgb),0.15))' }}
    >
      <IconAdis size={compact ? 11 : 13} color="var(--brand-yellow)" />
    </div>
  );
}

/* ── Message bubble ── */
export function PublishChatBubble({
  msg,
  compact,
  editing,
  editInput,
  onEditInputChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: {
  msg: ChatMessageView;
  compact?: boolean;
  editing: boolean;
  editInput: string;
  onEditInputChange: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}) {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {!isUser && <AdisAvatar compact={compact} />}

      <div className={`group flex flex-col max-w-[88%] ${isUser ? 'items-end' : 'items-start'}`}>
        {msg.step && isUser && (
          <span className="mb-1 px-1.5 text-[9px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            {STEP_LABELS[msg.step]}
          </span>
        )}

        <div
          className={`relative ${
            isUser
              ? 'rounded-2xl rounded-br-sm px-3.5 py-2.5 text-white shadow-[0_4px_16px_rgba(var(--brand-primary-rgb),0.35)]'
              : `rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-[var(--text-primary)] shadow-sm ring-1 ring-black/[0.04] bg-[var(--bg-primary)] ${compact ? 'text-[13px]' : 'text-sm'}`
          }`}
          style={
            isUser
              ? { background: 'linear-gradient(135deg, var(--brand-blue) 0%, #3d96b0 100%)' }
              : undefined
          }
        >
          {editing ? (
            <div className="flex flex-col gap-2 min-w-[160px]">
              <input
                value={editInput}
                onChange={(e) => onEditInputChange(e.target.value)}
                className="w-full rounded-lg px-2.5 py-1.5 text-sm text-[var(--text-primary)] bg-white/90 border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
                autoFocus
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={onSaveEdit}
                  className="flex-1 py-1 rounded-lg bg-white/25 text-xs font-bold hover:bg-white/35 transition-colors"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="flex-1 py-1 rounded-lg bg-black/10 text-xs font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className={`m-0 whitespace-pre-wrap break-words leading-relaxed ${compact && isUser ? 'text-[13px]' : ''}`}>
                {msg.content}
              </p>
              {msg.imageUrl && (
                <div className="mt-2">
                  <PublishImagePreview url={msg.imageUrl} onRemove={() => {}} size="sm" />
                </div>
              )}
              {isUser && msg.step && !editing && (
                <button
                  type="button"
                  onClick={onStartEdit}
                  className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[var(--bg-primary)] text-[var(--text-tertiary)] shadow-md ring-1 ring-black/[0.06] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all hover:text-[var(--brand-blue)] hover:scale-105"
                  aria-label="Editar"
                >
                  <FaPencilAlt size={8} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Option chips ── */
export function PublishCategoryGrid({
  compact,
  onSelect,
}: {
  compact?: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <div className={`grid gap-1.5 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
      {CATEGORIA_OPTIONS.map((opt, i) => (
        <motion.button
          key={opt.value}
          type="button"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          onClick={() => onSelect(opt.value)}
          className={`group flex items-center gap-2 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] ring-1 ring-black/[0.05] bg-[var(--bg-primary)] hover:ring-[rgba(var(--brand-primary-rgb),0.35)] hover:shadow-md ${compact ? 'px-2 py-2' : 'px-3 py-2.5'}`}
        >
          <span className={`${compact ? 'text-base' : 'text-lg'} leading-none`}>{opt.emoji}</span>
          <span className={`font-semibold text-[var(--text-primary)] ${compact ? 'text-[11px]' : 'text-xs'}`}>
            {opt.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}

export function PublishPriceOptions({
  compact,
  input,
  onInputChange,
  onSelect,
  onConfirmAmount,
}: {
  compact?: boolean;
  input: string;
  onInputChange: (v: string) => void;
  onSelect: (value: string) => void;
  onConfirmAmount: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'gap-2'}`}>
        {PRECIO_OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.value}
            type="button"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(opt.value)}
            className={`rounded-full font-semibold transition-all hover:scale-105 active:scale-95 ring-1 ring-black/[0.06] bg-[var(--bg-primary)] hover:bg-[rgba(var(--brand-primary-rgb),0.08)] hover:ring-[rgba(var(--brand-primary-rgb),0.3)] text-[var(--text-secondary)] hover:text-[var(--brand-blue)] ${compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'}`}
          >
            {opt.label}
          </motion.button>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          inputMode="decimal"
          value={input}
          onChange={(e) => onInputChange(e.target.value.replace(/[^\d.,]/g, ''))}
          placeholder="Monto en soles"
          className={`flex-1 rounded-xl ring-1 ring-black/[0.06] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-primary-rgb),0.35)] ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
        />
        <button
          type="button"
          onClick={onConfirmAmount}
          disabled={!input.trim()}
          className={`shrink-0 rounded-xl font-bold text-white disabled:opacity-40 transition-opacity ${compact ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-xs'}`}
          style={{ background: 'linear-gradient(135deg, var(--brand-blue), #3d96b0)' }}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export function PublishPhotoOptions({
  compact,
  uploading,
  onPickFile,
  onSkip,
}: {
  compact?: boolean;
  uploading: boolean;
  onPickFile: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={uploading}
        onClick={onPickFile}
        className={`rounded-xl font-semibold ring-1 ring-[rgba(var(--brand-primary-rgb),0.3)] text-[var(--brand-blue)] bg-[rgba(var(--brand-primary-rgb),0.08)] hover:bg-[rgba(var(--brand-primary-rgb),0.14)] transition-colors disabled:opacity-50 ${compact ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-xs'}`}
      >
        {uploading ? 'Subiendo…' : '📷 Adjuntar foto'}
      </button>
      <button
        type="button"
        onClick={onSkip}
        className={`rounded-xl font-medium text-[var(--text-tertiary)] ring-1 ring-black/[0.06] hover:bg-[var(--bg-tertiary)] transition-colors ${compact ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-xs'}`}
      >
        Sin foto
      </button>
    </div>
  );
}

/* ── Composer input ── */
export function PublishChatComposer({
  compact,
  input,
  placeholder,
  onChange,
  onSend,
}: {
  compact?: boolean;
  input: string;
  placeholder: string;
  onChange: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <div className={`flex items-end gap-2 ${compact ? '' : 'gap-2.5'}`}>
      <div className="flex-1 relative">
        <textarea
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          rows={compact ? 1 : 2}
          placeholder={placeholder}
          className={`w-full resize-none rounded-2xl ring-1 ring-black/[0.06] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-primary-rgb),0.35)] transition-shadow ${compact ? 'px-3 py-2 text-[13px] min-h-[40px]' : 'px-4 py-2.5 text-sm min-h-[44px]'}`}
        />
      </div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={onSend}
        disabled={!input.trim()}
        className={`shrink-0 rounded-2xl text-white flex items-center justify-center disabled:opacity-35 shadow-[0_4px_14px_rgba(var(--brand-primary-rgb),0.4)] transition-opacity ${compact ? 'w-9 h-9' : 'w-11 h-11'}`}
        style={{ background: 'linear-gradient(135deg, var(--brand-blue), #3d96b0)' }}
        aria-label="Enviar"
      >
        <FaPaperPlane size={compact ? 12 : 14} className="translate-x-px -translate-y-px" />
      </motion.button>
    </div>
  );
}

/* ── Summary card ── */
export function PublishChatSummary({
  compact,
  draft,
  imageUrl,
  onRemoveImage,
  onPublish,
}: {
  compact?: boolean;
  draft: PublishChatDraft;
  imageUrl?: string | null;
  onRemoveImage: () => void;
  onPublish: () => void;
}) {
  const cat = CATEGORIA_OPTIONS.find((c) => c.value === draft.categoria);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl overflow-hidden ring-1 ring-black/[0.06] shadow-md bg-[var(--bg-primary)] ${compact ? 'text-xs' : 'text-sm'}`}
    >
      <div
        className="px-3.5 py-2 flex items-center gap-2 border-b border-black/[0.04]"
        style={{ background: 'var(--brand-mesh-soft)' }}
      >
        <span className="w-5 h-5 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
          <FaCheck size={10} />
        </span>
        <span className="font-bold text-[var(--text-primary)] text-xs">Tu aviso está listo</span>
      </div>
      <div className={`space-y-2.5 ${compact ? 'p-3' : 'p-4'}`}>
        <div>
          <p className={`m-0 font-extrabold text-[var(--text-primary)] leading-snug ${compact ? 'text-sm' : 'text-base'}`}>
            {draft.titulo || 'Sin título'}
          </p>
          <p className={`m-0 mt-1 text-[var(--text-secondary)] line-clamp-3 leading-relaxed ${compact ? 'text-[11px]' : 'text-xs'}`}>
            {draft.descripcion}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(var(--brand-primary-rgb),0.1)] text-[var(--brand-blue)]">
            {cat?.emoji} {cat?.label}
          </span>
          {draft.ubicacion && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
              📍 {draft.ubicacion}
            </span>
          )}
          {draft.precio && draft.precio !== 'skip' && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[rgba(var(--brand-yellow-rgb),0.15)] text-[var(--text-primary)]">
              💰 {draft.precio === 'consultar' ? 'A consultar' : draft.precio === 'negociable' ? 'Negociable' : draft.precio === 'gratis' ? 'Gratis' : `S/ ${draft.precio}`}
            </span>
          )}
        </div>
        {imageUrl && (
          <PublishImagePreview url={imageUrl} onRemove={onRemoveImage} size="sm" />
        )}
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={onPublish}
          className={`w-full rounded-xl font-extrabold text-[#1c1608] shadow-[0_4px_16px_rgba(var(--brand-yellow-rgb),0.45)] hover:brightness-105 transition-all ${compact ? 'py-2 text-xs' : 'py-2.5 text-sm'}`}
          style={{ background: 'linear-gradient(135deg, var(--brand-yellow), #ffb020)' }}
        >
          Publicar aviso
        </motion.button>
      </div>
    </motion.div>
  );
}

export function calcProgress(currentStep: PublishChatStepId | 'done'): number {
  if (currentStep === 'done') return 100;
  const idx = STEP_ORDER.indexOf(currentStep);
  return Math.round(((idx + 0.5) / STEP_ORDER.length) * 100);
}
