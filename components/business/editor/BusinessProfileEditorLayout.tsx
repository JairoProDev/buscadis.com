'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { IconEdit, IconEye, IconX } from '@/components/Icons';

interface BusinessProfileEditorLayoutProps {
  isEditing: boolean;
  canEdit: boolean;
  onCloseEditor: () => void;
  onOpenEditor: () => void;
  editorTopBar?: ReactNode;
  sidebar: ReactNode;
  preview: ReactNode;
  floatingActions?: ReactNode;
}

export default function BusinessProfileEditorLayout({
  isEditing,
  canEdit,
  onCloseEditor,
  editorTopBar,
  sidebar,
  preview,
  floatingActions,
}: BusinessProfileEditorLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col overflow-x-clip">
      {canEdit && isEditing && editorTopBar}

      <div className="flex flex-1 relative">
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-[60] w-full md:w-[400px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-slate-200 overflow-y-auto',
            canEdit && isEditing ? 'translate-x-0 top-[var(--editor-header-h,5.625rem)]' : '-translate-x-full'
          )}
        >
          {isEditing && canEdit && sidebar}
        </div>

        <div
          className={cn(
            'flex-1 min-w-0 transition-all duration-300',
            canEdit && isEditing ? 'md:ml-[400px]' : ''
          )}
        >
          {preview}
          {canEdit && !isEditing && floatingActions}
        </div>
      </div>

      {canEdit && isEditing && (
        <div
          className="fixed inset-0 bg-black/30 z-[55] md:hidden"
          onClick={onCloseEditor}
          role="presentation"
        />
      )}
    </div>
  );
}

export function EditorViewToggle({
  isEditing,
  onEdit,
  onPreview,
}: {
  isEditing: boolean;
  onEdit: () => void;
  onPreview: () => void;
}) {
  return (
    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
      <button
        type="button"
        onClick={onPreview}
        className={cn(
          'px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all',
          !isEditing ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'
        )}
      >
        <IconEye size={13} />
        Ver
      </button>
      <button
        type="button"
        onClick={onEdit}
        className={cn(
          'px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 transition-all',
          isEditing ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'
        )}
      >
        <IconEdit size={13} />
        Editar
      </button>
    </div>
  );
}

export function EditorCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
      title="Cerrar editor"
    >
      <IconX size={18} color="var(--text-secondary, #64748b)" />
    </button>
  );
}
