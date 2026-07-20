'use client';

/**
 * AI-first business creation — magical zero-to-one entry.
 * Route: /mi-negocio/crear
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/AuthModal';
import AiProfileBuilder from '@/components/business/builder/AiProfileBuilder';
import type { BusinessProfile } from '@/types/business';
import BusinessPublicView from '@/components/business/BusinessPublicView';

export default function CrearNegocioConIAPage() {
  const router = useRouter();
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

  useEffect(() => {
    // After first real build with a slug, soft-offer editor (don't auto-redirect mid-chat).
  }, []);

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
            Inicia sesión para crear tu presencia digital con IA
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-slate-50 to-slate-100">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <Link href="/" className="text-xs font-bold text-teal-700 hover:underline">
              Buscadis
            </Link>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              Crea tu página en segundos
            </h1>
            <p className="text-xs text-slate-500">
              Habla con Adis — ella arma tu tarjeta digital, catálogo y canal de ventas.
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
          <p className="text-[11px] text-slate-400 text-center px-2">
            Crear y editar es gratis. Solo pagas S/30 al mes cuando quieras publicar.
          </p>
        </section>

        <section className="lg:sticky lg:top-20">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Vista previa en vivo</p>
              {hasBuilt ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Actualizándose
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Esperando tu info…</span>
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
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-2xl font-black text-teal-600">
                    A
                  </div>
                  <p className="text-sm font-bold text-slate-800">Tu página aparecerá aquí</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    Envía un audio, fotos de tus productos o escribe qué vendes. En segundos verás tu
                    presencia digital tomando forma.
                  </p>
                </div>
              )}
            </div>
          </div>

          {profile.slug && hasBuilt && (
            <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-center space-y-2">
              <p className="text-sm font-bold text-teal-900">
                Tu enlace: buscadis.com/@{profile.slug}
              </p>
              <button
                type="button"
                onClick={goToEditor}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold"
              >
                Seguir editando o publicar
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
