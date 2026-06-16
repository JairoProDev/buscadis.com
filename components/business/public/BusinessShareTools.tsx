'use client';

import { IconDownload, IconQrcode, IconShareAlt } from '@/components/Icons';

interface BusinessShareToolsProps {
  slug: string;
  businessName: string;
  onShare: () => void;
}

export default function BusinessShareTools({ slug, businessName, onShare }: BusinessShareToolsProps) {
  const encoded = encodeURIComponent(slug);

  const copyLink = async () => {
    const url = `${window.location.origin}/${slug}`;
    await navigator.clipboard.writeText(url);
    alert('Enlace copiado');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 print:hidden">
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4">Tarjeta digital</h3>
        <p className="text-sm text-slate-500 mb-6">
          Comparte el perfil de {businessName} con QR, vCard o flyer.
        </p>
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
            href={`/api/business/${encoded}/flyer`}
            download
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-700"
          >
            <IconDownload size={18} /> Descargar flyer
          </a>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-6">
          <img
            src={`/api/business/${encoded}/qr?format=png`}
            alt={`QR de ${businessName}`}
            className="w-40 h-40 rounded-2xl border border-slate-100 shadow-sm"
          />
          <div className="text-center sm:text-left">
            <p className="flex items-center justify-center sm:justify-start gap-2 text-sm font-bold text-slate-700">
              <IconQrcode size={18} /> QR dinámico
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Escanea para abrir adis.lat/{slug}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
