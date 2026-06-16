'use client';

import { useState, useCallback, useRef } from 'react';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { BusinessProfile, ProfileBlock, ProfileThemePreset } from '@/types/business';
import { DEFAULT_PROFILE_BLOCKS, PROFILE_THEME_PRESETS } from '@/lib/business/profile-blocks';
import TemplateGallery from './TemplateGallery';
import BlockInspector from './BlockInspector';
import CustomBlocksEditor from './CustomBlocksEditor';
import UnifiedAssistant from '@/components/business/editor/UnifiedAssistant';
import { cn } from '@/lib/utils';
import { trackBlockReordered, trackThemeChanged, trackBuilderModeChanged } from '@/lib/business/profile-analytics';
import { BLOCK_LABELS } from './BlockInspector';
import { IconEye } from '@/components/Icons';

type BuilderMode = 'design' | 'assist';

interface ProfileBuilderModesProps {
  profile: Partial<BusinessProfile>;
  onUpdate: (patch: Partial<BusinessProfile>) => void;
  adisos?: import('@/types').Adiso[];
  recommendedTemplateId?: string;
  selectedBlockId?: string | null;
  onSelectBlock?: (id: string | null) => void;
}

function SortableBlockRow({
  block,
  selected,
  onSelect,
  onToggle,
}: {
  block: ProfileBlock;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled: block.type === 'hero',
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-xl border p-2.5 text-sm transition-colors',
        selected
          ? 'border-[var(--brand-color)] bg-[var(--brand-color)]/5 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300',
        isDragging && 'shadow-lg ring-2 ring-[var(--brand-color)]/20',
        block.type === 'hero' && 'opacity-80'
      )}
    >
      <button
        type="button"
        className={cn(
          'shrink-0 p-1 text-slate-400 hover:text-slate-600 touch-none',
          block.type === 'hero' ? 'cursor-not-allowed opacity-40' : 'cursor-grab active:cursor-grabbing'
        )}
        aria-label="Reordenar"
        disabled={block.type === 'hero'}
        {...(block.type === 'hero' ? {} : { ...attributes, ...listeners })}
      >
        ⠿
      </button>
      <button type="button" className="flex-1 text-left min-w-0" onClick={onSelect}>
        <span className="font-semibold text-slate-800 block truncate">
          {BLOCK_LABELS[block.type] || block.type}
        </span>
        {block.type === 'hero' && (
          <span className="text-[10px] text-amber-600">Siempre primero</span>
        )}
      </button>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'shrink-0 text-[10px] font-bold px-2 py-1 rounded-full transition-colors',
          block.visible ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
        )}
      >
        {block.visible ? 'On' : 'Off'}
      </button>
    </div>
  );
}

