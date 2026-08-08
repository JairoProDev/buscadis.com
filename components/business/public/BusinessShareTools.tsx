'use client';

import { getBusinessProfilePath } from '@/lib/seo/business-metadata';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { IconDownload, IconShareAlt } from '@/components/Icons';
import { getBusinessCanonicalUrl } from '@/lib/business/public-utils';
import {
  mensajeCompartirPerfilPropio,
  perfilVivoOgPreviewUrl,
  perfilVivoPreviewUrl,
  perfilVivoPublicUrl,
  perfilVivoQrMarkedUrl,
} from '@/lib/business/perfil-vivo-share';

const QrStudio = dynamic(() => import('@/components/business/qr/QrStudio'), { ssr: false });

interface BusinessShareToolsProps {
  slug: string;
  businessName: string;
  onShare: () => void;
  isPro?: boolean;
  themeColor?: string;
  /** Sidebar editor: sin padding de página completa */
  embedded?: boolean;
  /** WhatsApp del dueño para “enviármelo” */
  ownerWhatsapp?: string | null;
}

export default function BusinessShareTools({
  slug,
  businessName,
  onShare,
  isPro = false,
  themeColor = '#53acc5',
  embedded = false,
  ownerWhatsapp,
}: BusinessShareToolsProps) {
  const [copied, setCopied] = useState<'link' | 'qr' | null>(null);
  const encoded = encodeURIComponent(slug);
  const profileUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${getBusinessProfilePath(slug)}`
      : getBusinessCanonicalUrl(slug);
  const publicUrl = typeof window !== 'undefined' ? profileUrl : perfilVivoPublicUrl(slug);
  const qrMarked =
    typeof window !== 'undefined'
      ? `${window.location.origin}${getBusinessProfilePath(slug)}?src=qr&utm_source=qr&utm_medium=offline`
      : perfilVivoQrMarkedUrl(slug);
  const previewUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/v/${encoded}`
      : perfilVivoPreviewUrl(slug);
  const ogUrl = perfilVivoOgPreviewUrl(slug);

  const copyText = async (text: string, kind: 'link' | 'qr') => {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
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

  const waSelfHref = ownerWhatsapp
    ? (() => {
        const digits = ownerWhatsapp.replace(/\D/g, '');
        const text = mensajeCompartirPerfilPropio(businessName, publicUrl);
        return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
      })()
    : null;

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
            <h3 className="font-bold text-lg mb-1">Kit para compartir</h3>
            <p className="text-sm text-slate-500">
              Enlace, WhatsApp y QR para la puerta. El QR no aparece en el perfil público.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3 space-y-2">
          <p className="text-[13px] font-bold text-teal-900">Kit Perfil Vivo</p>
          <p className="text-[13px] text-teal-800 leading-snug">
            Comparte el enlace o imprime el QR. Cada escaneo marca origen «qr» en tus visitas.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyText(publicUrl, 'link')}
              className="min-h-[44px] px-3 rounded-lg bg-white border border-teal-200 text-[13px] font-semibold text-teal-900"
            >
              {copied === 'link' ? 'Copiado' : 'Copiar enlace'}
            </button>
            <button
              type="button"
              onClick={() => void copyText(qrMarked, 'qr')}
              className="min-h-[44px] px-3 rounded-lg bg-white border border-teal-200 text-[13px] font-semibold text-teal-900"
            >
              {copied === 'qr' ? 'Copiado' : 'Copiar enlace QR'}
            </button>
            {waSelfHref ? (
              <a
                href={waSelfHref}
                target="_blank"
                rel="noreferrer"
                className="min-h-[44px] inline-flex items-center px-3 rounded-lg bg-[#25D366] text-white text-[13px] font-semibold"
              >
                Enviármelo por WhatsApp
              </a>
            ) : null}
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="min-h-[44px] inline-flex items-center px-3 rounded-lg bg-white border border-teal-200 text-[13px] font-semibold text-teal-900"
            >
              Vista previa /v
            </a>
            <a
              href={ogUrl}
              target="_blank"
              rel="noreferrer"
              className="min-h-[44px] inline-flex items-center px-3 rounded-lg bg-white border border-teal-200 text-[13px] font-semibold text-teal-900"
            >
              Ver imagen al compartir
            </a>
          </div>
        </div>

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
            onClick={() => void copyText(publicUrl, 'link')}
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
          <a
            href={`/api/business/${encoded}/qr-kit?template=sticker&format=png`}
            download
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700"
          >
            <IconDownload size={18} /> Sticker puerta
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
