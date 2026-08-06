'use client';

import { useCallback, useEffect, useState } from 'react';
import { IconTrash, IconRefresh, IconX, IconBox } from '@/components/Icons';

export type TrashKind = 'catalog_product' | 'classified_ad';

export interface TrashItem {
  id: string;
  kind: TrashKind;
  title: string;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  category: string | null;
  deletedAt: string;
  purgeAt: string;
}

interface CatalogTrashPanelProps {
  businessProfileId: string;
  open: boolean;
  onClose: () => void;
  /** Se llama tras restaurar o vaciar, para refrescar el catálogo. */
  onChanged?: () => void;
}

function daysLeft(purgeAt: string): number {
  const ms = new Date(purgeAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export default function CatalogTrashPanel({
  businessProfileId,
  open,
  onClose,
  onChanged,
}: CatalogTrashPanelProps) {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessProfileId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/catalog/trash?business=${businessProfileId}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'No se pudo cargar la papelera');
      setItems(json.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar la papelera');
    } finally {
      setLoading(false);
    }
  }, [businessProfileId]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const restore = async (item: TrashItem) => {
    setBusyId(item.id);
    try {
      const res = await fetch('/api/catalog/trash', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, kind: item.kind, business_id: businessProfileId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'No se pudo restaurar');
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al restaurar');
    } finally {
      setBusyId(null);
    }
  };

  const purge = async (item: TrashItem) => {
    setBusyId(item.id);
    try {
      const res = await fetch(
        `/api/catalog/trash?id=${encodeURIComponent(item.id)}&kind=${item.kind}&business=${businessProfileId}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'No se pudo eliminar');
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setBusyId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
              <IconTrash size={18} />
              Papelera
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Se eliminan definitivamente a los 30 días. Puedes restaurarlos antes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100"
            aria-label="Cerrar papelera"
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}

          {loading ? (
            <p className="py-10 text-center text-sm text-slate-400">Cargando…</p>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <IconTrash size={32} className="mx-auto mb-3 text-slate-200" />
              <p className="text-sm font-semibold text-slate-500">La papelera está vacía</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={`${item.kind}-${item.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-2.5"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <IconBox size={18} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">{item.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.kind === 'classified_ad' ? 'Aviso clasificado' : 'Producto'}
                      {' · '}
                      {daysLeft(item.purgeAt)} días para su eliminación
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => restore(item)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                  >
                    <IconRefresh size={13} />
                    Restaurar
                  </button>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => purge(item)}
                    className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
                    title="Eliminar definitivamente"
                    aria-label={`Eliminar definitivamente ${item.title}`}
                  >
                    <IconTrash size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
