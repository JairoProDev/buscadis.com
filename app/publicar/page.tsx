'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ToastContainer } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import PublishStudio from '@/components/publish/PublishStudio';

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

  useEffect(() => {
    router.prefetch('/');
  }, [router]);

  const notify = (msg: string, type?: 'info' | 'error' | 'success') => {
    if (type === 'error') error(msg);
    else if (type === 'success') success(msg);
  };

  const handleExit = () => {
    router.push('/');
  };

  return (
    <div className="fixed inset-0 z-[2100] flex flex-col bg-[var(--bg-primary)]">
      <main className="flex min-h-0 flex-1 flex-col">
        <PublishStudio
          key={seedKey}
          immersive
          initialText={initialText}
          initialImageUrl={initialImageUrl}
          initialContacto={initialContacto}
          onNotify={notify}
          onClose={handleExit}
          onPublished={() => {
            setInitialText('');
            setInitialImageUrl(null);
          }}
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
