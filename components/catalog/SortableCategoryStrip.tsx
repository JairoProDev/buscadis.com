'use client';

import { useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { IconEdit, IconStore } from '@/components/Icons';

interface SortableCategoryStripProps {
  categories: string[];
  selectedCategory: string | null;
  thumbs: Map<string, string>;
  /** Only categories that exist in business_categories can be persisted on reorder */
  reorderableNames: string[];
  onSelect: (category: string | null) => void;
  onReorder: (orderedNames: string[]) => void;
  onEditClick: () => void;
}

export default function SortableCategoryStrip({
  categories,
  selectedCategory,
  thumbs,
  reorderableNames,
  onSelect,
  onReorder,
  onEditClick,
}: SortableCategoryStripProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const sortableIds = useMemo(
    () => categories.filter((c) => c !== 'Clasificados' && reorderableNames.includes(c)),
    [categories, reorderableNames]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sortableIds.indexOf(String(active.id));
    const newIndex = sortableIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(sortableIds, oldIndex, newIndex));
  };

  return (
    <div className="overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
      <div className="flex gap-4 snap-x snap-mandatory items-start">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="flex flex-col items-center gap-1.5 shrink-0 snap-start"
        >
          <div
            className={cn(
              'w-[4.25rem] h-[4.25rem] p-[2px] rounded-[28%] transition-all',
              !selectedCategory
                ? 'bg-gradient-to-tr from-[var(--brand-color)] to-[var(--brand-accent,#ec4899)]'
                : 'bg-slate-200'
            )}
          >
            <div className="w-full h-full rounded-[26%] border-2 border-white overflow-hidden bg-slate-50 flex items-center justify-center">
              <IconStore
                size={22}
                className={!selectedCategory ? 'text-[var(--brand-color)]' : 'text-slate-400'}
              />
            </div>
          </div>
          <span
            className={cn(
              'text-[11px] font-medium truncate max-w-[4.5rem] text-center leading-tight',
              !selectedCategory ? 'text-[var(--brand-color)]' : 'text-slate-500'
            )}
          >
            Todos
          </span>
        </button>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={horizontalListSortingStrategy}>
            {categories.map((cat) => {
              const canDrag = cat !== 'Clasificados' && reorderableNames.includes(cat);
              if (!canDrag) {
                return (
                  <CategoryChip
                    key={cat}
                    cat={cat}
                    thumb={thumbs.get(cat)}
                    selected={selectedCategory === cat}
                    onSelect={() => onSelect(cat)}
                  />
                );
              }
              return (
                <SortableCategoryChip
                  key={cat}
                  cat={cat}
                  thumb={thumbs.get(cat)}
                  selected={selectedCategory === cat}
                  onSelect={() => onSelect(cat)}
                />
              );
            })}
          </SortableContext>
        </DndContext>

        <button
          type="button"
          onClick={onEditClick}
          className="flex flex-col items-center gap-1.5 shrink-0 snap-start"
          title="Gestionar categorías"
        >
          <div className="w-[4.25rem] h-[4.25rem] rounded-[26%] border-2 border-dashed border-[var(--brand-color)]/40 flex items-center justify-center text-[var(--brand-color)] bg-[var(--brand-color)]/5">
            <IconEdit size={22} />
          </div>
          <span className="text-[11px] font-medium truncate max-w-[4.5rem] text-center leading-tight text-[var(--brand-color)]">
            Editar
          </span>
        </button>
      </div>
    </div>
  );
}

function CategoryChip({
  cat,
  thumb,
  selected,
  onSelect,
  dragHandleProps,
  setNodeRef,
  style,
  isDragging,
}: {
  cat: string;
  thumb?: string;
  selected: boolean;
  onSelect: () => void;
  dragHandleProps?: Record<string, unknown>;
  setNodeRef?: (node: HTMLElement | null) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
}) {
  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      onClick={onSelect}
      className={cn(
        'flex flex-col items-center gap-1.5 shrink-0 snap-start touch-none',
        isDragging && 'opacity-80 z-20'
      )}
      {...dragHandleProps}
    >
      <div
        className={cn(
          'w-[4.25rem] h-[4.25rem] p-[2px] rounded-[28%] transition-all',
          selected
            ? 'bg-gradient-to-tr from-[var(--brand-color)] to-[var(--brand-accent,#ec4899)]'
            : 'bg-slate-200'
        )}
      >
        <div className="w-full h-full rounded-[26%] border-2 border-white overflow-hidden bg-slate-50">
          {thumb ? (
            <img src={thumb} alt={cat} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-base font-bold text-[var(--brand-color)] bg-[var(--brand-color)]/10">
              {cat.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
      <span
        className={cn(
          'text-[11px] font-medium truncate max-w-[4.5rem] text-center leading-tight',
          selected ? 'text-[var(--brand-color)]' : 'text-slate-500'
        )}
      >
        {cat}
      </span>
    </button>
  );
}

function SortableCategoryChip({
  cat,
  thumb,
  selected,
  onSelect,
}: {
  cat: string;
  thumb?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cat,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <CategoryChip
      cat={cat}
      thumb={thumb}
      selected={selected}
      onSelect={onSelect}
      setNodeRef={setNodeRef}
      style={style}
      isDragging={isDragging}
      dragHandleProps={{ ...attributes, ...listeners }}
    />
  );
}
