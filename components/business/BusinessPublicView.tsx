'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BusinessProfile } from '@/types/business';
import { Adiso } from '@/types';
import { cn } from '@/lib/utils';
import {
    IconStore, IconMapMarkerAlt, IconWhatsapp,
    IconShareAlt, IconSearch, IconHeart,
    IconFileAlt, IconEdit, IconPlus, IconBox, IconCheck, IconX, IconTrash,
    IconGrid, IconList, IconFeed, IconSparkles
} from '@/components/Icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import { deleteCatalogProduct } from '@/lib/business';
import { useCatalogPDF } from '@/hooks/useCatalogPDF';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useBusinessCart } from '@/hooks/useBusinessCart';
import BusinessHero from '@/components/business/public/BusinessHero';
import BusinessActionBar from '@/components/business/public/BusinessActionBar';
import BusinessHighlights from '@/components/business/public/BusinessHighlights';
import BusinessInfoTab from '@/components/business/public/BusinessInfoTab';
import BusinessDealsTab from '@/components/business/public/BusinessDealsTab';
import BusinessReviewsTab from '@/components/business/public/BusinessReviewsTab';
import BusinessShareTools from '@/components/business/public/BusinessShareTools';
import BusinessCartDrawer from '@/components/business/public/BusinessCartDrawer';
import BusinessJsonLd from '@/components/business/public/BusinessJsonLd';
import { getWhatsappUrl, getProductWhatsappUrl, businessThemeStyle } from '@/lib/business/public-utils';
import { IconStar } from '@/components/Icons';

interface BusinessPublicViewProps {
    profile: Partial<BusinessProfile> | null;
    adisos?: Adiso[];
    /** Filas crudas del catálogo (para firma del PDF en caché) */
    catalogProducts?: { id: string; updated_at?: string; images?: unknown }[];
    isPreview?: boolean;
    onEditPart?: (part: string) => void;
    editMode?: boolean;
    onUpdate?: (field: keyof BusinessProfile, value: any) => void;
    onEditProduct?: (product: Adiso) => void;
    chatbotMinimized?: boolean;
    onToggleChatbot?: () => void;
}

const DEFAULT_ADISOS: Adiso[] = [];

