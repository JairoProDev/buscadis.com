'use client';

import type { BusinessProfile, CustomBlock } from '@/types/business';
import BusinessCustomBlocks from './BusinessCustomBlocks';
import { useProfileEdit } from '@/contexts/ProfileEditContext';
import CustomLinksEditor from '@/components/business/editor/inline/CustomLinksEditor';
import { IconEdit } from '@/components/Icons';

interface BusinessLinksBlockProps {
  profile: Partial<BusinessProfile>;
  blocks: CustomBlock[];
  showEditControls?: boolean;
  onProfilePatch?: (patch: Partial<BusinessProfile>) => void;
}

export default function BusinessLinksBlock({
  profile,
  blocks,
  showEditControls = false,
  onProfilePatch,
}: BusinessLinksBlockProps) {
  const editCtx = useProfileEdit();
  const canEdit = showEditControls && Boolean(onProfilePatch);

  const openEditor = () =>
    editCtx?.openInlineEditor({
      editorId: 'custom-links',
      title: 'Enlaces',
      render: (close) => (
        <CustomLinksEditor profile={profile} onPatch={onProfilePatch!} onClose={close} />
      ),
    });

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      {canEdit && (
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-[var(--text-primary)]">Enlaces</h3>
          <button
            type="button"
            onClick={openEditor}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-color)] hover:underline"
          >
            <IconEdit size={14} /> Editar enlaces
          </button>
        </div>
      )}
      {blocks.length > 0 ? (
        <BusinessCustomBlocks blocks={blocks} />
      ) : canEdit ? (
        <button
          type="button"
          onClick={openEditor}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-[var(--brand-color)]/40 text-[var(--brand-color)] font-semibold hover:bg-[var(--brand-color)]/5"
        >
          + Agregar enlaces
        </button>
      ) : null}
    </div>
  );
}
