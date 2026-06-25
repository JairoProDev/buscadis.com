'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { IconDownload, IconQrcode, IconShareAlt, IconX } from '@/components/Icons';
import { getBusinessCanonicalUrl } from '@/lib/business/public-utils';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import QrPreview from './QrPreview';

const QrStudio = dynamic(() => import('./QrStudio'), { ssr: false });

interface QrProfileModalProps {
  open: boolean;
  onClose: () => void;
  slug: string;
  businessName: string;
  isOwner: boolean;
  isPro?: boolean;
  themeColor?: string;
}

export default function QrProfileModal({
  open,
  onClose,
  slug,
  businessName,
  isOwner,
  isPro = false,
  themeColor,
}: QrProfileModalProps) {
  const { user } = useAuth();
  const { openAuthModal } = useUI();
  const [scanUrl, setScanUrl] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const isLoggedIn = Boolean(user?.id);

  useEffect(() => {
    if (!open) return;
    setRefreshToken(Date.now());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const res = await fetch(`/api/business/${encodeURIComponent(slug)}/qr-style`);
        if (res.ok) {
          const data = await res.json();
          if (data.shortUrl) setScanUrl(data.shortUrl);
        }
      } catch {
        /* */
      }
    })();
  }, [open, slug]);

  const encoded = encodeURIComponent(slug);
  const qrPngUrl = `/api/business/${encoded}/qr?format=png&refresh=1&t=${refreshToken}`;
  const qrPrintUrl = `/api/business/${encoded}/qr?format=png&width=1024&refresh=1&t=${refreshToken}`;
  const packagingKitUrl = `/api/business/${encoded}/qr-kit?template=sticker&format=svg`;
  const profileUrl = getBusinessCanonicalUrl(slug);

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(scanUrl || profileUrl);
  }, [scanUrl, profileUrl]);

  const handlePrint = useCallback(() => {
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html>
      <html><head><title>QR — ${businessName}</title></head>
      <body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif">
        <img src="${qrPrintUrl}" alt="QR" style="width:min(80vw,400px);height:min(80vw,400px)" />
        <p style="margin-top:24px;font-size:18px;font-weight:bold">${businessName}</p>
        <p style="color:#64748b;font-size:14px">Escanea para ver nuestro perfil en Buscadis</p>
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.onload = () => w.print();
    setTimeout(() => w.print(), 500);
  }, [qrPrintUrl, businessName]);

  const handleShare = useCallback(async () => {
    const shareUrl = scanUrl || profileUrl;
    if (navigator.share) {
      try {
        await navigator.share({
          title: businessName,
          text: `Perfil de ${businessName} en Buscadis`,
          url: shareUrl,
        });
        return;
      } catch {
        /* cancelled */
      }
    }
    await copyLink();
    alert('Enlace copiado');
  }, [businessName, scanUrl, profileUrl, copyLink]);

  const handleUpgrade = useCallback(async () => {
    try {
      const res = await fetch('/api/business/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (data.initPoint) window.location.href = data.initPoint;
    } catch {
      /* */
    }
  }, [slug]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto overscroll-contain bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm rounded-t-3xl sm:rounded-t-3xl">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <IconQrcode size={18} />
            </div>
            <div className="min-w-0">
              <h2 id="qr-modal-title" className="font-bold text-slate-900 text-sm truncate">
                {isOwner ? 'Tu código QR' : 'Código QR'}
              </h2>
              <p className="text-[11px] text-slate-500 truncate">{businessName}</p>
            </div>
            {isOwner && isPro && (
              <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                Pro
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
            aria-label="Cerrar"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className={isOwner ? 'px-5 pb-5 pt-2' : 'p-5'}>
          {isOwner ? (
            <QrStudio
              slug={slug}
              businessName={businessName}
              isPro={isPro}
              themeColor={themeColor}
              compact
              onUpgrade={handleUpgrade}
              refreshToken={refreshToken}
            />
          ) : (
            <div className="flex flex-col items-center gap-5">
              <p className="text-sm text-slate-600 text-center max-w-xs">
                Escanea con la cámara de tu celular para ver el catálogo, ofertas y contacto de{' '}
                <span className="font-bold text-slate-800">{businessName}</span>.
              </p>
              <QrPreview
                slug={slug}
                businessName={businessName}
                tier={isPro ? 'pro' : 'free'}
                size={220}
                refreshToken={refreshToken}
              />
              <div className="w-full grid grid-cols-2 gap-2">
                <a
                  href={qrPngUrl}
                  download={`qr-${slug}.png`}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
                >
                  <IconDownload size={16} /> PNG
                </a>
                <a
                  href={qrPrintUrl}
                  download={`qr-${slug}-print.png`}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 transition-colors"
                >
                  <IconDownload size={16} /> Impresión
                </a>
                <a
                  href={packagingKitUrl}
                  download={`etiqueta-${slug}.svg`}
                  className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
                >
                  <IconDownload size={16} /> Etiqueta para empaque (SVG)
                </a>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-slate-800 text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Imprimir
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  <IconShareAlt size={16} /> Compartir
                </button>
              </div>
              {scanUrl && (
                <p className="text-[11px] text-slate-500 text-center">
                  Al escanear abre:{' '}
                  <span className="font-mono text-slate-700 break-all">{scanUrl}</span>
                </p>
              )}
              {!isLoggedIn ? (
                <p className="text-[11px] text-slate-400 text-center">
                  ¿Eres el dueño?{' '}
                  <button
                    type="button"
                    onClick={openAuthModal}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Inicia sesión
                  </button>{' '}
                  para personalizar colores, plantillas y analítica Pro.
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 text-center">
                  Para personalizar este QR, entra con la cuenta del negocio.{' '}
                  <Link href="/mi-negocio" className="text-blue-600 font-semibold hover:underline">
                    Ir a Mi negocio
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
