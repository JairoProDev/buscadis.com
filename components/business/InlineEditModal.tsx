/**
 * Mini Modal Inline para Editar Campos
 * Se muestra directamente en la interfaz para edición rápida
 */

'use client';

import { useState, useEffect } from 'react';
import { IconCheck, IconX, IconCamera } from '@/components/Icons';

interface InlineEditModalProps {
    title: string;
    value: string;
    type?: 'text' | 'textarea' | 'image' | 'color';
    placeholder?: string;
    onSave: (newValue: string) => void;
    onCancel: () => void;
}

export default function InlineEditModal({
    title,
    value,
    type = 'text',
    placeholder = '',
    onSave,
    onCancel
}: InlineEditModalProps) {
    const [editValue, setEditValue] = useState(value || '');

    useEffect(() => {
        setEditValue(value || '');
    }, [value]);

    const handleSave = () => {
        onSave(editValue);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            onSave(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const colors = ['#53ACC5', '#FFC24A', '#0F766E', '#C2410C', '#BE123C', '#7E22CE', '#4F46E5', '#A21CAF'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in slide-in-from-bottom duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                    {title}
                </h3>

                {type === 'text' && (
                    <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors mb-4"
                        style={{ borderColor: 'var(--border-color)' }}
                        autoFocus
                    />
                )}

                {type === 'textarea' && (
                    <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder={placeholder}
                        rows={4}
                        className="w-full px-4 py-3 border-2 rounded-xl outline-none focus:border-[var(--brand-blue)] transition-colors resize-none mb-4"
                        style={{ borderColor: 'var(--border-color)' }}
                        autoFocus
                    />
                )}

                {type === 'image' && (
                    <div className="mb-4">
                        <button
                            onClick={() => document.getElementById('inline-image-upload')?.click()}
                            className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 border-2 border-dashed hover:border-[var(--brand-blue)] transition-colors"
                            style={{ borderColor: 'var(--border-color)' }}
                        >
                            <IconCamera size={20} color="var(--brand-blue)" />
                            Seleccionar Imagen
                        </button>
                        <input
                            id="inline-image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        {editValue && (
                            <img
                                src={editValue}
                                alt="Preview"
                                className="mt-3 w-full h-32 object-cover rounded-lg"
                            />
                        )}
                    </div>
                )}

                {type === 'color' && (
                    <div className="grid grid-cols-4 gap-3 mb-4">
                        {colors.map((color) => (
                            <button
                                key={color}
                                onClick={() => setEditValue(color)}
                                className={`
                                    w-full aspect-square rounded-xl transition-all hover:scale-110
                                    ${editValue === color ? 'ring-4 ring-offset-2' : ''}
                                `}
                                style={{
                                    backgroundColor: color
                                }}
                            />
                        ))}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                        style={{ backgroundColor: 'var(--brand-blue)' }}
                    >
                        <IconCheck size={18} />
                        Guardar
                    </button>
                    <button
                        onClick={onCancel}
                        className="px-4 py-3 rounded-xl font-medium hover:bg-slate-100 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <IconX size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
