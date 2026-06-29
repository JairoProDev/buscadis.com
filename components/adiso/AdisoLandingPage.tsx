'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { Adiso, Categoria } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { useAdInteraction } from '@/hooks/useAdInteraction';
import { useAdInteractionSession } from '@/hooks/useAdInteractionSession';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { getWhatsAppUrl, copiarLink, compartirNativo } from '@/lib/utils';
import { getBusinessProfilePath } from '@/lib/seo/business-metadata';
import { FIELD_QUESTIONS, type RevealField } from '@/lib/interactions/field-reveal';
import { ExternalContactChannel, resolveExternalContact } from '@/lib/adiso-contact';
import {
  formatPrecioDisplay,
  formatRelativePublishedAt,
  formatUbicacionCorta,
  getCategoriaLabel,
  getCtaLabelPorCategoria,
  getInAppCtaLabelPorCategoria,
  pickSocialBadge,
  sanitizeAdisoDescripcion,
  toDisplayTitle,
} from '@/lib/adiso-display';
import { registrarVisualizacion, registrarContacto } from '@/lib/analytics';
import { trackViewHistory } from '@/lib/profile/view-history-client';
import SimilarAdisos from '@/components/SimilarAdisos';
import {
  IconArrowLeft,
  IconCamera,
  IconCheck,
  IconClock,
  IconClose,
  IconCopy,
  IconDescription,
  IconEye,
  IconFileAlt,
  IconHeart,
  IconHeartOutline,
  IconLocation,
  IconSend,
  IconShare,
  IconStore,
  IconTag,
  IconVerified,
  IconWhatsApp,
} from '@/components/Icons';

const FIELD_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  ubicacion: IconLocation,
  precio: IconTag,
  descripcion: IconDescription,
  fotos: IconCamera,
  disponibilidad: IconClock,
  condiciones: IconFileAlt,
};

const QUICK_QUESTIONS: RevealField[] = [
  'disponibilidad',
  'precio',
  'ubicacion',
  'descripcion',
  'condiciones',
];

function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Imagen ampliada"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar imagen"
        className="fixed right-5 top-5 z-[10001] flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white"
      >
        <IconClose size={24} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="max-h-[90vh] max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  );
}

interface AdisoLandingPageProps {
  adiso: Adiso;
  onVolver: () => void;
}

