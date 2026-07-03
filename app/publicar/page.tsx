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

const PublishStudioShell = dynamic(() => import('@/components/publish/PublishStudioShell'), {
  loading: () => <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Cargando Publish Studio…</div>,
  ssr: false,
});

function PublicarHubContent() {
  const searchParams = useSearchParams();
  const { setSidebarExpanded } = useNavigation();
  const { toasts, removeToast, success, error } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initialText, setInitialText] = useState('');
  const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);
  const [initialContacto, setInitialContacto] = useState<string | undefined>();
  const [seedKey, setSeedKey] = useState(0);

  useEffect(() => {
    setSidebarExpanded(false);
  }, [setSidebarExpanded]);

  useEffect(() => {
    const titulo = searchParams.get('titulo');
    const descripcion = searchParams.get('descripcion');
    const text = searchParams.get('text') || searchParams.get('descripcion');
    const imagen = searchParams.get('imagen');
    const contacto = searchParams.get('contacto');
    if (titulo || descripcion || text || imagen || contacto) {
      const combined = [titulo, descripcion || text].filter(Boolean).join('. ');
      setInitialText(combined);
      if (imagen) setInitialImageUrl(imagen);
      if (contacto) setInitialContacto(contacto);
      setSeedKey((k) => k + 1);
    }
  }, [searchParams]);

  const notify = (msg: string, type?: 'info' | 'error' | 'success') => {
    if (type === 'error') error(msg);
    else if (type === 'success') success(msg);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col pb-16 md:pb-0">
      <Header onToggleLeftSidebar={() => setSidebarOpen(true)} seccionActiva="publicar" />
      <main className="flex-1 w-full flex flex-col min-h-0">
        <div className="container mx-auto px-3 py-3 md:py-5 max-w-xl flex-1 flex flex-col min-h-0 w-full">
          <h1 className="text-lg md:text-xl font-bold text-center mb-0.5 text-[var(--text-primary)] shrink-0">
            Publica tu oferta u oportunidad en Buscadis
          </h1>


          <div className="flex-1 flex flex-col min-h-[min(680px,calc(100vh-180px))]">
            <PublishStudioShell
              key={seedKey}
              variant="page"
              initialText={initialText}
              initialImageUrl={initialImageUrl}
              initialContacto={initialContacto}
              onNotify={notify}
              onPublished={() => {
                setInitialText('');
                setInitialImageUrl(null);
              }}
            />
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
