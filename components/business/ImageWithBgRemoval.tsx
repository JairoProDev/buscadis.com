'use client';

/**
 * ImageWithBgRemoval
 *
 * Shows an uploaded image with an overlay UI to:
 * - Remove background (transparent or white) — runs 100% client-side, FREE
 * - Restore original
 *
 * Works well in both light and dark mode.
 */

import { useState } from 'react';
import { useBackgroundRemoval, blobToFile, BgStyle } from '@/hooks/useBackgroundRemoval';
import { tokens } from '@buscadis/tokens';

interface ImageWithBgRemovalProps {
    /** Current data URL or http URL of the image */
    src: string;
    /** Original File object (needed to re-run removal) */
    originalFile: File | null;
    /** Called with the new File when background is removed or restored */
    onProcessed: (newFile: File, newPreview: string) => void;
    /** Called when user wants to restore original */
    onRestore: () => void;
    /** Whether background has already been removed */
    isBgRemoved?: boolean;
}

export default function ImageWithBgRemoval({
    src,
    originalFile,
    onProcessed,
    onRestore,
    isBgRemoved = false
}: ImageWithBgRemovalProps) {
    const { remove, isProcessing, progress, error } = useBackgroundRemoval();
    const [showOptions, setShowOptions] = useState(false);

    const handleRemove = async (style: BgStyle) => {
        if (!originalFile) return;
        setShowOptions(false);
        const result = await remove(originalFile, style);
        if (result) {
            const newFile = blobToFile(result.blob, originalFile.name);
            onProcessed(newFile, result.dataUrl);
        }
    };

    // Background pattern to visualize transparency
    const checkPattern = `repeating-conic-gradient(${tokens['--bs-color-neutral-300']} 0% 25%, ${tokens['--bs-color-neutral-25']} 0% 50%) 0 0/16px 16px`;

    return (
        <div className="relative group">
            {/* Image preview */}
            <div
                className="w-full aspect-square rounded-xl overflow-hidden border-2 flex items-center justify-center"
                style={{
                    borderColor: 'var(--border-color)',
                    background: isBgRemoved ? checkPattern : 'var(--bg-secondary)'
                }}
            >
                <img
                    src={src}
                    alt="Product preview"
                    className="w-full h-full object-contain"
                />
            </div>

            {/* Processing overlay */}
            {isProcessing && (
                <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-2"
                    style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                >
                    <div className="text-white text-sm font-bold">Quitando fondo...</div>
                    <div className="w-36 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-400 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="text-white/70 text-xs">{progress}%</div>
                    {progress < 30 && (
                        <div className="text-white/50 text-[10px] text-center px-4">
                            Descargando modelo IA (primera vez ~15s)
                        </div>
                    )}
                </div>
            )}

            {/* Hover action buttons */}
            {!isProcessing && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 rounded-xl flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100">
                    <div className="flex gap-1.5">
                        {!isBgRemoved ? (
                            <>
                                <button
                                    onClick={() => handleRemove('transparent')}
                                    title="Fondo transparente"
                                    className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 shadow-lg transition-all hover:scale-105"
                                    style={{ backgroundColor: 'rgba(88,28,220,0.9)' }}
                                >
                                    <span>✨</span> Quitar fondo
                                </button>
                                <button
                                    onClick={() => handleRemove('white')}
                                    title="Fondo blanco"
                                    className="px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-lg transition-all hover:scale-105"
                                    style={{
                                      backgroundColor: 'rgba(255,255,255,0.95)',
                                      color: tokens['--bs-color-neutral-800'],
                                    }}
                                >
                                    ⬜ Fondo blanco
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onRestore}
                                className="px-2 py-1.5 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 shadow-lg hover:scale-105 transition-all"
                                style={{ backgroundColor: 'rgba(71,85,105,0.9)' }}
                            >
                                ↩ Restaurar original
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Badge showing bg is removed */}
            {isBgRemoved && !isProcessing && (
                <span className="absolute top-1.5 left-1.5 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
                    sin fondo
                </span>
            )}

            {/* Error */}
            {error && (
                <div className="mt-1 text-red-500 text-[10px]">
                    {error}
                </div>
            )}
        </div>
    );
}
