'use client';

/**
 * MagicEditorPanel
 *
 * A collapsible panel inside ProductEditor that lets the owner:
 * 1. Upload (or re-use existing) product image → AI auto-fills ALL fields
 * 2. Enhance a specific field: title, description (per-field AI)
 *
 * Uses the existing /api/analyze-product and /api/catalog/enhance-image APIs.
 * Calls Gemini — costs some tokens — but only when explicitly triggered by user.
 */

import { useState, useRef } from 'react';
import { IconSparkles, IconCamera, IconX } from '@/components/Icons';
import { catalogUi, publishUi } from '@/lib/bs-tokens';
import { supabase } from '@/lib/supabase';

interface MagicEditorPanelProps {
    /** Current product images (for pre-loading in the AI panel) */
    currentImages: any[];
    /** Called when AI successfully fills in all product data */
    onFillAll: (data: {
        title?: string;
        description?: string;
        price?: number | null;
        category?: string;
        brand?: string;
        tags?: string[];
    }) => void;
    /** Called to enhance a single field */
    onFillField: (field: 'title' | 'description', value: string) => void;
    /** Current values (used as context for per-field enhancement) */
    currentTitle: string;
    currentDescription: string;
}

type Panel = 'closed' | 'full' | 'title' | 'description';

export default function MagicEditorPanel({
    currentImages,
    onFillAll,
    onFillField,
    currentTitle,
    currentDescription
}: MagicEditorPanelProps) {
    const [panel, setPanel] = useState<Panel>('closed');
    const [loading, setLoading] = useState(false);
    const [loadingField, setLoadingField] = useState<'title' | 'description' | null>(null);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [aiImageFile, setAiImageFile] = useState<File | null>(null);
    const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const firstExistingImageUrl: string | null =
        currentImages.length > 0
            ? (typeof currentImages[0] === 'string' ? currentImages[0] : currentImages[0]?.url)
            : null;

    const getAuthHeader = async (): Promise<Record<string, string>> => {
        if (!supabase) return {};
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token
            ? { 'Authorization': `Bearer ${session.access_token}` }
            : {};
    };

    // ── Full product AI analysis ──────────────────────────────────────────────

    const handleAnalyzeImage = async (imageUrl: string) => {
        setLoading(true);
        setMessage(null);
        try {
            const authH = await getAuthHeader();
            const res = await fetch('/api/analyze-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authH } as HeadersInit,
                body: JSON.stringify({ imageUrl })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Error al analizar');

            const data = json.data;
            onFillAll({
                title: data.title || undefined,
                description: data.description || undefined,
                price: data.price ?? undefined,
                category: data.category || undefined,
                brand: data.brand || undefined,
                tags: Array.isArray(data.tags) ? data.tags : []
            });
            setMessage('✅ ¡Listo! La IA llenó los datos del producto.');
            setPanel('closed');
        } catch (err: any) {
            setMessage('❌ ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadAndAnalyze = async () => {
        if (!aiImageFile) return;
        setLoading(true);
        setMessage(null);
        try {
            if (!supabase) throw new Error('Supabase no configurado');
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No autenticado');

            // Upload to Supabase first, then analyze
            const fileName = `ai-temp/${user.id}/${Date.now()}-${aiImageFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('catalog-images')
                .upload(fileName, aiImageFile, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('catalog-images')
                .getPublicUrl(fileName);

            await handleAnalyzeImage(publicUrl);
        } catch (err: any) {
            setMessage('❌ ' + err.message);
            setLoading(false);
        }
    };

    // ── Per-field enhancement ─────────────────────────────────────────────────

    const enhanceField = async (field: 'title' | 'description') => {
        const imageUrl = firstExistingImageUrl;
        if (!imageUrl && !aiImagePreview) {
            setMessage('⚠️ Primero sube una imagen para que la IA pueda mejorar el campo.');
            return;
        }
        setLoadingField(field);
        setMessage(null);
        try {
            const headers = await getAuthHeader();
            const contextText = field === 'title'
                ? `Título actual: "${currentTitle}"\nDescripción actual: "${currentDescription}"`
                : `Título actual: "${currentTitle}"\nDescripción actual: "${currentDescription}"`;

            // Use enhance-image endpoint with analyze action if we have an image URL
            const analyzeUrl = imageUrl || '';
            if (!analyzeUrl) throw new Error('Sin imagen');

            const authH = await getAuthHeader();
            const res = await fetch('/api/catalog/enhance-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authH } as HeadersInit,
                body: JSON.stringify({
                    imageUrl: analyzeUrl,
                    actions: ['analyze']
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Error al mejorar');

            const analysis = json.analysis;
            if (field === 'title' && analysis?.title) {
                onFillField('title', analysis.title);
                setMessage(`✅ Título mejorado: "${analysis.title}"`);
            } else if (field === 'description' && analysis?.description) {
                onFillField('description', analysis.description);
                setMessage(`✅ Descripción mejorada.`);
            } else {
                setMessage('La IA no encontró mejoras para este campo.');
            }
        } catch (err: any) {
            setMessage('❌ ' + err.message);
        } finally {
            setLoadingField(null);
        }
    };

    // ── File selection ────────────────────────────────────────────────────────

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAiImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setAiImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-subtle)' }}>
            {/* Header button */}
            <button
                onClick={() => setPanel(panel === 'closed' ? 'full' : 'closed')}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors"
                style={{
                    background: panel !== 'closed'
                        ? publishUi.magicGradient
                        : 'var(--bg-secondary)',
                    color: panel !== 'closed' ? 'white' : 'var(--text-primary)'
                }}
            >
                <span className="text-lg">✨</span>
                <div className="flex-1">
                    <div className="font-bold text-sm">Editor Mágico</div>
                    <div className="text-xs opacity-70">
                        {panel !== 'closed' ? 'Haz click para cerrar' : 'Usa IA para mejorar o rellenar este producto'}
                    </div>
                </div>
                <span className="text-xl opacity-70">{panel !== 'closed' ? '▲' : '▼'}</span>
            </button>

            {/* Panel content */}
            {panel !== 'closed' && (
                <div className="p-4 space-y-4" style={{ backgroundColor: 'var(--bg-primary)' }}>

                    {/* Message area */}
                    {message && (
                        <div
                            className={`text-sm px-3 py-2 rounded-lg font-medium flex items-start gap-2`}
                            style={{
                                backgroundColor: message.startsWith('✅')
                                  ? catalogUi.successBg
                                  : message.startsWith('❌')
                                    ? catalogUi.dangerBg
                                    : catalogUi.warningBg,
                                color: message.startsWith('✅')
                                  ? catalogUi.successFg
                                  : message.startsWith('❌')
                                    ? catalogUi.dangerFg
                                    : catalogUi.warningFg,
                            }}
                        >
                            <span className="flex-1">{message}</span>
                            <button onClick={() => setMessage(null)} className="opacity-50 hover:opacity-100 shrink-0">
                                <IconX size={14} />
                            </button>
                        </div>
                    )}

                    {/* Section 1: Full AI analysis */}
                    <div>
                        <div className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>
                            🤖 Rellenar todo automáticamente con IA
                        </div>

                        {/* Option A: Use existing image */}
                        {firstExistingImageUrl && (
                            <button
                                onClick={() => handleAnalyzeImage(firstExistingImageUrl)}
                                disabled={loading}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-left transition-all hover:border-purple-400 hover:bg-purple-50 disabled:opacity-50 mb-2"
                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin shrink-0" />
                                ) : (
                                    <span>🖼️</span>
                                )}
                                <span>Analizar imagen principal del producto</span>
                            </button>
                        )}

                        {/* Option B: Upload new image to analyze */}
                        <div className="flex gap-2">
                            <label className="flex-1 cursor-pointer">
                                <div
                                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed text-sm font-medium transition-all hover:border-purple-400 hover:bg-purple-50"
                                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                                >
                                    <span>📷</span>
                                    <span>{aiImagePreview ? 'Cambiar imagen para análisis' : 'Subir imagen para analizar'}</span>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </label>
                            {aiImageFile && (
                                <button
                                    onClick={handleUploadAndAnalyze}
                                    disabled={loading}
                                    className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 hover:brightness-110 transition-all"
                                    style={{ backgroundColor: catalogUi.eventosFg }}
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : '✨ Analizar'}
                                </button>
                            )}
                        </div>

                        {aiImagePreview && (
                            <div className="mt-2 flex items-center gap-2">
                                <img src={aiImagePreview} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Lista para analizar</span>
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
                        <div className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>
                            ✍️ Mejorar campos específicos
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => enhanceField('title')}
                                disabled={loadingField === 'title' || !firstExistingImageUrl}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all hover:border-blue-400 hover:bg-blue-50 disabled:opacity-40"
                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                title={!firstExistingImageUrl ? 'Primero agrega una imagen al producto' : ''}
                            >
                                {loadingField === 'title' ? (
                                    <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                ) : '✨'}
                                Mejorar título
                            </button>
                            <button
                                onClick={() => enhanceField('description')}
                                disabled={loadingField === 'description' || !firstExistingImageUrl}
                                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all hover:border-blue-400 hover:bg-blue-50 disabled:opacity-40"
                                style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                                title={!firstExistingImageUrl ? 'Primero agrega una imagen al producto' : ''}
                            >
                                {loadingField === 'description' ? (
                                    <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                ) : '✨'}
                                Mejorar descripción
                            </button>
                        </div>
                        {!firstExistingImageUrl && (
                            <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                                💬 Agrega una foto al producto para habilitar la mejora por campo.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
