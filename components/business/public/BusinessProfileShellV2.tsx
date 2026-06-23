'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { IconPlus } from '@/components/Icons';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { useBusinessCart } from '@/hooks/useBusinessCart';
import BusinessShareTools from '@/components/business/public/BusinessShareTools';
import QrProfileModal from '@/components/business/qr/QrProfileModal';
import BusinessCartDrawer from '@/components/business/public/BusinessCartDrawer';
import BusinessJsonLd from '@/components/business/public/BusinessJsonLd';
import BlockRendererEngine from '@/components/business/public/BlockRendererEngine';
import CommerceDock from '@/components/business/public/CommerceDock';
import StorefrontChrome from '@/components/business/public/StorefrontChrome';
import BuscadisDiscovery from '@/components/business/public/BuscadisDiscovery';
import { businessThemeStyle, businessThemeClassName } from '@/lib/business/public-utils';
import { normalizeProfileBlocks } from '@/lib/business/blocks/normalize';
import { getTemplateById } from '@/lib/business/templates/registry';
import type { BlockRenderContext } from '@/lib/business/blocks/types';
import { PrintableCatalog } from '@/components/business/public/BusinessCatalogTab';
import type { BusinessProfileShellProps } from './BusinessProfileShell.types';
import type { BusinessReviewAggregate } from '@/types/business';
import { trackProfileEvent } from '@/lib/business/analytics/track-profile-event';
import { canUseProQr } from '@/lib/business/subscription';

