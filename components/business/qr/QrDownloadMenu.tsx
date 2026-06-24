'use client';

import { IconDownload } from '@/components/Icons';

interface QrDownloadMenuProps {
  slug: string;
  isPro: boolean;
  shortUrl?: string;
}

const KITS_FREE = [
  { id: 'flyer-basic', label: 'Flyer básico', format: 'svg' as const },
  { id: 'sticker', label: 'Etiqueta empaque', format: 'svg' as const },
];
const KITS_PRO = [
  { id: 'story', label: 'Historia IG', format: 'png' as const },
  { id: 'table-tent', label: 'Tarjeta de mesa', format: 'pdf' as const },
  { id: 'poster', label: 'Cartel A4', format: 'pdf' as const },
  { id: 'business-card', label: 'Tarjeta visita', format: 'pdf' as const },
];

export default function QrDownloadMenu({ slug, isPro, shortUrl }: QrDownloadMenuProps) {
  const encoded = encodeURIComponent(slug);
  const base = `/api/business/${encoded}`;

  const download = (href: string, label: string) => (
    <a
      key={href}
      href={href}
      download
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
    >
      <IconDownload size={14} />
      {label}
    </a>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Descargar</p>
      <div className="flex flex-wrap gap-2">
        {download(`${base}/qr?format=png`, 'QR PNG')}
        {download(`${base}/qr?format=png&width=1024`, 'PNG impresión (1024px)')}
        {isPro && download(`${base}/qr?format=png&width=2048&tier=pro`, 'Packaging 2048px (Pro)')}
        {download(`${base}/qr?format=svg`, 'QR SVG')}
        {isPro && download(`${base}/qr?format=pdf&tier=pro`, 'Guía PDF impresión')}
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        Mínimo 2.5 cm en impresión · deja margen blanco (quiet zone) · prueba el escaneo antes de
        imprimir en volumen.
      </p>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide pt-2">Kits phygital</p>
      <div className="flex flex-wrap gap-2">
        {KITS_FREE.map((k) =>
          download(`${base}/qr-kit?template=${k.id}&format=${k.format}`, k.label)
        )}
        {isPro &&
          KITS_PRO.map((k) =>
            download(`${base}/qr-kit?template=${k.id}&format=${k.format}`, k.label)
          )}
      </div>
      {shortUrl && (
        <p className="text-[11px] text-slate-400 font-mono truncate pt-1">{shortUrl}</p>
      )}
    </div>
  );
}
