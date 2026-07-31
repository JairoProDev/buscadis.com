'use client';

import { motion } from 'framer-motion';
import { FaPencilAlt, FaCheck } from 'react-icons/fa';
import { IconAdis } from '@/components/Icons';
import PublishImagePreview from './PublishImagePreview';
import { getCategoriaIcon, PUBLISH_CATEGORIAS } from '@/lib/categoria-icons';
import { getCategoriaThemeTokens } from '@/lib/categoria-theme';
import {
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

/* ── Opciones inline en el hilo ── */
export function PublishChatInlineOptions({
  step,
  compact,
  input,
  uploading,
  onInputChange,
  onSelect,
  onConfirmAmount,
  onPickFile,
}: {
  step: 'categoria' | 'precio' | 'foto';
  compact?: boolean;
  input?: string;
  uploading?: boolean;
  onInputChange?: (v: string) => void;
  onSelect: (value: string) => void;
  onConfirmAmount?: () => void;
  onPickFile?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-2.5 max-w-full pl-0.5"
    >
      <div className={`${compact ? 'w-7' : 'w-8'} shrink-0`} aria-hidden />
      <div className="flex-1 min-w-0">
        {step === 'categoria' && (
          <PublishCategoryGrid compact={compact} onSelect={onSelect} inline />
        )}
        {step === 'precio' && (
          <PublishPriceOptions
            compact={compact}
            inline
            input={input ?? ''}
            onInputChange={onInputChange ?? (() => {})}
            onSelect={onSelect}
            onConfirmAmount={onConfirmAmount ?? (() => {})}
          />
        )}
        {step === 'foto' && (
          <PublishPhotoOptions
            compact={compact}
            inline
            uploading={uploading ?? false}
            onPickFile={onPickFile ?? (() => {})}
            onSkip={() => onSelect('skip')}
          />
        )}
      </div>
    </motion.div>
  );
}

export function PublishChatHeader({
  compact,
  typing,
  currentStep,
}: {
  compact?: boolean;
  typing: boolean;
  currentStep: PublishChatStepId | 'done';
  progress?: number;
}) {
  const stepIndex =
    currentStep === 'done'
      ? STEP_ORDER.length
      : STEP_ORDER.indexOf(currentStep as PublishChatStepId) + 1;

  const stepLabel =
    currentStep === 'done'
      ? 'Revisión final'
      : STEP_LABELS[currentStep as PublishChatStepId];

  const status = typing
    ? 'Escribiendo…'
    : currentStep === 'done'
      ? 'Listo para publicar'
      : `${stepLabel} · ${stepIndex}/${STEP_ORDER.length}`;

  return (
    <div className="shrink-0 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
      <div className={`${compact ? 'px-3 py-2.5' : 'px-4 py-3.5'}`}>
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div
              className={`${compact ? 'h-9 w-9' : 'h-10 w-10'} flex items-center justify-center rounded-full bg-[rgba(var(--brand-primary-rgb),0.1)] ring-1 ring-[rgba(var(--brand-primary-rgb),0.15)]`}
            >
              <IconAdis size={compact ? 16 : 18} color="var(--brand-blue)" />
            </div>
            {!typing && currentStep !== 'done' && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-primary)] bg-emerald-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={`m-0 font-semibold tracking-tight text-[var(--text-primary)] ${compact ? 'text-[13px]' : 'text-sm'}`}
            >
              Asistente de publicación
            </p>
            <p
              className={`m-0 truncate text-[var(--text-tertiary)] ${compact ? 'text-[11px]' : 'text-xs'}`}
            >
              {status}
            </p>
          </div>
        </div>

        {/* Step dots */}
        <div className="mt-3 flex items-center gap-1">
          {STEP_ORDER.map((s, i) => {
            const done = currentStep === 'done' || i < stepIndex - 1;
            const active =
              currentStep !== 'done' && s === currentStep;
            return (
              <span
                key={s}
                title={STEP_LABELS[s]}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  done
                    ? 'bg-[var(--brand-blue)]'
                    : active
                      ? 'bg-[rgba(var(--brand-primary-rgb),0.55)]'
                      : 'bg-[var(--bg-tertiary)]'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PublishChatTyping({ compact }: { compact?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-end gap-2.5"
    >
      <AdisAvatar compact={compact} />
      <div
        className={`inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-[var(--bg-primary)] px-4 py-3 ring-1 ring-[var(--border-color)] ${compact ? 'py-2.5' : ''}`}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)]"
            animate={{ opacity: [0.25, 0.9, 0.25] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function AdisAvatar({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`${compact ? 'h-7 w-7' : 'h-8 w-8'} flex shrink-0 items-center justify-center rounded-full bg-[rgba(var(--brand-primary-rgb),0.1)]`}
    >
      <IconAdis size={compact ? 12 : 14} color="var(--brand-blue)" />
    </div>
  );
}

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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {!isUser && <AdisAvatar compact={compact} />}

      <div className={`group flex max-w-[90%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {msg.step && isUser && (
          <span className="mb-1 px-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
            {STEP_LABELS[msg.step]}
          </span>
        )}

        <div
          className={`relative ${
            isUser
              ? `rounded-2xl rounded-br-md bg-[var(--brand-blue)] px-3.5 py-2.5 text-white shadow-sm ${compact ? 'text-[13px]' : 'text-sm'}`
              : `rounded-2xl rounded-bl-md bg-[var(--bg-primary)] px-3.5 py-2.5 text-[var(--text-primary)] ring-1 ring-[var(--border-color)] ${compact ? 'text-[13px]' : 'text-sm'}`
          }`}
        >
          {editing ? (
            <div className="flex min-w-[160px] flex-col gap-2">
              <input
                value={editInput}
                onChange={(e) => onEditInputChange(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-primary-rgb),0.3)]"
                autoFocus
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={onSaveEdit}
                  className="flex-1 rounded-lg bg-[var(--brand-blue)] py-1.5 text-xs font-semibold text-white"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="flex-1 rounded-lg bg-[var(--bg-tertiary)] py-1.5 text-xs font-medium text-[var(--text-secondary)]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="m-0 whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
              {msg.imageUrl && (
                <div className="mt-2">
                  <PublishImagePreview url={msg.imageUrl} onRemove={() => {}} size="sm" />
                </div>
              )}
              {isUser && msg.step && !editing && (
                <button
                  type="button"
                  onClick={onStartEdit}
                  className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-primary)] text-[var(--text-tertiary)] opacity-0 shadow-sm ring-1 ring-[var(--border-color)] transition-all group-hover:opacity-100 hover:text-[var(--brand-blue)]"
                  aria-label="Editar"
                >
                  <FaPencilAlt size={9} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function PublishCategoryGrid({
  compact,
  onSelect,
  inline = false,
}: {
  compact?: boolean;
  onSelect: (value: string) => void;
  inline?: boolean;
}) {
  return (
    <div
      className={`grid gap-1.5 ${
        compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
      } ${inline ? 'rounded-2xl rounded-bl-md bg-[var(--bg-primary)] p-2 ring-1 ring-[var(--border-color)]' : ''}`}
    >
      {PUBLISH_CATEGORIAS.map((opt, i) => {
        const Icon = getCategoriaIcon(opt.value);
        const accent = getCategoriaThemeTokens(opt.value).accent;
        return (
          <motion.button
            key={opt.value}
            type="button"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.025, duration: 0.2 }}
            onClick={() => onSelect(opt.value)}
            className="group flex items-center gap-2.5 rounded-xl border border-transparent bg-[var(--bg-secondary)] px-2.5 py-2 text-left transition-all hover:border-[var(--border-color)] hover:bg-[var(--bg-primary)] active:scale-[0.98]"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
              style={{ backgroundColor: `${accent}18` }}
            >
              <Icon size={18} color={accent} />
            </span>
            <span
              className={`font-medium leading-tight text-[var(--text-primary)] group-hover:text-[var(--brand-blue)] ${compact ? 'text-xs' : 'text-[13px]'}`}
            >
              {opt.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

export function PublishPriceOptions({
  compact,
  inline = false,
  input,
  onInputChange,
  onSelect,
  onConfirmAmount,
}: {
  compact?: boolean;
  inline?: boolean;
  input: string;
  onInputChange: (v: string) => void;
  onSelect: (value: string) => void;
  onConfirmAmount: () => void;
}) {
  return (
    <div
      className={`space-y-2.5 ${inline ? 'rounded-2xl rounded-bl-md bg-[var(--bg-primary)] p-2.5 ring-1 ring-[var(--border-color)]' : ''}`}
    >
      <div className="flex flex-wrap gap-1.5">
        {PRECIO_OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.value}
            type="button"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(opt.value)}
            className={`rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] font-medium text-[var(--text-secondary)] transition-colors hover:border-[rgba(var(--brand-primary-rgb),0.35)] hover:bg-[rgba(var(--brand-primary-rgb),0.06)] hover:text-[var(--brand-blue)] ${compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'}`}
          >
            {opt.label}
          </motion.button>
        ))}
      </div>
      {!inline && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={input}
            onChange={(e) => onInputChange(e.target.value.replace(/[^\d.,]/g, ''))}
            placeholder="Monto en soles"
            className={`flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--brand-primary-rgb),0.25)] ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
          />
          <button
            type="button"
            onClick={onConfirmAmount}
            disabled={!input.trim()}
            className={`shrink-0 rounded-xl bg-[var(--brand-blue)] font-semibold text-white disabled:opacity-40 ${compact ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-xs'}`}
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}

export function PublishPhotoOptions({
  compact,
  inline = false,
  uploading,
  onPickFile,
  onSkip,
}: {
  compact?: boolean;
  inline?: boolean;
  uploading: boolean;
  onPickFile: () => void;
  onSkip: () => void;
}) {
  return (
    <div
      className={`flex flex-col gap-2 ${inline ? 'rounded-2xl rounded-bl-md bg-[var(--bg-primary)] p-2.5 ring-1 ring-[var(--border-color)]' : ''}`}
    >
      <button
        type="button"
        disabled={uploading}
        onClick={onPickFile}
        className={`w-full rounded-xl border border-[rgba(var(--brand-primary-rgb),0.25)] bg-[rgba(var(--brand-primary-rgb),0.06)] font-semibold text-[var(--brand-blue)] transition-colors hover:bg-[rgba(var(--brand-primary-rgb),0.1)] disabled:opacity-50 ${compact ? 'py-2 text-xs' : 'py-2.5 text-sm'}`}
      >
        {uploading ? 'Subiendo…' : 'Adjuntar foto'}
      </button>
      <button
        type="button"
        onClick={onSkip}
        className={`w-full rounded-xl py-2 font-medium text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-secondary)] ${compact ? 'text-xs' : 'text-sm'}`}
      >
        Continuar sin foto
      </button>
      <p className="m-0 text-center text-[10px] text-[var(--text-tertiary)]">
        Sin foto se genera una portada automática con el título.
      </p>
    </div>
  );
}

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
  const cat = PUBLISH_CATEGORIAS.find((c) => c.value === draft.categoria);
  const CatIcon = getCategoriaIcon(draft.categoria);
  const catAccent = getCategoriaThemeTokens(draft.categoria).accent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-sm ${compact ? 'text-xs' : 'text-sm'}`}
    >
      <div className="flex items-center gap-2 border-b border-[var(--border-color)] px-3.5 py-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
          <FaCheck size={10} />
        </span>
        <span className="text-xs font-semibold text-[var(--text-primary)]">Vista previa del aviso</span>
      </div>
      <div className={`space-y-3 ${compact ? 'p-3' : 'p-4'}`}>
        <div>
          <p
            className={`m-0 font-semibold leading-snug text-[var(--text-primary)] ${compact ? 'text-sm' : 'text-base'}`}
          >
            {draft.titulo || 'Sin título'}
          </p>
          <p
            className={`m-0 mt-1.5 line-clamp-3 leading-relaxed text-[var(--text-secondary)] ${compact ? 'text-[11px]' : 'text-xs'}`}
          >
            {draft.descripcion}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-secondary)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
            <CatIcon size={10} color={catAccent} />
            {cat?.label}
          </span>
          {draft.ubicacion && (
            <span className="rounded-md bg-[var(--bg-secondary)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
              {draft.ubicacion}
            </span>
          )}
          {draft.precio && draft.precio !== 'skip' && (
            <span className="rounded-md bg-[rgba(var(--brand-yellow-rgb),0.12)] px-2 py-1 text-[10px] font-medium text-[var(--text-primary)]">
              {draft.precio === 'consultar'
                ? 'A consultar'
                : draft.precio === 'negociable'
                  ? 'Negociable'
                  : draft.precio === 'gratis'
                    ? 'Gratis'
                    : `S/ ${draft.precio}`}
            </span>
          )}
        </div>
        {imageUrl && <PublishImagePreview url={imageUrl} onRemove={onRemoveImage} size="sm" />}
        <button
          type="button"
          onClick={onPublish}
          className={`w-full rounded-xl bg-[var(--brand-yellow)] py-2.5 text-sm font-bold text-[#1a1508] transition-all hover:brightness-105 active:scale-[0.99] ${compact ? 'py-2 text-xs' : ''}`}
        >
          Elegir plan y publicar
        </button>
      </div>
    </motion.div>
  );
}
export function calcProgress(currentStep: PublishChatStepId | 'done'): number {
  if (currentStep === 'done') return 100;
  const idx = STEP_ORDER.indexOf(currentStep);
  return Math.round(((idx + 0.5) / STEP_ORDER.length) * 100);
}
