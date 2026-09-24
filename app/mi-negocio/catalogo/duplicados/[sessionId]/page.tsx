/**
 * Página de Revisión de Duplicados
 * Permite al usuario resolver conflictos entre productos importados y existentes
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { withNewCatalogProductId } from '@/lib/catalog/product-id';
import {
    IconArrowLeft, IconCheck, IconX, IconAlertTriangle,
    IconCopy, IconTrash, IconEdit, IconArrowRight
} from '@/components/Icons';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import Link from 'next/link';

interface DuplicateCandidate {
    id: string;
    new_data: any;
    existing_product_id: string;
    similarity_score: number;
    match_reason: string[];
    resolution: string | null;

    // Join
    catalog_products?: {
        id: string;
        title: string;
        price: number;
        sku: string;
        images: any[];
        description: string;
        status: string;
    };
}

export default function DuplicateReviewPage() {
    const router = useRouter();
    const params = useParams();
    const sessionId = params?.sessionId as string;
    const { success, error: showError, toasts, removeToast } = useToast();

    const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [resolving, setResolving] = useState(false);

    const fetchDuplicates = useCallback(async () => {
        try {
            setLoading(true);

            // Get duplicates that are not resolved yet
            const { data, error } = await supabase!
                .from('duplicate_candidates')
                .select(`
                    *,
                    catalog_products:existing_product_id (
                        id, title, price, sku, images, description, status
                    )
                `)
                .eq('import_session_id', sessionId)
                .is('resolution', null)
                .order('similarity_score', { ascending: false });

            if (error) throw error;

            setDuplicates(data || []);

            if (data?.length === 0) {
                // If no duplicates, redirect back to table
                success('¡Todos los duplicados resueltos!');
                setTimeout(() => router.push('/mi-negocio/catalogo/tabla'), 1500);
            }

        } catch (err: any) {
            showError('Error al cargar duplicados: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [router, sessionId, showError, success]);

    useEffect(() => {
        if (sessionId) {
            void fetchDuplicates();
        }
    }, [sessionId, fetchDuplicates]);

    const handleResolve = async (action: 'skip' | 'replace' | 'keep_both') => {
        const current = duplicates[currentIndex];
        if (!current) return;

        setResolving(true);

        try {
            // 1. Perform action on Catalog Products
            if (action === 'replace') {
                // Update existing product with new data
                const updates = {
                    ...current.new_data,
                    updated_at: new Date().toISOString()
                };

                // Remove ID if present in new_data to avoid PK conflict
                delete updates.id;

                const { error: updateError } = await supabase!
                    .from('catalog_products')
                    .update(updates)
                    .eq('id', current.existing_product_id);

                if (updateError) throw updateError;

            } else if (action === 'keep_both') {
                // Insert new product as a separate entry
                const newProduct = { ...current.new_data };
                // Ensure unique SKU if possible or let user fix later
                if (newProduct.sku) {
                    newProduct.sku = `${newProduct.sku}-COPY`;
                }
                newProduct.title = `${newProduct.title} (Copia)`;

                const { error: insertError } = await supabase!
                    .from('catalog_products')
                    .insert(withNewCatalogProductId(newProduct));

                if (insertError) throw insertError;
            }

            // 2. Mark candidate as resolved
            const { error: resolveError } = await supabase!
                .from('duplicate_candidates')
                .update({
                    resolution: action,
                    resolved_at: new Date().toISOString()
                })
                .eq('id', current.id);

            if (resolveError) throw resolveError;

            // 3. Move to next or finish
            const nextList = duplicates.filter(d => d.id !== current.id);
            setDuplicates(nextList);

            // Adjust index if needed
            if (currentIndex >= nextList.length) {
                setCurrentIndex(Math.max(0, nextList.length - 1));
            }

            if (nextList.length === 0) {
                success('¡Has revisado todos los duplicados!');
                setTimeout(() => router.push('/mi-negocio/catalogo/tabla'), 1500);
            }

        } catch (err: any) {
            showError('Error al resolver: ' + err.message);
        } finally {
            setResolving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[var(--bg-secondary)]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-blue)]"></div>
            </div>
        );
    }

    if (duplicates.length === 0) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[var(--bg-secondary)] p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                        <IconCheck size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Todo Listo!</h2>
                    <p className="text-slate-500 mb-6">No hay duplicados pendientes de revisión.</p>
                    <button
                        onClick={() => router.push('/mi-negocio/catalogo/tabla')}
                        className="w-full py-3 bg-[var(--brand-blue)] text-white font-bold rounded-xl hover:brightness-110 transition-all"
                    >
                        Ir al Catálogo
                    </button>
                </div>
            </div>
        );
    }

    const current = duplicates[currentIndex];
    const existing = current.catalog_products!; // Joined data
    const newData = current.new_data;

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-secondary)] overflow-hidden">
            <Header />
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="flex-1 overflow-y-auto w-full p-4 md:p-6 flex flex-col">
                <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <Link
                                href="/mi-negocio/catalogo/tabla"
                                className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand-blue)] hover:opacity-80 mb-1"
                            >
                                <IconArrowLeft size={14} />
                                Cancelar revisión
                            </Link>
                            <h1 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                                Revisión de Duplicados
                                <span className="text-xs font-bold bg-[var(--bs-identity-warm)] text-[var(--bs-publish-fg)] px-3 py-1 rounded-full">
                                    {duplicates.length} pendientes
                                </span>
                            </h1>
                        </div>
                    </div>

                    {/* Main Comparison Area */}
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">

                        {/* LEFT: Existing Product */}
                        <div className="flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-xs font-black tracking-wider text-slate-400 uppercase">
                                    ACTUALMENTE EN CATÁLOGO
                                </span>
                                <span className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded font-bold">
                                    ID: {existing.id.substring(0, 8)}...
                                </span>
                            </div>

                            <div className="space-y-6">
                                {/* Image */}
                                <div className="aspect-video bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                                    {existing.images && existing.images[0] ? (
                                        <img src={existing.images[0].url} alt={existing.title} className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="text-slate-300">Sin Imagen</div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold block mb-1">NOMBRE</label>
                                        <div className="text-lg font-bold text-slate-800">{existing.title}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-400 font-bold block mb-1">PRECIO</label>
                                            <div className="text-lg font-bold text-slate-800">S/ {existing.price?.toFixed(2) || '0.00'}</div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 font-bold block mb-1">SKU</label>
                                            <div className="text-lg font-bold text-slate-800">{existing.sku || '-'}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-400 font-bold block mb-1">DESCRIPCIÓN</label>
                                        <div className="text-sm text-slate-600 line-clamp-3">
                                            {existing.description || 'Sin descripción'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CENTER: Match Info (Desktop only overlay or separator) */}
                        <div className="bg-white p-4 flex md:flex-col items-center justify-center gap-2 border-b md:border-b-0 md:border-r border-slate-100">
                            <div className="text-center">
                                <div className="text-yellow-500 font-black text-xl">
                                    {(current.similarity_score * 100).toFixed(0)}%
                                </div>
                                <div className="text-[10px] uppercase font-bold text-slate-400">Coincidencia</div>
                            </div>
                            <div className="bg-yellow-100 rounded-full p-2">
                                <IconAlertTriangle size={20} className="text-yellow-600" />
                            </div>
                        </div>

                        {/* RIGHT: New Product */}
                        <div className="flex-1 p-6 md:p-8 bg-blue-50/30 relative">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-xs font-black tracking-wider text-blue-500 uppercase">
                                    NUEVO (IMPORTADO)
                                </span>
                            </div>

                            <div className="space-y-6 opacity-75">
                                {/* Image */}
                                <div className="aspect-video bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden">
                                    {newData.images && newData.images[0] ? (
                                        <img src={newData.images[0].url} alt={newData.title} className="w-full h-full object-contain" />
                                    ) : (
                                        <div className="text-slate-300">Sin Imagen</div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-blue-300 font-bold block mb-1">NOMBRE</label>
                                        <div className={`text-lg font-bold ${newData.title !== existing.title ? 'text-blue-700 bg-blue-100 inline-block px-1 rounded' : 'text-slate-800'}`}>
                                            {newData.title}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-blue-300 font-bold block mb-1">PRECIO</label>
                                            <div className={`text-lg font-bold ${newData.price !== existing.price ? 'text-blue-700 bg-blue-100 inline-block px-1 rounded' : 'text-slate-800'}`}>
                                                S/ {newData.price?.toFixed(2) || '0.00'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-blue-300 font-bold block mb-1">SKU</label>
                                            <div className={`text-lg font-bold ${newData.sku !== existing.sku ? 'text-blue-700 bg-blue-100 inline-block px-1 rounded' : 'text-slate-800'}`}>
                                                {newData.sku || '-'}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-blue-300 font-bold block mb-1">DESCRIPCIÓN</label>
                                        <div className="text-sm text-slate-600 line-clamp-3">
                                            {newData.description || 'Sin descripción'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-6 flex flex-col md:flex-row gap-4">
                        <button
                            onClick={() => handleResolve('skip')}
                            disabled={resolving}
                            className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                        >
                            <IconX size={20} />
                            Ignorar Nuevo
                            <span className="text-xs font-normal opacity-70">(Mantener original)</span>
                        </button>

                        <button
                            onClick={() => handleResolve('keep_both')}
                            disabled={resolving}
                            className="flex-1 py-4 bg-white border border-blue-200 text-blue-600 font-bold rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center justify-center gap-2"
                        >
                            <IconCopy size={20} />
                            Guardar Ambos
                            <span className="text-xs font-normal opacity-70">(Crear copia)</span>
                        </button>

                        <button
                            onClick={() => handleResolve('replace')}
                            disabled={resolving}
                            className="flex-[2] py-4 bg-[var(--brand-blue)] text-white font-bold rounded-xl hover:brightness-110 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            {resolving ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <IconCheck size={20} />
                                    Reemplazar con Nuevo
                                    <span className="text-xs font-normal opacity-70">(Actualizar datos)</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
