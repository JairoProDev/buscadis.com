'use client';

import { useEffect, useRef, useState } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { uploadProductImage } from '@/lib/business';
import {
  type BusinessCategory,
  listBusinessCategories,
  createBusinessCategory,
  updateBusinessCategory,
  deleteBusinessCategory,
  reorderBusinessCategories,
} from '@/lib/catalog/categories';
import { IconCamera, IconStore, IconTrash, IconX } from '@/components/Icons';
import { cn } from '@/lib/utils';

interface CategoryManagerModalProps {
  businessProfileId: string;
  productCategories: string[];
  autoThumbs: Map<string, string>;
  onClose: () => void;
  onChanged: () => void;
}

function asTempCategory(
  businessProfileId: string,
  name: string,
  sortOrder: number,
  imageUrl?: string | null
): BusinessCategory {
  return {
    id: `temp:${name}`,
    business_profile_id: businessProfileId,
    name,
    slug: name,
    image_url: imageUrl || null,
    sort_order: sortOrder,
  };
}

export default function CategoryManagerModal({
  businessProfileId,
  productCategories,
  autoThumbs,
  onClose,
  onChanged,
}: CategoryManagerModalProps) {
  const { user } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const [items, setItems] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const dirtyRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Materialize product-derived categories into business_categories, then load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setSyncError(null);

      // Show product categories immediately so the modal never looks empty
      // while we sync to the DB (or if the write is denied by RLS).
      const preview = productCategories
        .filter((n) => n && n !== 'Clasificados')
        .map((name, i) => asTempCategory(businessProfileId, name, i, autoThumbs.get(name)));
      if (!cancelled && preview.length > 0) {
        setItems(preview);
      }

      const existing = await listBusinessCategories(businessProfileId);
      const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));
      const missing = productCategories.filter(
        (n) => n && n !== 'Clasificados' && !existingNames.has(n.toLowerCase())
      );

      let createdCount = 0;
      let failedCount = 0;
      if (missing.length > 0) {
        let order = existing.length;
        for (const name of missing) {
          const created = await createBusinessCategory(businessProfileId, {
            name,
            imageUrl: autoThumbs.get(name) || null,
            sortOrder: order++,
          });
          if (created) {
            createdCount += 1;
            dirtyRef.current = true;
          } else {
            failedCount += 1;
          }
        }
      }

      const fresh = await listBusinessCategories(businessProfileId);
      if (cancelled) return;

      if (fresh.length > 0) {
        setItems(fresh);
      } else if (preview.length > 0) {
        // DB still empty (likely RLS) — keep the product-derived preview
        setItems(preview);
        setSyncError(
          'No se pudieron guardar las categorías en el servidor. Puedes verlas aquí, pero el orden/fotos no se persistirán hasta que se corrijan los permisos.'
        );
      } else {
        setItems([]);
      }

      if (failedCount > 0 && createdCount === 0 && fresh.length === 0) {
        toastError('No tienes permiso para guardar categorías en este negocio.');
      }

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessProfileId, productCategories.join('|')]);

  const handleClose = () => {
    if (dirtyRef.current) onChanged();
    onClose();
  };

  const ensurePersisted = async (cat: BusinessCategory): Promise<BusinessCategory | null> => {
    if (!cat.id.startsWith('temp:')) return cat;
    const created = await createBusinessCategory(businessProfileId, {
      name: cat.name,
      imageUrl: cat.image_url || autoThumbs.get(cat.name) || null,
      sortOrder: cat.sort_order,
    });
    if (!created) {
      toastError('No se pudo guardar la categoría. Revisa tus permisos.');
      return null;
    }
    dirtyRef.current = true;
    setItems((prev) => prev.map((c) => (c.id === cat.id ? created : c)));
    return created;
  };

  const handleRename = async (cat: BusinessCategory, name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === cat.name) return;
    setBusy(true);
    const persisted = await ensurePersisted(cat);
    if (!persisted) {
      setBusy(false);
      return;
    }
    const updated = await updateBusinessCategory(persisted, { name: trimmed });
    setBusy(false);
    if (updated) {
      setItems((prev) => prev.map((c) => (c.id === persisted.id || c.id === cat.id ? updated : c)));
      dirtyRef.current = true;
    } else {
      toastError('No se pudo renombrar la categoría');
    }
  };

  const handlePhoto = async (cat: BusinessCategory, file: File) => {
    if (!user?.id) return;
    setBusy(true);
    try {
      const persisted = await ensurePersisted(cat);
      if (!persisted) return;
      const url = await uploadProductImage(file, user.id);
      const updated = await updateBusinessCategory(persisted, { imageUrl: url });
      if (updated) {
        setItems((prev) => prev.map((c) => (c.id === persisted.id || c.id === cat.id ? updated : c)));
        dirtyRef.current = true;
      }
    } catch (e) {
      console.error(e);
      toastError('No se pudo subir la imagen');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (cat: BusinessCategory) => {
    setBusy(true);
    if (cat.id.startsWith('temp:')) {
      setItems((prev) => prev.filter((c) => c.id !== cat.id));
      setBusy(false);
      return;
    }
    const ok = await deleteBusinessCategory(cat.id);
    setBusy(false);
    if (ok) {
      setItems((prev) => prev.filter((c) => c.id !== cat.id));
      dirtyRef.current = true;
    } else {
      toastError('No se pudo eliminar la categoría');
    }
  };

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    if (items.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toastError('Esa categoría ya existe');
      return;
    }
    setBusy(true);
    const created = await createBusinessCategory(businessProfileId, {
      name,
      sortOrder: items.length,
    });
    setBusy(false);
    if (created) {
      setItems((prev) => [...prev, created]);
      setNewName('');
      dirtyRef.current = true;
      toastSuccess('Categoría agregada');
      setSyncError(null);
    } else {
      toastError('No se pudo agregar la categoría');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = items.map((c) => c.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex).map((c, i) => ({ ...c, sort_order: i }));
    setItems(next);
    dirtyRef.current = true;

    // Persist only real rows; materialize temps first if needed.
    const persisted: BusinessCategory[] = [];
    for (const cat of next) {
      if (cat.id.startsWith('temp:')) {
        const created = await createBusinessCategory(businessProfileId, {
          name: cat.name,
          imageUrl: cat.image_url || autoThumbs.get(cat.name) || null,
          sortOrder: cat.sort_order,
        });
        if (created) persisted.push(created);
        else {
          toastError('No se pudo guardar el nuevo orden (permisos).');
          return;
        }
      } else {
        persisted.push(cat);
      }
    }
    setItems(persisted);
    const ok = await reorderBusinessCategories(persisted.map((c) => c.id));
    if (!ok) toastError('No se pudo guardar el orden de categorías');
    else setSyncError(null);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 m-0">
              <IconStore size={18} className="text-[var(--brand-color)]" /> Categorías
            </h3>
            <p className="text-xs text-slate-400 mt-1 m-0">
              Arrastra ⠿ para cambiar el orden que ven tus clientes.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 -mr-2 rounded-full hover:bg-slate-100 text-slate-500"
            aria-label="Cerrar"
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {syncError && (
            <p className="mb-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-800">
              {syncError}
            </p>
          )}
          {loading && items.length === 0 ? (
            <div className="py-10 flex justify-center">
              <div className="w-6 h-6 border-2 border-slate-200 border-t-[var(--brand-color)] rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              Aún no tienes categorías. Agrega una abajo.
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {items.map((cat) => (
                    <CategoryRow
                      key={cat.id}
                      cat={cat}
                      fallbackThumb={autoThumbs.get(cat.name)}
                      disabled={busy}
                      onRename={(name) => handleRename(cat, name)}
                      onPhoto={(file) => handlePhoto(cat, file)}
                      onDelete={() => handleDelete(cat)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            placeholder="Nueva categoría"
            className="flex-1 min-w-0 px-3 py-2.5 border-2 border-slate-200 rounded-xl outline-none focus:border-[var(--brand-color)] transition-colors text-sm"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={busy || !newName.trim()}
            className="px-4 py-2.5 rounded-xl bg-[var(--brand-color)] text-white font-bold text-sm hover:shadow-lg transition-all disabled:opacity-40"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  cat,
  fallbackThumb,
  disabled,
  onRename,
  onPhoto,
  onDelete,
}: {
  cat: BusinessCategory;
  fallbackThumb?: string;
  disabled?: boolean;
  onRename: (name: string) => void;
  onPhoto: (file: File) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cat.id,
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 20 : undefined,
  };
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(cat.name);
  const thumb = cat.image_url || fallbackThumb;

  useEffect(() => setName(cat.name), [cat.name]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 bg-slate-50 rounded-2xl p-2 border border-slate-100',
        isDragging && 'shadow-xl'
      )}
    >
      <button
        type="button"
        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Arrastrar para reordenar"
        title="Arrastrar"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="shrink-0 w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-white relative group"
        aria-label="Cambiar foto"
      >
        {thumb ? (
          <img src={thumb} alt={cat.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--brand-color)] bg-[var(--brand-color)]/10 font-bold">
            {cat.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
          <IconCamera size={16} />
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPhoto(f);
          e.target.value = '';
        }}
      />

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => onRename(name)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        className="flex-1 min-w-0 px-2 py-1.5 bg-transparent outline-none text-sm font-semibold text-slate-700 focus:bg-white rounded-lg"
      />

      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className="shrink-0 p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
        aria-label="Eliminar categoría"
      >
        <IconTrash size={15} />
      </button>
    </div>
  );
}
