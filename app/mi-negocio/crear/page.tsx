'use client';

/**
 * Experiencia creador — Perfil Vivo (P04)
 * Route: /mi-negocio/crear
 * ?modo=adis → chat IA legado como atajo
 */
import { useCallback, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/AuthModal';
import AiProfileBuilder from '@/components/business/builder/AiProfileBuilder';
import CreadorOnboarding from '@/components/business/creator/CreadorOnboarding';
import type { BusinessProfile } from '@/types/business';
import BusinessPublicView from '@/components/business/BusinessPublicView';

function CrearInner() {
  const router = useRouter();
  const search = useSearchParams();
  const modoAdis = search.get('modo') === 'adis';
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Partial<BusinessProfile>>({
    name: '',
    is_published: false,
  });
  const [hasBuilt, setHasBuilt] = useState(false);

  const onUpdate = useCallback((patch: Partial<BusinessProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      if (next.name && next.name !== 'Mi negocio') setHasBuilt(true);
      if (next.description || next.tagline || next.contact_whatsapp) setHasBuilt(true);
      return next;
    });
  }, []);

  const goToEditor = useCallback(() => {
    if (profile.slug) {
      router.push(`/@${profile.slug}?edit=true&hub=content&ai=1`);
    }
  }, [profile.slug, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthModal abierto modoInicial="login" onCerrar={() => router.push('/')} />
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <p className="text-slate-500 text-sm text-center">
            Inicia sesión para crear tu presencia digital
          </p>
        </div>
      </>
    );
  }

  if (!modoAdis) {
    return <CreadorOnboarding />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-slate-50 to-slate-100">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <Link href="/mi-negocio/crear" className="text-xs font-bold text-teal-700 hover:underline">
              ← Volver al guía paso a paso
            </Link>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              Habla con Adis
            </h1>
            <p className="text-xs text-slate-500">
              Atajo con IA. También puedes armar tu perfil pregunta por pregunta.
            </p>
          </div>
          {profile.slug && (
            <button
              type="button"
              onClick={goToEditor}
              className="shrink-0 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 shadow-sm"
            >
              Abrir editor
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-2 gap-6 items-start">
        <section className="space-y-3">
          <AiProfileBuilder
            variant="hero"
            profile={profile}
            onUpdate={onUpdate}
            onProfileCreated={(id, slug) => {
              setProfile((prev) => ({
                ...prev,
                id,
                ...(slug ? { slug } : {}),
              }));
            }}
          />
        </section>

        <section className="lg:sticky lg:top-20">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Vista previa
              </p>
              {profile.slug && (
                <Link
                  href={`/v/${encodeURIComponent(profile.slug)}`}
                  target="_blank"
                  className="text-[10px] font-bold text-teal-700"
                >
                  Perfil Vivo ↗
                </Link>
              )}
            </div>
            <div className="max-h-[min(640px,70vh)] overflow-y-auto bg-white">
              {hasBuilt || profile.name ? (
                <div className="pointer-events-none origin-top scale-[0.92] sm:scale-100">
                  <BusinessPublicView
                    profile={profile as BusinessProfile}
                    adisos={[]}
                    catalogProducts={[]}
                    viewMode="editor"
                    editMode={false}
                    canEdit={false}
                  />
                </div>
              ) : (
                <div className="p-10 text-center space-y-3">
                  <p className="text-sm font-bold text-slate-800">Tu página aparecerá aquí</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function CrearNegocioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
        </div>
      }
    >
      <CrearInner />
    </Suspense>
  );
}
