'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { IconCheck } from '@/components/Icons';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { useBusinessCart } from '@/hooks/useBusinessCart';
import BusinessJsonLd from '@/components/business/public/BusinessJsonLd';
import QrProfileModal from '@/components/business/qr/QrProfileModal';
import BusinessCartDrawer from '@/components/business/public/BusinessCartDrawer';
import BlockRendererEngine from '@/components/business/public/BlockRendererEngine';
import CommerceDock from '@/components/business/public/CommerceDock';
import { usesWireframeLayout } from '@/lib/profile/adapters/business-adapter';
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
import { useUI } from '@/contexts/UIContext';
import type { ProfileEditAccess } from '@/components/profile/ProfileChrome';

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
  canEdit: canEditProp,
  onOpenEditor,
}: BusinessProfileShellProps) {
  const { user } = useAuth();
  const { isPlatformAdmin } = useUser();
  const { success: toastSuccess, error: toastError } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [printAdisos, setPrintAdisos] = useState(adisos);
  const [reviewAggregate, setReviewAggregate] = useState<BusinessReviewAggregate | null>(
    reviewAggregateProp ?? null
  );
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const { openAuthModal } = useUI();

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
  }, [profile?.slug, profile?.id, reviewAggregateProp]);

  useEffect(() => {
    if (!isStorefront || typeof window === 'undefined') return;
    const onScroll = () => {
      const pct = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (pct > 0.6) setEngaged(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isStorefront]);

  useEffect(() => {
    if (!mounted || !user?.id || !profile?.id) {
      setIsTeamMember(false);
      return;
    }
    if (profile.user_id === user.id || isPlatformAdmin) {
      setIsTeamMember(false);
      return;
    }
    if (!supabase) {
      setIsTeamMember(false);
      return;
    }
    let cancelled = false;
    void supabase
      .from('business_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_profile_id', profile.id)
      .eq('status', 'active')
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const role = data?.role;
        setIsTeamMember(Boolean(role && ['owner', 'admin', 'editor'].includes(role)));
      });
    return () => {
      cancelled = true;
    };
  }, [mounted, user?.id, profile?.id, profile?.user_id, isPlatformAdmin]);

  const isOwner = Boolean(mounted && user?.id && profile?.user_id && user.id === profile.user_id);
  const canManageProfile = Boolean(
    canEditProp ?? (mounted && (isOwner || isTeamMember || isPlatformAdmin))
  );
  const showEditControls = Boolean(canManageProfile && isEditor);

  const editAccess: ProfileEditAccess = !mounted
    ? 'login_required'
    : canManageProfile && !isEditor
      ? 'allowed'
      : user
        ? 'denied'
        : 'login_required';

  const handleEditRequest = useCallback(() => {
    if (isEditor) return;
    if (!user) {
      openAuthModal();
      return;
    }
    if (!canManageProfile) {
      toastError('Este perfil no te pertenece. No tienes permiso para editarlo.');
      return;
    }
    onOpenEditor?.();
  }, [isEditor, user, canManageProfile, openAuthModal, onOpenEditor, toastError]);

  const showMarketplaceChrome = false;
  const showCommerceDock =
    isStorefront &&
    !isPreviewMode &&
    !usesWireframeLayout(profile ?? {});
  const showWireframeSticky =
    isStorefront &&
    !isPreviewMode &&
    usesWireframeLayout(profile ?? {});
  const dockBottomPad = showCommerceDock || (showWireframeSticky && !isEditor) ? 'pb-24' : '';

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

      <BlockRendererEngine
        ctx={blockCtx}
        isOwner={isOwner}
        canEdit={canManageProfile}
        isEditor={isEditor}
        isLoggedIn={Boolean(mounted && user)}
        userEmail={user?.email}
        cartCount={cartCount}
        onShare={handleShare}
        onOpenCart={() => setCartOpen(true)}
        onEditPart={onEditPart}
        onOpenEditor={onOpenEditor}
        onOpenQr={() => setQrModalOpen(true)}
        onWhatsappClick={handleWhatsappClick}
        editAccess={editAccess}
        onEditRequest={handleEditRequest}
        ctaPlacement={template.ctaPlacement}
      />

      {profile.slug && !isEditor && (
        <QrProfileModal
          open={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          slug={profile.slug}
          businessName={profile.name || 'Negocio'}
          isOwner={canManageProfile}
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
