'use client';

/**
 * Entrada corta para talleres (QR: buscadis.com/taller).
 * Funciona en navegador y en la app (WebView carga la misma web).
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { enableWorkshopMode } from '@/lib/workshop-mode';

export default function TallerPage() {
  const router = useRouter();

  useEffect(() => {
    enableWorkshopMode();
    router.replace('/mi-negocio/crear?taller=1');
  }, [router]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 bg-slate-50 px-6">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
      <p className="text-sm text-slate-600 text-center">Abriendo el creador de tu página…</p>
    </div>
  );
}
