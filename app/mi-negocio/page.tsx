/**
 * Página de Creación/Edición de Negocios - REDISEÑO COMPLETO
 * 
 * Experiencia guiada por chatbot con vista en tiempo real
 * Sin formularios separados, todo inline y fluido
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createBusinessProfile, listBusinessProfilesForUser, updateBusinessProfile, getBusinessCatalog } from '@/lib/business';
import { hasPermission, type BusinessMemberRole, type BusinessWithRole } from '@/lib/business-access';
import { BusinessProfile } from '@/types/business';
import { Adiso } from '@/types';
import { IconEye, IconEdit, IconX, IconCheck } from '@/components/Icons';
import AuthModal from '@/components/AuthModal';
import BusinessPublicView from '@/components/business/BusinessPublicView';
import ChatbotGuide from '@/components/business/ChatbotGuide';
import { EditorSteps } from './components/EditorSteps';
import SimpleCatalogAdd from '@/components/business/SimpleCatalogAdd';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { ProductEditor } from '@/components/business/ProductEditor';

function BusinessBuilderPageContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { success, error } = useToast();

    const [businessOptions, setBusinessOptions] = useState<BusinessWithRole[]>([]);
    const [memberRole, setMemberRole] = useState<BusinessMemberRole | null>(null);

    const [profileLoading, setProfileLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);

    // View State
    const [viewMode, setViewMode] = useState<'preview' | 'editor'>('preview');
    const [activeStep, setActiveStep] = useState(0);

    const [chatbotMinimized, setChatbotMinimized] = useState(false);
    const [isFirstTime, setIsFirstTime] = useState(false);

    const lastSavedProfileStr = React.useRef<string>('');
    const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

    const [profile, setProfile] = useState<Partial<BusinessProfile>>({
        name: '',
        slug: '',
        description: '',
        contact_whatsapp: '',
        contact_email: '',
        contact_phone: '',
        contact_address: '',
        logo_url: '',
        banner_url: '',
        theme_color: '#53acc5', // Default: turquesa
        social_links: [],
        business_hours: {
            monday: { open: '', close: '', closed: false },
            tuesday: { open: '', close: '', closed: false },
            wednesday: { open: '', close: '', closed: false },
            thursday: { open: '', close: '', closed: false },
            friday: { open: '', close: '', closed: false },
            saturday: { open: '', close: '', closed: false },
            sunday: { open: '', close: '', closed: true }
        },
        announcement_text: '',
        is_published: false
    });

    const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
    const [adisos, setAdisos] = useState<Adiso[]>([]);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showAddProductModal, setShowAddProductModal] = useState(false);

    const debouncedProfile = useDebounce(profile, 1000);



    const handleEditProduct = (product: Adiso) => {
        const original = catalogProducts.find(p => p.id === product.id);
        if (original) {
            setEditingProduct(original);
            setShowProductModal(true);
        } else {
            // New product or fallback
            setEditingProduct(null);
            setShowProductModal(true);
        }
    };

    const handleRefreshCatalog = async () => {
        if (profile.id) {
            const products = await getBusinessCatalog(profile.id);
            setCatalogProducts(products);

            const mappedAdisos: Adiso[] = products.map(p => ({
                id: p.id,
                titulo: p.title || '',
                descripcion: p.description || '',
                precio: p.price,
                imagenesUrls: Array.isArray(p.images) ? p.images.map((img: any) => typeof img === 'string' ? img : img.url) : [],
                imagenUrl: Array.isArray(p.images) && p.images.length > 0 ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0].url) : '',
                slug: p.id,
                categoria: (p.category as any) || 'productos',
                user_id: user?.id || '',
                contacto: profile.contact_phone || '',
                ubicacion: profile.contact_address || '',
                fechaPublicacion: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                horaPublicacion: p.created_at ? new Date(p.created_at).toLocaleTimeString() : new Date().toLocaleTimeString()
            }));
            setAdisos(mappedAdisos);
        }
    };

    const handleProductSave = async (updatedProduct: any) => {
        await handleRefreshCatalog();
        setShowProductModal(false);
        setEditingProduct(null);
    };


    const loadProfile = React.useCallback(async () => {
        if (!user) return;

        try {
            setProfileLoading(true);
            const memberships = await listBusinessProfilesForUser(user.id);
            setBusinessOptions(memberships);

            const forceNew = searchParams.get('new') === '1';
            if (forceNew) {
                setMemberRole(null);
                setIsFirstTime(true);
                setChatbotMinimized(false);
                setCatalogProducts([]);
                setAdisos([]);
                setProfile((prev) => ({
                    ...prev,
                    id: undefined as any,
                    name: '',
                    slug: '',
                    user_id: user.id,
                    is_published: false,
                }));
                lastSavedProfileStr.current = '';
                setProfileLoading(false);
                return;
            }

            const paramBusinessId = searchParams.get('business');
            const picked =
                (paramBusinessId && memberships.find((m) => m.profile.id === paramBusinessId)) ||
                memberships[0] ||
                null;

            if (picked) {
                const existingProfile = picked.profile;
                setMemberRole(picked.role);

                // If the business already has a slug, redirect to the public page editor (Unified Experience)
                if (existingProfile.slug) {
                    router.push(`/negocio/${existingProfile.slug}?edit=true`);
                    return;
                }

                setProfile(existingProfile);
                lastSavedProfileStr.current = JSON.stringify(existingProfile);
                setIsFirstTime(false);
                setChatbotMinimized(true); // Usuario existente: chatbot minimizado

                // Load Catalog
                if (existingProfile.id) {
                    const products = await getBusinessCatalog(existingProfile.id);
                    setCatalogProducts(products);

                    // Map to Adiso for View
                    const mappedAdisos: Adiso[] = products.map(p => ({
                        id: p.id,
                        titulo: p.title || '',
                        descripcion: p.description || '',
                        precio: p.price,
                        imagenesUrls: Array.isArray(p.images) ? p.images.map((img: any) => typeof img === 'string' ? img : img.url) : [],
                        imagenUrl: Array.isArray(p.images) && p.images.length > 0 ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0].url) : '',
                        slug: p.id,
                        categoria: (p.category as any) || 'productos',
                        user_id: user.id,
                        contacto: existingProfile.contact_phone || '',
                        ubicacion: existingProfile.contact_address || '',
                        fechaPublicacion: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                        horaPublicacion: p.created_at ? new Date(p.created_at).toLocaleTimeString() : new Date().toLocaleTimeString()
                    }));
                    setAdisos(mappedAdisos);
                }
            } else {
                // Primera vez: mostrar chatbot
                setMemberRole(null);
                setIsFirstTime(true);
                setChatbotMinimized(false);
                setProfile((prev) => ({ ...prev, user_id: user.id }));
                // Don't set lastSavedProfileStr here so it saves on first meaningful change or creation
            }
        } catch (err) {
            console.error('Error loading profile:', err);
            error('Error al cargar tu página');
        } finally {
            setProfileLoading(false);
        }
    }, [user, router, error, searchParams]);

    const handleSave = React.useCallback(async (showNotification = true) => {
        if (!user || !profile.name) return;

        if (profile.id && memberRole && !hasPermission(memberRole, 'business:write')) {
            error('No tienes permiso para editar este negocio');
            return;
        }

        try {
            setSaving(true);

            // Optimistic update of ref to prevent double triggering if debounce fires again quickly
            // But better to do it after success to ensure consistency

            let savedProfile;
            if (profile.id) {
                savedProfile = await updateBusinessProfile(profile.id, profile);
            } else {
                savedProfile = await createBusinessProfile({
                    ...profile,
                    user_id: user.id,
                    created_by: user.id,
                    slug: profile.slug || profile.name.toLowerCase().replace(/\s+/g, '-')
                } as BusinessProfile);
            }

            if (savedProfile) {
                setProfile(savedProfile);
                lastSavedProfileStr.current = JSON.stringify(savedProfile);
                setLastSavedTime(new Date());

                if (!profile.id && savedProfile.id) {
                    router.replace(`${pathname}?business=${savedProfile.id}`);
                }

                if (showNotification) {
                    success('¡Cambios guardados!');
                }
            }
        } catch (err: any) {
            console.error('Error saving profile:', err);
            if (showNotification) {
                error('Error al guardar: ' + err.message);
            }
        } finally {
            setSaving(false);
        }
    }, [user, profile, memberRole, success, error, router, pathname]);

    // Load profile on mount
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            setShowAuthModal(true);
            setProfileLoading(false);
            return;
        }

        loadProfile();
    }, [user, authLoading, loadProfile]);

    // Auto-save on debounced profile change
    useEffect(() => {
        if (!profile.id || profileLoading) return;

        const currentStr = JSON.stringify(debouncedProfile);
        if (currentStr === lastSavedProfileStr.current) return;

        handleSave(false);
    }, [debouncedProfile, profile.id, profileLoading, handleSave]);

    const handleChatbotUpdate = (field: keyof BusinessProfile, value: any) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleChatbotComplete = async () => {
        await handleSave(true);
        setChatbotMinimized(true);
        success('¡Tu página está lista! 🎉');
    };

    const handleEditPart = (part: string) => {
        if (part === 'add-product') {
            setShowAddProductModal(true);
            return;
        }

        // Switch to editor and set step
        const partToStep: Record<string, number> = {
            'identity': 0,
            'logo': 1,
            'visual': 1,
            'banner': 1,
            'catalog': 2,
            'add-product': 2,
            'contact': 3,
            'hours': 4,
            'social': 5,
            'marketing': 6
        };

        if (partToStep[part] !== undefined) {
            setActiveStep(partToStep[part]);
        }

        setViewMode('editor');
    };

    const handlePublish = async () => {
        if (!user || !profile.id) {
            error('Guarda los cambios primero');
            return;
        }

        try {
            setSaving(true);
            if (!profile.id || !memberRole || !hasPermission(memberRole, 'business:publish')) {
                error('No tienes permiso para publicar este negocio');
                return;
            }

            const updated = await updateBusinessProfile(profile.id, {
                ...profile,
                is_published: !profile.is_published
            });

            if (updated) {
                setProfile(updated);
                lastSavedProfileStr.current = JSON.stringify(updated);
                success(updated.is_published ? '¡Página publicada! 🎉' : 'Página despublicada');
            }
        } catch (err: any) {
            error('Error al publicar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // Auth check
    if (authLoading || profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4"
                        style={{
                            borderColor: 'var(--brand-blue)',
                            borderTopColor: 'transparent'
                        }}
                    />
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <>
                <AuthModal
                    abierto={showAuthModal}
                    onCerrar={() => router.push('/')}
                    modoInicial="login"
                />
                <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                            Inicia sesión para continuar
                        </h2>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            {/* Top Bar */}
            <div className="sticky top-0 z-50 bg-white border-b shadow-sm h-16" style={{ borderColor: 'var(--border-color)' }}>
                <div className="max-w-[1920px] mx-auto px-4 h-full flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/')}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <IconX size={20} color="var(--text-secondary)" />
                        </button>
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex flex-col items-start gap-0.5 ml-2">
                                <h1 className="font-bold text-base md:text-lg text-slate-800 leading-tight">Editar Página</h1>
                                {/* Auto-save Indicator */}
                                <div className="flex items-center gap-2">
                                    {saving ? (
                                        <span className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1 font-medium">
                                            <div className="w-2.5 h-2.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                            Guardando...
                                        </span>
                                    ) : (
                                        lastSavedTime && (
                                            <span className="text-[10px] md:text-xs text-green-600 flex items-center gap-1 font-medium bg-green-50 px-1.5 rounded-full">
                                                <IconCheck size={10} />
                                                Autoguardado
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>
                            {businessOptions.length > 0 && (
                                <div className="flex items-center gap-2 ml-2 flex-wrap">
                                    <label className="text-xs text-slate-500 font-medium">Negocio</label>
                                    <select
                                        className="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-800 max-w-[200px]"
                                        value={profile.id || ''}
                                        onChange={(e) => {
                                            const id = e.target.value;
                                            if (id) router.push(`${pathname}?business=${id}`);
                                        }}
                                    >
                                        {businessOptions.map(({ profile: p }) => (
                                            <option key={p.id} value={p.id}>{p.name || p.slug || p.id}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="text-xs font-semibold text-blue-600 hover:underline"
                                        onClick={() => router.push(`${pathname}?new=1`)}
                                    >
                                        + Nuevo negocio
                                    </button>
                                    {profile.id && (
                                        <Link
                                            href={`/mi-negocio/equipo?business=${profile.id}`}
                                            className="text-xs font-semibold text-slate-600 hover:underline"
                                        >
                                            Equipo
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isFirstTime && (
                            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner">
                                <button
                                    onClick={() => setViewMode('preview')}
                                    className={`px-2 md:px-3 py-1.5 rounded-md text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${viewMode === 'preview' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                    title="Ver como usuario"
                                >
                                    <IconEye size={14} />
                                    <span>Ver</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('editor')}
                                    className={`px-2 md:px-3 py-1.5 rounded-md text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${viewMode === 'editor' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    title="Editar contenido"
                                >
                                    <IconEdit size={14} />
                                    <span>Editar</span>
                                </button>
                            </div>
                        )}

                        <button
                            onClick={handlePublish}
                            disabled={
                                saving ||
                                !profile.id ||
                                !memberRole ||
                                !hasPermission(memberRole, 'business:publish')
                            }
                            className="px-4 md:px-6 py-2 rounded-lg font-bold text-white flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 text-sm"
                            style={{ backgroundColor: profile.is_published ? '#10b981' : 'var(--brand-blue)' }}
                        >
                            {profile.is_published ? 'Publicado' : 'Publicar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Editor Panel (Only in Editor Mode) */}
                <div className={`
                    bg-white border-r border-slate-200 z-20 transition-all duration-300
                    ${viewMode === 'editor' ? 'w-full md:w-[400px] lg:w-[450px] translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'}
                `}>
                    <div className="h-full overflow-hidden w-full md:w-[400px] lg:w-[450px]">
                        <EditorSteps
                            profile={profile as any}
                            setProfile={setProfile}
                            saving={saving}
                            activeStep={activeStep}
                            setActiveStep={setActiveStep}
                            catalogProducts={catalogProducts}
                            onAddProduct={() => setShowAddProductModal(true)}
                            onRefreshCatalog={handleRefreshCatalog}
                            onToggleView={() => setViewMode('preview')}
                            isPublished={!!profile.is_published}
                            onPublish={handlePublish}
                        />
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 overflow-auto bg-slate-100 relative">
                    <div className={`mx-auto h-full ${viewMode === 'editor' ? 'p-4 md:p-8 max-w-[1200px]' : ''}`}>
                        <div className={`bg-white min-h-full ${viewMode === 'editor' ? 'rounded-xl shadow-xl border border-slate-200 overflow-hidden' : ''}`}>
                            <BusinessPublicView
                                profile={profile}
                                isPreview
                                editMode={true} // Always show edit controls, let them trigger the editor
                                onUpdate={handleChatbotUpdate}
                                onEditPart={handleEditPart}
                                onEditProduct={handleEditProduct}
                                adisos={adisos}
                            />
                        </div>
                    </div>
                </div>

                {/* Chatbot (Only showing when appropriate) */}
                {(isFirstTime || (!chatbotMinimized && viewMode === 'preview')) && (
                    <ChatbotGuide
                        profile={profile}
                        onUpdate={handleChatbotUpdate}
                        onComplete={handleChatbotComplete}
                        isMinimized={chatbotMinimized}
                        onToggleMinimize={() => setChatbotMinimized(!chatbotMinimized)}
                    />
                )}

                {/* Floating Chat Button (to re-open) */}
                {!isFirstTime && chatbotMinimized && viewMode === 'preview' && (
                    <button
                        onClick={() => setChatbotMinimized(false)}
                        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform bg-white text-blue-600 border border-blue-100"
                    >
                        <span className="text-2xl">💬</span>
                    </button>
                )}
            </div>

            {/* Product Edit Modal Overlay */}
            {showProductModal && user && profile.id && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <ProductEditor
                            key={editingProduct?.id || 'new-product'}
                            product={editingProduct}
                            businessProfileId={profile.id}
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

            {/* Product Addition Method Modal */}
            {showAddProductModal && profile.id && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl overflow-hidden">
                        <SimpleCatalogAdd
                            businessProfileId={profile.id}
                            onSuccess={handleRefreshCatalog}
                            onClose={() => setShowAddProductModal(false)}
                            adisos={adisos}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BusinessBuilderPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 rounded-full animate-spin"
                    style={{ borderColor: 'var(--brand-blue)', borderTopColor: 'transparent' }}
                />
            </div>
        }>
            <BusinessBuilderPageContent />
        </Suspense>
    );
}
