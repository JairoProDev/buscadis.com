'use client';

import type { BusinessWithRole } from '@/lib/business-access';
import type { BusinessProfile } from '@/types/business';
import EditorChromeMenu from '@/components/business/editor/EditorChromeMenu';
import EditorProgressWidget from '@/components/business/editor/EditorProgressWidget';
import { EditorCloseButton } from '@/components/business/editor/BusinessProfileEditorLayout';
import { IconCheck, IconEye } from '@/components/Icons';
import { cn } from '@/lib/utils';

interface EditorTopBarProps {
  saving: boolean;
  lastSavedTime: Date | null;
  isPlatformAdmin: boolean;
  isOwner: boolean;
  isMember: boolean;
  editableProfile: Partial<BusinessProfile>;
  catalogProductCount: number;
  businessOptions: BusinessWithRole[];
  businessId?: string;
  onClose: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onToggleVacation: () => void;
}

export default function EditorTopBar({
  saving,
  lastSavedTime,
  isPlatformAdmin,
  isOwner,
  isMember,
  editableProfile,
  catalogProductCount,
  businessOptions,
  businessId,
  onClose,
  onPreview,
  onPublish,
  onToggleVacation,
}: EditorTopBarProps) {
  return (
    <div
      className="sticky top-0 z-[70] bg-white border-b border-slate-200 shadow-sm [--editor-header-h:5.625rem] md:[--editor-header-h:3.5rem]"
      data-editor-header
    >
      {/* Fila 1: título + progreso (móvil) / título + acciones (desktop) */}
      <div className="flex items-center gap-2 px-4 pt-2.5 pb-2 md:py-2 md:min-h-14">
        <EditorCloseButton onClick={onClose} />

        <div className="flex flex-col min-w-0 flex-1 gap-0.5">
          <span className="font-bold text-sm text-slate-900 leading-tight truncate">
            Editar página
          </span>
          {isPlatformAdmin && !isOwner && !isMember && (
            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded w-fit">
              Modo admin
            </span>
          )}
          <div className="flex items-center gap-1.5 min-h-[14px] md:hidden">
            {saving ? (
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                Guardando…
              </span>
            ) : lastSavedTime ? (
              <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                <IconCheck size={10} />
                Guardado
              </span>
            ) : null}
          </div>
        </div>

        <div className="hidden md:block shrink-0 w-[140px]">
          <EditorProgressWidget
            profile={editableProfile}
            productCount={catalogProductCount}
            compact
          />
        </div>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <SaveStatus saving={saving} lastSavedTime={lastSavedTime} />
          <PreviewButton onClick={onPreview} />
          <PublishButton
            isPublished={Boolean(editableProfile.is_published)}
            saving={saving}
            onClick={onPublish}
          />
          {businessOptions.length > 0 && businessId && (
            <EditorChromeMenu
              businesses={businessOptions}
              currentBusinessId={businessId}
              profile={editableProfile}
              onCloseEditor={onClose}
              onPublish={onPublish}
              onToggleVacation={onToggleVacation}
            />
          )}
        </div>

        <div className="md:hidden shrink-0 w-[72px]">
          <EditorProgressWidget
            profile={editableProfile}
            productCount={catalogProductCount}
            compact
          />
        </div>
      </div>

      {/* Fila 2: acciones (solo móvil) */}
      <div className="flex items-center gap-2 px-4 pb-2.5 md:hidden">
        <PreviewButton onClick={onPreview} iconOnly />
        <PublishButton
          isPublished={Boolean(editableProfile.is_published)}
          saving={saving}
          onClick={onPublish}
          className="flex-1 justify-center"
        />
        {businessOptions.length > 0 && businessId && (
          <EditorChromeMenu
            businesses={businessOptions}
            currentBusinessId={businessId}
            profile={editableProfile}
            onCloseEditor={onClose}
            onPublish={onPublish}
            onToggleVacation={onToggleVacation}
            mobile
          />
        )}
      </div>
    </div>
  );
}

function SaveStatus({
  saving,
  lastSavedTime,
}: {
  saving: boolean;
  lastSavedTime: Date | null;
}) {
  if (saving) {
    return (
      <span className="text-[10px] text-slate-500 flex items-center gap-1 whitespace-nowrap">
        <span className="w-2 h-2 border border-slate-400 border-t-transparent rounded-full animate-spin" />
        Guardando…
      </span>
    );
  }
  if (lastSavedTime) {
    return (
      <span className="text-[10px] text-emerald-600 flex items-center gap-1 whitespace-nowrap">
        <IconCheck size={10} />
        Guardado
      </span>
    );
  }
  return null;
}

function PreviewButton({
  onClick,
  iconOnly = false,
}: {
  onClick: () => void;
  iconOnly?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors shrink-0',
        iconOnly ? 'h-9 w-9' : 'gap-1.5 px-3 py-1.5 text-xs'
      )}
      title="Ver página"
      aria-label="Ver página"
    >
      <IconEye size={16} />
      {!iconOnly && <span>Ver página</span>}
    </button>
  );
}

function PublishButton({
  isPublished,
  saving,
  onClick,
  className,
}: {
  isPublished: boolean;
  saving: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className={cn(
        'px-3 py-2 rounded-lg font-bold text-white text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 shrink-0',
        isPublished ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-[var(--brand-blue,#53acc5)] hover:brightness-110',
        className
      )}
    >
      {isPublished ? '✓ Publicado' : 'Publicar'}
    </button>
  );
}
