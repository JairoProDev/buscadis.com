'use client';

import InlineEditModal from '@/components/business/InlineEditModal';
import { useProfileEdit } from '@/contexts/ProfileEditContext';

/** Renders the active inline edit modal from ProfileEditContext */
export default function InlineFieldEditorHost() {
  const ctx = useProfileEdit();
  if (!ctx?.inlineField) return null;

  const { inlineField, closeInlineField } = ctx;

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
