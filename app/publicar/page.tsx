'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';
import { useNavigation } from '@/contexts/NavigationContext';
import dynamic from 'next/dynamic';
import { ToastContainer } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import FeedbackButton from '@/components/FeedbackButton';
import { useSearchParams } from 'next/navigation';
import { DraftListingData } from '@/components/ai/DraftListingCard';

const FormularioPublicar = dynamic(() => import('@/components/FormularioPublicar'), {
  loading: () => <div className="p-8 text-center">Cargando…</div>,
  ssr: false,
});

const ChatbotIANew = dynamic(() => import('@/components/ChatbotIANew'), {
  loading: () => <div className="p-4 text-center text-sm">Cargando ADIS…</div>,
  ssr: false,
});

function PublicarHubContent() {
  const searchParams = useSearchParams();
  const { setSidebarExpanded } = useNavigation();
  const { toasts, removeToast, success, error } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [draftHint, setDraftHint] = useState<Partial<DraftListingData> | null>(null);

  useEffect(() => {
    setSidebarExpanded(false);
  }, [setSidebarExpanded]);

  useEffect(() => {
    const titulo = searchParams.get('titulo');
    const descripcion = searchParams.get('descripcion');
    const categoria = searchParams.get('categoria');
    const text = searchParams.get('text');
    if (titulo || text) {
      setDraftHint({
        titulo: titulo || text?.slice(0, 60) || '',
        descripcion: descripcion || text || '',
        categoria: (categoria as DraftListingData['categoria']) || 'productos',
      });
    }
  }, [searchParams]);

  const handleFlyer = async (adisoId: string) => {
    try {
      const res = await fetch('/api/adisos/flyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adisoId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      const blob = new Blob([data.svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.downloadName || 'flyer.svg';
      a.click();
      URL.revokeObjectURL(url);
      success('Flyer descargado');
    } catch (e) {
      error(e instanceof Error ? e.message : 'No se pudo generar el flyer');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 md:pb-0">
      <Header onToggleLeftSidebar={() => setSidebarOpen(true)} seccionActiva="publicar" />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-2">Publicar con ADIS</h1>
          <p className="text-center text-sm text-[var(--text-secondary)] mb-6 max-w-xl mx-auto">
            Chatea con la IA a la izquierda, revisa y publica con todas las opciones a la derecha.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[70vh]">
            <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] overflow-hidden flex flex-col min-h-[420px]">
              <div className="px-4 py-3 border-b border-[var(--border-color)] font-semibold text-sm">
                ADIS — asistente de publicación
              </div>
              <div className="flex-1 min-h-0">
                <ChatbotIANew
                  onPublicar={() => success('Borrador listo — completa en el panel derecho')}
                  onError={(msg) => error(msg)}
                  onSuccess={(msg) => success(msg)}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 md:p-6 overflow-y-auto">
              {draftHint && (
                <div className="mb-4 p-3 rounded-xl bg-[rgba(var(--brand-primary-rgb),0.08)] text-sm">
                  <p className="font-semibold m-0 mb-1">Borrador desde el buscador</p>
                  <p className="m-0 text-[var(--text-secondary)]">{draftHint.titulo}</p>
                </div>
              )}
              <FormularioPublicar
                esPaginaCompleta
                onPublicar={(adiso) => {
                  success('¡Anuncio publicado!');
                  if (adiso?.id) void handleFlyer(adiso.id);
                }}
                onError={(msg) => error(msg)}
                onSuccess={(msg) => success(msg)}
              />
            </section>
          </div>
        </div>
      </main>
      <LeftSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="block md:hidden">
        <NavbarMobile seccionActiva="publicar" tieneAdisoAbierto={false} onCambiarSeccion={() => {}} />
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <FeedbackButton />
    </div>
  );
}

export default function PublicarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando…</div>}>
      <PublicarHubContent />
    </Suspense>
  );
}
