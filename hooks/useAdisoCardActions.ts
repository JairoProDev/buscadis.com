'use client';

import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFavoritos } from '@/contexts/FavoritosContext';
import { useUI } from '@/contexts/UIContext';
import { useToast } from '@/hooks/useToast';
import {
  registrarInteraccion,
  recordInterestSignal,
  setInteractionReason,
  restaurarAdisoOculto,
} from '@/lib/interactions';
import { trackEvent } from '@/lib/events';
import { registrarFavorito } from '@/lib/analytics';
import { getAdisoAbsoluteUrl } from '@/lib/url';
import type { Adiso } from '@/types';
import type { DismissReason } from '@/lib/interactions';

export type AdisoCardActionId =
  | 'see_more'
  | 'see_less'
  | 'save'
  | 'share'
  | 'copy_link'
  | 'download'
  | 'open_page'
  | 'hide'
  | 'report';

function listingKind(adiso: Adiso): 'adiso' | 'catalog_product' {
  return adiso.privateData?.source === 'catalog_product' ? 'catalog_product' : 'adiso';
}

export function useAdisoCardActions(adiso: Adiso, opts?: { onHidden?: () => void }) {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavoritos();
  const { openAuthModal } = useUI();
  const { success, error: toastError } = useToast();

  const requireAuth = useCallback(
    (actionLabel: string): boolean => {
      if (user?.id) return true;
      openAuthModal();
      toastError(`Inicia sesión para ${actionLabel}`);
      return false;
    },
    [user?.id, openAuthModal, toastError]
  );

  const seeMore = useCallback(async () => {
    trackEvent('ad.see_more', {
      entityType: 'adiso',
      entityId: adiso.id,
      payload: { categoria: adiso.categoria, listing_kind: listingKind(adiso) },
      userId: user?.id,
      scoreDelta: 2.5,
    });
    if (user?.id) {
      await recordInterestSignal(user.id, adiso, 1);
      await registrarInteraccion(user.id, adiso.id, 'view');
    }
    success('Verás más adisos como este');
  }, [adiso, user?.id, success]);

  const seeLess = useCallback(async () => {
    trackEvent('ad.see_less', {
      entityType: 'adiso',
      entityId: adiso.id,
      payload: { categoria: adiso.categoria, listing_kind: listingKind(adiso) },
      userId: user?.id,
      scoreDelta: -1.2,
    });
    if (user?.id) {
      await recordInterestSignal(user.id, adiso, -1);
    }
    success('Verás menos adisos como este');
  }, [adiso, user?.id, success]);

  const save = useCallback(async () => {
    try {
      const newState = await toggleFavorite(adiso.id);
      if (user?.id && newState) {
        await registrarInteraccion(user.id, adiso.id, 'favorite');
        await recordInterestSignal(user.id, adiso, 1);
        registrarFavorito(user.id, adiso.id, adiso.categoria);
      }
      trackEvent('ad.favorite', {
        entityType: 'adiso',
        entityId: adiso.id,
        payload: { categoria: adiso.categoria, source: 'card_menu' },
        userId: user?.id,
      });
      success(newState ? 'Guardado en tu perfil' : 'Eliminado de guardados');
      if (!user) openAuthModal();
    } catch {
      toastError('No se pudo guardar');
    }
  }, [adiso, user, toggleFavorite, success, toastError, openAuthModal]);

  const share = useCallback(async () => {
    const url = getAdisoAbsoluteUrl(adiso);
    const title = adiso.titulo;
    trackEvent('ad.share', {
      entityType: 'adiso',
      entityId: adiso.id,
      payload: { categoria: adiso.categoria, channel: 'native_or_copy' },
      userId: user?.id,
    });
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, url });
        success('Compartido');
        return;
      }
      await navigator.clipboard.writeText(url);
      success('Enlace copiado');
    } catch {
      toastError('No se pudo compartir');
    }
  }, [adiso, user?.id, success, toastError]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getAdisoAbsoluteUrl(adiso));
      trackEvent('ad.contact_copy', {
        entityType: 'adiso',
        entityId: adiso.id,
        payload: { kind: 'listing_url', categoria: adiso.categoria },
        userId: user?.id,
      });
      success('Enlace copiado');
    } catch {
      toastError('No se pudo copiar');
    }
  }, [adiso, user?.id, success, toastError]);

  const downloadImage = useCallback(async () => {
    const url = adiso.imagenesUrls?.[0] || adiso.imagenUrl;
    if (!url || url.startsWith('data:')) {
      toastError('Este adiso no tiene imagen para descargar');
      return;
    }
    trackEvent('ad.download_image', {
      entityType: 'adiso',
      entityId: adiso.id,
      payload: { categoria: adiso.categoria },
      userId: user?.id,
    });
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${adiso.id.slice(0, 12)}.jpg`;
      a.click();
      URL.revokeObjectURL(a.href);
      success('Imagen descargada');
    } catch {
      toastError('No se pudo descargar la imagen');
    }
  }, [adiso, user?.id, success, toastError]);

  const openPage = useCallback(() => {
    window.open(getAdisoAbsoluteUrl(adiso), '_blank', 'noopener,noreferrer');
  }, [adiso]);

  const hide = useCallback(async () => {
    await opts?.onHidden?.();
    success('Ocultamos este adiso');
  }, [opts, success]);

  const report = useCallback(
    async (reason: string, details?: string) => {
      if (!requireAuth('reportar')) return;
      try {
        const res = await fetch('/api/listings/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId: adiso.id,
            listingKind: listingKind(adiso),
            reason,
            details,
            categoria: adiso.categoria,
            title: adiso.titulo,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Error');
        trackEvent('ad.report', {
          entityType: 'adiso',
          entityId: adiso.id,
          payload: { reason, categoria: adiso.categoria },
          userId: user?.id,
          scoreDelta: 0,
        });
        success('Reporte enviado. Lo revisaremos pronto.');
      } catch (e) {
        toastError(e instanceof Error ? e.message : 'No se pudo enviar el reporte');
      }
    },
    [adiso, user?.id, requireAuth, success, toastError]
  );

  const runAction = useCallback(
    async (id: AdisoCardActionId, extra?: { reportReason?: string; reportDetails?: string }) => {
      switch (id) {
        case 'see_more':
          return seeMore();
        case 'see_less':
          return seeLess();
        case 'save':
          return save();
        case 'share':
          return share();
        case 'copy_link':
          return copyLink();
        case 'download':
          return downloadImage();
        case 'open_page':
          return openPage();
        case 'hide':
          return hide();
        case 'report':
          if (extra?.reportReason) return report(extra.reportReason, extra.reportDetails);
          return;
        default:
          return;
      }
    },
    [seeMore, seeLess, save, share, copyLink, downloadImage, openPage, hide, report]
  );

  const undoHide = useCallback(async () => {
    if (user?.id) {
      await restaurarAdisoOculto(user.id, adiso.id);
    }
  }, [adiso.id, user?.id]);

  const giveFeedback = useCallback(
    async (reason: DismissReason) => {
      if (user?.id) {
        await setInteractionReason(user.id, adiso.id, reason);
        await recordInterestSignal(user.id, adiso, -1, reason);
        trackEvent('ad.dismiss_reason', {
          entityType: 'adiso',
          entityId: adiso.id,
          payload: { reason, categoria: adiso.categoria },
          userId: user?.id,
        });
      }
      success('Gracias, ajustaremos tus recomendaciones.');
    },
    [adiso, user?.id, success]
  );

  return {
    isSaved: isFavorite(adiso.id),
    runAction,
    seeMore,
    seeLess,
    save,
    share,
    copyLink,
    downloadImage,
    openPage,
    hide,
    report,
    undoHide,
    giveFeedback,
    canDownloadImage: Boolean(
      (adiso.imagenesUrls?.[0] || adiso.imagenUrl) &&
        !(adiso.imagenesUrls?.[0] || adiso.imagenUrl || '').startsWith('data:')
    ),
  };
}