export default function BusinessProfileShellV2({
  profile,
  adisos = [],
  catalogProducts = [],
  reviewAggregate: reviewAggregateProp,
  viewMode: viewModeProp,
  isPreview = false,
  onEditPart,
  editMode = false,
  onEditProduct,
  onTrackEvent,
}: BusinessProfileShellProps) {
  const { user } = useAuth();
  const { success: toastSuccess } = useToast();
  const [mounted, setMounted] = useState(false);
  const [printAdisos, setPrintAdisos] = useState(adisos);
  const [reviewAggregate, setReviewAggregate] = useState<BusinessReviewAggregate | null>(
    reviewAggregateProp ?? null
  );
  const [showOwnerTools, setShowOwnerTools] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [engaged, setEngaged] = useState(false);

  const viewMode = viewModeProp ?? (isPreview ? 'preview' : editMode ? 'editor' : 'storefront');
  const isStorefront = viewMode === 'storefront';
  const isEditor = viewMode === 'editor';
  const isPreviewMode = viewMode === 'preview';

  const { items: cartItems, count: cartCount, open: cartOpen, setOpen: setCartOpen, addItem, updateQty, removeItem } =
    useBusinessCart(profile?.id);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setPrintAdisos(adisos);
  }, [adisos]);

  useEffect(() => {
    if (reviewAggregateProp) setReviewAggregate(reviewAggregateProp);
  }, [reviewAggregateProp]);

  useEffect(() => {
    if (!profile?.slug || reviewAggregateProp) return;
    let cancelled = false;
    fetch(`/api/business/${encodeURIComponent(profile.slug)}/reviews`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.aggregate && profile?.id) {
          setReviewAggregate({
            business_profile_id: profile.id,
            avg_rating: data.aggregate.avg_rating ?? 0,
            review_count: data.aggregate.review_count ?? 0,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profile?.slug, reviewAggregateProp]);

  useEffect(() => {
    if (!isStorefront || typeof window === 'undefined') return;
    const onScroll = () => {
      const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (pct > 0.6) setEngaged(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isStorefront]);

  const isOwner = Boolean(mounted && user?.id && profile?.user_id && user.id === profile.user_id);
  const showEditControls = Boolean(isOwner && isEditor);
  const showMarketplaceChrome = false;
  const showCommerceDock = (isStorefront || isEditor) && !isPreviewMode;
  const dockBottomPad = showCommerceDock ? 'pb-24' : '';

  const templateId = profile?.template_id || 'modern_tabs';
  const template = getTemplateById(templateId);
  const blocks = useMemo(
    () => normalizeProfileBlocks(profile?.profile_blocks, templateId),
    [profile?.profile_blocks, templateId]
  );

  const track = useCallback(
    (event: Parameters<typeof trackProfileEvent>[1]) => {
      if (profile?.id) trackProfileEvent(profile.id, event);
      onTrackEvent?.(event);
    },
    [profile?.id, onTrackEvent]
  );

  const blockCtx: BlockRenderContext = useMemo(
    () => ({
      profile: profile!,
      adisos,
      catalogProducts,
      blocks,
      showEditControls,
      isPreview: isPreviewMode,
      onEditPart,
      onEditProduct,
      addItem,
      reviewAggregate,
      viewMode,
      hideMobileActionBar: showCommerceDock,
      defaultCatalogView:
        template.catalogPresentation === 'list'
          ? 'list'
          : template.catalogPresentation === 'feed' || template.catalogPresentation === 'pinned_carousel'
            ? 'feed'
            : 'grid',
      onOpenQr: profile?.slug ? () => setQrModalOpen(true) : undefined,
    }),
    [
      profile,
      adisos,
      catalogProducts,
      blocks,
      showEditControls,
      isPreviewMode,
      onEditPart,
      onEditProduct,
      addItem,
      reviewAggregate,
      viewMode,
      showCommerceDock,
      template.catalogPresentation,
    ]
  );

  const handleShare = async () => {
    if (!profile) return;
    track('share_click');
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = `Mira la tienda de ${profile.name || 'este negocio'} en Buscadis`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: profile.name || 'Negocio',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        /* cancelled */
      }
    } else if (typeof navigator !== 'undefined') {
      await navigator.clipboard.writeText(shareUrl);
      toastSuccess('Enlace copiado');
    }
  };

  const handleWhatsappClick = () => {
    track('whatsapp_click');
    setEngaged(true);
  };

  if (!profile) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[var(--bp-text-muted)]">
        Cargando perfil...
      </div>
    );
  }

  return (
    <div
      id={isPreviewMode ? undefined : 'printable-content'}
      className={cn(
        'bg-[var(--bg-secondary)] text-[var(--text-primary)]',
        isPreviewMode ? 'min-h-0 relative isolate' : 'min-h-screen',
        dockBottomPad,
        businessThemeClassName(profile),
        profile.font_family === 'mono' ? 'font-mono' : ''
      )}
      style={businessThemeStyle(profile)}
    >
      {!isPreviewMode && (
        <BusinessJsonLd profile={profile} products={adisos.slice(0, 5)} aggregate={reviewAggregate} />
      )}

      {isStorefront && <StorefrontChrome businessName={profile.name} />}

      <BlockRendererEngine
        ctx={blockCtx}
        isOwner={isOwner && isEditor}
        cartCount={cartCount}
        onShare={handleShare}
        onOpenCart={() => setCartOpen(true)}
        onEditPart={onEditPart}
        onOpenQr={() => setQrModalOpen(true)}
        ctaPlacement={template.ctaPlacement}
      />

      {profile.slug && (
        <QrProfileModal
          open={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          slug={profile.slug}
          businessName={profile.name || 'Negocio'}
          isOwner={isOwner}
          isPro={canUseProQr(profile)}
          themeColor={profile.theme_color}
        />
      )}

      {showCommerceDock && (
        <CommerceDock
          profile={profile}
          cartCount={cartCount}
          onOpenCart={() => setCartOpen(true)}
          onShare={handleShare}
          onWhatsappClick={handleWhatsappClick}
          onOpenQr={() => setQrModalOpen(true)}
        />
      )}

      {isEditor && isOwner && (
        <div className="fixed right-4 bottom-28 z-[95] flex flex-col gap-2 print:hidden md:bottom-6">
          <button
            type="button"
            onClick={() => onEditPart?.('add-product')}
            className="w-12 h-12 bg-[var(--brand-color)] text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
            title="Agregar producto"
          >
            <IconPlus size={24} />
          </button>
        </div>
      )}

      {isEditor && isOwner && (
        <>
          <button
            type="button"
            onClick={() => setQrModalOpen(true)}
            className="fixed left-4 bottom-40 z-[95] md:bottom-20 px-3 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold shadow-lg print:hidden"
          >
            QR
          </button>
          <button
            type="button"
            onClick={() => setShowOwnerTools((v) => !v)}
            className="fixed left-4 bottom-28 z-[95] md:bottom-6 px-3 py-2 rounded-full bg-[var(--bp-surface)] border border-[var(--bp-border)] text-xs font-bold shadow-lg print:hidden"
          >
            {showOwnerTools ? 'Cerrar' : 'Herramientas'}
          </button>
          {showOwnerTools && (
            <div className="fixed inset-x-4 bottom-40 z-[95] md:inset-x-auto md:left-4 md:max-w-sm print:hidden">
              <BusinessShareTools
                slug={profile.slug || ''}
                businessName={profile.name || 'Negocio'}
                onShare={handleShare}
                isPro={canUseProQr(profile)}
                themeColor={profile.theme_color}
              />
            </div>
          )}
        </>
      )}

      <BusinessCartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        businessName={profile.name || 'Negocio'}
        whatsapp={profile.contact_whatsapp}
        onUpdateQty={updateQty}
        onRemove={removeItem}
        slug={profile.slug || ''}
      />

      {isStorefront && (
        <BuscadisDiscovery
          businessSlug={profile.slug || ''}
          businessName={profile.name || 'Negocio'}
          engaged={engaged}
          onDiscoveryClick={() => track('discovery_cta_click')}
        />
      )}

      {!isPreviewMode && !showMarketplaceChrome && (
        <div className="printable-catalog hidden w-full bg-white p-8">
          <div className="max-w-4xl mx-auto">
            <PrintableCatalog profile={profile} adisos={printAdisos} />
          </div>
        </div>
      )}
    </div>
  );
}