export default function BusinessPublicView({
    profile,
    adisos = DEFAULT_ADISOS,
    catalogProducts = [],
    isPreview = false,
    onEditPart,
    editMode = false,
    onUpdate,
    onEditProduct,
    chatbotMinimized = true,
    onToggleChatbot
}: BusinessPublicViewProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'inicio' | 'catalogo' | 'feed' | 'resenas'>('catalogo');

    // Safeguard against null profile - REMOVED to avoid hook error
    // if (!profile) ... moved to after hooks

    const { items: cartItems, count: cartCount, open: cartOpen, setOpen: setCartOpen, addItem, updateQty, removeItem } = useBusinessCart(profile?.id);

    // Catalog State & Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'feed'>('grid');
    const [filteredAdisos, setFilteredAdisos] = useState(adisos);

    // Scroll Direction for Hide/Show Header/Nav
    const [showNav, setShowNav] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setShowNav(false); // Scrolling down
            } else {
                setShowNav(true); // Scrolling up
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Ownership check. 
    // True owner check for button visibility
    const isOwner = user?.id && profile?.user_id && user.id === profile.user_id;
    // Controls for inline editing overlays (pencil on image, etc) - only show when in explicit edit mode
    const showEditControls = isOwner && editMode;

    const handleShare = async () => {
        if (!profile) return;
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: profile.name || 'Negocio en Adis',
                    text: profile.description || 'Mira este negocio en Adis',
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            // Fallback
            navigator.clipboard.writeText(window.location.href);
            alert('Enlace copiado al portapapeles');
        }
    };

    const { isOnline } = useNetworkStatus();
    /** Sin red: mostrar todo el catálogo y pedir imágenes en eager para usar caché del SW/navegador */
    const showEntireCatalogOffline = !isOnline;
    const catalogImgLoading = showEntireCatalogOffline ? ('eager' as const) : ('lazy' as const);

    // Infinite Scroll State
    const [visibleCount, setVisibleCount] = useState(24);

    // Derived Categories
    const categories = Array.from(new Set(adisos.map(a => a.categoria || 'Otros').filter(Boolean)));

    // Update filtering effect
    useEffect(() => {
        let result = adisos;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(a =>
                a.titulo.toLowerCase().includes(query) ||
                a.descripcion.toLowerCase().includes(query)
            );
        }

        if (selectedCategory) {
            result = result.filter(a => (a.categoria || 'Otros') === selectedCategory);
        }

        setFilteredAdisos(result);
        setVisibleCount(24); // Reset visible count on filter change
    }, [searchQuery, selectedCategory, adisos]);

    const displayedAdisos = useMemo(
        () =>
            showEntireCatalogOffline
                ? filteredAdisos
                : filteredAdisos.slice(0, visibleCount),
        [showEntireCatalogOffline, filteredAdisos, visibleCount]
    );
    const hasMore = !showEntireCatalogOffline && visibleCount < filteredAdisos.length;

    // Infinite Scroll Observer
    const loadMoreRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setVisibleCount((prev) => prev + 24);
                }
            },
            { rootMargin: '400px' }
        );

        const currentRef = loadMoreRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [hasMore, visibleCount]);

    // Editing State
    const [editingField, setEditingField] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState('');

    // Estado para eliminar productos desde la vista del catálogo (solo dueño)
    const [confirmDeleteAdiso, setConfirmDeleteAdiso] = useState<Adiso | null>(null);
    const [deletingAdisoId, setDeletingAdisoId] = useState<string | null>(null);

    // PDF Generator
    const { openCatalogPdf, generating: generatingPDF, progress: pdfProgress } = useCatalogPDF();

    const startEditing = (field: string, value: string) => {
        setEditingField(field);
        setTempValue(value || '');
    };

    const saveField = (field: keyof BusinessProfile) => {
        onUpdate?.(field, tempValue);
        setEditingField(null);
    };

    const cancelEditing = () => {
        setEditingField(null);
        setTempValue('');
    };

    const handleDeleteAdiso = async (adiso: Adiso) => {
        setDeletingAdisoId(adiso.id);
        try {
            // deleteCatalogProduct works with the product id
            await deleteCatalogProduct(adiso.id);
            // Remove from local state immediately for instant feedback
            setFilteredAdisos(prev => prev.filter(a => a.id !== adiso.id));
        } finally {
            setDeletingAdisoId(null);
            setConfirmDeleteAdiso(null);
        }
    };

    const handlePDFDownload = async () => {
        if (!profile) return;
        try {
            const rows =
                catalogProducts.length > 0
                    ? catalogProducts
                    : filteredAdisos.map((a) => ({ id: a.id, images: a.imagenesUrls }));
            await openCatalogPdf(profile, filteredAdisos, rows);
        } catch (e) {
            console.error('Error al generar PDF:', e);
        }
    };

    // Derived State — catalog filters use adisos directly

    // Scroll Handler for Sticky Header
    useEffect(() => {
        if (!isPreview) {
            // reserved for future compact header behavior
        }
    }, [isPreview]);

    if (!profile) {
        return <div className="min-h-[50vh] flex items-center justify-center text-slate-400">Cargando perfil...</div>;
    }

    return (
        <div
            id="printable-content"
            className={cn(
                "min-h-screen bg-[var(--bg-secondary)] text-[var(--text-primary)]",
                profile.font_family === 'serif' ? 'font-serif' :
                    profile.font_family === 'mono' ? 'font-mono' : 'font-sans'
            )}
            style={businessThemeStyle(profile)}
        >
            <BusinessJsonLd profile={profile} products={adisos.slice(0, 5)} />
            <BusinessHighlights
                announcementText={profile.announcement_text}
                announcementActive={profile.announcement_active}
                customBlocks={profile.custom_blocks}
            />

            {/* --- HEADER (Scroll Aware) --- */}
            <div className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-transform duration-300",
                showNav ? "translate-y-0" : "-translate-y-full"
            )}>
                {/* Provide dummy props for Header since we are in business view context */}
                <Header
                    onToggleLeftSidebar={() => {/* No left sidebar logic here yet */ }}
                    ubicacion="Perú"
                    onUbicacionClick={() => { }}
                    seccionActiva="negocio"
                    onSeccionChange={() => { }}
                />
            </div>

            <BusinessHero
                profile={profile}
                showEditControls={Boolean(showEditControls)}
                onEditPart={onEditPart}
            />
            <BusinessActionBar
                profile={profile}
                isOwner={Boolean(isOwner)}
                cartCount={cartCount}
                onShare={handleShare}
                onOpenCart={() => setCartOpen(true)}
                onEditPart={onEditPart}
            />

            <div className="bg-white pb-2 shadow-sm relative z-10">
                {/* --- NAVIGATION TABS --- */}
                <div className="mt-8 border-t border-slate-100 bg-white sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90 supports-[backdrop-filter]:bg-white/80 print:hidden">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="flex items-center gap-8 overflow-x-auto no-scrollbar mask-fade-right">
                            {[
                                { id: 'catalogo', label: 'Catálogo', icon: <IconStore size={18} />, count: adisos.length },
                                { id: 'inicio', label: 'Información', icon: <IconMapMarkerAlt size={18} /> },
                                { id: 'feed', label: 'Deals', icon: <IconHeart size={18} /> },
                                { id: 'resenas', label: 'Reseñas', icon: <IconStar size={18} /> },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex items-center gap-2 py-4 px-2 font-bold text-sm whitespace-nowrap transition-all border-b-2 relative",
                                        activeTab === tab.id
                                            ? "text-[var(--brand-color)] border-[var(--brand-color)]"
                                            : "text-slate-400 border-transparent hover:text-slate-600"
                                    )}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    {tab.count !== undefined && (
                                        <span className={cn(
                                            "ml-1 px-2 py-0.5 rounded-full text-xs",
                                            activeTab === tab.id ? "bg-[var(--brand-color)]/10" : "bg-slate-100 text-slate-500"
                                        )}>{tab.count}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div >

            {/* --- CONTENT AREA --- */}
            < div className="max-w-6xl mx-auto px-4 py-8 min-h-[50vh]" >
                <AnimatePresence mode="wait">

                    {activeTab === 'inicio' && (
                        <BusinessInfoTab profile={profile} adisos={adisos} />
                    )}

                    {/* CATALOGO TAB */}
                    {activeTab === 'catalogo' && (
                        <motion.div
                            key="catalogo"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="max-w-7xl mx-auto space-y-12"
                        >
                            <div className="flex flex-col gap-6 print:hidden">

                                {/* Row 1: Search Bar — full width */}
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--brand-color)] transition-colors">
                                        <IconSearch size={22} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Buscar productos..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl shadow-sm focus:border-[var(--brand-color)] focus:ring-4 focus:ring-[var(--brand-color)]/10 transition-all font-medium text-slate-700 outline-none"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-200 text-slate-500 rounded-full p-1 hover:bg-slate-300"
                                        >
                                            <IconX size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Row 2: Count + View Mode Toggles */}
                                <div className="flex items-center justify-between gap-3">
                                    {/* Product count */}
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                        <IconBox size={14} />
                                        <span>{filteredAdisos.length} productos encontrados</span>
                                    </div>

                                    {/* View Mode Toggles + PDF */}
                                    <div className="flex items-center gap-1 bg-white border border-slate-100 p-1 rounded-2xl shadow-sm shrink-0">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={cn("p-2.5 rounded-xl transition-all", viewMode === 'grid' ? "bg-[var(--brand-color)] text-white shadow-md" : "text-slate-400 hover:text-slate-600")}
                                            title="Cuadrícula"
                                        >
                                            <IconGrid size={18} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('feed')}
                                            className={cn("p-2.5 rounded-xl transition-all", viewMode === 'feed' ? "bg-[var(--brand-color)] text-white shadow-md" : "text-slate-400 hover:text-slate-600")}
                                            title="Feed"
                                        >
                                            <IconFeed size={18} />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={cn("p-2.5 rounded-xl transition-all", viewMode === 'list' ? "bg-[var(--brand-color)] text-white shadow-md" : "text-slate-400 hover:text-slate-600")}
                                            title="Lista"
                                        >
                                            <IconList size={18} />
                                        </button>
                                        <div className="w-[1px] h-5 bg-slate-200 mx-1" />
                                        {/* PDF Button mejorado */}
                                        <button
                                            onClick={handlePDFDownload}
                                            disabled={generatingPDF}
                                            className="p-2.5 text-slate-400 hover:text-slate-600 relative disabled:cursor-wait"
                                            title="Descargar catálogo en PDF"
                                        >
                                            {generatingPDF ? (
                                                <div className="relative">
                                                    <div className="w-[18px] h-[18px] border-2 border-slate-200 border-t-[var(--brand-color)] rounded-full animate-spin" />
                                                    {pdfProgress > 0 && (
                                                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[var(--brand-color)] whitespace-nowrap">
                                                            {pdfProgress}%
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <IconFileAlt size={18} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Categories - Horizontal Scroll Pills */}
                                {categories.length > 0 && (
                                    <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar mask-fade-right">
                                        <div className="flex gap-2.5">
                                            <button
                                                onClick={() => setSelectedCategory(null)}
                                                className={cn(
                                                    "px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
                                                    !selectedCategory
                                                        ? "bg-[var(--brand-color)] text-white shadow-lg shadow-[var(--brand-color)]/25 ring-2 ring-[var(--brand-color)] ring-offset-2"
                                                        : "bg-white text-slate-600 border border-slate-200 hover:border-[var(--brand-color)] hover:text-[var(--brand-color)] hover:bg-slate-50"
                                                )}
                                            >
                                                <IconStore size={16} />
                                                Todos
                                            </button>
                                            {categories.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setSelectedCategory(cat)}
                                                    className={cn(
                                                        "px-5 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
                                                        selectedCategory === cat
                                                            ? "bg-[var(--brand-color)] text-white shadow-lg shadow-[var(--brand-color)]/25 ring-2 ring-[var(--brand-color)] ring-offset-2"
                                                            : "bg-white text-slate-600 border border-slate-200 hover:border-[var(--brand-color)] hover:text-[var(--brand-color)] hover:bg-slate-50"
                                                    )}
                                                >
                                                    {/* Generic Icon since we don't have category specific ones yet */}
                                                    <IconBox size={16} className={selectedCategory === cat ? "text-white" : "text-slate-400"} />
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Products Grid / List */}
                            {displayedAdisos.length > 0 ? (
                                <>
                                    <div className={cn(
                                        "grid gap-3 md:gap-4",
                                        viewMode === 'grid'
                                            ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                                            : viewMode === 'feed'
                                                ? "grid-cols-1 max-w-xl mx-auto"
                                                : "grid-cols-1"
                                    )}>
                                        {displayedAdisos.map((adiso) => (
                                            viewMode === 'feed' ? (
                                                /* ── Feed Card (Instagram Style) ── */
                                                <div
                                                    key={adiso.id}
                                                    className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex flex-col"
                                                >
                                                    {/* Header */}
                                                    <div className="p-3 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 relative">
                                                                {profile.logo_url ? (
                                                                    <img src={profile.logo_url} alt={profile.name || "Logo"} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-300">
                                                                        {profile.name?.substring(0, 1) || 'N'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-900">{profile.name}</span>
                                                        </div>
                                                        {showEditControls && (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => {
                                                                        if (onEditProduct) onEditProduct(adiso);
                                                                        else onEditPart?.('catalog');
                                                                    }}
                                                                    className="text-slate-400 hover:text-[var(--brand-color)] p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                                                >
                                                                    <IconEdit size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setConfirmDeleteAdiso(adiso)}
                                                                    disabled={deletingAdisoId === adiso.id}
                                                                    className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                                                >
                                                                    {deletingAdisoId === adiso.id
                                                                        ? <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                                                                        : <IconTrash size={14} />}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Image - Square */}
                                                    <div className="relative w-full aspect-square bg-slate-50 overflow-hidden cursor-pointer" onClick={() => router.push(`/adiso/${(adiso as any).slug || adiso.id}`)}>
                                                        {adiso.imagenUrl || adiso.imagenesUrls?.[0] ? (
                                                            <img
                                                                src={adiso.imagenesUrls?.[0] || adiso.imagenUrl || ''}
                                                                alt={adiso.titulo}
                                                                className="w-full h-full object-contain"
                                                                loading={catalogImgLoading}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                                <IconBox size={48} />
                                                            </div>
                                                        )}
                                                        {/* Price Tag Overlay */}
                                                        {adiso.precio && (
                                                            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-white/50">
                                                                <span className="font-black text-slate-900">S/ {adiso.precio}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Legend */}
                                                    <div className="p-4 flex flex-col gap-1">
                                                        <h3 className="font-bold text-base text-slate-900 leading-tight cursor-pointer" onClick={() => router.push(`/adiso/${(adiso as any).slug || adiso.id}`)}>
                                                            {adiso.titulo}
                                                        </h3>
                                                        {adiso.descripcion && (
                                                            <p className="text-sm text-slate-600 leading-relaxed mt-1">
                                                                {adiso.descripcion.replace('Precio:', '').trim()}
                                                            </p>
                                                        )}
                                                        {profile.contact_whatsapp && (
                                                            <a
                                                                href={`https://wa.me/${profile.contact_whatsapp}?text=${encodeURIComponent(`Hola! Me interesa: ${adiso.titulo}`)}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="mt-3 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2"
                                                            >
                                                                <IconWhatsapp size={18} /> Pedir ahora
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : viewMode === 'grid' ? (
                                                /* ── Grid Card ── */
                                                <button
                                                    key={adiso.id}
                                                    onClick={() => router.push(`/adiso/${(adiso as any).slug || adiso.id}`)}
                                                    className="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left flex flex-col"
                                                >
                                                    {/* Image */}
                                                    <div className="relative w-full bg-slate-50 overflow-hidden" style={{ aspectRatio: '4/3' }}>
                                                        {adiso.imagenUrl || adiso.imagenesUrls?.[0] ? (
                                                            <img
                                                                src={adiso.imagenesUrls?.[0] || adiso.imagenUrl || ''}
                                                                alt={adiso.titulo}
                                                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                                                                loading={catalogImgLoading}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-200">
                                                                <IconBox size={40} />
                                                            </div>
                                                        )}
                                                        {/* Category pill */}
                                                        {adiso.categoria && (
                                                            <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-[10px] font-bold px-2 py-0.5 rounded-full text-[var(--brand-color)] shadow-sm">
                                                                {adiso.categoria}
                                                            </span>
                                                        )}
                                                        {/* Edit + Delete buttons for owner */}
                                                        {showEditControls && (
                                                            <div className="absolute top-2 right-2 flex gap-1 z-10">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (onEditProduct) onEditProduct(adiso);
                                                                        else onEditPart?.('catalog');
                                                                    }}
                                                                    className="p-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-slate-100 hover:bg-[var(--brand-color)] hover:text-white text-slate-600 transition-colors"
                                                                    title="Editar producto"
                                                                >
                                                                    <IconEdit size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setConfirmDeleteAdiso(adiso);
                                                                    }}
                                                                    disabled={deletingAdisoId === adiso.id}
                                                                    className="p-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                                                                    title="Eliminar producto"
                                                                >
                                                                    {deletingAdisoId === adiso.id
                                                                        ? <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                                                                        : <IconTrash size={12} />}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Content */}
                                                    <div className="p-3 flex flex-col gap-1 flex-1">
                                                        <h3 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug">
                                                            {adiso.titulo}
                                                        </h3>
                                                        {adiso.descripcion && (
                                                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed flex-1">
                                                                {adiso.descripcion.replace('Precio:', '').trim()}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-50 gap-2">
                                                            <span className="font-black text-base text-slate-900">
                                                                {adiso.precio ? `S/ ${adiso.precio}` : <span className="text-sm font-semibold text-slate-400">Consultar</span>}
                                                            </span>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        addItem({
                                                                            productId: adiso.id,
                                                                            title: adiso.titulo,
                                                                            price: adiso.precio,
                                                                            imageUrl: adiso.imagenesUrls?.[0] || adiso.imagenUrl,
                                                                        });
                                                                    }}
                                                                    className="text-[10px] font-bold px-2 py-1 bg-[var(--brand-color)]/10 text-[var(--brand-color)] rounded-lg hover:bg-[var(--brand-color)] hover:text-white transition-colors"
                                                                >
                                                                    + Carrito
                                                                </button>
                                                                {profile.contact_whatsapp && (
                                                                    <a
                                                                        href={getProductWhatsappUrl(profile.contact_whatsapp, profile.name || 'Negocio', adiso)}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1"
                                                                    >
                                                                        <IconWhatsapp size={11} />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ) : (
                                                /* ── List Card ── */
                                                <div
                                                    key={adiso.id}
                                                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex gap-3 items-start relative group cursor-pointer p-3"
                                                    onClick={() => router.push(`/adiso/${(adiso as any).slug || adiso.id}`)}
                                                >
                                                    <div className="w-20 h-20 flex-shrink-0 bg-slate-50 rounded-xl overflow-hidden">
                                                        {adiso.imagenUrl || adiso.imagenesUrls?.[0] ? (
                                                            <img
                                                                src={adiso.imagenesUrls?.[0] || adiso.imagenUrl || ''}
                                                                alt={adiso.titulo || "Producto"}
                                                                className="w-full h-full object-contain"
                                                                loading={catalogImgLoading}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                                <IconBox size={28} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 pr-8">
                                                        <span className="text-[10px] font-bold text-[var(--brand-color)] uppercase tracking-wide block mb-0.5">{adiso.categoria || ''}</span>
                                                        <h3 className="font-bold text-sm text-slate-800 mb-1 leading-snug line-clamp-2">{adiso.titulo}</h3>
                                                        {adiso.descripcion && (
                                                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{adiso.descripcion.replace('Precio:', '').trim()}</p>
                                                        )}
                                                        <div className="mt-2 font-black text-lg text-slate-900">
                                                            {adiso.precio ? `S/ ${adiso.precio}` : <span className="text-sm font-semibold text-slate-400">Consultar</span>}
                                                        </div>
                                                    </div>
                                                    {showEditControls && (
                                                        <div className="absolute top-2 right-2 flex gap-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (onEditProduct) onEditProduct(adiso);
                                                                }}
                                                                className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-[var(--brand-color)] hover:text-white transition-colors"
                                                            >
                                                                <IconEdit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setConfirmDeleteAdiso(adiso);
                                                                }}
                                                                disabled={deletingAdisoId === adiso.id}
                                                                className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                                                            >
                                                                {deletingAdisoId === adiso.id
                                                                    ? <div className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                                                                    : <IconTrash size={14} />}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        ))}
                                    </div>

                                    {/* Infinite Scroll Sentinel */}
                                    {hasMore && (
                                        <div
                                            ref={loadMoreRef}
                                            className="h-20 flex items-center justify-center p-4"
                                        >
                                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="py-24 text-center">
                                    <div className="w-24 h-24 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 dark:text-zinc-700">
                                        <IconSearch size={48} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-400">Sin resultados</h3>
                                    <p className="text-slate-300">Intenta con otros términos</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'feed' && profile.slug && (
                        <BusinessDealsTab slug={profile.slug} businessName={profile.name || 'Negocio'} />
                    )}

                    {activeTab === 'resenas' && profile.slug && (
                        <BusinessReviewsTab slug={profile.slug} />
                    )}

                    {/* INFO TAB (FUSED INTO INICIO) */}

                </AnimatePresence>
            </div >

            {/* --- FLOATING ACTION BUTTON --- */}
            <div className={cn(
                "fixed right-6 z-50 flex flex-col gap-3 print:hidden transition-all duration-500",
                showNav ? "bottom-32" : "bottom-6" // Move up when navbar is shown to avoid overlap
            )}>
                {
                    isOwner ? (
                        <>
                            {chatbotMinimized && onToggleChatbot && (
                                <button
                                    onClick={onToggleChatbot}
                                    className="w-14 h-14 bg-white text-[var(--brand-color)] border-2 border-[var(--brand-color)] rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group relative mb-2"
                                    title="Asistente IA"
                                >
                                    <IconSparkles size={24} />
                                    <span className="absolute right-full mr-3 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        Asistente
                                    </span>
                                </button>
                            )}
                            <button
                                onClick={() => onEditPart?.('add-product')}
                                className="w-14 h-14 bg-[var(--brand-color)] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group relative"
                                title="Agregar Producto"
                            >
                                <IconPlus size={28} />
                                <span className="absolute right-full mr-3 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    Nuevo Producto
                                </span>
                            </button>
                        </>
                    ) : (
                        profile.contact_whatsapp && (
                            <a
                                href={getWhatsappUrl(profile.contact_whatsapp, profile.name || 'Negocio')}
                                target="_blank"
                                rel="noreferrer"
                                className="w-14 h-14 bg-green-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group relative"
                            >
                                <IconWhatsapp size={28} />
                                <span className="absolute right-full mr-3 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    WhatsApp
                                </span>
                            </a>
                        )
                    )}
            </div >

            <BusinessShareTools
                slug={profile.slug || ''}
                businessName={profile.name || 'Negocio'}
                onShare={handleShare}
            />

            <BusinessCartDrawer
                open={cartOpen}
                onClose={() => setCartOpen(false)}
                items={cartItems}
                businessName={profile.name || 'Negocio'}
                whatsapp={profile.contact_whatsapp}
                onUpdateQty={updateQty}
                onRemove={removeItem}
                slug={profile.slug || ''}
            />

            {/* Branding Footer */}
            <div className="py-8 text-center text-xs text-[var(--text-tertiary)] print:hidden" >
                <p>Hecho con <span className="font-bold text-[var(--brand-blue)]">Buscadis Store</span></p>
            </div>

            {/* ── Modal de Confirmar Eliminación (desde catálogo en vivo) ── */}
            {confirmDeleteAdiso && (
                <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
                    <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        {/* Product preview */}
                        <div className="p-5 flex items-center gap-4 border-b border-slate-100">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                {confirmDeleteAdiso.imagenesUrls?.[0] || confirmDeleteAdiso.imagenUrl ? (
                                    <img
                                        src={confirmDeleteAdiso.imagenesUrls?.[0] || confirmDeleteAdiso.imagenUrl || ''}
                                        className="w-full h-full object-cover"
                                        alt={confirmDeleteAdiso.titulo || "Producto"}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <IconBox size={24} />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-0.5">Eliminar del catálogo</p>
                                <h3 className="font-bold text-slate-800 truncate text-base">{confirmDeleteAdiso.titulo}</h3>
                                {confirmDeleteAdiso.precio && (
                                    <p className="text-sm font-semibold text-slate-500">S/ {confirmDeleteAdiso.precio}</p>
                                )}
                            </div>
                        </div>

                        <div className="px-5 py-4">
                            <div className="flex items-start gap-3 bg-red-50 rounded-2xl p-4 mb-4 border border-red-100">
                                <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <IconTrash size={18} className="text-red-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-red-800 mb-1">Esta acción no se puede deshacer</p>
                                    <p className="text-xs text-red-600 leading-relaxed">
                                        El producto desaparecerá del catálogo inmediatamente.
                                        Los clientes ya no podrán verlo ni contactarte por él.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmDeleteAdiso(null)}
                                    disabled={deletingAdisoId !== null}
                                    className="flex-1 py-3 text-sm font-bold rounded-2xl border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => handleDeleteAdiso(confirmDeleteAdiso)}
                                    disabled={deletingAdisoId !== null}
                                    className="flex-1 py-3 text-sm font-bold rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-red-200"
                                >
                                    {deletingAdisoId ? (
                                        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <IconTrash size={16} />
                                            Sí, eliminar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PRINTABLE CATALOG (Hidden on Screen) --- */}
            < div className="printable-catalog hidden w-full bg-white p-8" >
                <div className="max-w-4xl mx-auto">
                    <PrintableCatalog profile={profile} adisos={filteredAdisos} />
                </div>
            </div >
            {/* --- NAVBAR MOBILE (Scroll Aware with Animation) --- */}
            <div className={cn(
                "fixed bottom-0 left-0 right-0 z-40 transition-transform duration-500 ease-in-out md:hidden",
                showNav ? "translate-y-0" : "translate-y-full"
            )}>
                <NavbarMobile
                    seccionActiva={null}
                    onCambiarSeccion={() => { }}
                    tieneAdisoAbierto={false}
                />
            </div>
        </div>
    );
}

// Separate component for clean printing
function PrintableCatalog({ profile, adisos }: { profile: Partial<BusinessProfile>, adisos: Adiso[] }) {
    return (
        <div className="w-full text-black bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-6 mb-8">
                <div className="flex items-center gap-6">
                    {profile.logo_url && (
                        <img src={profile.logo_url} alt={profile.name || "Logo"} className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                    )}
                    <div>
                        <h1 className="text-4xl font-black mb-2">{profile.name}</h1>
                        <div className="text-sm font-medium space-y-1 text-gray-600">
                            {profile.contact_address && <p className="flex items-center gap-2">📍 {profile.contact_address}</p>}
                            {profile.contact_phone && <p className="flex items-center gap-2">📞 {profile.contact_phone}</p>}
                            {profile.contact_email && <p className="flex items-center gap-2">✉️ {profile.contact_email}</p>}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-black text-white text-xs font-bold px-3 py-1 rounded mb-2 inline-block">CATÁLOGO</div>
                    <p className="text-xs text-gray-500">Generado el {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-6">
                {adisos.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-3 break-inside-avoid page-break-inside-avoid">
                        <div className="w-full h-40 bg-gray-100 rounded-md mb-3 overflow-hidden relative">
                            {product.imagenUrl ? (
                                <img src={product.imagenUrl} className="w-full h-full object-cover" alt={product.titulo || "Producto"} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-xs uppercase">Sin Foto</div>
                            )}
                        </div>
                        <h3 className="font-bold text-sm mb-1 line-clamp-2 h-10">{product.titulo}</h3>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2 h-8">{product.descripcion}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                            <span className="text-xs font-bold text-gray-400 uppercase">{product.categoria || 'Producto'}</span>
                            <span className="font-black text-lg">{product.precio ? `S/ ${product.precio}` : '-'}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
                <p>Catálogo generado por {profile.name} - Precios sujetos a cambios.</p>
            </div>

        </div>
    );
}
