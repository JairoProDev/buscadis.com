'use client';

import Link from 'next/link';
import { useState } from 'react';
import { nanoid } from 'nanoid';
import type { BusinessProfile, StoryHighlight, MetricsConfig } from '@/types/business';
import { METRIC_LABELS } from '@buscadis/profile-engine';
import FieldLabel from '@/components/business/editor/FieldLabel';
import ProfileBuilderModes from '@/components/business/builder/ProfileBuilderModes';
import ProfileSectionBlocksEditor from '@/components/business/editor/ProfileSectionBlocksEditor';
import { deleteAllBusinessProducts, deleteCatalogProduct } from '@/lib/business';
import { isFieldComplete, type ProfileFieldStatus } from '@/lib/business/profile-progress';
import {
  IconPlus, IconEdit, IconTrash, IconSearch, IconBox, IconSparkles, IconArrowRight, IconArrowLeft,
} from '@/components/Icons';
import { ProductEditor } from '@/components/business/ProductEditor';
import type { Adiso } from '@/types';

const METRIC_KEYS = Object.keys(METRIC_LABELS) as MetricsConfig['keys'][number][];

interface ContentHubFieldsProps {
  profile: Partial<BusinessProfile>;
  setProfile: (p: Partial<BusinessProfile>) => void;
  fields: ProfileFieldStatus[];
  catalogProducts?: any[];
  userAdisos?: Adiso[];
  onAddProduct?: () => void;
  editingProduct?: any;
  setEditingProduct?: (p: any) => void;
  onRefreshCatalog?: () => void;
}

export default function ContentHubFields({
  profile,
  setProfile,
  fields,
  catalogProducts = [],
  userAdisos = [],
  onAddProduct,
  editingProduct,
  setEditingProduct,
  onRefreshCatalog,
}: ContentHubFieldsProps) {
  const done = (id: string) => isFieldComplete(id, fields);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const highlights = profile.story_highlights ?? [];
  const selectedMetrics = profile.metrics_config?.keys ?? ['views', 'products', 'reviews'];

  const toggleMetric = (key: MetricsConfig['keys'][number]) => {
    const has = selectedMetrics.includes(key);
    let next = has ? selectedMetrics.filter((k) => k !== key) : [...selectedMetrics, key];
    if (next.length > 3) next = next.slice(-3);
    setProfile({ ...profile, metrics_config: { keys: next } });
  };

  const addHighlight = () => {
    setProfile({
      ...profile,
      story_highlights: [
        ...highlights,
        { id: nanoid(8), title: 'Nuevo', cover_url: '', link_url: '' },
      ],
    });
  };

  const updateHighlight = (id: string, patch: Partial<StoryHighlight>) => {
    setProfile({
      ...profile,
      story_highlights: highlights.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    });
  };

  const removeHighlight = (id: string) => {
    setProfile({ ...profile, story_highlights: highlights.filter((h) => h.id !== id) });
  };

  const filtered = catalogProducts.filter(
    (p: any) =>
      (p.title || '').toLowerCase().includes(catalogSearch.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel number={1} label="Métricas visibles (máx. 3)" complete={done('metrics')} />
        <div className="flex flex-wrap gap-2">
          {METRIC_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleMetric(key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${
                selectedMetrics.includes(key)
                  ? 'bg-[var(--brand-blue,#53acc5)] text-white border-transparent'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              {METRIC_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel number={2} label="Destacados" complete={done('highlights')} />
        <div className="space-y-2">
          {highlights.map((h) => (
            <div key={h.id} className="flex gap-2 items-start p-2 bg-white border border-slate-200 rounded-xl">
              <input
                className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1"
                value={h.title}
                onChange={(e) => updateHighlight(h.id, { title: e.target.value })}
                placeholder="Título"
              />
              <input
                className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1"
                value={h.link_url || ''}
                onChange={(e) => updateHighlight(h.id, { link_url: e.target.value })}
                placeholder="Enlace"
              />
              <button type="button" onClick={() => removeHighlight(h.id)} className="text-red-400 p-1">
                <IconTrash size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addHighlight}
            className="text-xs font-bold text-[var(--brand-blue,#53acc5)] flex items-center gap-1"
          >
            <IconPlus size={12} /> Agregar destacado
          </button>
        </div>
      </div>

      <div>
        <FieldLabel number={3} label="Secciones y bloques" complete={done('sections')} />
        <ProfileBuilderModes
          profile={profile}
          onUpdate={(patch) => setProfile({ ...profile, ...patch })}
          adisos={userAdisos}
        />
      </div>

      <div>
        <FieldLabel number={4} label="Catálogo" complete={done('catalog')} />
        {editingProduct ? (
          <div>
            <button
              type="button"
              onClick={() => setEditingProduct?.(null)}
              className="text-xs text-slate-500 flex items-center gap-1 mb-2 font-bold"
            >
              <IconArrowLeft size={10} /> Volver
            </button>
            <ProductEditor
              product={editingProduct === 'new' ? undefined : editingProduct}
              businessProfileId={profile.id || ''}
              userId={profile.user_id || ''}
              onSave={() => {
                setEditingProduct?.(null);
                onRefreshCatalog?.();
              }}
              onCancel={() => setEditingProduct?.(null)}
            />
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={onAddProduct}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--brand-blue,#53acc5)] text-white rounded-2xl text-sm font-black"
              >
                <IconPlus size={18} /> Agregar producto
              </button>
              {catalogProducts.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm('¿Eliminar todo el catálogo?')) return;
                    await deleteAllBusinessProducts(profile.id || '');
                    onRefreshCatalog?.();
                  }}
                  className="w-12 h-12 flex items-center justify-center text-red-400 border border-red-100 rounded-2xl"
                >
                  <IconTrash size={20} />
                </button>
              )}
            </div>
            <div className="relative mb-2">
              <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl text-sm"
              />
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filtered.map((p: any) => (
                <div key={p.id} className="flex items-center gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100/50">
                  <div className="w-10 h-10 rounded bg-white overflow-hidden shrink-0">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <IconBox size={16} className="m-auto text-blue-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate flex items-center gap-1">
                      {p.title} <IconSparkles size={10} className="text-blue-400" />
                    </p>
                    <p className="text-[10px] text-blue-600">S/ {(p.price || 0).toFixed(2)}</p>
                  </div>
                  <button type="button" onClick={() => setEditingProduct?.(p)} className="p-1.5 bg-white rounded border">
                    <IconEdit size={12} />
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === p.id}
                    onClick={async () => {
                      setDeletingId(p.id);
                      await deleteCatalogProduct(p.id);
                      onRefreshCatalog?.();
                      setDeletingId(null);
                    }}
                    className="p-1.5 text-red-400"
                  >
                    <IconTrash size={12} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div>
        <FieldLabel number={5} label="Deals y contenido" complete={false} />
        <Link
          href={`/mi-negocio/deals${profile.id ? `?business=${profile.id}` : ''}`}
          className="text-sm font-bold text-[var(--brand-blue,#53acc5)] hover:underline"
        >
          Gestionar deals →
        </Link>
      </div>

      <div>
        <FieldLabel number={6} label="Información profunda" complete={done('deep_blocks')} />
        <ProfileSectionBlocksEditor
          profile={profile}
          onUpdate={(patch) => setProfile({ ...profile, ...patch })}
        />
      </div>
    </div>
  );
}
