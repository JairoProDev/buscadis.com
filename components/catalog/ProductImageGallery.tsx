'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { IconImage, IconTrash, IconX } from '@/components/Icons';
import ImageWithBgRemoval from '@/components/business/ImageWithBgRemoval';

export type ProductImageItem = string | { url?: string; type?: string; [key: string]: unknown };

function getImageUrl(img: ProductImageItem): string {
  if (!img) return '';
  if (typeof img === 'string') return img;
  return img?.url || '';
}

interface ProductImageGalleryProps {
  images: ProductImageItem[];
  uploadedFiles: (File | null)[];
  bgRemovedIdx: Set<number>;
  enhancingIdx: number | null;
  loading?: boolean;
  onReorder: (images: ProductImageItem[]) => void;
  onUpload: (file: File) => void;
  onRemove: (idx: number) => void;
  onEnhance: (idx: number, action: 'remove_bg' | 'upscale') => void;
  onBgRemoved: (idx: number, file: File, preview: string) => void;
  onBgRestore: (idx: number) => void;
}

export default function ProductImageGallery({
  images,
  uploadedFiles,
  bgRemovedIdx,
  enhancingIdx,
  loading,
  onReorder,
  onUpload,
  onRemove,
  onEnhance,
  onBgRemoved,
  onBgRestore,
}: ProductImageGalleryProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = images.map((_, i) => `img-${i}`);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(images, oldIndex, newIndex));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">Arrastra para reordenar. La primera imagen es la portada.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <SortableImageCard
                key={ids[idx]}
                id={ids[idx]}
                idx={idx}
                img={img}
                uploadedFile={uploadedFiles[idx]}
                isCover={idx === 0}
                isBgRemoved={bgRemovedIdx.has(idx)}
                isEnhancing={enhancingIdx === idx}
                onRemove={() => onRemove(idx)}
                onEnhance={(action) => onEnhance(idx, action)}
                onBgRemoved={(file, preview) => onBgRemoved(idx, file, preview)}
                onBgRestore={() => onBgRestore(idx)}
              />
            ))}
            <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-[var(--brand-color)] hover:bg-slate-50 transition-colors">
              <IconImage size={24} className="text-slate-300 mb-1" />
              <span className="text-xs font-bold text-slate-400">Agregar</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={loading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableImageCard({
  id,
  idx,
  img,
  uploadedFile,
  isCover,
  isBgRemoved,
  isEnhancing,
  onRemove,
  onEnhance,
  onBgRemoved,
  onBgRestore,
}: {
  id: string;
  idx: number;
  img: ProductImageItem;
  uploadedFile?: File | null;
  isCover: boolean;
  isBgRemoved: boolean;
  isEnhancing: boolean;
  onRemove: () => void;
  onEnhance: (action: 'remove_bg' | 'upscale') => void;
  onBgRemoved: (file: File, preview: string) => void;
  onBgRestore: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const url = getImageUrl(img);

  return (
    <div ref={setNodeRef} style={style} className={cn('relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group', isDragging && 'shadow-lg')}>
      {isCover && (
        <span className="absolute top-1 left-1 z-10 text-[10px] font-bold bg-[var(--brand-color)] text-white px-1.5 py-0.5 rounded-md">
          Portada
        </span>
      )}
      <button
        type="button"
        className="absolute top-1 right-8 z-10 w-7 h-7 rounded-lg bg-white/90 border border-slate-200 text-slate-500 cursor-grab active:cursor-grabbing touch-none flex items-center justify-center"
        aria-label="Arrastrar imagen"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 z-10 w-7 h-7 rounded-lg bg-white/90 border border-slate-200 text-red-500 flex items-center justify-center"
        aria-label="Eliminar imagen"
      >
        <IconX size={14} />
      </button>
      {url ? (
        uploadedFile && !isBgRemoved ? (
          <ImageWithBgRemoval
            src={url}
            originalFile={uploadedFile}
            isBgRemoved={isBgRemoved}
            onProcessed={onBgRemoved}
            onRestore={onBgRestore}
          />
        ) : (
          <img src={url} alt="" className="w-full h-full object-cover" />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-200">
          <IconImage size={32} />
        </div>
      )}
      <div className="absolute bottom-0 inset-x-0 p-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/50 to-transparent">
        <button
          type="button"
          disabled={isEnhancing}
          onClick={() => onEnhance('remove_bg')}
          className="flex-1 text-[10px] font-bold py-1 rounded bg-white/90 text-slate-700"
        >
          {isEnhancing ? '…' : 'Sin fondo'}
        </button>
        <button
          type="button"
          disabled={isEnhancing}
          onClick={() => onEnhance('upscale')}
          className="flex-1 text-[10px] font-bold py-1 rounded bg-white/90 text-slate-700"
        >
          IA+
        </button>
      </div>
    </div>
  );
}
