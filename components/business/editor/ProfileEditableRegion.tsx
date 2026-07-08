'use client';

import EditableElement from '@/components/business/EditableElement';
import { IconEdit } from '@/components/Icons';
import { useProfileEdit } from '@/contexts/ProfileEditContext';
import { getEditFieldById } from '@/lib/business/edit-field-registry';
import type { BusinessProfile } from '@/types/business';
import type { ReactNode } from 'react';

interface ProfileEditableRegionProps {
  fieldKey: keyof typeof import('@/lib/business/edit-field-registry').EDIT_FIELD_REGISTRY | string;
  profile: Partial<BusinessProfile>;
  onPatch: (patch: Partial<BusinessProfile>) => void;
  editMode: boolean;
  children: ReactNode;
  className?: string;
  onActivate?: () => void;
}

/**
 * Wraps preview content for dual edit modes:
 * - panel: hover pencil routes to sidebar hub
 * - direct: click opens inline modal
 */
export default function ProfileEditableRegion({
  fieldKey,
  profile,
  onPatch,
  editMode,
  children,
  className,
  onActivate,
}: ProfileEditableRegionProps) {
  const ctx = useProfileEdit();
  const field = getEditFieldById(fieldKey);

  if (!editMode || !field) {
    return <div className={className}>{children}</div>;
  }

  const surface = ctx?.editSurface ?? 'panel';

  if (surface === 'direct') {
    return (
      <div className={`${className || ''} relative`}>
        <button
          type="button"
          className="text-left w-full rounded-xl transition-all hover:outline hover:outline-2 hover:outline-dashed hover:outline-[var(--brand-color)]/40 cursor-pointer"
          onClick={() => {
            if (onActivate) {
              onActivate();
              return;
            }
            ctx?.openInlineField({
              fieldId: field.fieldId,
              title: field.label,
              type: field.type,
              value: field.getValue(profile),
              hub: field.hub,
              onSave: (value) => onPatch(field.patch(profile, value)),
            });
          }}
        >
          {children}
        </button>
        <span className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full bg-white/45 backdrop-blur-md border border-white/60 text-[var(--brand-color)] flex items-center justify-center shadow-sm pointer-events-none">
          <IconEdit size={12} />
        </span>
      </div>
    );
  }

  return (
    <EditableElement
      editMode
      className={className}
      onEdit={() => ctx?.openHubForPart(field.part)}
    >
      {children}
    </EditableElement>
  );
}
