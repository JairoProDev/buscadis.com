'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Adiso, AdisoPromotionTier } from '@/types';
import { getWhatsAppUrl, copiarLink, compartirNativo } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { isMyAdiso } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/contexts/UIContext';
import { trackViewHistory } from '@/lib/profile/view-history-client';
import { registrarVisualizacion, registrarClick, registrarContacto } from '@/lib/analytics';
import { useAdInteraction } from '@/hooks/useAdInteraction';
import { useAdInteractionSession } from '@/hooks/useAdInteractionSession';
import PromoteAdisoModal from '@/components/PromoteAdisoModal';
import { IconZap } from './Icons';
import {
  IconClose,
  IconArrowLeft,
  IconArrowRight,
  IconCopy,
  IconShare,
  IconWhatsApp,
  IconCheck,
  IconHeart,
  IconHeartOutline,
  IconLocation,
  IconEmpleos,
  IconInmuebles,
  IconVehiculos,
  IconServicios,
  IconProductos,
  IconEventos,
  IconNegocios,
  IconComunidad,
  IconEdit,
  IconTrash,
  IconExternalLink,
  IconSend,
  IconEnvelope,
  IconPhone,
} from './Icons';
import { Categoria, UbicacionDetallada } from '@/types';
import { getAdisoUrl } from '@/lib/url';
import {
  pickSocialBadge,
  getCtaLabelPorCategoria,
  getInAppCtaLabelPorCategoria,
  sanitizeAdisoDescripcion,
  toDisplayTitle,
  formatPrecioDisplay,
  getCategoriaLabel,
} from '@/lib/adiso-display';
import { ExternalContactChannel, resolveExternalContact } from '@/lib/adiso-contact';

// Función helper para formatear ubicación
function formatearUbicacion(ubicacion: any): { texto: string; coordenadas: { lat: number; lng: number } | null } {
  if (typeof ubicacion === 'object' && ubicacion !== null && 'distrito' in ubicacion) {
    const ubi = ubicacion as UbicacionDetallada;
    let texto = `${ubi.distrito || ''}, ${ubi.provincia || ''}, ${ubi.departamento || ''}`.replace(/^,\s*|,\s*$/g, '');
    if (ubi.direccion) {
      texto += `, ${ubi.direccion}`;
    }
    const coords = (ubi.latitud && ubi.longitud) ? { lat: ubi.latitud, lng: ubi.longitud } : null;
    return { texto, coordenadas: coords };
  }
  return {
    texto: typeof ubicacion === 'string' ? ubicacion : 'Sin ubicación',
    coordenadas: null
  };
}

interface ModalAdisoProps {
  adiso: Adiso;
  onCerrar: () => void;
  onAnterior?: () => void;
  onSiguiente?: () => void;
  puedeAnterior: boolean;
  puedeSiguiente: boolean;
  dentroSidebar?: boolean; // Indica si está dentro del sidebar (sin overlay)
  onEditar?: (adiso: Adiso) => void; // Callback para editar adiso
  onEliminar?: (adisoId: string) => void; // Callback para eliminar adiso
  onSuccess?: (message: string) => void; // Callback para mensajes de éxito
  onError?: (message: string) => void; // Callback para mensajes de error
}

function getSellerDisplayName(adiso: Adiso): string | null {
  const rawName = adiso.vendedor?.nombre?.trim();
  if (!rawName) return null;
  if (rawName.toLowerCase() === 'anunciante') return null;
  return rawName;
}

