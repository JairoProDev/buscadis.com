'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ToastContainer } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { IconClose } from '@/components/Icons';

const PublishStudioShell = dynamic(() => import('@/components/publish/PublishStudioShell'), {
  loading: () => (
    <div className="flex flex-1 items-center justify-center p-6 text-sm text-[var(--text-secondary)]">
      Cargando Publish Studio…
    </div>
  ),
  ssr: false,
});

function PublicarHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toasts, removeToast, success, error } = useToast();
  const [initialText, setInitialText] = useState('');
  const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);
  const [initialContacto, setInitialContacto] = useState<string | undefined>();
  const [seedKey, setSeedKey] = useState(0);

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

  const handleExit = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--bg-primary)]">
      <header className="flex shrink-0 items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <button
          type="button"
          onClick={handleExit}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors hover:bg-[var(--hover-bg)]"
          aria-label="Cerrar y salir"
          title="Salir"
        >
          <IconClose size={20} />
        </button>
        <span className="text-sm font-bold text-[var(--text-primary)]">Publicar</span>
        <span className="w-11" aria-hidden />
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <PublishStudioShell
          key={seedKey}
          variant="page"
          immersive
          initialText={initialText}
          initialImageUrl={initialImageUrl}
          initialContacto={initialContacto}
          onNotify={notify}
          onPublished={() => {
            setInitialText('');
            setInitialImageUrl(null);
          }}
          onClose={handleExit}
        />
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default function PublicarPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center p-8">Cargando…</div>}>
      <PublicarHubContent />
    </Suspense>
  );
}
