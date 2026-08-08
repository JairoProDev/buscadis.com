'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { BusinessProfile } from '@/types/business';
import {
  createBusinessViaAPI,
  saveBusinessViaAPI,
  publishBusinessViaAPI,
} from '@/lib/business-api';
import { uploadBusinessImage, uploadProductImage } from '@/lib/business';
import { presetHorario } from '@/lib/business/completitud-vivo';
import CompletitudMeter from '@/components/business/creator/CompletitudMeter';
import { trackEvent } from '@/lib/events/track';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type PasoId = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const RUBROS = [
  { id: 'ferreteria', label: 'Ferretería / materiales', hint: 'Cemento, fierro, herramientas' },
  { id: 'tienda', label: 'Tienda / abarrotes', hint: 'Productos del día a día' },
  { id: 'comida', label: 'Comida / restaurante', hint: 'Platos, delivery, menú' },
  { id: 'servicios', label: 'Servicios', hint: 'Barbería, talleres, profesiones' },
  { id: 'otro', label: 'Otro', hint: 'Cuéntanos qué vendes' },
] as const;

interface DraftProduct {
  localId: string;
  title: string;
  price: string;
  imageUrl: string;
  file?: File;
  saving?: boolean;
  savedId?: string;
}

interface AvisoLite {
  id: string;
  titulo: string;
  categoria?: string;
  imagenUrl?: string | null;
  ubicacion?: string;
}

function trackPaso(paso: number, businessId?: string, extra?: Record<string, unknown>) {
  trackEvent('publish.step_view', {
    entityType: 'publish_draft',
    entityId: businessId,
    payload: { step: `onboarding_${paso}`, ...extra },
  });
}

function digitosWa(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.length === 9 && d.startsWith('9')) d = `51${d}`;
  if (d.length === 11 && d.startsWith('51')) return d;
  return d;
}

