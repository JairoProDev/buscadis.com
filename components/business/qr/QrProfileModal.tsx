'use client';

import { useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { IconDownload, IconQrcode, IconShareAlt, IconX } from '@/components/Icons';
import { getBusinessCanonicalUrl } from '@/lib/business/public-utils';
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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const encoded = encodeURIComponent(slug);
  const qrPngUrl = `/api/business/${encoded}/qr?format=png`;
  const profileUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/p/${slug}`
      : getBusinessCanonicalUrl(slug);

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(profileUrl);
  }, [profileUrl]);

  const handlePrint = useCallback(() => {
    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html>
      <html><head><title>QR — ${businessName}</title></head>
      <body style="margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif">
        <img src="${qrPngUrl}" alt="QR" style="width:min(80vw,400px);height:min(80vw,400px)" />
        <p style="margin-top:24px;font-size:18px;font-weight:bold">${businessName}</p>
        <p style="color:#64748b;font-size:14px">Escanea para ver nuestro perfil en Buscadis</p>
      </body></html>
    `);
    w.document.close();
    w.focus();
    w.onload = () => w.print();
    setTimeout(() => w.print(), 500);
  }, [qrPngUrl, businessName]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: businessName,
          text: `Perfil de ${businessName} en Buscadis`,
          url: profileUrl,
        });
        return;
      } catch {
        /* cancelled */
      }
    }
    await copyLink();
    alert('Enlace copiado');
  }, [businessName, profileUrl, copyLink]);

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
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm rounded-t-3xl sm:rounded-t-3xl">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <IconQrcode size={18} />
            </div>
            <div>
              <h2 id="qr-modal-title" className="font-bold text-slate-900 text-sm">
                {isOwner ? 'Tu código QR' : 'Código QR'}
              </h2>
              <p className="text-[11px] text-slate-500">{businessName}</p>
            </div>
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

        <div className="p-5">
          {isOwner ? (
            <QrStudio
              slug={slug}
              businessName={businessName}
              isPro={isPro}
              themeColor={themeColor}
              compact
              onUpgrade={handleUpgrade}
            />
          ) : (
            <div className="flex flex-col items-center gap-5">
              <p className="text-sm text-slate-600 text-center max-w-xs">
                Escanea con la cámara de tu celular para ver el catálogo, ofertas y contacto de{' '}
                <span className="font-bold text-slate-800">{businessName}</span>.
              </p>
              <QrPreview slug={slug} businessName={businessName} tier={isPro ? 'pro' : 'free'} size={220} />
              <div className="w-full grid grid-cols-2 gap-2">
                <a
                  href={qrPngUrl}
                  download={`qr-${slug}.png`}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors"
                >
                  <IconDownload size={16} /> Descargar
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
                  className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  <IconShareAlt size={16} /> Compartir enlace
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-full">{profileUrl}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
