/**
 * Importador de Catálogo con IA
 * Drag & drop para Excel/CSV y Agregado Manual Rápido
 */

'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import {
    IconUpload, IconSparkles, IconCheck, IconX,
    IconAlertTriangle, IconArrowLeft, IconFileSpreadsheet,
    IconCamera, IconPlus, IconImage
} from '@/components/Icons';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { listBusinessProfilesForUser, uploadProductImage } from '@/lib/business';
import { useAuth } from '@/hooks/useAuth';

interface ImportResult {
    success: boolean;
    sessionId: string;
    stats: {
        totalRows: number;
        productsToCreate: number;
        duplicatesFound: number;
        errors: number;
    };
    columnMapping: any;
    needsReview: boolean;
    duplicates: any[];
    errors: any[];
}

// ─── Sector Templates ─────────────────────────────────────────────────────────

const SECTOR_TEMPLATES: Record<string, { label: string; emoji: string; categories: string[] }> = {
    ferreteria: {
        label: 'Ferretería / Construcción',
        emoji: '🔧',
        categories: ['Herramientas', 'Pinturas', 'Plomería', 'Electricidad', 'Materiales', 'Seguridad', 'Adhesivos', 'Abrasivos']
    },
    ropa: {
        label: 'Ropa y Accesorios',
        emoji: '👗',
        categories: ['Camisetas', 'Pantalones', 'Vestidos', 'Calzado', 'Accesorios', 'Ropa interior', 'Deportivo', 'Infantil']
    },
    hogar: {
        label: 'Hogar y Decoración',
        emoji: '🏠',
        categories: ['Muebles', 'Decoración', 'Cocina', 'Baño', 'Jardín', 'Limpieza', 'Iluminación', 'Textiles']
    },
    alimentos: {
        label: 'Alimentos y Bebidas',
        emoji: '🍎',
        categories: ['Frutas y verduras', 'Carnes', 'Lácteos', 'Panadería', 'Bebidas', 'Snacks', 'Congelados', 'Abarrotes']
    },
    tecnologia: {
        label: 'Tecnología / Electrónica',
        emoji: '💻',
        categories: ['Celulares', 'Computadoras', 'Accesorios', 'Audio', 'Gaming', 'Impresión', 'Redes', 'Componentes']
    },
    belleza: {
        label: 'Belleza y Cuidado Personal',
        emoji: '💄',
        categories: ['Cabello', 'Maquillaje', 'Cuidado de la piel', 'Perfumes', 'Higiene', 'Uñas', 'Spa', 'Afeitado']
    },
    servicios: {
        label: 'Servicios',
        emoji: '💼',
        categories: ['Consultoría', 'Diseño', 'Marketing', 'Tecnología', 'Legal', 'Capacitación', 'Mantenimiento', 'Salud']
    },
    agro: {
        label: 'Agropecuario / Veterinaria',
        emoji: '🌿',
        categories: ['Semillas', 'Fertilizantes', 'Herramientas agrícolas', 'Alimento animal', 'Veterinaria', 'Fumigación', 'Riego', 'Otros']
    },
    otro: {
        label: 'Otro tipo de negocio',
        emoji: '🏪',
        categories: ['Categoría 1', 'Categoría 2', 'Categoría 3', 'Categoría 4', 'Otros']
    }
};

function CatalogImportPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading: authLoading } = useAuth();
    const { success: showSuccess, error: showError, toasts, removeToast } = useToast();

    // Sector selection
    const [selectedSector, setSelectedSector] = useState<string | null>(null);
    const [showSectorPicker, setShowSectorPicker] = useState(false);

    // UI Mode state
    const [mode, setMode] = useState<'excel' | 'manual' | 'bulk_images'>('excel');

    // Excel Import State
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<ImportResult | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [businessOptions, setBusinessOptions] = useState<{ id: string; name: string }[]>([]);
    const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

    // Bulk Images State
    const [bulkImages, setBulkImages] = useState<{ id: string; file: File; title: string; preview: string; status: 'pending' | 'uploading' | 'success' | 'error' }[]>([]);
    const [bulkUploading, setBulkUploading] = useState(false);
    const bulkDropzone = useDropzone({
        accept: { 'image/*': [] },
        onDrop: (acceptedFiles) => {
            const newImages = acceptedFiles.map(file => ({
                id: Math.random().toString(36).substring(7),
                file,
                title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' '),
                preview: URL.createObjectURL(file),
                status: 'pending' as const
            }));
            setBulkImages(prev => [...prev, ...newImages]);
        }
    });

    const removeBulkImage = (id: string) => {
        setBulkImages(prev => prev.filter(img => img.id !== id));
    };

    const updateBulkTitle = (id: string, newTitle: string) => {
        setBulkImages(prev => prev.map(img => img.id === id ? { ...img, title: newTitle } : img));
    };

    const handleBulkSubmit = async () => {
        if (!selectedBusinessId) return showError('Selecciona un negocio primero');
        if (bulkImages.length === 0) return;

        try {
            setBulkUploading(true);
            const { data: { user } } = await supabase!.auth.getUser();
            if (!user) throw new Error('No se encontró el usuario');

            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < bulkImages.length; i++) {
                const img = bulkImages[i];
                if (img.status === 'success') continue;

                // Update UI to uploading
                setBulkImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'uploading' } : p));

                try {
                    const imageUrl = await uploadProductImage(img.file, user.id);
                    if (!imageUrl) throw new Error('Error al subir imagen');

                    const { error } = await supabase!
                        .from('catalog_products')
                        .insert({
                            business_profile_id: selectedBusinessId,
                            title: img.title,
                            status: 'published',
                            images: [{ url: imageUrl, alt: img.title }],
                            import_source: 'bulk_images'
                        });

                    if (error) throw error;
                    
                    setBulkImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'success' } : p));
                    successCount++;
                } catch (e) {
                    console.error('Bulk upload error:', e);
                    setBulkImages(prev => prev.map(p => p.id === img.id ? { ...p, status: 'error' } : p));
                    errorCount++;
                }
            }

            if (successCount > 0) showSuccess(`✅ ${successCount} productos subidos correctamente`);
            if (errorCount > 0) showError(`❌ ${errorCount} productos fallaron`);

            if (errorCount === 0) {
                setTimeout(() => {
                    router.push('/mi-negocio/catalogo');
                }, 1500);
            }

        } catch (err: any) {
            showError('Error en subida masiva: ' + err.message);
        } finally {
            setBulkUploading(false);
        }
    };

    // Manual Add State
    const [manualLoading, setManualLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [manualForm, setManualForm] = useState({
        title: '',
        price: '',
        sku: '',
        image: null as File | null,
        imagePreview: null as string | null
    });

    useEffect(() => {
        if (authLoading || !user) return;
        (async () => {
            const list = await listBusinessProfilesForUser(user.id);
            const opts = list.map((m) => ({
                id: m.profile.id,
                name: m.profile.name || m.profile.slug || m.profile.id,
            }));
            setBusinessOptions(opts);
            const param = searchParams.get('business');
            const id = param && opts.some((o) => o.id === param) ? param : opts[0]?.id ?? null;
            setSelectedBusinessId(id);
            
            const modeParam = searchParams.get('mode');
            if (modeParam === 'excel' || modeParam === 'manual' || modeParam === 'bulk_images') {
                setMode(modeParam);
            }
        })();
    }, [user, authLoading, searchParams]);

    // --- EXCEL LOGIC ---
    const handleUpload = async (file: File) => {
        try {
            if (!selectedBusinessId) {
                showError('Selecciona o espera a que cargue tu negocio.');
                return;
            }
            setUploading(true);
            setUploadProgress(0);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('business_id', selectedBusinessId);
            if (selectedSector) formData.append('sector', selectedSector);

            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            if (!supabase) throw new Error('Supabase no está configurado');
            const { data: { session } } = await supabase.auth.getSession();

            const response = await fetch('/api/catalog/import/excel', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: formData
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al importar');
            }

            const data: ImportResult = await response.json();
            setResults(data);

            if (data.success) {
                showSuccess(`✅ Importación completada: ${data.stats.productsToCreate} productos procesados`);
            }

        } catch (err: any) {
            showError('Error al importar: ' + err.message);
        } finally {
            setUploading(false);
            setTimeout(() => setUploadProgress(0), 1000);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: async (acceptedFiles) => {
            if (acceptedFiles.length === 0) return;
            await handleUpload(acceptedFiles[0]);
        },
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv']
        },
        maxFiles: 1
    });

    // --- MANUAL ADD LOGIC ---
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setManualForm(prev => ({
                ...prev,
                image: file,
                imagePreview: URL.createObjectURL(file)
            }));
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualForm.title) return showError('El nombre del producto es obligatorio');

        try {
            setManualLoading(true);

            let imageUrl = null;

            // 1. Upload Image if exists
            if (manualForm.image) {
                const fileExt = manualForm.image.name.split('.').pop();
                const fileName = `manual-${Date.now()}.${fileExt}`;

                if (!supabase) throw new Error('Supabase no está configurado');
                const { error: uploadError } = await supabase.storage
                    .from('catalog-images') // Make sure this bucket exists!
                    .upload(fileName, manualForm.image);

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    // Continue without image or throw? Let's try to get public URL anyway if it worked partially, or just skip
                }

                if (!supabase) throw new Error('Supabase no está configurado');
                const { data: urlData } = supabase.storage
                    .from('catalog-images')
                    .getPublicUrl(fileName);

                imageUrl = urlData.publicUrl;
            }

            // 2. Create Product
            if (!supabase) throw new Error('Supabase no está configurado');

            // Get Business Profile ID
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No se encontró el usuario');

            if (!selectedBusinessId) throw new Error('Selecciona un negocio');

            const { error: insertError } = await supabase
                .from('catalog_products')
                .insert({
                    business_profile_id: selectedBusinessId,
                    title: manualForm.title,
                    price: manualForm.price ? parseFloat(manualForm.price) : null,
                    sku: manualForm.sku || null,
                    status: 'published',
                    images: imageUrl ? [{ url: imageUrl, alt: manualForm.title }] : [],
                    import_source: 'manual'
                });

            if (insertError) throw insertError;

            showSuccess('✅ Producto agregado correctamente');

            // Reset form
            setManualForm({
                title: '',
                price: '',
                sku: '',
                image: null,
                imagePreview: null
            });

        } catch (err: any) {
            showError('Error al crear producto: ' + err.message);
        } finally {
            setManualLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-secondary)] overflow-hidden">
            <Header />
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            <div className="flex-1 overflow-y-auto px-4 py-4 md:py-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header Navigation */}
                    <div className="mb-5">
                        <Link
                            href="/mi-negocio/catalogo"
                            className="inline-flex items-center gap-2 text-xs font-bold opacity-70 hover:opacity-100 mb-3 transition-all"
                            style={{ color: 'var(--brand-blue)' }}
                        >
                            <IconArrowLeft size={12} />
                            Mi catálogo
                        </Link>

                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                    Agregar Productos
                                </h1>
                                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                    Importa en lote o agrega uno a uno
                                </p>
                                {businessOptions.length > 0 && (
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <label className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>
                                            Negocio
                                        </label>
                                        <select
                                            className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white max-w-[240px]"
                                            value={selectedBusinessId || ''}
                                            onChange={(e) => {
                                                const id = e.target.value;
                                                setSelectedBusinessId(id);
                                                router.replace(`/mi-negocio/catalogo/importar?business=${id}`);
                                            }}
                                        >
                                            {businessOptions.map((o) => (
                                                <option key={o.id} value={o.id}>
                                                    {o.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sector selector */}
                    <div className="mb-5 p-4 rounded-2xl border-2 bg-white" style={{ borderColor: selectedSector ? 'var(--brand-blue)' : 'var(--border-color)' }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                                    ¿Qué tipo de negocio es?
                                </p>
                                {selectedSector ? (
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--brand-blue)' }}>
                                        {SECTOR_TEMPLATES[selectedSector].emoji} {SECTOR_TEMPLATES[selectedSector].label}
                                    </p>
                                ) : (
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                                        Opcional — nos ayuda a clasificar mejor tus productos
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setShowSectorPicker(!showSectorPicker)}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                                style={{ color: 'var(--brand-blue)', backgroundColor: 'var(--bg-secondary)' }}
                            >
                                {selectedSector ? 'Cambiar' : 'Elegir'}
                            </button>
                        </div>

                        {showSectorPicker && (
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {Object.entries(SECTOR_TEMPLATES).map(([key, s]) => (
                                    <button
                                        key={key}
                                        onClick={() => { setSelectedSector(key); setShowSectorPicker(false); }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-left transition-all border-2"
                                        style={{
                                            borderColor: selectedSector === key ? 'var(--brand-blue)' : 'var(--border-color)',
                                            backgroundColor: selectedSector === key ? 'var(--bg-secondary)' : 'transparent',
                                            color: 'var(--text-primary)'
                                        }}
                                    >
                                        <span className="text-base">{s.emoji}</span>
                                        <span className="text-xs leading-tight">{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedSector && !showSectorPicker && (
                            <div className="mt-3">
                                <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-tertiary)' }}>Categorías pre-cargadas:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {SECTOR_TEMPLATES[selectedSector].categories.map(cat => (
                                        <span
                                            key={cat}
                                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                                            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                                        >
                                            {cat}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-200/60 rounded-xl mb-6 w-full md:w-fit">
                        <button
                            onClick={() => { setMode('excel'); setResults(null); }}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'excel'
                                ? 'bg-white text-[var(--brand-blue)] shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <IconFileSpreadsheet size={18} />
                            Importar Excel/CSV
                        </button>
                        <button
                            onClick={() => setMode('manual')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'manual'
                                ? 'bg-white text-[var(--brand-blue)] shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <IconCamera size={18} />
                            Agregar Manual
                        </button>
                        <button
                            onClick={() => setMode('bulk_images')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'bulk_images'
                                ? 'bg-white text-[var(--brand-blue)] shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <IconImage size={18} />
                            Múltiples Imágenes
                        </button>
                    </div>

                    {/* MODE: EXCEL IMPORT */}
                    {mode === 'excel' && (
                        !results ? (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12 mb-8 animate-in fade-in zoom-in duration-300">
                                <div className="text-center max-w-2xl mx-auto">
                                    <div className="inline-flex p-4 bg-sky-50 rounded-2xl mb-4">
                                        <IconSparkles size={32} className="text-[var(--brand-blue)]" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
                                        Importación Inteligente con IA
                                    </h2>
                                    <p className="text-slate-500 text-sm md:text-base mb-6">
                                        Sube tu archivo Excel o CSV. Nuestra IA detectará automáticamente las columnas,
                                        eliminará duplicados y organizará tu catálogo.
                                    </p>

                                    <div
                                        {...getRootProps()}
                                        className={`relative border-3 border-dashed rounded-xl p-8 md:p-12 transition-all cursor-pointer group ${isDragActive
                                            ? 'border-[var(--brand-blue)] bg-sky-50'
                                            : 'border-slate-300 hover:border-[var(--brand-blue)] hover:bg-slate-50'
                                            }`}
                                    >
                                        <input {...getInputProps()} />

                                        {uploading ? (
                                            <div className="py-4">
                                                <div className="animate-spin text-blue-600 mb-4 mx-auto">
                                                    <IconSparkles size={40} />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-2">
                                                    Analizando archivo...
                                                </h3>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden max-w-xs mx-auto">
                                                    <div
                                                        className="h-full bg-blue-600 transition-all duration-300"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                                <p className="text-sm text-slate-500 mt-2">
                                                    Normalizando datos y detectando duplicados
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="py-4">
                                                <IconUpload size={40} className="text-slate-400 group-hover:text-blue-500 transition-colors mx-auto mb-4" />
                                                <p className="font-bold text-slate-700 mb-1">
                                                    Haz clic o arrastra tu archivo aquí
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    Soporta .xlsx, .xls, .csv
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8 flex justify-center gap-8 text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <IconCheck size={16} className="text-green-500" /> Auto-mapeo
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <IconCheck size={16} className="text-green-500" /> Detecta duplicados
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <IconCheck size={16} className="text-green-500" /> Limpieza de datos
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                {/* Summary Card */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                            <IconCheck size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900">Importación Finalizada</h2>
                                            <p className="text-slate-500 text-sm">Sesión: {results.sessionId}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                            <div className="text-3xl font-black text-slate-800 mb-1">{results.stats.totalRows}</div>
                                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Filas Leídas</div>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-center">
                                            <div className="text-3xl font-black text-green-600 mb-1">{results.stats.productsToCreate}</div>
                                            <div className="text-xs text-green-700 font-bold uppercase tracking-wider">Nuevos</div>
                                        </div>
                                        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-center">
                                            <div className="text-3xl font-black text-yellow-600 mb-1">{results.stats.duplicatesFound}</div>
                                            <div className="text-xs text-yellow-700 font-bold uppercase tracking-wider">Duplicados</div>
                                        </div>
                                        <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center">
                                            <div className="text-3xl font-black text-red-600 mb-1">{results.stats.errors}</div>
                                            <div className="text-xs text-red-700 font-bold uppercase tracking-wider">Errores</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            onClick={() => router.push('/mi-negocio/catalogo')}
                                            className="flex-1 py-3 px-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all"
                                        >
                                            Ver Catálogo
                                        </button>
                                        {results.needsReview && (
                                            <button
                                                onClick={() => router.push(`/mi-negocio/catalogo/duplicados/${results.sessionId}`)}
                                                className="flex-1 py-3 px-4 bg-yellow-400 text-yellow-900 font-bold rounded-xl hover:bg-yellow-500 transition-all flex items-center justify-center gap-2"
                                            >
                                                <IconAlertTriangle size={18} />
                                                Resolver Duplicados
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setResults(null)}
                                            className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
                                        >
                                            Importar Otro
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    )}

                    {/* MODE: MANUAL ADD */}
                    {mode === 'manual' && (
                        <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 md:p-8">
                                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <IconPlus className="text-blue-600" />
                                        Agregar Producto Rápido
                                    </h2>

                                    <form onSubmit={handleManualSubmit} className="space-y-6">
                                        {/* Image Upload */}
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="relative aspect-video rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-all overflow-hidden group"
                                        >
                                            {manualForm.imagePreview ? (
                                                <>
                                                    <img
                                                        src={manualForm.imagePreview}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <IconCamera className="text-white" size={32} />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="p-4 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                                                        <IconCamera size={24} className="text-slate-400 group-hover:text-blue-500" />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-500 group-hover:text-blue-600">
                                                        Tomar foto o subir imagen
                                                    </p>
                                                </>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                capture="environment" // Opens camera on mobile
                                                onChange={handleImageSelect}
                                                className="hidden"
                                            />
                                        </div>

                                        {/* Inputs */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1">
                                                    Nombre del Producto <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Ej. Taladro Percutor Bosch"
                                                    value={manualForm.title}
                                                    onChange={e => setManualForm({ ...manualForm, title: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">
                                                        Precio (S/)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={manualForm.price}
                                                        onChange={e => setManualForm({ ...manualForm, price: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">
                                                        SKU / Código
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Opcional"
                                                        value={manualForm.sku}
                                                        onChange={e => setManualForm({ ...manualForm, sku: e.target.value })}
                                                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <button
                                            type="submit"
                                            disabled={manualLoading}
                                            className="w-full py-4 bg-[var(--brand-blue)] text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {manualLoading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>Guardando...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <IconCheck size={20} />
                                                    <span>Guardar Producto</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            <p className="text-center text-slate-400 text-sm mt-6">
                                💡 Tip: Usa el modo &quot;Importar Excel&quot; para subir productos masivamente.
                            </p>
                        </div>
                    )}

                    {/* MODE: BULK IMAGES */}
                    {mode === 'bulk_images' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <IconImage className="text-blue-600" /> Subida Masiva de Imágenes
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">
                                    Arrastra múltiples imágenes a la vez. El nombre de cada archivo se usará como título del producto automáticamente.
                                </p>
                            </div>

                            <div
                                {...bulkDropzone.getRootProps()}
                                className={`relative border-3 border-dashed rounded-xl p-8 mb-6 transition-all cursor-pointer group ${bulkDropzone.isDragActive
                                    ? 'border-[var(--brand-blue)] bg-sky-50'
                                    : 'border-slate-300 hover:border-[var(--brand-blue)] hover:bg-slate-50'
                                    }`}
                            >
                                <input {...bulkDropzone.getInputProps()} />
                                <div className="text-center">
                                    <div className="mx-auto w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <IconUpload size={32} className="text-slate-400 group-hover:text-blue-500" />
                                    </div>
                                    <p className="font-bold text-slate-700 mb-1">
                                        Arrastra aquí todas tus imágenes o haz clic para seleccionar
                                    </p>
                                    <p className="text-xs text-slate-400">Puedes seleccionar 10, 20 o más imágenes a la vez (Formatos: JPG, PNG, WEBP)</p>
                                </div>
                            </div>

                            {bulkImages.length > 0 && (
                                <div className="mt-8">
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                                        <h3 className="font-bold text-slate-800">
                                            {bulkImages.length} imágenes seleccionadas
                                        </h3>
                                        <button
                                            onClick={() => setBulkImages([])}
                                            disabled={bulkUploading}
                                            className="text-sm font-bold text-red-500 hover:text-red-600 disabled:opacity-50"
                                        >
                                            Limpiar todo
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                                        {bulkImages.map((img) => (
                                            <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                                                <div className="aspect-square relative">
                                                    <img src={img.preview} alt={img.title} className="w-full h-full object-cover" />
                                                    
                                                    {img.status === 'pending' && !bulkUploading && (
                                                        <button 
                                                            onClick={() => removeBulkImage(img.id)}
                                                            className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <IconX size={14} />
                                                        </button>
                                                    )}
                                                    {img.status === 'uploading' && (
                                                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                        </div>
                                                    )}
                                                    {img.status === 'success' && (
                                                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                                                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                                                <IconCheck size={20} />
                                                            </div>
                                                        </div>
                                                    )}
                                                    {img.status === 'error' && (
                                                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                                                            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                                                Error
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-2">
                                                    <input
                                                        type="text"
                                                        value={img.title}
                                                        onChange={(e) => updateBulkTitle(img.id, e.target.value)}
                                                        disabled={bulkUploading || img.status === 'success'}
                                                        className="w-full text-xs font-bold text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none px-1 py-0.5 transition-colors disabled:opacity-70 disabled:bg-transparent disabled:border-transparent truncate"
                                                        title={img.title}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-slate-100">
                                        <button
                                            onClick={handleBulkSubmit}
                                            disabled={bulkUploading || bulkImages.every(img => img.status === 'success')}
                                            className="py-3 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {bulkUploading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>Subiendo ({bulkImages.filter(i => i.status === 'success').length}/{bulkImages.length})...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <IconUpload size={20} />
                                                    <span>Subir {bulkImages.filter(i => i.status !== 'success').length} productos</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CatalogImportPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)]">
                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            }
        >
            <CatalogImportPageContent />
        </Suspense>
    );
}
