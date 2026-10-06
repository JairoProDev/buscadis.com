'use client';

/**
 * Experiencia creador — Perfil Vivo (P04)
 * Route: /mi-negocio/crear
 * Default: crear con Adis (IA). ?modo=guia → wizard paso a paso.
 * ?modo=adis → alias del default. ?taller=1 → copy para facilitadores.
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
import { publishBusinessViaAPI } from '@/lib/business-api';

function CrearInner() {
  const router = useRouter();
  const search = useSearchParams();
  const modoGuia = search.get('modo') === 'guia';
  const taller = search.get('taller') === '1' || search.get('taller') === 'true';
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

  const goToLivePreview = useCallback(() => {
    if (profile.slug) {
      router.push(`/v/${encodeURIComponent(profile.slug)}`);
    }
  }, [profile.slug, router]);

  const publishAndShare = useCallback(async () => {
    if (!profile.id || !profile.slug) return;
    try {
      await publishBusinessViaAPI(profile.id, true);
    } catch {
      /* preview still works if paywall */
    }
    const link = `${typeof window !== 'undefined' ? window.location.origin : 'https://buscadis.com'}/v/${profile.slug}`;
    const text = encodeURIComponent(
      `¡Mira la página de mi negocio en Buscadis!\n${link}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [profile.id, profile.slug]);

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

  if (modoGuia) {
    return <CreadorOnboarding />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-slate-50 to-slate-100">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <Link href="/mi-negocio/crear?modo=guia" className="text-xs font-bold text-slate-500 hover:text-teal-700 hover:underline">
              Preferir guía paso a paso
            </Link>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              {taller ? 'Tu negocio en 1 minuto' : 'Habla con Adis'}
            </h1>
            <p className="text-xs text-slate-500">
              {taller
                ? 'Graba un audio, escribe en tus palabras o pega el enlace de Facebook/Instagram. La IA arma tu página al instante.'
                : 'Audio, fotos, enlaces o texto — tu página profesional en minutos.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {profile.slug && (
              <>
                <button
                  type="button"
                  onClick={goToLivePreview}
                  className="rounded-full border border-teal-200 bg-white text-teal-800 text-xs font-bold px-4 py-2.5"
                >
                  Ver mi página
                </button>
                <button
                  type="button"
                  onClick={() => void publishAndShare()}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 shadow-sm"
                >
                  Compartir en WhatsApp
                </button>
                <button
                  type="button"
                  onClick={goToEditor}
                  className="rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 shadow-sm"
                >
                  Afinar en editor
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-2 gap-6 items-start">
        <section className="space-y-3">
          <AiProfileBuilder
            variant="hero"
            workshopMode={taller}
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