export default function CreadorOnboarding() {
  const router = useRouter();
  const [paso, setPaso] = useState<PasoId>(0);
  const [profile, setProfile] = useState<Partial<BusinessProfile>>({
    name: '',
    is_published: false,
  });
  const [productCount, setProductCount] = useState(0);
  const [draftProducts, setDraftProducts] = useState<DraftProduct[]>([]);
  const [avisos, setAvisos] = useState<AvisoLite[]>([]);
  const [loadingAvisos, setLoadingAvisos] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [rubroOtro, setRubroOtro] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creatingRef = useRef(false);

  const slug = profile.slug;
  const previewHref = slug ? `/v/${encodeURIComponent(slug)}` : null;
  const site = typeof window !== 'undefined' ? window.location.origin : 'https://buscadis.com';

  const ensureDraft = useCallback(
    async (seed?: Partial<BusinessProfile>) => {
      if (profile.id) return profile as BusinessProfile;
      if (creatingRef.current) return null;
      creatingRef.current = true;
      try {
        const created = await createBusinessViaAPI({
          name: seed?.name || profile.name || 'Mi negocio',
          is_published: false,
          ...seed,
        });
        setProfile(created);
        trackEvent('publish.draft_update', {
          entityType: 'publish_draft',
          entityId: created.id,
          payload: { action: 'onboarding_draft_created' },
        });
        return created;
      } finally {
        creatingRef.current = false;
      }
    },
    [profile]
  );

  const patchProfile = useCallback(
    (patch: Partial<BusinessProfile>) => {
      setProfile((prev) => ({ ...prev, ...patch }));
      setSavedFlash(false);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          let id = profile.id;
          if (!id) {
            const created = await ensureDraft(patch);
            id = created?.id;
            if (!id) return;
          } else {
            const saved = await saveBusinessViaAPI(id, { ...profile, ...patch, id });
            setProfile(saved);
          }
          setSavedFlash(true);
        } catch (e) {
          console.error('[creador] autosave', e);
        }
      }, 900);
    },
    [profile, ensureDraft]
  );

  useEffect(() => {
    trackPaso(paso, profile.id);
  }, [paso, profile.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        const res = await fetch('/api/business/my-adisos', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!cancelled && json.adisos) setAvisos(json.adisos);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingAvisos(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const go = (next: PasoId) => {
    setError(null);
    setPaso(next);
  };

  const fromAviso = async (adisoId: string) => {
    setBusy(true);
    setError(null);
    try {
      if (!supabase) throw new Error('Sin conexión');
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Inicia sesión');
      const res = await fetch('/api/business/from-adiso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adisoId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo usar el aviso');
      setProfile(json.profile);
      setProductCount(json.productosCreados || 0);
      trackEvent('publish.draft_update', {
        entityType: 'publish_draft',
        entityId: json.profile?.id,
        payload: { action: 'from_adiso', adisoId },
      });
      go(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const onPickLogo = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const draft = await ensureDraft({ name: profile.name || 'Mi negocio' });
      if (!draft?.id) throw new Error('No se pudo crear el borrador');
      const url = await uploadBusinessImage(file, draft.id, 'logo');
      if (!url) throw new Error('No se pudo subir la foto');
      const saved = await saveBusinessViaAPI(draft.id, { logo_url: url });
      setProfile(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir');
    } finally {
      setBusy(false);
    }
  };

  const onPickProducts = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    try {
      const draft = await ensureDraft({ name: profile.name || 'Mi negocio' });
      if (!draft?.id) throw new Error('No se pudo crear el borrador');
      if (!supabase) throw new Error('Sin conexión');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Inicia sesión');

      const list = Array.from(files).slice(0, 12);
      const next: DraftProduct[] = [];
      for (const file of list) {
        const url = await uploadProductImage(file, user.id);
        const title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').slice(0, 60) || 'Producto';
        next.push({
          localId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title,
          price: '',
          imageUrl: url,
          file,
        });
      }
      setDraftProducts((prev) => [...prev, ...next].slice(0, 20));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir fotos');
    } finally {
      setBusy(false);
    }
  };

  const saveDraftProducts = async () => {
    if (!profile.id) return;
    setBusy(true);
    setError(null);
    try {
      if (!supabase) throw new Error('Sin conexión');
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Inicia sesión');

      let saved = 0;
      for (const p of draftProducts) {
        if (p.savedId) {
          saved++;
          continue;
        }
        const priceNum = p.price.trim() ? Number(p.price.replace(',', '.')) : null;
        const res = await fetch('/api/catalog/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            businessId: profile.id,
            title: p.title || 'Producto',
            price: Number.isFinite(priceNum) ? priceNum : null,
            currency: 'PEN',
            images: [{ url: p.imageUrl, alt: p.title }],
            status: Number.isFinite(priceNum) && (priceNum as number) > 0 ? 'published' : 'draft',
            import_source: 'onboarding_photos',
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'No se guardó el producto');
        p.savedId = json.data?.id;
        saved++;
      }
      setDraftProducts([...draftProducts]);
      setProductCount((c) => Math.max(c, saved));
      go(6);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar productos');
    } finally {
      setBusy(false);
    }
  };

  const finishAndSendWa = async () => {
    if (!profile.id || !slug) return;
    setBusy(true);
    try {
      try {
        await publishBusinessViaAPI(profile.id, true);
      } catch {
        /* paywall: still share /v preview */
      }
      trackEvent('publish.draft_update', {
        entityType: 'publish_draft',
        entityId: profile.id,
        payload: { action: 'onboarding_complete', scoreHint: productCount },
      });
      const phone = digitosWa(profile.contact_whatsapp || '');
      const link = `${site}/v/${slug}`;
      const text = encodeURIComponent(
        `Este es el enlace de mi negocio en Buscadis:\n${link}\n\nPuedes compartirlo con tus clientes.`
      );
      if (phone.length >= 11) {
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
      } else {
        window.open(`https://wa.me/?text=${text}`, '_blank');
      }
    } finally {
      setBusy(false);
    }
  };

  const progressPct = useMemo(() => Math.round((paso / 6) * 100), [paso]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-slate-50 to-amber-50/40">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href="/" className="text-xs font-bold text-teal-700 hover:underline">
              Buscadis
            </Link>
            <p className="text-[17px] font-black text-slate-900 truncate">Arma tu perfil</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-semibold text-slate-500 tabular-nums">
              {paso === 0 ? 'Inicio' : `Paso ${paso} de 6`}
            </p>
            {savedFlash && (
              <p className="text-[11px] text-emerald-600 font-semibold">Guardamos tu avance</p>
            )}
          </div>
        </div>
        <div className="h-1 bg-slate-100">
          <div className="h-full bg-teal-600 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-28 space-y-5">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-800">
            {error}
          </div>
        )}

        {/* Puerta 0 */}
        {paso === 0 && (
          <section className="space-y-4">
            <h1 className="text-2xl font-black text-slate-900 leading-tight">
              ¿Por dónde empezamos?
            </h1>
            <p className="text-[17px] text-slate-600 leading-snug">
              Si ya tienes un aviso en Buscadis, lo convertimos en tu perfil en menos de un minuto.
            </p>

            {loadingAvisos ? (
              <div className="h-24 rounded-2xl bg-white border border-slate-200 animate-pulse" />
            ) : avisos.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-700">Tus avisos</p>
                {avisos.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    disabled={busy}
                    onClick={() => fromAviso(a.id)}
                    className="w-full flex items-center gap-3 min-h-[72px] rounded-2xl border border-slate-200 bg-white p-3 text-left hover:border-teal-400 hover:bg-teal-50/40 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                      {a.imagenUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.imagenUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-lg font-bold">
                          A
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate text-[17px]">{a.titulo}</p>
                      <p className="text-sm text-slate-500 truncate">
                        {[a.categoria, a.ubicacion].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => go(1)}
              className="w-full min-h-[56px] rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-[17px] font-bold"
            >
              Empezar de cero
            </button>

            <details className="rounded-2xl border border-slate-200 bg-white/80 p-4">
              <summary className="text-[15px] font-semibold text-slate-600 cursor-pointer">
                Prefiero hablar con Adis (IA)
              </summary>
              <p className="mt-2 text-sm text-slate-500 mb-3">
                Atajo opcional. El camino recomendado son las preguntas de abajo.
              </p>
              <Link
                href="/mi-negocio/crear?modo=adis"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-teal-200 bg-teal-50 px-4 text-sm font-bold text-teal-800"
              >
                Abrir chat con Adis
              </Link>
            </details>
          </section>
        )}

        {paso === 1 && (
          <PasoShell
            title="¿Qué vendes?"
            subtitle="Elige lo más parecido. Luego afinamos."
            onSkip={() => go(2)}
            onNext={() => go(2)}
            nextLabel="Continuar"
          >
            <div className="grid gap-3">
              {RUBROS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    const tag = r.id === 'otro' ? rubroOtro || 'otro' : r.label;
                    patchProfile({
                      tagline: tag,
                      profile_hashtags: [r.id],
                      description:
                        profile.description ||
                        (r.id === 'otro'
                          ? ''
                          : `Vendemos ${r.hint.toLowerCase()} en Cusco y alrededores.`),
                    });
                    if (r.id !== 'otro') go(2);
                  }}
                  className="w-full text-left min-h-[64px] rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:border-teal-400"
                >
                  <p className="text-[17px] font-bold text-slate-900">{r.label}</p>
                  <p className="text-sm text-slate-500">{r.hint}</p>
                </button>
              ))}
              <input
                value={rubroOtro}
                onChange={(e) => setRubroOtro(e.target.value)}
                placeholder="Si es otro, escribe aquí…"
                className="w-full min-h-[56px] rounded-2xl border border-slate-200 px-4 text-[17px]"
              />
            </div>
          </PasoShell>
        )}

        {paso === 2 && (
          <PasoShell
            title="¿Cómo se llama y cómo te ves?"
            subtitle="Si no tienes logo, sube una foto del letrero de tu local."
            onBack={() => go(1)}
            onSkip={() => go(3)}
            onNext={async () => {
              if (!profile.name?.trim()) {
                setError('Escribe el nombre de tu negocio');
                return;
              }
              setBusy(true);
              try {
                await ensureDraft({ name: profile.name.trim() });
                go(3);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Error');
              } finally {
                setBusy(false);
              }
            }}
            nextLabel="Continuar"
            busy={busy}
          >
            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-600">Nombre del negocio</span>
              <input
                value={profile.name || ''}
                onChange={(e) => patchProfile({ name: e.target.value })}
                className="w-full min-h-[56px] rounded-2xl border border-slate-200 px-4 text-[17px]"
                placeholder="Ej. Ferretería Quival"
                autoFocus
              />
            </label>
            <label className="block space-y-2 mt-4">
              <span className="text-sm font-bold text-slate-600">Logo o foto del letrero</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => onPickLogo(e.target.files?.[0] || null)}
                className="block w-full text-sm"
              />
              {profile.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.logo_url}
                  alt="Logo"
                  className="mt-2 w-24 h-24 rounded-2xl object-cover border border-slate-200"
                />
              )}
            </label>
          </PasoShell>
        )}

        {paso === 3 && (
          <PasoShell
            title="¿Dónde te encuentran?"
            subtitle="Una referencia clara vale más que la dirección exacta."
            onBack={() => go(2)}
            onSkip={() => go(4)}
            onNext={() => go(4)}
            nextLabel="Continuar"
          >
            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-600">Dirección o referencia</span>
              <input
                value={profile.contact_address || ''}
                onChange={(e) => patchProfile({ contact_address: e.target.value })}
                className="w-full min-h-[56px] rounded-2xl border border-slate-200 px-4 text-[17px]"
                placeholder="Ej. Frente al Mall Aventura, Wanchaq"
              />
            </label>
            <label className="block space-y-2 mt-4">
              <span className="text-sm font-bold text-slate-600">WhatsApp</span>
              <input
                inputMode="tel"
                value={profile.contact_whatsapp || ''}
                onChange={(e) =>
                  patchProfile({
                    contact_whatsapp: e.target.value,
                    contact_phone: e.target.value,
                  })
                }
                className="w-full min-h-[56px] rounded-2xl border border-slate-200 px-4 text-[17px]"
                placeholder="987 654 321"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                patchProfile({ contact_address: profile.contact_address || 'Atención solo por WhatsApp' });
                go(4);
              }}
              className="mt-4 w-full min-h-[56px] rounded-2xl border border-slate-300 bg-white text-[17px] font-bold text-slate-700"
            >
              No tengo local, atiendo por WhatsApp
            </button>
          </PasoShell>
        )}

        {paso === 4 && (
          <PasoShell
            title="¿Cuándo atiendes?"
            subtitle="Un toque. Ajustas después si hace falta."
            onBack={() => go(3)}
            onSkip={() => go(5)}
            onNext={() => go(5)}
            nextLabel="Continuar"
          >
            <div className="grid gap-3">
              {(
                [
                  ['lun_sab_8_18', 'Lunes a sábado, 8 a 6'],
                  ['todos_8_18', 'Todos los días, 8 a 6'],
                  ['lun_vie_9_18', 'Lunes a viernes, 9 a 6'],
                ] as const
              ).map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => {
                    patchProfile({ business_hours: presetHorario(kind) });
                    go(5);
                  }}
                  className="w-full min-h-[56px] rounded-2xl border border-slate-200 bg-white px-4 text-left text-[17px] font-bold text-slate-900 hover:border-teal-400"
                >
                  {label}
                </button>
              ))}
            </div>
          </PasoShell>
        )}

        {paso === 5 && (
          <PasoShell
            title="¿Qué vendes exactamente?"
            subtitle="Elige hasta 10 fotos. Solo escribes el precio en soles."
            onBack={() => go(4)}
            onSkip={() => go(6)}
            onNext={saveDraftProducts}
            nextLabel={draftProducts.length ? 'Guardar y ver mi perfil' : 'Continuar sin fotos'}
            busy={busy}
          >
            <label className="flex flex-col items-center justify-center min-h-[120px] rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50/50 px-4 py-6 cursor-pointer">
              <span className="text-[17px] font-bold text-teal-800">Elegir fotos de productos</span>
              <span className="text-sm text-teal-700/80 mt-1">Desde la galería o la cámara</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => onPickProducts(e.target.files)}
              />
            </label>

            {draftProducts.length > 0 && (
              <ul className="mt-4 space-y-3">
                {draftProducts.map((p, idx) => (
                  <li
                    key={p.localId}
                    className="flex gap-3 items-center rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-2">
                      <input
                        value={p.title}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDraftProducts((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, title: v } : x))
                          );
                        }}
                        className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 text-[15px]"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-[17px] font-bold text-slate-700">S/</span>
                        <input
                          inputMode="decimal"
                          value={p.price}
                          onChange={(e) => {
                            const v = e.target.value.replace(/[^\d.,]/g, '');
                            setDraftProducts((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, price: v } : x))
                            );
                          }}
                          placeholder="0.00"
                          className="w-full min-h-[48px] rounded-xl border border-slate-200 px-3 text-[17px] font-semibold"
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {productCount > 0 && draftProducts.length === 0 && (
              <p className="text-[15px] text-emerald-700 font-semibold mt-3">
                Ya tienes {productCount} producto{productCount === 1 ? '' : 's'} del aviso. Puedes
                agregar más fotos o continuar.
              </p>
            )}
          </PasoShell>
        )}

        {paso === 6 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900">Listo — así te ven tus clientes</h2>
            <p className="text-[17px] text-slate-600">
              Ábrelo, revísalo y envíatelo por WhatsApp para compartirlo fácil.
            </p>

            {profile.id && (
              <CompletitudMeter profile={profile} productCount={productCount + draftProducts.filter((p) => p.savedId).length} slug={slug} />
            )}

            {previewHref && (
              <a
                href={previewHref}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
              >
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    Vista Perfil Vivo
                  </span>
                  <span className="text-xs font-semibold text-teal-700">Abrir ↗</span>
                </div>
                <iframe
                  title="Vista previa"
                  src={previewHref}
                  className="w-full h-[420px] bg-white pointer-events-none"
                />
              </a>
            )}

            <button
              type="button"
              disabled={busy || !slug}
              onClick={finishAndSendWa}
              className="w-full min-h-[56px] rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-[17px] font-bold"
            >
              Enviármelo por WhatsApp
            </button>

            {slug && (
              <button
                type="button"
                onClick={() => router.push(`/@${slug}?edit=true`)}
                className="w-full min-h-[56px] rounded-2xl border border-slate-300 bg-white text-[17px] font-bold text-slate-800"
              >
                Seguir editando
              </button>
            )}
          </section>
        )}

        {paso > 0 && paso < 6 && previewHref && (
          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className="fixed bottom-4 right-4 z-30 rounded-full bg-slate-900 text-white text-sm font-bold px-4 py-3 shadow-lg"
          >
            Ver en vivo
          </a>
        )}
      </main>
    </div>
  );
}

function PasoShell({
  title,
  subtitle,
  children,
  onBack,
  onSkip,
  onNext,
  nextLabel = 'Continuar',
  busy,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  onBack?: () => void;
  onSkip?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  busy?: boolean;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-slate-900 leading-tight">{title}</h2>
        <p className="mt-1 text-[17px] text-slate-600 leading-snug">{subtitle}</p>
      </div>
      <div>{children}</div>
      <div className="flex flex-col gap-2 pt-2">
        {onNext && (
          <button
            type="button"
            disabled={busy}
            onClick={onNext}
            className={cn(
              'w-full min-h-[56px] rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-[17px] font-bold',
              busy && 'opacity-60'
            )}
          >
            {busy ? 'Guardando…' : nextLabel}
          </button>
        )}
        <div className="flex gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 min-h-[48px] rounded-2xl border border-slate-200 bg-white text-[15px] font-semibold text-slate-700"
            >
              Atrás
            </button>
          )}
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 min-h-[48px] rounded-2xl text-[15px] font-semibold text-slate-500"
            >
              Hacerlo después
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
