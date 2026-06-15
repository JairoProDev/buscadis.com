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
const UnifiedSearchComposer = dynamic(() => import('@/components/UnifiedSearchComposer'), {
  ssr: false,
});

const PublishChatWizard = dynamic(() => import('@/components/publish/PublishChatWizard'), {
  loading: () => <div className="p-6 text-center text-sm text-[var(--text-secondary)]">Cargando asistente…</div>,
  ssr: false,
});

function PublicarHubContent() {
  const searchParams = useSearchParams();
  const { setSidebarExpanded } = useNavigation();
  const { toasts, removeToast, success, error } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [chatSeed, setChatSeed] = useState<{ text: string; imageUrl?: string | null } | null>(null);
  const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);

  useEffect(() => {
    setSidebarExpanded(false);
  }, [setSidebarExpanded]);

  useEffect(() => {
    const titulo = searchParams.get('titulo');
    const descripcion = searchParams.get('descripcion');
    const text = searchParams.get('text') || searchParams.get('descripcion');
    const imagen = searchParams.get('imagen');
    if (titulo || descripcion || text) {
      const combined = [titulo, descripcion || text].filter(Boolean).join('. ');
      setComposerText(combined);
      if (imagen) setInitialImageUrl(imagen);
      setChatSeed({ text: combined, imageUrl: imagen });
    }
  }, [searchParams]);

  const notify = (msg: string, type?: 'info' | 'error' | 'success') => {
    if (type === 'error') error(msg);
    else if (type === 'success') success(msg);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex flex-col pb-16 md:pb-0">
      <Header onToggleLeftSidebar={() => setSidebarOpen(true)} seccionActiva="publicar" />
      <main className="flex-1 w-full">
        <div className="container mx-auto px-4 py-5 md:py-8 max-w-2xl">
          <h1 className="text-xl md:text-2xl font-bold text-center mb-1 text-[var(--text-primary)]">
            Publica tu aviso
          </h1>
          <p className="text-center text-sm text-[var(--text-secondary)] mb-5">
            Escribe una idea arriba y ADIS te guiará paso a paso.
          </p>

          <UnifiedSearchComposer
            value={composerText}
            onChange={setComposerText}
            initialMode="publish"
            publishBehavior="chat"
            onPublishToChat={(payload) => setChatSeed(payload)}
            onNotify={notify}
          />

          <div className="mt-5">
            <PublishChatWizard
              initialText={composerText}
              initialImageUrl={initialImageUrl}
              externalSubmit={chatSeed}
              onExternalSubmitHandled={() => setChatSeed(null)}
              onNotify={notify}
              onPublished={() => {
                setComposerText('');
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
