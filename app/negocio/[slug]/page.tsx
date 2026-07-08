'use client';

import React, { use, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { BusinessProfile } from '@/types/business';
import BusinessPublicView from '@/components/business/BusinessPublicView';
import BusinessProfileEditorLayout from '@/components/business/editor/BusinessProfileEditorLayout';
import EditorTopBar from '@/components/business/editor/EditorTopBar';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { EditorSteps, editPartToHub } from '../../mi-negocio/components/EditorSteps';
import type { ProfileHubId } from '@/lib/business/profile-progress';

import { ProductEditor } from '@/components/business/ProductEditor';
import SimpleCatalogAdd from '@/components/business/SimpleCatalogAdd';

import { useToast } from '@/hooks/useToast';
import { useBusinessData } from '@/hooks/useBusinessData';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { updateBusinessProfile, listBusinessProfilesForUser } from '@/lib/business';
import { type BusinessWithRole } from '@/lib/business-access';
import { saveBusinessViaAPI, publishBusinessViaAPI } from '@/lib/business-api';
import { useDebounce } from '@/hooks/useDebounce';
import { normalizeBusinessSlug } from '@/lib/business/normalize-slug';
import { trackProfileEvent, trackProfileView } from '@/lib/business/analytics/track-profile-event';
import { ProfileEditProvider } from '@/contexts/ProfileEditContext';
import ProductEditorModal from '@/components/business/editor/ProductEditorModal';
import InlineFieldEditorHost from '@/components/business/editor/InlineFieldEditorHost';

export default function PublicBusinessPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { slug: slugParam } = use(params);
    const resolvedSearchParams = use(searchParams);
    const slug = normalizeBusinessSlug(slugParam);
    const { user } = useAuth();
    const { profile, isPlatformAdmin } = useUser();
    const { success, error: showError } = useToast();
    const { isOnline, justCameOnline } = useNetworkStatus();

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [activeHub, setActiveHub] = useState<ProfileHubId>('identity');
    const [saving, setSaving] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
    const [editingProduct, setEditingProduct] = useState<any>(null);

    // Local profile state for editing (separate from the cached read-only version)
    const [localProfile, setLocalProfile] = useState<Partial<BusinessProfile> | null>(null);
    const lastSavedStr = useRef<string>('');

    // Modals state
    const [showAddProductModal, setShowAddProductModal] = useState(false);

    // Auto-open editor if requested
    useEffect(() => {
        if (resolvedSearchParams?.edit === 'true') {
            setIsEditing(true);
        }
    }, [resolvedSearchParams]);

    const [mounted, setMounted] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [businessOptions, setBusinessOptions] = useState<BusinessWithRole[]>([]);

    const {
        business,
        adisos,
        catalogProducts,
        loading,
        revalidating,
        fromCache,
        isStale,
        reloadCatalog,
        updateBusiness,
    } = useBusinessData(slug, isPlatformAdmin || isMember);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!user?.id) {
            setBusinessOptions([]);
            return;
        }
        listBusinessProfilesForUser(user.id).then(setBusinessOptions);
    }, [user?.id, business?.id]);

    // Derived owner check — also works when user_id in business_profiles matches auth user
    // OR when the user is in business_members with a role >= editor
    const isOwner = mounted && Boolean(
        user?.id &&
        business &&
        (business.user_id === user.id)
    );

    // Secondary check via membership (handles cases where user_id differs)
    useEffect(() => {
        if (!user?.id || !business?.id || isOwner || isPlatformAdmin) return;
        supabase!.from('business_members')
            .select('role')
            .eq('user_id', user.id)
            .eq('business_profile_id', business.id)
            .eq('status', 'active')
            .single()
            .then(({ data }) => {
                if (data?.role && ['owner','admin','editor'].includes(data.role)) {
                    setIsMember(true);
                }
            });
    }, [user?.id, business?.id, isOwner, isPlatformAdmin]);

    const canEdit = mounted && (isOwner || isMember || isPlatformAdmin);

    // When business loads, initialize local editing profile
    useEffect(() => {
        if (business && !localProfile) {
            setLocalProfile(business);
            lastSavedStr.current = JSON.stringify(business);
        }
    }, [business, localProfile]);

    // Reload catalog when ownership is confirmed to ensure drafts are visible
    useEffect(() => {
        if (business?.id && canEdit && isOnline) {
            reloadCatalog(business.id);
        }
    }, [canEdit, business?.id, isOnline, reloadCatalog]);

    // ─── REAL SAVE TO SUPABASE ────────────────────────────────────────
    const handleSave = useCallback(async (profileToSave: Partial<BusinessProfile>, showNotification = false) => {
        if (!profileToSave.id) return;
        try {
            setSaving(true);
            const saved = await saveBusinessViaAPI(profileToSave.id, profileToSave);
            if (saved) {
                setLocalProfile(saved);
                lastSavedStr.current = JSON.stringify(saved);
                setLastSavedTime(new Date());
                updateBusiness(() => saved);
                if (showNotification) success('¡Cambios guardados!');
            }
        } catch (err: any) {
            console.error('handleSave error:', err);
            showError('Error al guardar: ' + (err?.message || JSON.stringify(err)));
        } finally {
            setSaving(false);
        }
    }, [updateBusiness, success, showError]);

    // ─── AUTO-SAVE: debounce profile changes ─────────────────────────
    const debouncedProfile = useDebounce(localProfile, 1200);

    useEffect(() => {
        if (!debouncedProfile?.id) return;
        const currentStr = JSON.stringify(debouncedProfile);
        if (currentStr === lastSavedStr.current) return;
        handleSave(debouncedProfile, false);
    }, [debouncedProfile, handleSave]);

    // ─── PUBLISH TOGGLE ───────────────────────────────────────────────
    const handlePublish = useCallback(async () => {
        if (!localProfile?.id) {
            showError('Carga tu negocio primero (recarga la página)');
            return;
        }
        // Skip client-side permission check — let Supabase RLS be the authority
        try {
            setSaving(true);
            const newState = !localProfile.is_published;
            const saved = await publishBusinessViaAPI(localProfile.id, newState);
            if (saved) {
                setLocalProfile(saved);
                lastSavedStr.current = JSON.stringify(saved);
                updateBusiness(() => saved);
                success(newState ? '¡Página publicada! 🎉' : 'Página despublicada');
            } else {
                showError('No se pudo publicar. Verifica permisos en Supabase.');
            }
        } catch (err: any) {
            console.error('handlePublish error:', err);
            showError('Error al publicar: ' + (err?.message || JSON.stringify(err)));
        } finally {
            setSaving(false);
        }
    }, [localProfile, updateBusiness, success, showError]);

    const trackEvent = useCallback(async (eventType: string, businessId: string, productId?: string) => {
        if (!isOnline) return;
        await trackProfileEvent(businessId, eventType as Parameters<typeof trackProfileEvent>[1], productId);
    }, [isOnline]);

    useEffect(() => {
        if (!business?.id || !isOnline) return;
        const isOwnerOrMember = canEdit;
        trackProfileView({
            businessProfileId: business.id,
            isEditing,
            isOwnerOrMember,
            fromQr: resolvedSearchParams?.from_qr === '1',
        });
    }, [business?.id, isOnline, isEditing, canEdit, resolvedSearchParams?.from_qr]);

    const handleProductSave = async (updatedProduct: any) => {
        if (business?.id) {
            await reloadCatalog(business.id);
            success('Producto guardado correctamente');
        }
        setEditingProduct(null);
    };

    const handleEditPart = useCallback((part: string) => {
        setIsEditing(true);
        setActiveHub(editPartToHub(part));
        if (part === 'add-product') {
            setActiveHub('content');
            setShowAddProductModal(true);
        }
    }, []);

    useEffect(() => {
        if (!isEditing) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (localProfile?.id) handleSave(localProfile, true);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isEditing, localProfile, handleSave]);
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">Cargando...</p>
                    {mounted && !isOnline && (
                        <p className="text-sm text-amber-500 mt-2">Sin conexión — buscando datos guardados</p>
                    )}
                </div>
            </div>
        );
    }

    // ─── NOT FOUND STATE ──────────────────────────────────
    if (!business) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-sm mx-auto p-8">
                    {!isOnline ? (
                        <>
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M8.879 8.879a5 5 0 000 7.072m6.242-7.072a5 5 0 010 7.072" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Sin conexión</h2>
                            <p className="text-slate-500 text-sm">
                                No hay datos guardados de este negocio. Conéctate a internet para cargarlo por primera vez.
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Negocio no encontrado</h2>
                            <p className="text-slate-500 text-sm">No encontramos ningún negocio con este enlace.</p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // The profile used for editing (local state) or the cached one for preview
    const editableProfile = localProfile || business;

    return (
        <>
        <ProfileEditProvider
            isEditing={isEditing}
            initialHub={activeHub}
            onHubChange={setActiveHub}
            onEditPart={handleEditPart}
        >
        <BusinessProfileEditorLayout
            isEditing={isEditing}
            canEdit={canEdit}
            onCloseEditor={() => setIsEditing(false)}
            onOpenEditor={() => setIsEditing(true)}
            editorTopBar={
                <EditorTopBar
                    saving={saving}
                    lastSavedTime={lastSavedTime}
                    isPlatformAdmin={isPlatformAdmin}
                    isOwner={isOwner}
                    isMember={isMember}
                    editableProfile={editableProfile}
                    catalogProductCount={catalogProducts.length}
                    businessOptions={businessOptions}
                    businessId={business?.id}
                    onClose={() => setIsEditing(false)}
                    onPreview={() => setIsEditing(false)}
                    onPublish={handlePublish}
                    onToggleVacation={() =>
                        setLocalProfile((prev) =>
                            prev ? { ...prev, is_vacation_mode: !prev.is_vacation_mode } : prev
                        )
                    }
                />
            }
            sidebar={
                <EditorSteps
                    profile={editableProfile as any}
                    setProfile={(p: any) => {
                        if (typeof p === 'function') {
                            setLocalProfile((prev) => (prev ? (p as any)(prev) : prev));
                        } else {
                            setLocalProfile(p);
                        }
                    }}
                    saving={saving}
                    catalogProducts={catalogProducts}
                    activeHub={activeHub}
                    setActiveHub={setActiveHub}
                    onAddProduct={() => setShowAddProductModal(true)}
                    editingProduct={editingProduct}
                    setEditingProduct={setEditingProduct}
                    onRefreshCatalog={() => business?.id && reloadCatalog(business.id)}
                />
            }
            preview={
                <>
                    {!isOnline && fromCache && (
                        <div className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-white text-center text-sm py-2 px-4 font-medium">
                            📴 Sin conexión — mostrando datos guardados
                        </div>
                    )}
                    {revalidating && isOnline && isEditing && (
                        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] bg-slate-800/90 text-white text-xs py-1.5 px-4 rounded-full flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Actualizando...
                        </div>
                    )}
                    <BusinessPublicView
                        profile={editableProfile as any}
                        adisos={adisos}
                        catalogProducts={catalogProducts}
                        viewMode={isEditing ? 'editor' : 'storefront'}
                        editMode={canEdit && isEditing}
                        canEdit={canEdit}
                        onOpenEditor={() => setIsEditing(true)}
                        onEditPart={handleEditPart}
                        onProfilePatch={(patch) =>
                            setLocalProfile((prev) => (prev ? { ...prev, ...patch } : prev))
                        }
                        onEditProduct={(productAdiso) => {
                            setIsEditing(true);
                            setActiveHub('content');
                            const fullProduct = catalogProducts.find((p) => p.id === productAdiso.id);
                            setEditingProduct(fullProduct || productAdiso);
                        }}
                        onCatalogReorder={() => business?.id && reloadCatalog(business.id)}
                    />
                </>
            }
            floatingActions={undefined}
        />
        <InlineFieldEditorHost />
        <ProductEditorModal
            open={Boolean(editingProduct) && Boolean(user?.id && business?.id)}
            product={editingProduct}
            businessProfileId={business?.id || ''}
            userId={user?.id || ''}
            adisos={adisos}
            onSave={handleProductSave}
            onClose={() => setEditingProduct(null)}
        />
        </ProfileEditProvider>

            {/* Simple Product Add Modal */}
            {showAddProductModal && business?.id && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl overflow-hidden">
                        <SimpleCatalogAdd
                            businessProfileId={business.id}
                            onSuccess={() => {
                                reloadCatalog(business.id);
                                setShowAddProductModal(false);
                                success('Producto añadido correctamente');
                            }}
                            onClose={() => setShowAddProductModal(false)}
                            adisos={adisos}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