export default function ModalAdiso({
  adiso,
  onCerrar,
  onAnterior,
  onSiguiente,
  puedeAnterior,
  puedeSiguiente,
  dentroSidebar = false,
  onEditar,
  onEliminar,
  onSuccess,
  onError
}: ModalAdisoProps) {
  const [copiado, setCopiado] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imagenAmpliada, setImagenAmpliada] = useState<{ url: string; index: number } | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [mostrarConfirmarEliminar, setMostrarConfirmarEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const esMiAdiso = isMyAdiso(adiso.id);
  const { user, session } = useAuth();
  const { openAuthModal, openChat } = useUI();
  const { isFavorite, toggleFav } = useAdInteraction(adiso);
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);

  const minSwipeDistance = 50;

  const [vistasLocales, setVistasLocales] = useState(adiso.vistas || 0);
  const [contactosLocales, setContactosLocales] = useState(adiso.contactos || 0);
  const [promotionTier, setPromotionTier] = useState<AdisoPromotionTier>(adiso.promotionTier || 'gratis');
  const [mostrarPromocionar, setMostrarPromocionar] = useState(false);
  const esPropietario = Boolean(user?.id && (adiso.usuario_id === user.id || adiso.user_id === user.id));
  const sellerName = getSellerDisplayName(adiso);
  const socialBadge = pickSocialBadge({
    ...adiso,
    vistas: vistasLocales,
    contactos: contactosLocales,
  });
  const ctaLabel = getCtaLabelPorCategoria(adiso.categoria);
  const inAppCtaLabel = getInAppCtaLabelPorCategoria(adiso.categoria);
  const externalContact = resolveExternalContact(adiso);
  const displayTitle = toDisplayTitle(adiso.titulo);
  const displayDescription = sanitizeAdisoDescripcion(adiso.descripcion);
  const priceLabel = formatPrecioDisplay(adiso);

  const imagenesGaleria =
    adiso.imagenesUrls && adiso.imagenesUrls.length > 0
      ? adiso.imagenesUrls.filter(Boolean)
      : adiso.imagenUrl
        ? [adiso.imagenUrl]
        : [];

  // Cuando cambia el adiso, reiniciamos el estado local con los valores del nuevo adiso
  useEffect(() => {
    setVistasLocales(adiso.vistas || 0);
    setContactosLocales(adiso.contactos || 0);
    setGalleryIndex(0);
    setPromotionTier(adiso.promotionTier || 'gratis');
  }, [adiso.id, adiso.vistas, adiso.contactos, adiso.promotionTier]);

  // Registrar visualización + dwell time al cerrar
  useEffect(() => {
    const openedAt = Date.now();
    registrarVisualizacion(user?.id, adiso.id);
    trackViewHistory({ adisoId: adiso.id, source: 'direct' }, session?.access_token);
    setVistasLocales((prev) => prev + 1);

    return () => {
      const dwellSec = Math.round((Date.now() - openedAt) / 1000);
      if (dwellSec >= 3) {
        void registrarVisualizacion(user?.id, adiso.id, dwellSec);
      }
    };
  }, [user?.id, adiso.id, session?.access_token]);


  const getCategoriaTheme = (categoria: Categoria) => {
    const themes: Record<Categoria, { color: string; bg: string; iconBg: string }> = {
      empleos: { color: '#2c3e50', bg: 'rgba(44, 62, 80, 0.05)', iconBg: 'from-[#2c3e50] to-[#4b79a1]' },
      inmuebles: { color: '#134E5E', bg: 'rgba(19, 78, 94, 0.05)', iconBg: 'from-[#134E5E] to-[#71B280]' },
      vehiculos: { color: '#1A2980', bg: 'rgba(26, 41, 128, 0.05)', iconBg: 'from-[#1A2980] to-[#26D0CE]' },
      servicios: { color: '#f2994a', bg: 'rgba(242, 153, 74, 0.05)', iconBg: 'from-[#f2994a] to-[#f2c94c]' },
      productos: { color: '#b31217', bg: 'rgba(179, 18, 23, 0.05)', iconBg: 'from-[#e52d27] to-[#b31217]' },
      eventos: { color: '#4facfe', bg: 'rgba(79, 172, 254, 0.05)', iconBg: 'from-[#4facfe] to-[#00f2fe]' },
      negocios: { color: '#434343', bg: 'rgba(67, 67, 67, 0.05)', iconBg: 'from-[#434343] to-[#000000]' },
      comunidad: { color: '#0072ff', bg: 'rgba(0, 114, 255, 0.05)', iconBg: 'from-[#00c6ff] to-[#0072ff]' },
    };
    return themes[categoria] || themes.productos;
  };

  const theme = getCategoriaTheme(adiso.categoria);

  const getCategoriaIcon = (categoria: Categoria): React.ComponentType<{ size?: number; color?: string; className?: string }> => {
    const iconMap: Record<Categoria, React.ComponentType<{ size?: number; color?: string; className?: string }>> = {
      empleos: IconEmpleos,
      inmuebles: IconInmuebles,
      vehiculos: IconVehiculos,
      servicios: IconServicios,
      productos: IconProductos,
      eventos: IconEventos,
      negocios: IconNegocios,
      comunidad: IconComunidad,
    };
    return iconMap[categoria];
  };

  // Actualizar URL del navegador al abrir adiso (SEO Friendly)
  useEffect(() => {
    // Solo actualizar URL si NO estamos en el sidebar (para evitar conflictos con el estado de la home)
    // O si estamos en modo standalone/mobile específico
    if (adiso && !dentroSidebar) {
      const seoUrl = getAdisoUrl(adiso);
      // Solo actualizar si es diferente para no llenar el historial
      if (typeof window !== 'undefined' && window.location.pathname !== seoUrl && !window.location.pathname.includes('/admin')) {
        window.history.replaceState(null, '', seoUrl);
      }
    }
  }, [adiso, dentroSidebar]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (imagenAmpliada) {
          setImagenAmpliada(null);
        } else {
          onCerrar();
        }
      } else if (imagenAmpliada) {
        // Navegación entre imágenes ampliadas
        const imagenes = adiso.imagenesUrls && adiso.imagenesUrls.length > 0
          ? adiso.imagenesUrls
          : adiso.imagenUrl ? [adiso.imagenUrl] : [];

        if (e.key === 'ArrowLeft' && imagenAmpliada.index > 0) {
          setImagenAmpliada({ url: imagenes[imagenAmpliada.index - 1], index: imagenAmpliada.index - 1 });
        } else if (e.key === 'ArrowRight' && imagenAmpliada.index < imagenes.length - 1) {
          setImagenAmpliada({ url: imagenes[imagenAmpliada.index + 1], index: imagenAmpliada.index + 1 });
        }
      } else if (e.key === 'ArrowLeft' && puedeAnterior && onAnterior) {
        onAnterior();
      } else if (e.key === 'ArrowRight' && puedeSiguiente && onSiguiente) {
        onSiguiente();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCerrar, onAnterior, onSiguiente, puedeAnterior, puedeSiguiente, imagenAmpliada, adiso]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && puedeSiguiente && onSiguiente) {
      onSiguiente();
    } else if (isRightSwipe && puedeAnterior && onAnterior) {
      onAnterior();
    }
  };

  const handleCopiarLink = async () => {
    try {
      await copiarLink(adiso);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };

  const handleCompartir = async () => {
    await compartirNativo(adiso);
  };

  const handleContactar = async (contactoEspecifico?: string) => {
    const contactoAUsar = contactoEspecifico || adiso.contacto;

    // Verificar si el anuncio está caducado o es histórico
    const ahora = new Date();
    const estaCaducado =
      adiso.estaActivo === false ||
      (adiso.fechaExpiracion && new Date(adiso.fechaExpiracion) < ahora);
    const esHistorico = adiso.esHistorico === true;

    if (estaCaducado || esHistorico) {
      // Anuncio caducado o histórico - redirigir a WhatsApp del admin
      // Número de WhatsApp del administrador (sin +51 ni espacios)
      const adminWhatsApp = '937054328'; // Tu número de WhatsApp

      // Generar URL completa del aviso
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://adis.lat';
      const adisoUrl = `${baseUrl}${getAdisoUrl(adiso)}`;

      // Crear mensaje que parezca natural del usuario pero con info necesaria
      // Incluye el link para que puedas acceder rápidamente a la info del anunciante
      const mensaje = `Hola! Me interesa este anuncio: ${adiso.categoria === 'inmuebles' ? '¿Sigue disponible?' :
        adiso.categoria === 'empleos' ? '¿Aún están contratando?' :
          adiso.categoria === 'vehiculos' ? '¿Aún está en venta?' :
            '¿Sigue disponible?'
        }

${adisoUrl}

Ref: ${adiso.edicionNumero || adiso.id}`;

      // URL de WhatsApp con el mensaje predeterminado
      const whatsappUrl = `https://wa.me/51${adminWhatsApp}?text=${encodeURIComponent(mensaje)}`;

      // Registrar analytics si hay usuario
      if (user?.id) {
        registrarContacto(user.id, adiso.id, adiso.categoria, 'whatsapp');
      }

      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank');
      return;
    }

    // Anuncio activo - contacto directo normal
    setContactosLocales(prev => prev + 1);
    registrarContacto(user?.id, adiso.id, adiso.categoria, 'whatsapp');

    // Determinar tipo de contacto y abrir según corresponda

    if (contactoEspecifico) {
      // Si es un contacto específico de contactosMultiples, verificar tipo
      const contactoObj = adiso.contactosMultiples?.find(c => c.valor === contactoEspecifico);
      if (contactoObj?.tipo === 'whatsapp' || contactoObj?.tipo === 'telefono') {
        window.open(getWhatsAppUrl(contactoAUsar, adiso.titulo, adiso), '_blank');
      } else if (contactoObj?.tipo === 'email') {
        window.location.href = `mailto:${contactoAUsar}?subject=Interesado en: ${encodeURIComponent(adiso.titulo)}`;
      } else {
        // Por defecto, intentar WhatsApp
        window.open(getWhatsAppUrl(contactoAUsar, adiso.titulo, adiso), '_blank');
      }
    } else {
      window.open(getWhatsAppUrl(contactoAUsar, adiso.titulo, adiso), '_blank');
    }
  };

  const handleExternalContact = async (channel?: ExternalContactChannel | null) => {
    const contact = channel ?? externalContact;
    if (!contact) return;

    const ahora = new Date();
    const estaCaducado =
      adiso.estaActivo === false ||
      (adiso.fechaExpiracion && new Date(adiso.fechaExpiracion) < ahora);
    const esHistorico = adiso.esHistorico === true;

    if (estaCaducado || esHistorico) {
      await handleContactar();
      return;
    }

    setContactosLocales((prev) => prev + 1);
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
  };

  const sellerUserId = adiso.user_id || adiso.usuario_id || adiso.vendedor?.id;
  const canAutoInteract = Boolean(sellerUserId && !esMiAdiso && user);
  const { askField, isRevealed, upsell: interactionUpsell } = useAdInteractionSession(
    adiso.id,
    canAutoInteract
  );

  const handleMensajeBuscadis = async () => {
    if (!sellerUserId || esMiAdiso) return;
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

  const handleEditar = () => {
    if (onEditar) {
      onEditar(adiso);
    }
  };

  const handleEliminarClick = () => {
    setMostrarConfirmarEliminar(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!onEliminar) return;

    setEliminando(true);
    try {
      await onEliminar(adiso.id);
      setMostrarConfirmarEliminar(false);
      onCerrar(); // Cerrar el modal después de eliminar
    } catch (error) {
      console.error('Error al eliminar adiso:', error);
      setEliminando(false);
    }
  };

  const handleCancelarEliminar = () => {
    setMostrarConfirmarEliminar(false);
    setEliminando(false);
  };

  // --- RENDER LOGIC ---

  const actionBtnClass =
    'flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] active:bg-[var(--bg-secondary)]';

  const ActionButtons = () => (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleCompartir}
        className={actionBtnClass}
        title="Compartir"
        aria-label="Compartir"
      >
        <IconShare size={18} />
      </button>
      <button
        type="button"
        onClick={handleCopiarLink}
        className={`${actionBtnClass}${copiado ? ' bg-[#22c55e] text-white hover:bg-[#22c55e] active:bg-[#16a34a]' : ''}`}
        title="Copiar enlace"
        aria-label="Copiar enlace"
      >
        {copiado ? <IconCheck size={18} /> : <IconCopy size={18} />}
      </button>
      <button
        type="button"
        onClick={(e) => toggleFav(e)}
        className={`${actionBtnClass}${isFavorite ? ' text-red-500 active:bg-red-500/10' : ''}`}
        title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      >
        {isFavorite ? (
          <IconHeart size={18} className="text-red-500" />
        ) : (
          <IconHeartOutline size={18} />
        )}
      </button>
    </div>
  );

  const canMessageInApp = !!sellerUserId && !esMiAdiso;

  const ExternalContactIcon = ({ channel }: { channel: ExternalContactChannel }) => {
    if (channel.kind === 'email') return <IconEnvelope size={22} />;
    if (channel.kind === 'telefono') return <IconPhone size={20} />;
    if (channel.kind === 'link') return <IconExternalLink size={20} />;
    return <IconWhatsApp size={22} />;
  };

  const externalBtnAccent =
    externalContact?.kind === 'email'
      ? '#6366f1'
      : externalContact?.kind === 'telefono'
        ? '#0ea5e9'
        : externalContact?.kind === 'link'
          ? 'var(--brand-blue)'
          : '#25D366';

  const ContactFooter = () => {
    if (esMiAdiso || esPropietario) return null;

    const showInApp = canMessageInApp;
    const showExternal = Boolean(externalContact);

    if (!showInApp && !showExternal) return null;

    return (
      <div className="flex shrink-0 gap-2 border-t border-[var(--border-color)] bg-[var(--bg-primary)] p-3 shadow-[var(--shadow-up)]">
        {showInApp ? (
          <button
            type="button"
            onClick={() => void handleMensajeBuscadis()}
            disabled={enviandoMensaje}
            className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue)] px-4 py-3.5 text-sm font-bold text-white transition-transform hover:brightness-105 active:scale-[0.98] disabled:opacity-70"
          >
            <IconSend size={18} />
            <span className="truncate">{enviandoMensaje ? 'Abriendo chat…' : inAppCtaLabel}</span>
          </button>
        ) : showExternal && externalContact ? (
          <button
            type="button"
            onClick={() => void handleExternalContact(externalContact)}
            className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-transform hover:brightness-105 active:scale-[0.98]"
            style={{
              backgroundColor: externalBtnAccent,
              boxShadow: `0 8px 20px -6px ${externalBtnAccent}66`,
            }}
          >
            <ExternalContactIcon channel={externalContact} />
            <span className="truncate">{ctaLabel}</span>
          </button>
        ) : null}

        {showInApp && showExternal && externalContact && (
          <button
            type="button"
            onClick={() => void handleExternalContact(externalContact)}
            aria-label={externalContact.ariaLabel}
            title={externalContact.ariaLabel}
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl border border-[var(--border-color)] text-white transition-transform hover:brightness-105 active:scale-[0.98]"
            style={{ backgroundColor: externalBtnAccent }}
          >
            <ExternalContactIcon channel={externalContact} />
          </button>
        )}
      </div>
    );
  };

  const galleryNavBtnStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  };

  const askBtnStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1px dashed var(--brand-blue)',
    background: 'rgba(var(--brand-primary-rgb), 0.06)',
    color: 'var(--brand-blue)',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left' as const,
    width: '100%',
  };

  const ContentBody = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {imagenesGaleria.length > 0 && (
        <div>
          <div
            onClick={() => setImagenAmpliada({ url: imagenesGaleria[galleryIndex], index: galleryIndex })}
            style={{
              position: 'relative',
              width: '100%',
              height: '280px',
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: 'zoom-in',
            }}
          >
            <Image
              src={imagenesGaleria[galleryIndex]}
              alt={displayTitle}
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
          {imagenesGaleria.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setGalleryIndex((i) => Math.max(0, i - 1))}
                disabled={galleryIndex === 0}
                style={galleryNavBtnStyle}
                aria-label="Imagen anterior"
              >
                <IconArrowLeft size={16} />
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {galleryIndex + 1} / {imagenesGaleria.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = Math.min(imagenesGaleria.length - 1, galleryIndex + 1);
                  setGalleryIndex(next);
                  void askField('fotos', next);
                }}
                disabled={galleryIndex >= imagenesGaleria.length - 1}
                style={galleryNavBtnStyle}
                aria-label="Imagen siguiente"
              >
                <IconArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {(promotionTier === 'destacada' || promotionTier === 'premium') && (
        <span
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '0.7rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: promotionTier === 'premium' ? '#fff' : '#b8860b',
            background: promotionTier === 'premium'
              ? 'linear-gradient(135deg, var(--brand-blue), var(--brand-yellow))'
              : 'rgba(var(--brand-yellow-rgb), 0.18)',
          }}
        >
          {promotionTier === 'premium' ? '👑 Premium' : '⭐ Destacado'}
        </span>
      )}

      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.25, color: 'var(--text-primary)' }}>
        {displayTitle}
      </h2>

      {displayDescription && (
        <div style={{ fontSize: '0.9375rem', lineHeight: 1.55, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
          {displayDescription}
        </div>
      )}

      <div style={{
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '16px',
        gap: '10px',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
          {getCategoriaLabel(adiso.categoria)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ color: theme.color }}>
            <IconLocation size={18} />
          </div>
          {isRevealed('ubicacion') ? (
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {formatearUbicacion(adiso.ubicacion).texto}
            </span>
          ) : (
            <button type="button" style={askBtnStyle} onClick={() => void askField('ubicacion')}>
              ¿Dónde puedo verlo o recogerlo?
            </button>
          )}
        </div>
        {isRevealed('precio') && priceLabel ? (
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-blue)' }}>{priceLabel}</div>
        ) : (
          <button type="button" style={askBtnStyle} onClick={() => void askField('precio')}>
            ¿Cuál es el precio?
          </button>
        )}
        {interactionUpsell && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>
            Con un plan pago las respuestas pueden ser automáticas e instantáneas.
          </p>
        )}
        {sellerName && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Publicado por <strong>{sellerName}</strong>
          </div>
        )}
      </div>

      {socialBadge && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          {socialBadge.label}
        </div>
      )}

      {esPropietario && (
        <button
          type="button"
          onClick={() => setMostrarPromocionar(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '0.75rem 1rem',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <IconZap size={16} color="var(--brand-yellow)" />
          {promotionTier === 'gratis' ? 'Promocionar este anuncio' : 'Gestionar promoción'}
        </button>
      )}
    </div>
  );

  // --- MOBILE SHEET VIEW ---
  if (!isDesktop && !dentroSidebar) {
    return (
      <>
        <AnimatePresence>
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000 }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
              onClick={onCerrar}
            />

            {/* Sheet */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 100 || velocity.y > 500) {
                  onCerrar();
                }
              }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '92vh',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '24px 24px 0 0',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
                overflow: 'hidden'
              }}
            >
              {/* Header Fixed */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: 'var(--bg-primary)',
                zIndex: 10
              }}>
                {/* Handle */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                  <div style={{ width: '40px', height: '4px', borderRadius: '4px', backgroundColor: 'var(--border-color)' }} />
                </div>

                {/* Top Actions Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    color: 'var(--brand-blue)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: 'rgba(var(--brand-primary-rgb), 0.12)',
                    padding: '4px 12px',
                    borderRadius: '20px'
                  }}>
                    Detalle de Adiso
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ActionButtons />
                    <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />
                    <button
                      type="button"
                      onClick={onCerrar}
                      aria-label="Cerrar detalle"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] active:bg-[var(--bg-secondary)]"
                    >
                      <IconClose size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '32px' }}>
                <ContentBody />
              </div>

              {/* Sticky Footer CTA */}
              <ContactFooter />
            </motion.div>
          </div>
        </AnimatePresence>

        {/* Image Viewer Component (Standalone) */}
        {imagenAmpliada && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 3000, backgroundColor: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setImagenAmpliada(null)}>
            <button onClick={() => setImagenAmpliada(null)} style={{ position: 'absolute', top: '20px', right: '20px', color: 'white', background: 'none', border: 'none', zIndex: 3001 }}>
              <IconClose size={32} />
            </button>
            <img src={imagenAmpliada.url} alt="Full screen" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        )}

        {mostrarPromocionar && (
          <PromoteAdisoModal
            adiso={adiso}
            onClose={() => setMostrarPromocionar(false)}
            onPromoted={(tier) => {
              setPromotionTier(tier);
              setMostrarPromocionar(false);
            }}
          />
        )}
      </>
    );
  }

  // --- DESKTOP MODAL VIEW (OR SIDEBAR VIEW) ---
  const isSidebar = dentroSidebar;

  return (
    <>
      <div
        ref={modalRef}
        className={isSidebar ? 'flex h-full min-h-0 flex-col' : undefined}
        style={{
          // Desktop Overlay or Sidebar Container logic
          position: isSidebar ? 'relative' : 'fixed',
          inset: isSidebar ? 'auto' : 0,
          zIndex: isSidebar ? 'auto' : 1500,
          backgroundColor: isSidebar ? 'transparent' : 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'flex-end',
          pointerEvents: 'auto'
        }}
        onClick={(e) => {
          if (!isSidebar && e.target === e.currentTarget) onCerrar();
        }}
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden" style={{
          width: isSidebar ? '100%' : '480px',
          maxWidth: '100%',
          backgroundColor: 'var(--bg-primary)',
          boxShadow: isSidebar ? 'none' : '-10px 0 40px rgba(0,0,0,0.1)',
          position: 'relative'
        }} onClick={e => e.stopPropagation()}>

          {/* Desktop Header */}
          <div className="flex shrink-0 items-center justify-between px-4 py-3">
            <div className="text-base font-semibold text-[var(--text-primary)]">Detalle de Adiso</div>
            <div className="flex items-center gap-1">
              <ActionButtons />
              <button
                type="button"
                onClick={onCerrar}
                aria-label="Cerrar detalle"
                className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--hover-bg)] active:bg-[var(--bg-secondary)]"
              >
                <IconClose size={18} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <ContentBody />
          </div>

          {/* Footer */}
          <ContactFooter />
        </div>
      </div>

      {/* Image Viewer Global */}
      {imagenAmpliada && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)' }} onClick={() => setImagenAmpliada(null)}>
          <button onClick={() => setImagenAmpliada(null)} style={{ position: 'absolute', top: '2rem', right: '2rem', color: 'white', background: 'rgba(255,255,255,0.2)', border: 'none', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconClose size={24} />
          </button>
          <img src={imagenAmpliada.url} alt="Full screen" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
        </div>
      )}

      {mostrarPromocionar && (
        <PromoteAdisoModal
          adiso={adiso}
          onClose={() => setMostrarPromocionar(false)}
          onPromoted={(tier) => {
            setPromotionTier(tier);
            setMostrarPromocionar(false);
          }}
        />
      )}
    </>
  );
}
