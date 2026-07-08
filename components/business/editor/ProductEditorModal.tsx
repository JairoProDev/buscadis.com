'use client';

import { ProductEditor } from '@/components/business/ProductEditor';
import type { Adiso } from '@/types';

interface ProductEditorModalProps {
  open: boolean;
  product: unknown | null;
  businessProfileId: string;
  userId: string;
  adisos?: Adiso[];
  onSave: (product: unknown) => void;
  onClose: () => void;
}

export default function ProductEditorModal({
  open,
  product,
  businessProfileId,
  userId,
  adisos = [],
  onSave,
  onClose,
}: ProductEditorModalProps) {
  if (!open || !businessProfileId || !userId) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-label="Editor de producto"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <ProductEditor
          key={(product as { id?: string })?.id || 'new-product'}
          product={product === 'new' ? null : product}
          businessProfileId={businessProfileId}
          userId={userId}
          adisos={adisos}
          onSave={onSave}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
