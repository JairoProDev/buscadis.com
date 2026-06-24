'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthModal from '@/components/AuthModal';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <AuthModal
        abierto
        onCerrar={() => router.push(returnTo)}
        modoInicial="login"
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
          Cargando…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
