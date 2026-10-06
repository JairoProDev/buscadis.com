'use client';

/**
 * Experiencia creador — Perfil Vivo (P04)
 * Route: /mi-negocio/crear
 * Default: crear con Adis (IA). ?modo=guia → wizard paso a paso.
 * ?taller=1 → copy para facilitadores / talleres.
 */
import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/AuthModal';
import AiProfileBuilder from '@/components/business/builder/AiProfileBuilder';
import CreadorOnboarding from '@/components/business/creator/CreadorOnboarding';
import type { BusinessProfile } from '@/types/business';
import BusinessPublicView from '@/components/business/BusinessPublicView';
import { publishBusinessViaAPI } from '@/lib/business-api';
import CompletitudMeter from '@/components/business/creator/CompletitudMeter';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type MobilePanel = 'crear' | 'pagina';

function shareMessage(slug: string, name?: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://buscadis.com';
  const link = `${origin}/v/${slug}`;
  const title = name && name !== 'Mi negocio' ? name : 'mi negocio';
  return `Conoce ${title} en Buscadis — catálogo y WhatsApp en un solo enlace:\n${link}`;
}

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
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('crear');
  const [catalogProducts, setCatalogProducts] = useState<unknown[]>([]);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const didAutoPreview = useRef(false);
  const businessIdRef = useRef<string | undefined>();

  const onUpdate = useCallback((patch: Partial<BusinessProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      if (next.name && next.name !== 'Mi negocio') setHasBuilt(true);
      if (next.description || next.tagline || next.contact_whatsapp) setHasBuilt(true);
      return next;
    });
  }, []);

  const refreshCatalog = useCallback(async (businessId: string) => {
    try {
      const { data } = await supabase!.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) return;
      const res = await fetch(
        `/api/catalog/products?businessId=${encodeURIComponent(businessId)}&per_page=24`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setCatalogProducts(json.data);
      }
    } catch {
      /* preview still works without catalog rows */
    }
  }, []);

  useEffect(() => {
    if (profile.id) void refreshCatalog(profile.id);
  }, [profile.id, refreshCatalog]);

  useEffect(() => {
    if (hasBuilt && !didAutoPreview.current) {
      didAutoPreview.current = true;
      setMobilePanel('pagina');
    }
  }, [hasBuilt]);

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

  const shareProfile = useCallback(async () => {
    if (!profile.slug) return;
    if (profile.id) {
      try {
        await publishBusinessViaAPI(profile.id, true);
      } catch (e) {
        const err = e as Error & { code?: string; status?: number };
        if (err.code === 'SUBSCRIPTION_REQUIRED' || err.status === 402) {
          setShareHint(
            'Tu enlace ya funciona para compartir. Para aparecer en el buscador público de Buscadis activa un plan cuando quieras.'
          );
        }
      }
    }
    const text = shareMessage(profile.slug, profile.name);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://buscadis.com';
    const url = `${origin}/v/${profile.slug}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: profile.name || 'Mi negocio en Buscadis',
          text,
          url,
        });
        setShareHint('¡Listo! Comparte ese enlace en tus redes.');
        return;
      }
    } catch {
      /* user cancelled share sheet */
    }

    try {
      await navigator.clipboard.writeText(text);
      setShareHint('Enlace copiado. Pégalo en Instagram, TikTok o WhatsApp.');
    } catch {
      const wa = encodeURIComponent(text);
      window.open(`https://wa.me/?text=${wa}`, '_blank', 'noopener,noreferrer');
      setShareHint('Te abrimos WhatsApp para que te envíes el enlace.');
    }
  }, [profile.id, profile.slug, profile.name]);

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthModal abierto modoInicial="login" onCerrar={() => router.push('/')} />
        <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 p-6 pb-[env(safe-area-inset-bottom)]">
          <p className="text-slate-600 text-base text-center max-w-sm leading-relaxed">
            Inicia sesión con Google para crear la página de tu negocio y compartirla con tus clientes.
          </p>
        </div>
      </>
    );
  }

  if (modoGuia) {
    return <CreadorOnboarding />;
  }

  const showPageActions = Boolean(profile.slug && hasBuilt);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-slate-50 to-slate-100">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur sticky top-0 z-30 shrink-0">
        <div className="max-w-6xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href="/mi-negocio/crear?modo=guia"
                className="text-[11px] font-semibold text-slate-400 hover:text-teal-700"
              >
                Guía paso a paso
              </Link>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                {taller ? 'Tu página para clientes, en 1 minuto' : 'Crea tu página de negocio'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-snug mt-0.5">
                {taller
                  ? 'Cuéntale a Adis con voz o texto. Obtienes un enlace para WhatsApp, Instagram o Facebook.'
                  : 'Audio, fotos o un mensaje corto — Adis arma nombre, descripción, contacto y catálogo.'}
              </p>
            </div>
          </div>

          <div className="lg:hidden grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100">
            <button
              type="button"
              onClick={() => setMobilePanel('crear')}
              className={cn(
                'min-h-[44px] rounded-xl text-sm font-bold transition-colors',
                mobilePanel === 'crear' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600'
              )}
            >
              Hablar con Adis
            </button>
            <button
              type="button"
              onClick={() => setMobilePanel('pagina')}
              className={cn(
                'min-h-[44px] rounded-xl text-sm font-bold transition-colors relative',
                mobilePanel === 'pagina' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600'
              )}
            >
              Mi página
              {hasBuilt && (
                <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              )}
            </button>
          </div>

          {shareHint && (
            <p className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
              {shareHint}
            </p>
          )}

          <div className="hidden lg:flex flex-wrap gap-2 justify-end">
            {showPageActions && (
              <>
                <button
                  type="button"
                  onClick={goToLivePreview}
                  className="rounded-full border border-teal-200 bg-white text-teal-800 text-xs font-bold px-4 py-2.5 min-h-[44px]"
                >
                  Abrir página
                </button>
                <button
                  type="button"
                  onClick={() => void shareProfile()}
                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 min-h-[44px] shadow-sm"
                >
                  Compartir enlace
                </button>
                <button
                  type="button"
                  onClick={goToEditor}
                  className="rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 min-h-[44px] shadow-sm"
                >
                  Mejorar diseño
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main
        className={cn(
          'flex-1 max-w-6xl mx-auto w-full px-4 py-4 lg:py-6 grid lg:grid-cols-2 gap-4 lg:gap-6 items-start',
          showPageActions && 'pb-28 lg:pb-6'
        )}
      >
        <section
          className={cn(
            'space-y-3 min-h-0',
            mobilePanel !== 'crear' && 'hidden lg:block'
          )}
        >
          <AiProfileBuilder
            variant="hero"
            workshopMode={taller}
            profile={profile}
            onUpdate={onUpdate}
            onProfileCreated={(id, slug) => {
              businessIdRef.current = id;
              setProfile((prev) => ({
                ...prev,
                id,
                ...(slug ? { slug } : {}),
              }));
              void refreshCatalog(id);
            }}
            onProductsChanged={() => {
              const id = businessIdRef.current || profile.id;
              if (id) void refreshCatalog(id);
            }}
          />
        </section>

        <section
          className={cn(
            'min-h-0',
            mobilePanel !== 'pagina' && 'hidden lg:block',
            'lg:sticky lg:top-[7.5rem]'
          )}
        >
          <div className="rounded-2xl lg:rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden flex flex-col max-h-[min(72dvh,640px)] lg:max-h-[min(640px,70vh)]">
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Así te verán tus clientes
              </p>
              {profile.slug && (
                <Link
                  href={`/v/${encodeURIComponent(profile.slug)}`}
                  className="text-[11px] font-bold text-teal-700 min-h-[44px] flex items-center"
                >
                  Abrir ↗
                </Link>
              )}
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain bg-white">
              {hasBuilt || profile.name ? (
                <div className="pointer-events-none origin-top scale-[0.98] sm:scale-100">
                  <BusinessPublicView
                    profile={profile as BusinessProfile}
                    adisos={[]}
                    catalogProducts={catalogProducts as { id: string }[]}
                    viewMode="editor"
                    editMode={false}
                    canEdit={false}
                  />
                </div>
              ) : (
                <div className="p-8 sm:p-10 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-800">Tu página aparece aquí</p>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                    Envía un audio o escribe qué vendes. En segundos verás nombre, descripción y botón de WhatsApp.
                  </p>
                </div>
              )}
            </div>
          </div>
          {showPageActions && profile.slug && (
            <CompletitudMeter
              className="mt-3 lg:mt-4"
              profile={profile}
              productCount={catalogProducts.length}
              slug={profile.slug}
            />
          )}
        </section>
      </main>

      {showPageActions && (
        <div
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.06)]"
        >
          <div className="max-w-lg mx-auto grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={goToLivePreview}
              className="min-h-[48px] rounded-2xl border border-slate-200 bg-white text-slate-800 text-sm font-bold"
            >
              Ver página
            </button>
            <button
              type="button"
              onClick={() => void shareProfile()}
              className="min-h-[48px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md"
            >
              Compartir enlace
            </button>
          </div>
          <button
            type="button"
            onClick={goToEditor}
            className="mt-2 w-full min-h-[44px] text-sm font-semibold text-teal-700"
          >
            Afinar diseño y catálogo
          </button>
        </div>
      )}
    </div>
  );
}

export default function CrearNegocioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
        </div>
      }
    >
      <CrearInner />
    </Suspense>
  );
}
