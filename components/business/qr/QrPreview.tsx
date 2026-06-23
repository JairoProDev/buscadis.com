'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface QrPreviewProps {
  slug: string;
  businessName: string;
  format?: 'png' | 'svg';
  tier?: 'free' | 'pro';
  className?: string;
  size?: number;
  /** Cambia al abrir el modal para evitar imagen cacheada en el navegador */
  refreshToken?: number;
}

export default function QrPreview({
  slug,
  businessName,
  format = 'png',
  tier = 'free',
  className,
  size = 200,
  refreshToken = 0,
}: QrPreviewProps) {
  const encoded = encodeURIComponent(slug);
  const [cacheKey, setCacheKey] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    setCacheKey(null);
    void (async () => {
      try {
        const res = await fetch(`/api/business/${encoded}/qr-style`);
        if (!res.ok) {
          setCacheKey(`fallback-${refreshToken}`);
          return;
        }
        const data = await res.json();
        const key =
          data.qr?.asset_hash ||
          data.qr?.updated_at ||
          data.qr?.short_code ||
          String(refreshToken);
        setCacheKey(key);
      } catch {
        setCacheKey(`fallback-${refreshToken}`);
      }
    })();
  }, [encoded, slug, refreshToken]);

  const src =
    cacheKey != null
      ? `/api/business/${encoded}/qr?format=${format}&tier=${tier}&refresh=1&v=${encodeURIComponent(cacheKey)}&t=${refreshToken}`
      : undefined;

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm min-h-[200px] flex items-center justify-center',
        className
      )}
    >
      {!src && !error && (
        <div className="w-full h-[200px] animate-pulse bg-slate-100 rounded-xl" />
      )}
      {error && (
        <p className="text-sm text-red-500 text-center px-4">
          No se pudo cargar el QR. Intenta de nuevo en un momento.
        </p>
      )}
      {src && !error && (
        <img
          key={src}
          src={src}
          alt={`QR de ${businessName}`}
          width={size}
          height={size}
          className="mx-auto rounded-xl"
          style={{ width: size, height: size }}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
