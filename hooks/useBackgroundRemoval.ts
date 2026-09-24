'use client';

import { useState, useCallback } from 'react';
import { QR_DEFAULTS } from '@/lib/qr/kit-colors';

export type BgStyle = 'transparent' | 'white';

interface UseBackgroundRemovalReturn {
    remove: (file: File, bgStyle?: BgStyle) => Promise<{ dataUrl: string; blob: Blob } | null>;
    isProcessing: boolean;
    progress: number;
    error: string | null;
}

export function useBackgroundRemoval(): UseBackgroundRemovalReturn {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const remove = useCallback(async (file: File, bgStyle: BgStyle = 'transparent') => {
        setIsProcessing(true);
        setProgress(0);
        setError(null);

        try {
            // Dynamic import to avoid SSR issues and only load when needed
            const { removeBackground } = await import('@imgly/background-removal');

            setProgress(20);

            const result = await removeBackground(file, {
                progress: (key, current, total) => {
                    // key = 'fetch:model', 'fetch:model:chunk', 'compute:inference', etc.
                    const pct = Math.round((current / total) * 80) + 20;
                    setProgress(Math.min(pct, 98));
                },
            });
            // result is a Blob with transparent PNG
            setProgress(98);

            let finalBlob: Blob = result;

            if (bgStyle === 'white') {
                // Composite on white background using Canvas
                finalBlob = await compositeOnWhite(result);
            }

            // Convert to data URL for preview
            const dataUrl = await blobToDataUrl(finalBlob);
            setProgress(100);

            return { dataUrl, blob: finalBlob };
        } catch (err: any) {
            console.error('Background removal error:', err);
            setError('Error al quitar el fondo: ' + (err.message || 'Error desconocido'));
            return null;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    return { remove, isProcessing, progress, error };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function compositeOnWhite(transparentPng: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(transparentPng);

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('No canvas context')); return; }

            // White background
            ctx.fillStyle = QR_DEFAULTS.bg;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw product on top
            ctx.drawImage(img, 0, 0);

            URL.revokeObjectURL(url);
            canvas.toBlob(blob => {
                if (blob) resolve(blob);
                else reject(new Error('Canvas to blob failed'));
            }, 'image/png', 1);
        };

        img.onerror = reject;
        img.src = url;
    });
}

/** Convert a Blob to a File (for uploading through existing uploadProductImage) */
export function blobToFile(blob: Blob, originalName: string): File {
    const name = originalName.replace(/\.[^/.]+$/, '') + '-nobg.png';
    return new File([blob], name, { type: 'image/png' });
}
