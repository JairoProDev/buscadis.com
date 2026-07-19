'use client';

import InlineEditModal from '@/components/business/InlineEditModal';
import { useProfileEdit } from '@/contexts/ProfileEditContext';
import { IconX } from '@/components/Icons';

/** Renders the active inline edit modal / custom editor from ProfileEditContext */
export default function InlineFieldEditorHost() {
  const ctx = useProfileEdit();
  if (!ctx) return null;

  const { inlineField, closeInlineField, inlineEditor, closeInlineEditor } = ctx;

  if (inlineField) {
    return (
      <InlineEditModal
        title={inlineField.title}
        value={inlineField.value}
        type={inlineField.type}
        onSave={(v) => {
          inlineField.onSave(v);
          closeInlineField();
        }}
        onCancel={closeInlineField}
      />
    );
  }

  if (inlineEditor) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4"
        onClick={closeInlineEditor}
        role="presentation"
      >
        <div
          className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {inlineEditor.title}
            </h3>
            <button
              type="button"
              onClick={closeInlineEditor}
              className="p-2 -mr-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500"
              aria-label="Cerrar"
            >
              <IconX size={18} />
            </button>
          </div>
          {inlineEditor.render(closeInlineEditor)}
        </div>
      </div>
    );
  }

  return null;
}
