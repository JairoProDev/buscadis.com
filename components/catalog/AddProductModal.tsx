/**
 * AddProductModal - AI-Powered Product Creation
 *
 * Flow:
 * 1. Choose entry method (photo, file/excel, or manual)
 * 2. Photo/image → instant AI analysis + enhancement options
 * 3. Review AI-detected fields + confirm or edit
 * 4. Save
 *
 * AI features:
 * - Auto-detects title, price, category, brand, attributes
 * - Removes background, optimizes image quality
 * - Detects multiple products in one image → offer split
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import {
    IconX, IconCamera, IconSparkles, IconEdit, IconCheck,
    IconImage, IconZap, IconPackage, IconTag,
    IconAlertTriangle, IconLayers, IconFileSpreadsheet
} from '@/components/Icons';
import { useToast } from '@/hooks/useToast';
import { catalogUi, semantic, tokens } from '@/lib/bs-tokens';
import { supabase } from '@/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AIAnalysis {
    title: string;
    description: string;
    price: number | null;
    category: string;
    subcategory?: string;
    brand?: string;
    sku?: string;
    unit?: string;
    attributes?: Record<string, string>;
    tags?: string[];
    condition?: string;
    confidence: number;
    notes?: string;
}

interface MultiDetect {
    multiple_products: boolean;
    count: number;
    products: Array<{
        name: string;
        description: string;
        category: string;
        position: string;
    }>;
    recommendation: string;
}

type Step = 'choose' | 'uploading' | 'analyzing' | 'review' | 'multi' | 'manual' | 'saving';

interface ProductDraft {
    title: string;
    description: string;
    price: string;
    category: string;
    brand: string;
    sku: string;
    unit: string;
    stock: string;
    tags: string;
    imageUrl: string;
    status: 'published' | 'draft';
}

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessProfileId: string;
    onSuccess?: () => void;
}

const emptyDraft = (): ProductDraft => ({
    title: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    sku: '',
    unit: 'unidad',
    stock: '',
    tags: '',
    imageUrl: '',
    status: 'published'
});

const UNITS = ['unidad', 'par', 'caja', 'kg', 'g', 'litro', 'ml', 'metro', 'cm', 'rollo', 'paquete', 'docena', 'servicio'];

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddProductModal({ isOpen, onClose, businessProfileId, onSuccess }: AddProductModalProps) {
    const { success: showSuccess, error: showError } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const excelInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<Step>('choose');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string>('');
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [multiDetect, setMultiDetect] = useState<MultiDetect | null>(null);
    const [enhancedUrl, setEnhancedUrl] = useState<string>('');
    const [enhancing, setEnhancing] = useState<string | null>(null);
    const [draft, setDraft] = useState<ProductDraft>(emptyDraft());
    const [excelProcessing, setExcelProcessing] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');


    // ── Reset ───────────────────────────────────────────────────────────────

    const resetAll = () => {
        setStep('choose');
        setImagePreview(null);
        setImageFile(null);
        setUploadedUrl('');
        setAnalysis(null);
        setMultiDetect(null);
        setEnhancedUrl('');
        setEnhancing(null);
        setDraft(emptyDraft());
        setExcelProcessing(false);
        setStatusMsg('');
    };

    const handleClose = () => {
        resetAll();
        onClose();
    };

    // ── Helpers ─────────────────────────────────────────────────────────────

    const getAuthHeaders = async (): Promise<Record<string, string>> => {
        if (!supabase) throw new Error('Supabase no configurado');
        const { data: { session } } = await supabase.auth.getSession();
        return { 'Authorization': `Bearer ${session?.access_token}` };
    };

    const uploadImageFile = async (file: File): Promise<string> => {
        if (!supabase) throw new Error('Supabase no configurado');
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `products/${businessProfileId}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage
            .from('catalog-images')
            .upload(fileName, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(error.message);
        const { data: { publicUrl } } = supabase.storage
            .from('catalog-images')
            .getPublicUrl(fileName);
        return publicUrl;
    };

    // ── Image Selection Handler ──────────────────────────────────────────────

    const handleImageSelected = useCallback(async (file: File) => {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);

        setStep('uploading');
        setStatusMsg('Subiendo imagen...');

        try {
            const url = await uploadImageFile(file);
            setUploadedUrl(url);
            setStatusMsg('Analizando con IA...');
            setStep('analyzing');

            const headers = await getAuthHeaders();
            const res = await fetch('/api/catalog/enhance-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({
                    imageUrl: url,
                    actions: ['analyze', 'detect_multi', 'optimize']
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al analizar');

            if (data.analysis) {
                setAnalysis(data.analysis);
                setDraft({
                    title: data.analysis.title || '',
                    description: data.analysis.description || '',
                    price: data.analysis.price?.toString() || '',
                    category: data.analysis.category || '',
                    brand: data.analysis.brand || '',
                    sku: data.analysis.sku || '',
                    unit: data.analysis.unit || 'unidad',
                    stock: '',
                    tags: (data.analysis.tags || []).join(', '),
                    imageUrl: data.optimizedUrl || url,
                    status: 'published'
                });
            } else {
                setDraft(d => ({ ...d, imageUrl: data.optimizedUrl || url }));
            }

            if (data.optimizedUrl) setEnhancedUrl(data.optimizedUrl);
            if (data.multiDetect) setMultiDetect(data.multiDetect);

            if (data.multiDetect?.multiple_products && data.multiDetect?.count > 1) {
                setStep('multi');
            } else {
                setStep('review');
            }

        } catch (err: any) {
            showError('Error: ' + err.message);
            setStep('choose');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [businessProfileId]);

    // ── Enhance Image ────────────────────────────────────────────────────────

    const handleEnhance = async (action: 'remove_bg' | 'upscale') => {
        const urlToEnhance = enhancedUrl || uploadedUrl;
        if (!urlToEnhance) return;

        setEnhancing(action);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/catalog/enhance-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...headers },
                body: JSON.stringify({ imageUrl: urlToEnhance, actions: [action] })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error');
            const newUrl = data.removedBgUrl || data.upscaledUrl || data.finalUrl;
            if (newUrl) {
                setEnhancedUrl(newUrl);
                setDraft(d => ({ ...d, imageUrl: newUrl }));
            }
        } catch (err: any) {
            showError('Error al mejorar: ' + err.message);
        } finally {
            setEnhancing(null);
        }
    };

    // ── Save Product ─────────────────────────────────────────────────────────

    const handleSave = async (saveStatus: 'published' | 'draft' = 'published') => {
        if (!draft.title.trim()) { showError('El nombre es obligatorio'); return; }
        if (!supabase) return;

        setStep('saving');
        try {
            const imageUrl = draft.imageUrl || enhancedUrl || uploadedUrl;
            const tagsArr = draft.tags.split(',').map(t => t.trim()).filter(Boolean);

            const { error } = await supabase
                .from('catalog_products')
                .insert({
                    business_profile_id: businessProfileId,
                    title: draft.title.trim(),
                    description: draft.description.trim() || null,
                    price: draft.price ? parseFloat(draft.price) : null,
                    category: draft.category.trim() || null,
                    brand: draft.brand.trim() || null,
                    sku: draft.sku.trim() || null,
                    stock: draft.stock ? parseInt(draft.stock) : null,
                    tags: tagsArr,
                    images: imageUrl ? [{ url: imageUrl, is_primary: true, ai_enhanced: !!enhancedUrl, alt_text: draft.title }] : [],
                    attributes: analysis?.attributes || {},
                    status: saveStatus,
                    import_source: imageFile ? 'manual_photo' : 'manual_complete',
                    ai_metadata: analysis ? {
                        extracted_from: 'photo',
                        confidence_score: analysis.confidence,
                        auto_generated: ['title', 'description', 'category']
                    } : {}
                });

            if (error) throw error;
            showSuccess(saveStatus === 'published' ? '¡Producto publicado!' : 'Guardado como borrador');
            onSuccess?.();
            handleClose();
        } catch (err: any) {
            showError('Error: ' + err.message);
            setStep('review');
        }
    };

    // ── Save Multiple Products ───────────────────────────────────────────────

    const handleSaveMultiple = async () => {
        if (!multiDetect || !supabase) return;
        setStep('saving');
        try {
            const imageUrl = enhancedUrl || uploadedUrl;
            const productsToInsert = multiDetect.products.map(p => ({
                business_profile_id: businessProfileId,
                title: p.name,
                description: p.description,
                category: p.category,
                images: imageUrl ? [{ url: imageUrl, is_primary: true, ai_enhanced: false, alt_text: p.name }] : [],
                tags: [],
                attributes: {},
                status: 'draft' as const,
                import_source: 'manual_photo_multi',
                ai_metadata: { extracted_from: 'photo', confidence_score: 0.7 }
            }));

            const { error } = await supabase.from('catalog_products').insert(productsToInsert);
            if (error) throw error;
            showSuccess(`${productsToInsert.length} productos guardados como borradores`);
            onSuccess?.();
            handleClose();
        } catch (err: any) {
            showError('Error: ' + err.message);
            setStep('multi');
        }
    };

    // ── Excel Import ─────────────────────────────────────────────────────────

    const handleExcelFile = async (file: File) => {
        setExcelProcessing(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('business_id', businessProfileId);
            const headers = await getAuthHeaders();
            const res = await fetch('/api/catalog/import/excel', {
                method: 'POST',
                headers,
                body: formData
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Error');
            showSuccess(`${data.stats?.productsToCreate || 0} productos importados con IA`);
            onSuccess?.();
            handleClose();
        } catch (err: any) {
            showError('Error: ' + err.message);
        } finally {
            setExcelProcessing(false);
        }
    };

    const displayImage = enhancedUrl || imagePreview;
    const currentImageUrl = enhancedUrl || uploadedUrl;
    const confidence = analysis?.confidence || 0;

    // ── Render ───────────────────────────────────────────────────────────────

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="fixed z-50 bg-white
                bottom-0 left-0 right-0 rounded-t-3xl
                md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                md:bottom-auto md:rounded-2xl md:w-[580px]
                max-h-[92vh] overflow-y-auto shadow-2xl"
            >
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10 rounded-t-3xl md:rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-black text-slate-800">
                            {step === 'choose' && 'Agregar producto'}
                            {step === 'uploading' && 'Subiendo imagen...'}
                            {step === 'analyzing' && 'IA analizando...'}
                            {step === 'review' && 'Revisar y publicar'}
                            {step === 'multi' && 'Varios productos detectados'}
                            {step === 'manual' && 'Agregar manualmente'}
                            {step === 'saving' && 'Guardando...'}
                        </h2>
                        {step === 'review' && analysis && (
                            <p className="text-xs text-slate-400 mt-0.5">
                                IA completó {Math.round(confidence * 100)}% — revisa y ajusta
                            </p>
                        )}
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <IconX size={20} color={semantic.muted} />
                    </button>
                </div>

                <div className="p-5">

                    {/* ── CHOOSE ───────────────────────────────────────────────── */}
                    {step === 'choose' && (
                        <div className="space-y-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full p-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all active:scale-[0.98] text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <IconCamera size={22} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-base">Tomar o subir foto</div>
                                        <div className="text-sm opacity-80 mt-0.5">La IA detecta nombre, precio y categoría</div>
                                    </div>
                                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-semibold whitespace-nowrap">Recomendado</span>
                                </div>
                            </button>

                            <button
                                onClick={() => excelInputRef.current?.click()}
                                className="w-full p-5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl hover:border-emerald-400 transition-all active:scale-[0.98] text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <IconFileSpreadsheet size={22} color={catalogUi.successFg} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-base text-slate-800">Importar Excel o CSV</div>
                                        <div className="text-sm text-slate-500 mt-0.5">Varios productos a la vez</div>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setStep('manual')}
                                className="w-full p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl hover:border-slate-400 transition-all active:scale-[0.98] text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <IconEdit size={20} color={tokens['--bs-color-neutral-600']} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-base text-slate-800">Agregar manualmente</div>
                                        <div className="text-sm text-slate-500 mt-0.5">Llena todos los campos</div>
                                    </div>
                                </div>
                            </button>

                            <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelected(f); }}
                                className="hidden"
                            />
                            <input ref={excelInputRef} type="file" accept=".xlsx,.xls,.csv"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleExcelFile(f); }}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* ── LOADING ───────────────────────────────────────────────── */}
                    {(step === 'uploading' || step === 'analyzing') && (
                        <div className="flex flex-col items-center py-10 gap-6">
                            {imagePreview && (
                                <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-blue-100 shadow-lg">
                                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto mb-4 relative">
                                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                                    <div className="absolute inset-2 flex items-center justify-center">
                                        <IconSparkles size={14} color={semantic.action} />
                                    </div>
                                </div>
                                <p className="font-bold text-slate-800 text-lg">{statusMsg}</p>
                                <p className="text-sm text-slate-400 mt-1">
                                    {step === 'uploading' && 'Preparando tu imagen...'}
                                    {step === 'analyzing' && 'Detectando nombre, precio y categoría...'}
                                </p>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                    style={{ width: step === 'uploading' ? '30%' : '85%' }} />
                            </div>
                        </div>
                    )}

                    {/* ── MULTI PRODUCT ─────────────────────────────────────────── */}
                    {step === 'multi' && multiDetect && (
                        <div className="space-y-4">
                            {displayImage && (
                                <div className="w-full h-48 rounded-2xl overflow-hidden bg-slate-100">
                                    <img src={displayImage} alt="productos" className="w-full h-full object-contain" />
                                </div>
                            )}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <IconAlertTriangle size={16} color={semantic.warningFg} />
                                    <span className="font-bold text-amber-800">
                                        Detectamos {multiDetect.count} productos en esta imagen
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {multiDetect.products.map((p, i) => (
                                        <div key={i} className="bg-white rounded-lg p-2.5 flex items-start gap-2">
                                            <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-xs font-bold text-amber-700">{i + 1}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                                                <p className="text-xs text-slate-500">{p.category} · {p.position}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={handleSaveMultiple}
                                    className="py-3 px-4 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors flex flex-col items-center gap-1">
                                    <IconLayers size={18} />
                                    {multiDetect.count} por separado
                                </button>
                                <button onClick={() => setStep('review')}
                                    className="py-3 px-4 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors flex flex-col items-center gap-1">
                                    <IconPackage size={18} />
                                    Un solo producto
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── REVIEW ────────────────────────────────────────────────── */}
                    {step === 'review' && (
                        <div className="space-y-4">
                            {/* Image + enhancement controls */}
                            <div className="flex gap-3 items-start">
                                <div
                                    className="relative flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {displayImage ? (
                                        <img src={displayImage} alt="producto" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                            <IconCamera size={24} color={tokens['--bs-color-neutral-400']} />
                                            <span className="text-[10px] text-slate-400">Foto</span>
                                        </div>
                                    )}
                                    <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
                                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelected(f); }}
                                        className="hidden"
                                    />
                                </div>

                                <div className="flex-1 space-y-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Mejorar imagen con IA</p>
                                    <button
                                        onClick={() => handleEnhance('remove_bg')}
                                        disabled={!!enhancing || !currentImageUrl}
                                        className="w-full flex items-center gap-2 py-2 px-3 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition-all"
                                    >
                                        {enhancing === 'remove_bg'
                                            ? <div className="w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                                            : <IconSparkles size={12} />}
                                        {enhancing === 'remove_bg' ? 'Quitando fondo...' : 'Quitar fondo'}
                                    </button>
                                    <button
                                        onClick={() => handleEnhance('upscale')}
                                        disabled={!!enhancing || !currentImageUrl}
                                        className="w-full flex items-center gap-2 py-2 px-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-all"
                                    >
                                        {enhancing === 'upscale'
                                            ? <div className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                                            : <IconZap size={12} />}
                                        {enhancing === 'upscale' ? 'Mejorando...' : 'Mejorar calidad'}
                                    </button>
                                    {enhancedUrl && enhancedUrl !== uploadedUrl && (
                                        <p className="text-[10px] text-green-600 font-semibold flex items-center gap-1">
                                            <IconCheck size={10} />Imagen mejorada aplicada
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* AI badge */}
                            {analysis && (
                                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                                    <IconSparkles size={13} color={semantic.action} />
                                    <span className="text-xs text-blue-700 font-medium">
                                        IA detectó {Math.round(confidence * 100)}% de datos — revisa y ajusta si es necesario
                                    </span>
                                </div>
                            )}

                            {/* Form */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        value={draft.title}
                                        onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
                                        placeholder="Nombre del producto"
                                        className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors font-semibold"
                                        style={{
                                          borderColor: draft.title
                                            ? tokens['--bs-color-neutral-200']
                                            : tokens['--bs-danger-bg'],
                                        }}
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Descripción</label>
                                    <textarea
                                        value={draft.description}
                                        onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
                                        placeholder="Descripción del producto..."
                                        rows={3}
                                        className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Precio</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">S/</span>
                                            <input type="number" value={draft.price}
                                                onChange={(e) => setDraft(d => ({ ...d, price: e.target.value }))}
                                                placeholder="0.00"
                                                className="w-full pl-8 pr-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                                                min="0" step="0.01"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Unidad</label>
                                        <select value={draft.unit}
                                            onChange={(e) => setDraft(d => ({ ...d, unit: e.target.value }))}
                                            className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors">
                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Categoría</label>
                                        <input type="text" value={draft.category}
                                            onChange={(e) => setDraft(d => ({ ...d, category: e.target.value }))}
                                            placeholder="ej: Pinturas"
                                            className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Marca</label>
                                        <input type="text" value={draft.brand}
                                            onChange={(e) => setDraft(d => ({ ...d, brand: e.target.value }))}
                                            placeholder="ej: 3M"
                                            className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">SKU / Código</label>
                                        <input type="text" value={draft.sku}
                                            onChange={(e) => setDraft(d => ({ ...d, sku: e.target.value }))}
                                            placeholder="Código interno"
                                            className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Stock</label>
                                        <input type="number" value={draft.stock}
                                            onChange={(e) => setDraft(d => ({ ...d, stock: e.target.value }))}
                                            placeholder="Cantidad"
                                            className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                {analysis?.tags && analysis.tags.length > 0 && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1 flex items-center gap-1">
                                            <IconTag size={10} /> Etiquetas detectadas
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {analysis.tags.map(tag => (
                                                <span key={tag} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-lg font-medium border border-blue-100">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Save buttons */}
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => handleSave('draft')}
                                    className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                                    Borrador
                                </button>
                                <button onClick={() => handleSave('published')}
                                    disabled={!draft.title.trim()}
                                    className="flex-[2] py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    <IconCheck size={16} />
                                    Publicar ahora
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── MANUAL ───────────────────────────────────────────────── */}
                    {step === 'manual' && (
                        <div className="space-y-4">
                            <button onClick={() => setStep('choose')}
                                className="text-sm font-bold text-blue-500 hover:text-blue-700 transition-colors">
                                ← Volver
                            </button>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative h-40 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all overflow-hidden"
                            >
                                {draft.imageUrl ? (
                                    <img src={draft.imageUrl} alt="preview" className="w-full h-full object-contain" />
                                ) : (
                                    <>
                                        <IconImage size={36} color={tokens['--bs-color-neutral-400']} />
                                        <p className="text-sm text-slate-400 mt-2 font-medium">Toca para agregar foto</p>
                                        <p className="text-xs text-slate-300 mt-0.5">La IA llenará los campos automáticamente</p>
                                    </>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelected(f); }}
                                    className="hidden"
                                />
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Nombre *</label>
                                    <input type="text" value={draft.title}
                                        onChange={(e) => setDraft(d => ({ ...d, title: e.target.value }))}
                                        placeholder="Nombre del producto"
                                        className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Descripción</label>
                                    <textarea value={draft.description}
                                        onChange={(e) => setDraft(d => ({ ...d, description: e.target.value }))}
                                        placeholder="Describe el producto..."
                                        rows={3}
                                        className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Precio</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">S/</span>
                                            <input type="number" value={draft.price}
                                                onChange={(e) => setDraft(d => ({ ...d, price: e.target.value }))}
                                                placeholder="0.00"
                                                className="w-full pl-8 pr-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                                                min="0" step="0.01"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Categoría</label>
                                        <input type="text" value={draft.category}
                                            onChange={(e) => setDraft(d => ({ ...d, category: e.target.value }))}
                                            placeholder="ej: Herramientas"
                                            className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Marca</label>
                                        <input type="text" value={draft.brand}
                                            onChange={(e) => setDraft(d => ({ ...d, brand: e.target.value }))}
                                            placeholder="ej: Bosch"
                                            className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-1">Stock</label>
                                        <input type="number" value={draft.stock}
                                            onChange={(e) => setDraft(d => ({ ...d, stock: e.target.value }))}
                                            placeholder="Cantidad"
                                            className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors"
                                            min="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={() => handleSave('draft')}
                                    className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                                    Borrador
                                </button>
                                <button onClick={() => handleSave('published')}
                                    disabled={!draft.title.trim()}
                                    className="flex-[2] py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                    <IconCheck size={16} />
                                    Publicar ahora
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── SAVING ───────────────────────────────────────────────── */}
                    {step === 'saving' && (
                        <div className="flex flex-col items-center py-10 gap-4">
                            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                            <p className="font-bold text-slate-800">Guardando producto...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Excel processing overlay */}
            {excelProcessing && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4">
                        <div className="w-12 h-12 border-4 border-green-100 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="font-bold text-slate-800 text-lg">Procesando con IA</p>
                        <p className="text-sm text-slate-400 mt-1">Analizando productos del archivo...</p>
                    </div>
                </div>
            )}
        </>
    );
}
