'use client';

import type { BusinessProfile } from '@/types/business';
import type { Adiso } from '@/types';
import type { ProfileHubId } from '@/lib/business/profile-progress';
import { computeProfileProgress } from '@/lib/business/profile-progress';
import EditorProgressWidget from '@/components/business/editor/EditorProgressWidget';
import IdentityHubFields from '@/components/business/editor/hubs/IdentityHubFields';
import AppearanceHubFields from '@/components/business/editor/hubs/AppearanceHubFields';
import ContentHubFields from '@/components/business/editor/hubs/ContentHubFields';
import TrustHubFields from '@/components/business/editor/hubs/TrustHubFields';
import {
  IconStore, IconStar, IconBox, IconShield, IconArrowRight, IconCheck,
} from '@/components/Icons';
import { cn } from '@/lib/utils';

const HUBS: { id: ProfileHubId; label: string; subtitle: string; icon: typeof IconStore }[] = [
  { id: 'identity', label: 'Identidad', subtitle: 'Nombre, eslogan, bio y ubicación', icon: IconStore },
  { id: 'appearance', label: 'Apariencia', subtitle: 'Logo, portada, colores y estructura', icon: IconStar },
  { id: 'content', label: 'Contenido', subtitle: 'Métricas, catálogo, destacados y secciones', icon: IconBox },
  { id: 'trust', label: 'Confianza y crecimiento', subtitle: 'Contacto, redes, QR y SEO', icon: IconShield },
];

export interface ProfileEditorHubsProps {
  profile: Partial<BusinessProfile>;
  setProfile: (p: Partial<BusinessProfile> | ((prev: Partial<BusinessProfile>) => Partial<BusinessProfile>)) => void;
  saving?: boolean;
  userAdisos?: Adiso[];
  catalogProducts?: any[];
  activeHub: ProfileHubId;
  setActiveHub: (hub: ProfileHubId) => void;
  onAddProduct?: () => void;
  editingProduct?: any;
  setEditingProduct?: (product: any) => void;
  onRefreshCatalog?: () => void;
}

export function ProfileEditorHubs({
  profile,
  setProfile,
  catalogProducts = [],
  userAdisos = [],
  activeHub,
  setActiveHub,
  onAddProduct,
  editingProduct,
  setEditingProduct,
  onRefreshCatalog,
}: ProfileEditorHubsProps) {
  const { hubScores, fields } = computeProfileProgress(profile, catalogProducts.length);

  const patchProfile = (p: Partial<BusinessProfile>) => {
    setProfile((prev: Partial<BusinessProfile>) => ({ ...prev, ...p }));
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 border-b border-slate-100 bg-slate-50/80">
          <EditorProgressWidget profile={profile} productCount={catalogProducts.length} />
        </div>

        <div className="flex flex-col divide-y divide-slate-50">
          {HUBS.map((hub, index) => {
            const isActive = activeHub === hub.id;
            const HubIcon = hub.icon;
            const score = hubScores[hub.id];
            const hubComplete = score >= 100;

            return (
              <div key={hub.id}>
                <button
                  type="button"
                  onClick={() => setActiveHub(hub.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 text-left transition-all hover:bg-slate-50',
                    isActive ? 'bg-slate-50' : 'bg-white'
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 border-2',
                      hubComplete
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : isActive
                          ? 'bg-blue-100 border-blue-200 text-blue-700'
                          : 'bg-slate-100 border-slate-200 text-slate-500'
                    )}
                  >
                    {hubComplete ? <IconCheck size={14} /> : index + 1}
                  </div>
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                      isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    <HubIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn('font-bold text-sm', isActive ? 'text-blue-700' : 'text-slate-800')}>
                      {hub.label}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">{hub.subtitle}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{score}% completo</p>
                  </div>
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-slate-400',
                      isActive ? 'bg-blue-100 text-blue-600 rotate-90' : 'bg-slate-50'
                    )}
                  >
                    <IconArrowRight size={14} />
                  </div>
                </button>

                {isActive && (
                  <div className="p-6 bg-slate-50/50 border-y border-slate-100 animate-in slide-in-from-top-2 duration-200">
                    {hub.id === 'identity' && (
                      <IdentityHubFields profile={profile} setProfile={patchProfile} fields={fields} />
                    )}
                    {hub.id === 'appearance' && (
                      <AppearanceHubFields profile={profile} setProfile={patchProfile} fields={fields} />
                    )}
                    {hub.id === 'content' && (
                      <ContentHubFields
                        profile={profile}
                        setProfile={patchProfile}
                        fields={fields}
                        catalogProducts={catalogProducts}
                        userAdisos={userAdisos}
                        onAddProduct={onAddProduct}
                        editingProduct={editingProduct}
                        setEditingProduct={setEditingProduct}
                        onRefreshCatalog={onRefreshCatalog}
                      />
                    )}
                    {hub.id === 'trust' && (
                      <TrustHubFields profile={profile} setProfile={patchProfile} fields={fields} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}

/** Map legacy edit-part keys to hub ids */
export function editPartToHub(part: string): ProfileHubId {
  if (part === 'logo' || part === 'visual' || part === 'brand' || part === 'appearance') return 'appearance';
  if (part === 'add-product' || part === 'catalog' || part === 'content' || part === 'highlights') return 'content';
  if (part === 'contact' || part === 'hours' || part === 'social' || part === 'marketing' || part === 'qr' || part === 'qr_tools') return 'trust';
  return 'identity';
}

/** @deprecated Use ProfileEditorHubs */
export { ProfileEditorHubs as EditorSteps };
