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
  verticalListSortingStrategy,
  type SortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { Adiso } from '@/types';

interface SortableProductListProps {
  items: Adiso[];
  onReorder: (orderedIds: string[]) => Promise<void>;
  disabled?: boolean;
  renderItem: (adiso: Adiso, dragHandle: React.ReactNode) => React.ReactNode;
  className?: string;
  strategy?: 'grid' | 'list';
}

const STRATEGIES: Record<'grid' | 'list', SortingStrategy> = {
  grid: rectSortingStrategy,
  list: verticalListSortingStrategy,
};

export default function SortableProductList({
  items,
  onReorder,
  disabled = false,
  renderItem,
  className,
  strategy = 'grid',
}: SortableProductListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = items.map((i) => i.id);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || disabled) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    await onReorder(next.map((p) => p.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={STRATEGIES[strategy]}>
        <div className={className}>
          {items.map((adiso) => (
            <SortableProductRow key={adiso.id} id={adiso.id} disabled={disabled}>
              {(handle) => renderItem(adiso, handle)}
            </SortableProductRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableProductRow({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  const handle = (
    <button
      type="button"
      className={cn(
        'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500',
        'bg-white/90 border border-slate-200 shadow-sm touch-none',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:bg-slate-50',
        isDragging && 'ring-2 ring-[var(--brand-color)]/30'
      )}
      aria-label="Arrastrar para reordenar"
      disabled={disabled}
      {...(disabled ? {} : { ...attributes, ...listeners })}
    >
      ⠿
    </button>
  );

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'shadow-xl')}>
      {children(handle)}
    </div>
  );
}
