'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { BusinessProfile } from '@/types/business';
import BusinessPublicView from '@/components/business/BusinessPublicView';
import BusinessProfileEditorLayout, {
  EditorCloseButton,
  EditorViewToggle,
} from '@/components/business/editor/BusinessProfileEditorLayout';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { EditorSteps } from '../../mi-negocio/components/EditorSteps';
import { cn } from '@/lib/utils';

import { ProductEditor } from '@/components/business/ProductEditor';
import SimpleCatalogAdd from '@/components/business/SimpleCatalogAdd';

import { useToast } from '@/hooks/useToast';
import { useBusinessData } from '@/hooks/useBusinessData';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { updateBusinessProfile, listBusinessProfilesForUser } from '@/lib/business';
import { type BusinessWithRole } from '@/lib/business-access';
import BusinessSwitcher from '@/components/business/BusinessSwitcher';
import { saveBusinessViaAPI, publishBusinessViaAPI } from '@/lib/business-api';
import { useDebounce } from '@/hooks/useDebounce';
import { IconCheck, IconEdit } from '@/components/Icons';

export default function PublicBusinessPage({
    params,
    searchParams,
}: {
    params: { slug: string };
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const slug = decodeURIComponent(params.slug);
    const { user } = useAuth();
    const { profile, isPlatformAdmin } = useUser();
    const { success, error: showError } = useToast();
    const { isOnline, justCameOnline } = useNetworkStatus();

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
    const [editingProduct, setEditingProduct] = useState<any>(null);

    // Local profile state for editing (separate from the cached read-only version)
    const [localProfile, setLocalProfile] = useState<Partial<BusinessProfile> | null>(null);
    const lastSavedStr = useRef<string>('');

    // Modals state
    const [showProductModal, setShowProductModal] = useState(false);
    const [showAddProductModal, setShowAddProductModal] = useState(false);

    // Auto-open editor if requested
    useEffect(() => {
        if (searchParams?.edit === 'true') {
            setIsEditing(true);
        }
    }, [searchParams]);

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
    }, [business]);

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
    }, [debouncedProfile]);

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
        try {
            await supabase!.from('page_analytics').insert({
                business_profile_id: businessId,
                event_type: eventType,
                product_id: productId,
                session_id: getSessionId(),
                user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                referrer: typeof document !== 'undefined' ? document.referrer : '',
            });
        } catch (error) {
            // Silenciar errores de analytics offline
        }
    }, [isOnline]);

    const getSessionId = () => {
        if (typeof sessionStorage === 'undefined') return 'ssr-session';
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('session_id', sessionId);
        }
        return sessionId;
    };

    useEffect(() => {
        if (business?.id && isOnline) {
            trackEvent('profile_view', business.id);
        }
    }, [business?.id, isOnline, trackEvent]);

    const handleProductSave = async (updatedProduct: any) => {
        if (business?.id) {
            await reloadCatalog(business.id);
            success('Producto guardado correctamente');
        }
        setShowProductModal(false);
        setEditingProduct(null);
    };

    const handleEditPart = useCallback((part: string) => {
        setIsEditing(true);
        if (part === 'logo' || part === 'visual') setActiveStep(1);
        else if (part === 'add-product' || part === 'catalog') {
            setActiveStep(2);
            if (part === 'add-product') setShowAddProductModal(true);
        } else if (part === 'contact' || part === 'general') setActiveStep(3);
        else if (part === 'hours') setActiveStep(4);
        else if (part === 'social') setActiveStep(5);
        else if (part === 'marketing') setActiveStep(6);
        else if (part === 'identity') setActiveStep(0);
    }, []);

    // ─── LOADING STATE ────────────────────────────────────
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
        <BusinessProfileEditorLayout
            isEditing={isEditing}
            canEdit={canEdit}
            onCloseEditor={() => setIsEditing(false)}
            onOpenEditor={() => setIsEditing(true)}
            editorTopBar={
                <div className="sticky top-0 z-[70] bg-white border-b border-slate-200 shadow-sm h-14 flex items-center px-4 gap-3">
                    <EditorCloseButton onClick={() => setIsEditing(false)} />
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-bold text-sm text-slate-800 leading-tight">Editar Página</span>
                        {isPlatformAdmin && !isOwner && !isMember && (
                            <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded w-fit">
                                Modo admin — editando perfil ajeno
                            </span>
                        )}
                        <div className="flex items-center gap-1.5">
                            {saving ? (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <div className="w-2 h-2 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                                    Guardando...
                                </span>
                            ) : lastSavedTime ? (
                                <span className="text-[10px] text-green-600 flex items-center gap-1 bg-green-50 px-1.5 rounded-full">
                                    <IconCheck size={8} />
                                    Autoguardado
                                </span>
                            ) : (
                                <span className="text-[10px] text-slate-400">Los cambios se guardan solos</span>
                            )}
                        </div>
                        {businessOptions.length > 0 && business?.id && (
                            <div className="mt-1.5">
                                <BusinessSwitcher
                                    businesses={businessOptions}
                                    currentBusinessId={business.id}
                                    compact
                                />
                            </div>
                        )}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <EditorViewToggle
                            isEditing={isEditing}
                            onEdit={() => setIsEditing(true)}
                            onPreview={() => setIsEditing(false)}
                        />
                        <button
                            onClick={handlePublish}
                            disabled={saving}
                            className={cn(
                                'px-4 py-1.5 rounded-lg font-bold text-white text-sm flex items-center gap-2 transition-all hover:shadow-md disabled:opacity-50',
                                editableProfile.is_published ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-[var(--brand-blue,#53acc5)] hover:brightness-110'
                            )}
                        >
                            {editableProfile.is_published ? '✓ Publicado' : 'Publicar'}
                        </button>
                    </div>
                </div>
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
                    activeStep={activeStep}
                    setActiveStep={setActiveStep}
                    onAddProduct={() => setShowAddProductModal(true)}
                    editingProduct={editingProduct}
                    setEditingProduct={(product: any) => {
                        setEditingProduct(product);
                        setShowProductModal(true);
                    }}
                    onRefreshCatalog={() => business?.id && reloadCatalog(business.id)}
                    onToggleView={() => setIsEditing(false)}
                    isPublished={!!editableProfile.is_published}
                    onPublish={handlePublish}
                />
            }
            preview={
                <>
                    {!isOnline && fromCache && (
                        <div className="fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-white text-center text-sm py-2 px-4 font-medium">
                            📴 Sin conexión — mostrando datos guardados
                        </div>
                    )}
                    {revalidating && isOnline && (
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
                        onEditPart={handleEditPart}
                        onEditProduct={(productAdiso) => {
                            setIsEditing(true);
                            setActiveStep(2);
                            const fullProduct = catalogProducts.find((p) => p.id === productAdiso.id);
                            setEditingProduct(fullProduct || productAdiso);
                            setShowProductModal(true);
                        }}
                    />
                </>
            }
            floatingActions={
                <div className="fixed bottom-24 left-4 right-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:right-6 md:bottom-6">
                    {businessOptions.length > 0 && business?.id && (
                        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 shadow-lg max-w-full">
                            <BusinessSwitcher
                                businesses={businessOptions}
                                currentBusinessId={business.id}
                                compact
                            />
                        </div>
                    )}
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-full shadow-xl font-bold text-sm hover:bg-slate-700 transition-all active:scale-95"
                    >
                        <IconEdit size={16} />
                        Editar página
                    </button>
                </div>
            }
        />
            {(showProductModal || editingProduct) && user && business?.id && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <ProductEditor
                            key={editingProduct?.id || 'new-product'}
                            product={editingProduct === 'new' ? null : editingProduct}
                            businessProfileId={business.id}
                            userId={user.id}
                            adisos={adisos}
                            onSave={handleProductSave}
                            onCancel={() => {
                                setShowProductModal(false);
                                setEditingProduct(null);
                            }}
                        />
                    </div>
                </div>
            )}

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
