'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { listBusinessProfilesForUser } from '@/lib/business';
import AuthModal from '@/components/AuthModal';

function MiNegocioRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const businessId = searchParams.get('business');
  const isNew = searchParams.get('new') === '1';

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    if (isNew) {
      router.replace('/publicar?tipo=negocio');
      return;
    }

    listBusinessProfilesForUser(user.id).then((list) => {
      if (list.length === 0) {
        router.replace('/publicar?tipo=negocio');
        return;
      }
      const picked = businessId
        ? list.find((b) => b.profile.id === businessId) ?? list[0]
        : list[0];
      const slug = picked.profile.slug;
      if (slug) {
        router.replace(`/@${slug}?edit=true`);
      } else {
        router.replace(`/mi-negocio/catalogo?business=${picked.profile.id}`);
      }
    });
  }, [user, loading, businessId, isNew, router]);

  if (!loading && !user) {
    return (
      <>
        <AuthModal abierto modoInicial="login" onCerrar={() => router.push('/')} />
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-slate-500 text-sm">Inicia sesión para editar tu negocio</p>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-[var(--brand-blue,#53acc5)] rounded-full animate-spin" />
    </div>
  );
}

export default function MiNegocioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      }
    >
      <MiNegocioRedirect />
    </Suspense>
  );
}
