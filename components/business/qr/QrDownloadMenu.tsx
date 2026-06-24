'use client';

import { IconDownload } from '@/components/Icons';
import type { QrRenderMode } from '@/lib/qr/types';

interface QrDownloadMenuProps {
  slug: string;
  isPro: boolean;
  shortUrl?: string;
  renderMode?: QrRenderMode;
}

type DownloadItem = {
  id: string;
  label: string;
  desc: string;
  href: string;
  wire: 'square' | 'print' | 'packaging' | 'vector' | 'pdf' | 'flyer' | 'sticker' | 'story' | 'tent' | 'poster' | 'card';
  pro?: boolean;
};

function WireThumb({ type }: { type: DownloadItem['wire'] }) {
  const base = 'rounded border border-slate-200 bg-white flex items-center justify-center shrink-0';
  switch (type) {
    case 'square':
      return (
        <div className={`${base} w-12 h-12`}>
          <div className="w-7 h-7 border-2 border-slate-400 rounded-sm grid grid-cols-3 gap-px p-0.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-slate-400 rounded-[1px]" />
            ))}
          </div>
        </div>
      );
    case 'print':
      return (
        <div className={`${base} w-12 h-12`}>
          <div className="w-8 h-8 border border-slate-300 flex items-center justify-center text-[8px] text-slate-400">
            QR
          </div>
        </div>
      );
    case 'packaging':
      return (
        <div className={`${base} w-12 h-12`}>
          <div className="w-9 h-9 border-2 border-slate-400 rounded grid grid-cols-4 gap-px p-0.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="bg-slate-300 rounded-[1px]" />
            ))}
          </div>
        </div>
      );
    case 'vector':
      return (
        <div className={`${base} w-12 h-12`}>
          <svg viewBox="0 0 32 32" className="w-8 h-8 text-slate-400">
            <path d="M4 4h8v8H4zm16 0h8v8h-8zM4 20h8v8H4z" fill="currentColor" />
            <path d="M14 14h4v4h-4z" fill="currentColor" opacity="0.5" />
          </svg>
        </div>
      );
    case 'pdf':
      return (
        <div className={`${base} w-12 h-14 flex-col gap-0.5`}>
          <div className="w-7 h-7 border border-slate-300" />
          <div className="w-8 h-1 bg-slate-200 rounded" />
        </div>
      );
    case 'flyer':
      return (
        <div className={`${base} w-10 h-14 bg-slate-50`}>
          <div className="w-6 h-6 border border-slate-300 mb-1" />
          <div className="w-7 h-0.5 bg-slate-200" />
        </div>
      );
    case 'sticker':
      return (
        <div className={`${base} w-12 h-12 rounded-lg`}>
          <div className="w-8 h-8 border-2 border-dashed border-slate-300 rounded-md flex items-center justify-center text-[7px] text-slate-400">
            QR
          </div>
        </div>
      );
    case 'story':
      return (
        <div className={`${base} w-8 h-14 bg-slate-900 rounded-md`}>
          <div className="w-5 h-5 border border-white/40 mt-2" />
        </div>
      );
    case 'tent':
      return (
        <div className={`${base} w-12 h-10`}>
          <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[28px] border-l-transparent border-r-transparent border-b-slate-200 relative">
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-4 h-4 border border-slate-400 bg-white" />
          </div>
        </div>
      );
    case 'poster':
      return (
        <div className={`${base} w-10 h-14`}>
          <div className="w-full h-2 bg-slate-300 mb-1" />
          <div className="w-6 h-6 border border-slate-300 mx-auto" />
        </div>
      );
    case 'card':
      return (
        <div className={`${base} w-14 h-9`}>
          <div className="w-4 h-4 border border-slate-300 ml-auto mr-1" />
        </div>
      );
    default:
      return <div className={`${base} w-12 h-12`} />;
  }
}

function DownloadCard({ item }: { item: DownloadItem }) {
  return (
    <a
      href={item.href}
      download
      className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-colors group"
    >
      <WireThumb type={item.wire} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-800 group-hover:text-blue-800 flex items-center gap-1">
          <IconDownload size={12} className="opacity-60" />
          {item.label}
          {item.pro && (
            <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
              Pro
            </span>
          )}
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
      </div>
    </a>
  );
}

