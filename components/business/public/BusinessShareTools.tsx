'use client';

import { getBusinessProfilePath } from '@/lib/seo/business-metadata';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { IconDownload, IconShareAlt } from '@/components/Icons';
import { getBusinessCanonicalUrl } from '@/lib/business/public-utils';

const QrStudio = dynamic(() => import('@/components/business/qr/QrStudio'), { ssr: false });

interface BusinessShareToolsProps {
  slug: string;
  businessName: string;
  onShare: () => void;
  isPro?: boolean;
  themeColor?: string;
  /** Sidebar editor: sin padding de página completa */
  embedded?: boolean;
}

export default function BusinessShareTools({
  slug,
  businessName,
  onShare,
  isPro = false,
  themeColor = '#53acc5',
  embedded = false,
}: BusinessShareToolsProps) {
  const encoded = encodeURIComponent(slug);
  const profileUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${getBusinessProfilePath(slug)}`
      : getBusinessCanonicalUrl(slug);

  const copyLink = async () => {
    await navigator.clipboard.writeText(profileUrl);
    alert('Enlace copiado');
  };

  const handleUpgrade = async () => {
    try {
      const res = await fetch('/api/business/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (data.initPoint) window.location.href = data.initPoint;
      else alert(data.error || 'No se pudo iniciar el pago');
    } catch {
      alert('Error al conectar con el pago');
    }
  };

  return (
    <div className={embedded ? 'print:hidden' : 'max-w-6xl mx-auto px-4 py-8 print:hidden'}>
      <div
        className={
          embedded
            ? 'space-y-4'
            : 'bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6'
        }
      >
        {!embedded && (
          <div>
            <h3 className="font-bold text-lg mb-1">Tarjeta digital</h3>
            <p className="text-sm text-slate-500">
              Comparte el perfil de {businessName} con QR dinámico, vCard o flyer.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onShare}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700"
          >
            <IconShareAlt size={18} /> Compartir
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700"
          >
            Copiar enlace
          </button>
          <a
            href={`/api/business/${encoded}/vcard`}
            download
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700"
          >
            <IconDownload size={18} /> Guardar contacto (.vcf)
          </a>
          <a
            href={`/api/business/${encoded}/qr-kit?template=flyer-basic&format=svg`}
            download
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700"
          >
            <IconDownload size={18} /> Descargar flyer
          </a>
        </div>

        <QrStudio
          slug={slug}
          businessName={businessName}
          isPro={isPro}
          themeColor={themeColor}
          compact
          onUpgrade={handleUpgrade}
        />
      </div>
    </div>
  );
}
