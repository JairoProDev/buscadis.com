/**
 * Componente Simplificado para Agregar Productos
 * UN SOLO FLUJO: Chatbot pregunta cómo quiere agregarlo
 */

'use client';

import { useState, useRef } from 'react';
import { IconCamera, IconCheck, IconX, IconImage, IconUpload, IconSparkles } from '@/components/Icons';
import { supabase } from '@/lib/supabase';
import { uploadProductImage } from '@/lib/business';
import { Adiso } from '@/types';
import { findPotentialDuplicate, validatePrice } from '@/lib/business-validation';

type AddMethod = null | 'quick' | 'complete' | 'file';

interface SimpleCatalogAddProps {
    businessProfileId: string;
    onSuccess?: () => void;
    onClose: () => void;
    adisos?: Adiso[]; // Existing products for duplicate check
}

export default function SimpleCatalogAdd({ businessProfileId, onSuccess, onClose, adisos = [] }: SimpleCatalogAddProps) {
    const [method, setMethod] = useState<AddMethod>(null);
    const [loading, setLoading] = useState(false);
    const [magicLoading, setMagicLoading] = useState(false);

    // Quick: foto + nombre
    const [quickImage, setQuickImage] = useState<File | null>(null);
    const [quickImagePreview, setQuickImagePreview] = useState<string | null>(null);
    const [quickName, setQuickName] = useState('');

    // Complete: todos los campos
    const [form, setForm] = useState({
        title: '',
        description: '',
        price: '',
        image: null as File | null,
        imagePreview: null as string | null
    });

    // File
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);

    const quickFileRef = useRef<HTMLInputElement>(null);
    const completeFileRef = useRef<HTMLInputElement>(null);
    const excelFileRef = useRef<HTMLInputElement>(null);
    const magicFileRef = useRef<HTMLInputElement>(null);

    // Dirty state tracking (to prevent accidental closing)
    const isDirty = quickName.trim() !== '' || form.title.trim() !== '' || quickImage !== null || form.image !== null;

    const handleClose = () => {
        if (isDirty) {
            if (confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const handleQuickImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setQuickImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setQuickImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleCompleteImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setForm(prev => ({ ...prev, image: file }));
        const reader = new FileReader();
        reader.onloadend = () => setForm(prev => ({ ...prev, imagePreview: reader.result as string }));
        reader.readAsDataURL(file);
    };

    const handleQuickSubmit = async () => {
        if (!quickName.trim()) {
            alert('El nombre es obligatorio');
            return;
        }

        // 1. Accidente: Duplicados
        const potentialDuplicate = findPotentialDuplicate(quickName, adisos);
        if (potentialDuplicate) {
            if (!confirm(`⚠️ Ya tienes un producto llamado "${potentialDuplicate.titulo}". ¿Estás seguro de que quieres agregar otro igual?`)) {
                return;
            }
        }

        // 2. Accidente: Sin imagen
        if (!quickImage) {
            if (!confirm('📸 No has subido una foto. ¿Quieres publicar el producto sin imagen o prefieres subir una ahora?')) {
                quickFileRef.current?.click();
                return;
            }
        }

        try {
            setLoading(true);

            let imageUrl = '';
            if (quickImage) {
                // Get current user
                if (!supabase) throw new Error('Supabase no está configurado');
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Usuario no autenticado');

                // Use the proper upload function
                const url = await uploadProductImage(quickImage, user.id);
                if (!url) {
                    throw new Error('Error al subir la imagen');
                }
                imageUrl = url;
            }

            if (!supabase) throw new Error('Supabase no está configurado');
            const { error } = await supabase
                .from('catalog_products')
                .insert({
                    business_profile_id: businessProfileId,
                    title: quickName,
                    status: 'published',
                    images: imageUrl ? [{ url: imageUrl, alt: quickName }] : [],
                    import_source: 'manual_quick'
                });

            if (error) throw error;

            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error('Error creating product:', err);
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteSubmit = async () => {
        if (!form.title.trim()) {
            alert('El nombre es obligatorio');
            return;
        }

        // 1. Accidente: Duplicados
        const potentialDuplicate = findPotentialDuplicate(form.title, adisos);
        if (potentialDuplicate) {
            if (!confirm(`⚠️ Ya tienes un producto llamado "${potentialDuplicate.titulo}". ¿Estás seguro de que quieres agregar otro igual?`)) {
                return;
            }
        }

        // 2. Accidente: Precio extraño
        if (form.price) {
            const priceValidation = validatePrice(form.price);
            if (!priceValidation.isValid) {
                alert(priceValidation.warning);
                return;
            }
            if (priceValidation.warning) {
                if (!confirm(`💰 ${priceValidation.warning}`)) {
                    return;
                }
            }
        }

        // 3. Accidente: Sin imagen
        if (!form.image) {
            if (!confirm('📸 No has subido una foto. ¿Quieres publicar el producto sin imagen o prefieres subir una ahora?')) {
                completeFileRef.current?.click();
                return;
            }
        }

        try {
            setLoading(true);

            let imageUrl = '';
            if (form.image) {
                // Get current user
                if (!supabase) throw new Error('Supabase no está configurado');
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Usuario no autenticado');

                // Use the proper upload function
                const url = await uploadProductImage(form.image, user.id);
                if (!url) {
                    throw new Error('Error al subir la imagen');
                }
                imageUrl = url;
            }

            if (!supabase) throw new Error('Supabase no está configurado');
            const { error } = await supabase
                .from('catalog_products')
                .insert({
                    business_profile_id: businessProfileId,
                    title: form.title,
                    description: form.description || null,
                    price: form.price ? parseFloat(form.price) : null,
                    status: 'published',
                    images: imageUrl ? [{ url: imageUrl, alt: form.title }] : [],
                    import_source: 'manual_complete'
                });

            if (error) throw error;

            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error('Error creating product:', err);
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSubmit = async () => {
        if (!excelFile) {
            alert('Selecciona un archivo');
            return;
        }

        try {
            setProcessing(true);

            const formData = new FormData();
            formData.append('file', excelFile);
            formData.append('business_id', businessProfileId);

            if (!supabase) throw new Error('Supabase no está configurado');
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.access_token) {
                alert('Sesión expirada');
                return;
            }

            const response = await fetch('/api/catalog/import/excel', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.session.access_token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Error al procesar archivo');

            const result = await response.json();

            if (result.success) {
                const { stats } = result;
                let message = `Proceso completado.\n`;
                if (stats?.productsToCreate > 0) message += `✅ ${stats.productsToCreate} productos creados.\n`;
                if (stats?.duplicatesFound > 0) message += `⚠️ ${stats.duplicatesFound} duplicados encontrados (requieren revisión).\n`;
                if (stats?.errors > 0) message += `❌ ${stats.errors} errores en filas.\n`;

                alert(message);
                onSuccess?.();
                onClose();
            } else {
                alert(result.error || 'Error al procesar');
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setProcessing(false);
            setExcelFile(null); // Reset file input
        }
    };

    const handleExcelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setExcelFile(file);
    };

    const handleMagicImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setMagicLoading(true);
            setMethod('complete'); // Switch to complete view to show progress/results immediately

            // 1. Show preview immediately
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm(prev => ({ ...prev, image: file, imagePreview: reader.result as string }));
            };
            reader.readAsDataURL(file);

            // 2. Upload to Supabase to get URL
            if (!supabase) throw new Error('Supabase no configurado');
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario no autenticado');

            // Get session for API authorization
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const imageUrl = await uploadProductImage(file, user.id);
            if (!imageUrl) throw new Error('Error al subir imagen');

            // 3. Analyze with AI
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch('/api/analyze-product', {
                method: 'POST',
                headers,
                body: JSON.stringify({ imageUrl })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('AI Analysis failed:', response.status, errorData);
                alert(`Error al analizar imagen: ${errorData.error || 'Error desconocido'}`);
                return;
            }

            const { data } = await response.json();

            if (data) {
                // 4. Fill form
                setForm(prev => ({
                    ...prev,
                    image: file,
                    title: data.title || '',
                    description: data.description || '',
                    price: data.price ? String(data.price) : '',
                    // You might save category elsewhere if your form supports it
                }));
            }

        } catch (error: any) {
            console.error('Magic scan error:', error);
            alert('No pudimos analizar la imagen, pero puedes llenar los datos manualmente.');
        } finally {
            setMagicLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Selección de Método */}
            {method === null && (
                <>
                    <div className="text-center mb-4">
                        <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                            ¿Cómo quieres agregarlo?
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Elige la forma más cómoda para ti
                        </p>
                    </div>

                    <div className="space-y-3">
                        {/* Magic Scan Button */}
                        <button
                            onClick={() => magicFileRef.current?.click()}
                            className="w-full p-4 rounded-xl border-2 text-left hover:shadow-lg transition-all relative overflow-hidden group"
                            style={{
                                borderColor: 'transparent',
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                color: 'white'
                            }}
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/20 backdrop-blur-sm">
                                    <IconSparkles size={24} color="white" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-white flex items-center gap-2">
                                        ✨ Escaneo Mágico IA
                                        <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Nuevo</span>
                                    </div>
                                    <div className="text-sm text-white/90">Sube la foto y nosotros llenamos todo</div>
                                </div>
                            </div>
                            <input
                                ref={magicFileRef}
                                type="file"
                                accept="image/*"
                                onChange={handleMagicImageSelect}
                                className="hidden"
                            />
                        </button>
                        <button
                            onClick={() => setMethod('quick')}
                            className="w-full p-4 rounded-xl border-2 text-left hover:shadow-md transition-all group"
                            style={{ borderColor: 'var(--brand-blue)', backgroundColor: '#ecf8fb' }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--brand-blue)' }}>
                                    <IconCamera size={24} color="white" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold" style={{ color: 'var(--text-primary)' }}>📸 Foto Rápida</div>
                                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Solo toma una foto y el nombre. Listo.</div>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setMethod('complete')}
                            className="w-full p-4 rounded-xl border-2 text-left hover:shadow-md transition-all"
                            style={{ borderColor: 'var(--brand-yellow)', backgroundColor: '#fffbf0' }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--brand-yellow)' }}>
                                    <IconImage size={24} color="white" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold" style={{ color: 'var(--text-primary)' }}>📝 Con toda la info</div>
                                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Precio, descripción y más detalles</div>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => setMethod('file')}
                            className="w-full p-4 rounded-xl border-2 text-left hover:shadow-md transition-all"
                            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                                    <IconUpload size={24} color="var(--text-primary)" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold" style={{ color: 'var(--text-primary)' }}>📊 Subir archivo</div>
                                    <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Excel o CSV con muchos productos</div>
                                </div>
                            </div>
                        </button>

                        <a
                            href={`/mi-negocio/catalogo/importar?business=${businessProfileId}&mode=bulk_images`}
                            className="w-full p-4 rounded-xl border-2 text-left hover:shadow-md transition-all block"
                            style={{ borderColor: 'var(--brand-blue)', backgroundColor: 'white' }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
                                    <IconImage size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-blue-700">🖼️ Múltiples Imágenes</div>
                                    <div className="text-sm text-slate-500">Arrastra 10, 20 o más imágenes a la vez</div>
                                </div>
                            </div>
                        </a>
                    </div>

                    <button
                        onClick={handleClose}
                        className="w-full py-3 rounded-xl font-medium hover:bg-slate-100 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        Cancelar
                    </button>
                </>
            )}

            {/* Modo Rápido */}
            {method === 'quick' && (
                <div className="space-y-4">
                    <button
                        onClick={() => setMethod(null)}
                        className="text-sm font-medium"
                        style={{ color: 'var(--brand-blue)' }}
                    >
                        ← Cambiar método
                    </button>

                    <div
                        onClick={() => quickFileRef.current?.click()}
                        className="relative aspect-video bg-slate-50 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-[var(--brand-blue)] transition-all overflow-hidden"
                        style={{ borderColor: quickImagePreview ? 'var(--brand-blue)' : 'var(--border-color)' }}
                    >
                        {quickImagePreview ? (
                            <img src={quickImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center">
                                <IconCamera size={48} color="var(--text-tertiary)" />
                                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    Tomar foto o subir imagen
                                </p>
                            </div>
                        )}
                        <input
                            ref={quickFileRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleQuickImageSelect}
                            className="hidden"
                        />
                    </div>

                    <input
                        type="text"
                        placeholder="Nombre del producto *"
                        value={quickName}
                        onChange={(e) => setQuickName(e.target.value)}
                        className="w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                        style={{ borderColor: 'var(--border-color)' }}
                    />

                    <button
                        onClick={handleQuickSubmit}
                        disabled={loading || !quickName.trim()}
                        className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ backgroundColor: 'var(--brand-blue)' }}
                    >
                        <IconCheck size={20} />
                        {loading ? 'Guardando...' : 'Publicar Producto'}
                    </button>
                </div>
            )}

            {/* Modo Completo */}
            {method === 'complete' && (
                <div className="space-y-4">
                    <button
                        onClick={() => setMethod(null)}
                        className="text-sm font-medium"
                        style={{ color: 'var(--brand-blue)' }}
                    >
                        ← Cambiar método
                    </button>

                    {magicLoading && (
                        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3 animate-pulse mb-4">
                            <IconSparkles className="text-indigo-600 animate-spin" />
                            <div className="text-indigo-800 text-sm font-medium">Analizando imagen con IA...</div>
                        </div>
                    )}

                    <div
                        onClick={() => completeFileRef.current?.click()}
                        className="relative aspect-video bg-slate-50 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-[var(--brand-blue)] transition-all overflow-hidden"
                        style={{ borderColor: form.imagePreview ? 'var(--brand-blue)' : 'var(--border-color)' }}
                    >
                        {form.imagePreview ? (
                            <img src={form.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-center">
                                <IconImage size={48} color="var(--text-tertiary)" />
                                <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Subir imagen</p>
                            </div>
                        )}
                        <input
                            ref={completeFileRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCompleteImageSelect}
                            className="hidden"
                        />
                    </div>

                    <input
                        type="text"
                        placeholder="Nombre del producto *"
                        value={form.title}
                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                        style={{ borderColor: 'var(--border-color)' }}
                    />

                    <textarea
                        placeholder="Descripción (opcional)"
                        value={form.description}
                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors resize-none"
                        style={{ borderColor: 'var(--border-color)' }}
                    />

                    <input
                        type="text"
                        placeholder="Precio (opcional)"
                        value={form.price}
                        onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors"
                        style={{ borderColor: 'var(--border-color)' }}
                    />

                    <button
                        onClick={handleCompleteSubmit}
                        disabled={loading || !form.title.trim()}
                        className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ backgroundColor: 'var(--brand-blue)' }}
                    >
                        <IconCheck size={20} />
                        {loading ? 'Guardando...' : 'Publicar Producto'}
                    </button>
                </div>
            )}

            {/* Modo Archivo */}
            {method === 'file' && (
                <div className="space-y-4">
                    <button
                        onClick={() => setMethod(null)}
                        className="text-sm font-medium"
                        style={{ color: 'var(--brand-blue)' }}
                    >
                        ← Cambiar método
                    </button>

                    <div
                        onClick={() => excelFileRef.current?.click()}
                        className="bg-slate-50 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-[var(--brand-blue)] transition-all"
                        style={{ borderColor: excelFile ? 'var(--brand-blue)' : 'var(--border-color)' }}
                    >
                        {excelFile ? (
                            <div>
                                <IconCheck size={48} color="var(--brand-blue)" className="mx-auto mb-3" />
                                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{excelFile.name}</p>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    {(excelFile.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        ) : (
                            <div>
                                <IconUpload size={48} color="var(--text-tertiary)" className="mx-auto mb-3" />
                                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                    Subir Excel o CSV
                                </p>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    Supports .xlsx, .xls, .csv
                                </p>
                            </div>
                        )}
                        <input
                            ref={excelFileRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleExcelFileSelect}
                            className="hidden"
                        />
                    </div>

                    <button
                        onClick={handleFileSubmit}
                        disabled={processing || !excelFile}
                        className="w-full py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ backgroundColor: 'var(--brand-blue)' }}
                    >
                        <IconUpload size={20} />
                        {processing ? 'Procesando...' : 'Procesar Archivo'}
                    </button>
                </div>
            )}
        </div>
    );
}