export default function QrDownloadMenu({ slug, isPro, shortUrl, renderMode }: QrDownloadMenuProps) {
  const encoded = encodeURIComponent(slug);
  const base = `/api/business/${encoded}`;
  const modeQ = renderMode ? `&mode=${renderMode}` : '';

  const qrFiles: DownloadItem[] = [
    {
      id: 'png',
      label: 'PNG digital',
      desc: '512 px · pantallas, web y WhatsApp',
      href: `${base}/qr?format=png${modeQ}`,
      wire: 'square',
    },
    {
      id: 'png-print',
      label: 'PNG impresión',
      desc: '1024 px · flyers y carteles pequeños',
      href: `${base}/qr?format=png&width=1024${modeQ}`,
      wire: 'print',
    },
    {
      id: 'png-pack',
      label: 'Packaging alta res',
      desc: '2048 px · empaques e imprenta digital',
      href: `${base}/qr?format=png&width=2048&tier=pro${modeQ}`,
      wire: 'packaging',
      pro: true,
    },
    {
      id: 'svg',
      label: 'SVG vectorial',
      desc: 'Escala sin pérdida · diseñadores',
      href: `${base}/qr?format=svg${modeQ}`,
      wire: 'vector',
    },
    {
      id: 'pdf',
      label: 'Guía PDF',
      desc: 'Hoja A4 con QR + instrucciones de impresión',
      href: `${base}/qr?format=pdf&tier=pro${modeQ}`,
      wire: 'pdf',
      pro: true,
    },
  ];

  const kits: DownloadItem[] = [
    {
      id: 'packaging',
      label: 'Etiqueta producto',
      desc: 'Cuadrada premium para cajas, frascos y empaque',
      href: `${base}/qr-kit?template=packaging&format=png`,
      wire: 'packaging',
      pro: true,
    },
    {
      id: 'flyer',
      label: 'Flyer básico',
      desc: 'Vertical con nombre y QR grande',
      href: `${base}/qr-kit?template=flyer-basic&format=png`,
      wire: 'flyer',
    },
    {
      id: 'sticker',
      label: 'Sticker compacto',
      desc: 'Cuadrado limpio para pegatinas y bolsas',
      href: `${base}/qr-kit?template=sticker&format=png`,
      wire: 'sticker',
    },
    {
      id: 'story',
      label: 'Historia Instagram',
      desc: 'Formato 9:16 con gradiente de marca',
      href: `${base}/qr-kit?template=story&format=png`,
      wire: 'story',
      pro: true,
    },
    {
      id: 'tent',
      label: 'Tarjeta de mesa',
      desc: 'Doble cara para doblar en mostrador',
      href: `${base}/qr-kit?template=table-tent&format=pdf`,
      wire: 'tent',
      pro: true,
    },
    {
      id: 'poster',
      label: 'Cartel A4',
      desc: 'Póster con QR centrado para vitrina',
      href: `${base}/qr-kit?template=poster&format=pdf`,
      wire: 'poster',
      pro: true,
    },
    {
      id: 'card',
      label: 'Tarjeta de visita',
      desc: 'Horizontal con QR y datos del negocio',
      href: `${base}/qr-kit?template=business-card&format=pdf`,
      wire: 'card',
      pro: true,
    },
  ];

  const visibleQr = qrFiles.filter((i) => !i.pro || isPro);
  const visibleKits = kits.filter((i) => !i.pro || isPro);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
          Solo el código QR
        </p>
        <div className="grid grid-cols-1 gap-2">
          {visibleQr.map((item) => (
            <DownloadCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
          Kits listos para imprimir
        </p>
        <div className="grid grid-cols-1 gap-2">
          {visibleKits.map((item) => (
            <DownloadCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed rounded-xl bg-slate-50 border border-slate-100 p-3">
        Mínimo <strong>2.5 cm</strong> en impresión · deja margen blanco alrededor · prueba el
        escaneo antes de imprimir en volumen.
      </p>

      {shortUrl && (
        <p className="text-[11px] text-slate-400 font-mono truncate">{shortUrl}</p>
      )}
    </div>
  );
}
