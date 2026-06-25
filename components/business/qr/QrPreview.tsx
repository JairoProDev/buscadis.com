'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { QrQaStatus, QrRenderMode, QrStyleConfig } from '@/lib/qr/types';
import { buildPreviewQuery, previewStyleFingerprint } from '@/lib/qr/preview-params';

interface QrPreviewProps {
  slug: string;
  businessName: string;
  format?: 'png' | 'svg';
  tier?: 'free' | 'pro';
  className?: string;
  size?: number;
  /** Estilo en vivo desde QrStudio (preview sin guardar) */
  styleConfig?: QrStyleConfig | null;
  livePreview?: boolean;
  refreshToken?: number;
  qaStatus?: QrQaStatus | null;
  renderMode?: QrRenderMode | null;
}

const MODE_LABELS: Record<QrRenderMode, string> = {
  visual: 'Logo integrado',
  branded: 'Con logo',
  classic: 'Básico',
};

export default function QrPreview({
  slug,
  businessName,
  format = 'png',
  tier = 'free',
  className,
  size = 200,
  styleConfig,
  livePreview = false,
  refreshToken = 0,
  qaStatus,
  renderMode,
}: QrPreviewProps) {
  const encoded = encodeURIComponent(slug);
  const [error, setError] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [scanMsg, setScanMsg] = useState<string | null>(null);

  const displayMode = styleConfig?.renderMode || renderMode || 'branded';

  const src = useMemo(() => {
    if (livePreview && styleConfig) {
      const q = buildPreviewQuery({ ...styleConfig, renderMode: displayMode });
      const fp = previewStyleFingerprint(styleConfig);
      return `/api/business/${encoded}/qr?${q}&tier=${tier}&t=${refreshToken}&fp=${encodeURIComponent(fp)}`;
    }
    return `/api/business/${encoded}/qr?format=${format}&tier=${tier}&refresh=1&t=${refreshToken}`;
  }, [encoded, tier, format, livePreview, styleConfig, displayMode, refreshToken]);

  const tryScan = async () => {
    setScanMsg(null);
    if ('BarcodeDetector' in window) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setScanMsg('Apunta la cámara al QR en pantalla unos segundos…');
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();
        const detector = new (window as unknown as {
          BarcodeDetector: new (o: { formats: string[] }) => {
            detect: (s: ImageBitmapSource) => Promise<{ rawValue: string }[]>;
          };
        }).BarcodeDetector({ formats: ['qr_code'] });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let found = false;
        for (let i = 0; i < 30 && !found; i++) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx?.drawImage(video, 0, 0);
          const codes = await detector.detect(canvas);
          if (codes.length > 0) {
            found = true;
            setScanMsg(`✓ Escaneo OK: ${codes[0].rawValue.slice(0, 60)}…`);
          }
          await new Promise((r) => setTimeout(r, 200));
        }
        stream.getTracks().forEach((t) => t.stop());
        if (!found) setScanMsg('No detectado. Acerca más el teléfono o sube el brillo.');
      } catch {
        setScanMsg('Permite acceso a la cámara o escanea con la app de Cámara del teléfono.');
      }
      return;
    }
    setScanMsg('Abre la app Cámara de tu teléfono y apunta al QR en pantalla.');
  };

  const showImage = loadedSrc === src || loadedSrc === null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap gap-2 justify-center">
        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
          {MODE_LABELS[displayMode]}
        </span>
        {qaStatus === 'degraded' && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            Modo seguro
          </span>
        )}
        {livePreview && (
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            Vista previa
          </span>
        )}
      </div>
      <div
        className={cn(
          'relative rounded-2xl border border-slate-200 p-4 shadow-sm min-h-[200px] flex items-center justify-center',
          styleConfig?.transparentBackground
            ? 'bg-[length:12px_12px] bg-[position:0_0,6px_6px] bg-white'
            : 'bg-white'
        )}
        style={
          styleConfig?.transparentBackground
            ? {
                backgroundImage:
                  'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
              }
            : undefined
        }
      >
        {!showImage && !error && (
          <div className="absolute inset-4 animate-pulse bg-slate-100 rounded-xl" />
        )}
        {error && (
          <p className="text-sm text-red-500 text-center px-4">
            No se pudo cargar el QR. Intenta de nuevo en un momento.
          </p>
        )}
        <img
          src={src}
          alt={`QR de ${businessName}`}
          width={size}
          height={size}
          className={cn(
            'mx-auto rounded-xl transition-opacity duration-150',
            showImage ? 'opacity-100' : 'opacity-0'
          )}
          style={{ width: size, height: size }}
          onLoad={() => {
            setLoadedSrc(src);
            setError(false);
          }}
          onError={() => setError(true)}
        />
      </div>
      <button
        type="button"
        onClick={tryScan}
        className="w-full text-xs font-bold text-blue-600 hover:text-blue-800 py-1"
      >
        Probar escaneo
      </button>
      {scanMsg && <p className="text-[11px] text-slate-500 text-center">{scanMsg}</p>}
      {qaStatus === 'degraded' && !livePreview && (
        <p className="text-[11px] text-amber-700 text-center">
          Versión optimizada para escaneo confiable.
        </p>
      )}
    </div>
  );
}