export default function AdisoLandingPage({ adiso, onVolver }: AdisoLandingPageProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { user, session } = useAuth();
  const { openAuthModal, openChat } = useUI();
  const { isFavorite, toggleFav } = useAdInteraction(adiso);

  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);

  const displayTitle = toDisplayTitle(adiso.titulo);
  const displayDescription = sanitizeAdisoDescripcion(adiso.descripcion);
  const priceLabel = formatPrecioDisplay(adiso);
  const locationLabel = formatUbicacionCorta(adiso.ubicacion) || 'Perú';
  const publishedLabel = formatRelativePublishedAt(adiso) || 'Recientemente';
  const socialBadge = pickSocialBadge(adiso);
  const externalContact = resolveExternalContact(adiso);
  const ctaLabel = getCtaLabelPorCategoria(adiso.categoria);
  const inAppCtaLabel = getInAppCtaLabelPorCategoria(adiso.categoria);
  const businessSlug = (adiso.privateData as { business_slug?: string } | undefined)?.business_slug;
  const sellerName = adiso.vendedor?.nombre?.trim();
  const sellerDisplay = sellerName && sellerName.toLowerCase() !== 'anunciante' ? sellerName : null;

  const imagenes =
    adiso.imagenesUrls && adiso.imagenesUrls.length > 0
      ? adiso.imagenesUrls.filter(Boolean)
      : adiso.imagenUrl
        ? [adiso.imagenUrl]
        : [];

  const sellerUserId = adiso.user_id || adiso.usuario_id || adiso.vendedor?.id;
  const canMessageInApp = Boolean(sellerUserId);
  const { askField } = useAdInteractionSession(adiso.id, Boolean(sellerUserId && user));

  useEffect(() => {
    registrarVisualizacion(user?.id, adiso.id);
    trackViewHistory({ adisoId: adiso.id, source: 'direct' }, session?.access_token);
  }, [adiso.id, user?.id, session?.access_token]);

  const handleCopiar = async () => {
    await copiarLink(adiso);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleExternalContact = useCallback(
    (contact: ExternalContactChannel) => {
      registrarContacto(user?.id, adiso.id, adiso.categoria, 'whatsapp');
      if (contact.kind === 'email') {
        window.location.href = `mailto:${contact.valor}?subject=${encodeURIComponent(`Interesado en: ${adiso.titulo}`)}`;
        return;
      }
      if (contact.kind === 'telefono') {
        window.location.href = `tel:${contact.valor.replace(/\s/g, '')}`;
        return;
      }
      if (contact.kind === 'link') {
        window.open(contact.valor, '_blank', 'noopener,noreferrer');
        return;
      }
      window.open(getWhatsAppUrl(contact.valor, adiso.titulo, adiso), '_blank');
    },
    [adiso, user?.id],
  );

  const handleMensajeBuscadis = async () => {
    if (!sellerUserId) return;
    if (!user) {
      openAuthModal();
      return;
    }
    setEnviandoMensaje(true);
    try {
      const res = await fetch('/api/interactions/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ adisoId: adiso.id }),
      });
      const data = (await res.json()) as { conversationId?: string; adisoTitle?: string };
      if (data.conversationId) {
        openChat(data.conversationId, {
          adisoTitle: data.adisoTitle || adiso.titulo,
          adisoId: adiso.id,
        });
      }
    } finally {
      setEnviandoMensaje(false);
    }
  };

  const handleQuickQuestion = async (field: RevealField) => {
    if (user && session?.access_token) {
      await askField(field);
      return;
    }
    if (externalContact) {
      const q = FIELD_QUESTIONS[field] || 'Hola, tengo una consulta';
      if (externalContact.kind === 'whatsapp' || externalContact.kind === 'telefono') {
        const numero = externalContact.valor.replace(/\D/g, '');
        const text = encodeURIComponent(`${q}\n\nVi: ${displayTitle}`);
        window.open(`https://wa.me/${numero}?text=${text}`, '_blank');
      } else {
        handleExternalContact(externalContact);
      }
      return;
    }
    openAuthModal();
  };

  const actionBtnClass =
    'flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-blue)]/40 hover:text-[var(--brand-blue)]';

  const CtaButtons = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex gap-2.5 ${compact ? '' : 'flex-col sm:flex-row'}`}>
      {canMessageInApp && (
        <button
          type="button"
          onClick={() => void handleMensajeBuscadis()}
          disabled={enviandoMensaje}
          className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--brand-blue)] to-[#3db8d9] px-5 font-bold text-white shadow-lg shadow-[var(--brand-blue)]/25 transition-transform hover:brightness-105 active:scale-[0.98] disabled:opacity-70 ${
            compact ? 'py-3 text-sm' : 'py-4 text-base'
          }`}
        >
          <IconSend size={compact ? 18 : 20} />
          <span className="truncate">{enviandoMensaje ? 'Abriendo chat…' : inAppCtaLabel}</span>
        </button>
      )}
      {externalContact && (
        <button
          type="button"
          onClick={() => handleExternalContact(externalContact)}
          className={`flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#25D366] font-bold text-white shadow-lg shadow-[#25D366]/30 transition-transform hover:brightness-105 active:scale-[0.98] ${
            compact
              ? 'px-4 py-3'
              : canMessageInApp
                ? 'px-5 py-4 sm:w-auto'
                : 'min-w-0 flex-1 px-5 py-4 text-base'
          }`}
          aria-label={ctaLabel}
          title={ctaLabel}
        >
          <IconWhatsApp size={compact ? 22 : 24} />
          {!compact && !canMessageInApp && <span className="truncate">{ctaLabel}</span>}
        </button>
      )}
    </div>
  );

  const PurchasePanel = ({ className = '' }: { className?: string }) => (
    <div className={`flex flex-col gap-5 ${className}`}>
      {/* Negocio */}
      {(sellerDisplay || businessSlug) && (
        <Link
          href={businessSlug ? getBusinessProfilePath(businessSlug) : '#'}
          className="group flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 transition-colors hover:border-[var(--brand-blue)]/50"
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]">
            {adiso.vendedor?.avatarUrl ? (
              <Image src={adiso.vendedor.avatarUrl} alt="" fill className="object-cover" sizes="48px" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[var(--brand-blue)]">
                {(sellerDisplay || businessSlug || 'N').charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              Vendido por
            </p>
            <p className="flex items-center gap-1 truncate text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-blue)]">
              {sellerDisplay || businessSlug}
              {adiso.vendedor?.esVerificado && <IconVerified size={14} color="var(--brand-blue)" />}
            </p>
            {businessSlug && (
              <p className="text-xs font-medium text-[var(--brand-blue)]">Ver tienda →</p>
            )}
          </div>
        </Link>
      )}

      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--bg-primary)] px-3 py-1 text-xs font-bold text-[var(--text-secondary)] ring-1 ring-[var(--border-color)]">
            {getCategoriaLabel(adiso.categoria as Categoria)}
          </span>
          {socialBadge && (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
              {socialBadge.label}
            </span>
          )}
        </div>

        <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-[var(--text-primary)] lg:text-3xl xl:text-4xl">
          {displayTitle}
        </h1>
      </div>

      {priceLabel && (
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-[var(--brand-blue)] lg:text-4xl">{priceLabel}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5">
          <IconLocation size={16} color="var(--brand-blue)" />
          {locationLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <IconClock size={16} />
          {publishedLabel}
        </span>
        {(adiso.vistas ?? 0) > 0 && (
          <span className="flex items-center gap-1.5">
            <IconEye size={16} />
            {adiso.vistas} vistas
          </span>
        )}
      </div>

      <CtaButtons />

      {/* Preguntas rápidas */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
        <p className="mb-3 text-sm font-bold text-[var(--text-primary)]">Pregunta al vendedor</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((field) => {
            const Icon = FIELD_ICONS[field] || IconDescription;
            return (
              <button
                key={field}
                type="button"
                onClick={() => void handleQuickQuestion(field)}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[var(--brand-blue)]/50 bg-[rgba(var(--brand-primary-rgb),0.06)] px-3 py-2 text-xs font-semibold text-[var(--brand-blue)] transition-colors hover:bg-[rgba(var(--brand-primary-rgb),0.12)]"
              >
                <Icon size={14} />
                {FIELD_QUESTIONS[field]}
              </button>
            );
          })}
        </div>
      </div>

      {businessSlug && (
        <Link
          href={getBusinessProfilePath(businessSlug)}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-primary)] py-3.5 text-sm font-bold text-[var(--text-primary)] transition-colors hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
        >
          <IconStore size={18} />
          Explorar catálogo completo
        </Link>
      )}

      <p className="rounded-xl bg-[var(--bg-primary)] px-4 py-3 text-xs leading-relaxed text-[var(--text-tertiary)] ring-1 ring-[var(--border-color)]">
        <strong className="text-[var(--text-secondary)]">Consejo:</strong> verifica el producto en persona antes de pagar por adelantado.
      </p>
    </div>
  );

  return (
    <>
      {/* Toolbar */}
      <div
        className="sticky z-[900] border-b border-[var(--border-color)] bg-[var(--bg-primary)]/95 backdrop-blur-md"
        style={{ top: '72px' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 lg:px-8">
          <button
            type="button"
            onClick={onVolver}
            className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)]"
          >
            <IconArrowLeft size={18} />
            <span className="hidden sm:inline">Volver</span>
          </button>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => void compartirNativo(adiso)} className={actionBtnClass} aria-label="Compartir">
              <IconShare size={18} />
            </button>
            <button
              type="button"
              onClick={() => void handleCopiar()}
              className={`${actionBtnClass}${copiado ? ' border-green-500 bg-green-500 text-white' : ''}`}
              aria-label="Copiar enlace"
            >
              {copiado ? <IconCheck size={18} /> : <IconCopy size={18} />}
            </button>
            <button
              type="button"
              onClick={(e) => toggleFav(e)}
              className={`${actionBtnClass}${isFavorite ? ' border-red-400 text-red-500' : ''}`}
              aria-label="Favorito"
            >
              {isFavorite ? <IconHeart size={18} /> : <IconHeartOutline size={18} />}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-28 pt-6 lg:px-8 lg:pb-16">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-14">
          {/* Galería */}
          <div className="lg:col-span-7">
            {imagenes.length > 0 ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setLightboxUrl(imagenes[galleryIndex])}
                  className="group relative flex w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-sm"
                  style={{ minHeight: isDesktop ? '480px' : '320px', maxHeight: isDesktop ? '640px' : '420px' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagenes[galleryIndex]}
                    alt={displayTitle}
                    className="max-h-[min(640px,70vh)] w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[0.65rem] font-semibold text-white backdrop-blur-sm">
                    <IconCamera size={12} />
                    Ampliar
                  </span>
                </button>

                {imagenes.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {imagenes.map((url, i) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setGalleryIndex(i)}
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                          i === galleryIndex
                            ? 'border-[var(--brand-blue)] ring-2 ring-[var(--brand-blue)]/30'
                            : 'border-[var(--border-color)] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[280px] items-center justify-center rounded-3xl border-2 border-dashed border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-tertiary)]">
                Sin imagen
              </div>
            )}

            {/* Descripción — debajo de galería en desktop */}
            {displayDescription && (
              <section className="mt-8 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-6 lg:mt-10">
                <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">Descripción</h2>
                <div className="whitespace-pre-wrap text-base leading-relaxed text-[var(--text-secondary)]">
                  {displayDescription}
                </div>
              </section>
            )}
          </div>

          {/* Panel de compra — sticky en desktop */}
          <div className="lg:col-span-5">
            <div className="lg:sticky" style={{ top: 'calc(72px + 56px)' }}>
              <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-5 shadow-sm lg:p-6">
                <PurchasePanel />
              </div>
            </div>
          </div>
        </div>

        {/* Recomendaciones — ancho completo */}
        <div className="mt-12 border-t border-[var(--border-color)] pt-10">
          <SimilarAdisos currentAdiso={adiso} />
        </div>
      </div>

      {/* CTA fijo en móvil */}
      <div className="fixed bottom-0 left-0 right-0 z-[950] border-t border-[var(--border-color)] bg-[var(--bg-primary)]/95 p-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          {priceLabel && (
            <div className="shrink-0">
              <p className="text-[0.65rem] font-semibold uppercase text-[var(--text-tertiary)]">Precio</p>
              <p className="text-lg font-black text-[var(--brand-blue)]">{priceLabel}</p>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <CtaButtons compact />
          </div>
        </div>
      </div>

      {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </>
  );
}