export default function ProfileBuilderModes({
  profile,
  onUpdate,
  adisos: _adisos = [],
  recommendedTemplateId,
  selectedBlockId: controlledBlockId,
  onSelectBlock,
}: ProfileBuilderModesProps) {
  const [mode, setMode] = useState<BuilderMode>('design');
  const [internalBlockId, setInternalBlockId] = useState<string | null>(null);
  const [visualPanel, setVisualPanel] = useState<'blocks' | 'links'>('blocks');
  const undoSnapshot = useRef<Partial<BusinessProfile> | null>(null);

  const selectedBlockId = controlledBlockId ?? internalBlockId;
  const setSelectedBlockId = onSelectBlock ?? setInternalBlockId;

  const blocks = profile.profile_blocks?.length ? profile.profile_blocks : DEFAULT_PROFILE_BLOCKS;
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const switchMode = (m: BuilderMode) => {
    setMode(m);
    trackBuilderModeChanged(m, profile.id);
  };

  const setTheme = (preset: ProfileThemePreset) => {
    undoSnapshot.current = { ...profile };
    const theme = PROFILE_THEME_PRESETS[preset];
    onUpdate({
      theme_preset: preset,
      theme_color: theme.color,
      theme_mode: theme.mode,
    });
    trackThemeChanged(preset, profile.id);
  };

  const toggleBlock = (id: string) => {
    const next = blocks.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b));
    onUpdate({ profile_blocks: next });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    if (blocks[oldIndex].type === 'hero') return;
    undoSnapshot.current = { profile_blocks: blocks };
    const next = arrayMove(blocks, oldIndex, newIndex);
    onUpdate({ profile_blocks: next });
    trackBlockReordered(String(active.id), profile.id);
  };

  const updateBlockConfig = (config: Record<string, unknown>) => {
    if (!selectedBlock) return;
    const next = blocks.map((b) =>
      b.id === selectedBlock.id ? { ...b, config } : b
    );
    onUpdate({ profile_blocks: next });
  };

  const handleUndo = useCallback(() => {
    if (undoSnapshot.current) {
      onUpdate(undoSnapshot.current);
      undoSnapshot.current = null;
    }
  }, [onUpdate]);

  const paletteTypes: ProfileBlock['type'][] = ['text', 'embed', 'cta'];

  const addBlockFromPalette = (type: ProfileBlock['type']) => {
    if (type === 'catalog' && blocks.some((b) => b.type === 'catalog')) return;
    const id = `${type}-${Date.now()}`;
    onUpdate({
      profile_blocks: [...blocks, { id, type, visible: true, config: {} }],
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
        {(['design', 'assist'] as BuilderMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={cn(
              'flex-1 rounded-lg py-2 text-xs font-bold transition-all',
              mode === m
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {m === 'design' ? 'Diseño' : 'Asistente'}
          </button>
        ))}
      </div>

      {mode === 'design' && (
        <div className="space-y-4">
          <TemplateGallery
            profile={profile}
            onUpdate={onUpdate}
            recommendedTemplateId={recommendedTemplateId}
            onUndo={handleUndo}
            canUndo={Boolean(undoSnapshot.current)}
          />
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Tema curado</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PROFILE_THEME_PRESETS) as ProfileThemePreset[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(key)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border p-2 text-left text-xs font-semibold transition-colors',
                    profile.theme_preset === key
                      ? 'border-[var(--brand-color)] bg-[var(--brand-color)]/5'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-white shadow shrink-0"
                    style={{ background: PROFILE_THEME_PRESETS[key].color }}
                  />
                  {PROFILE_THEME_PRESETS[key].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-800">
            <IconEye size={16} className="shrink-0 mt-0.5 text-blue-500" />
            <p>Así verán tus clientes en el celular — los cambios se aplican al instante en la vista previa.</p>
          </div>

          <div className="flex gap-1 p-0.5 bg-slate-100 rounded-lg">
            {(['blocks', 'links'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setVisualPanel(tab)}
                className={cn(
                  'flex-1 py-1.5 text-xs font-bold rounded-md transition-colors',
                  visualPanel === tab ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'
                )}
              >
                {tab === 'blocks' ? 'Bloques' : 'Enlaces'}
              </button>
            ))}
          </div>

          {visualPanel === 'blocks' && (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-0.5">
                    {blocks.map((block) => (
                      <SortableBlockRow
                        key={block.id}
                        block={block}
                        selected={selectedBlockId === block.id}
                        onSelect={() => setSelectedBlockId(block.id)}
                        onToggle={() => toggleBlock(block.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="flex flex-wrap gap-1.5">
                {paletteTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => addBlockFromPalette(t)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    + {BLOCK_LABELS[t]}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                <BlockInspector block={selectedBlock} onUpdateConfig={updateBlockConfig} />
              </div>
            </>
          )}

          {visualPanel === 'links' && (
            <CustomBlocksEditor
              blocks={profile.custom_blocks || []}
              onChange={(custom_blocks) => onUpdate({ custom_blocks })}
            />
          )}
        </div>
      )}

      {mode === 'assist' && (
        <UnifiedAssistant profile={profile} onUpdate={onUpdate} embedded />
      )}
    </div>
  );
}
