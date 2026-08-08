/**
 * Listing Card - Generative UI Component
 *
 * This component is rendered by the AI when displaying search results.
 * It's a rich, interactive card that can be embedded in the chat stream.
 */

'use client';

import React from 'react';
import { Adiso } from '@/types';
import { motion } from 'framer-motion';

export interface ListingCardProps {
  adiso: Adiso;
  onContact?: (adiso: Adiso) => void;
  onView?: (adiso: Adiso) => void;
  showActions?: boolean;
}

export function ListingCard({
  adiso,
  onContact,
  onView,
  showActions = true,
}: ListingCardProps) {
  // Use navigation context for robust handling, but fail gracefully if not inside provider
  let abrirAdiso: ((id: string) => void) | undefined;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const nav = require('@/contexts/NavigationContext').useNavigation();
    abrirAdiso = nav.abrirAdiso;
  } catch (e) {
    // Ignore if outside provider
  }

  const getCategoriaNombre = (categoria: string): string => {
    const nombres: Record<string, string> = {
      empleos: 'Empleos',
      inmuebles: 'Inmuebles',
      vehiculos: 'Vehículos',
      servicios: 'Servicios',
      productos: 'Productos',
      eventos: 'Eventos',
      negocios: 'Negocios',
      comunidad: 'Comunidad',
    };
    return nombres[categoria] || categoria;
  };

  const getCategoriaColor = (categoria: string): string => {
    const colors: Record<string, string> = {
      empleos: '#0F766E',
      inmuebles: '#047857',
      vehiculos: '#C2410C',
      servicios: '#A16207',
      productos: '#BE123C',
      eventos: '#7E22CE',
      negocios: '#4F46E5',
      comunidad: '#A21CAF',
    };
    return colors[categoria] || '#55666F';
  };

  const handleView = () => {
    if (onView) {
      onView(adiso);
    } else if (abrirAdiso) {
      abrirAdiso(adiso.id);
    } else {
      console.log('No navigation handler available for', adiso.id);
    }
  };

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onContact) {
      onContact(adiso);
    } else if (abrirAdiso) {
      abrirAdiso(adiso.id); // Default to opening ad for contact details
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      }}
      whileHover={{
        y: -2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
      onClick={handleView}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
          flex: 1,
          lineHeight: 1.4,
        }}>
          {adiso.titulo}
        </h3>
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: getCategoriaColor(adiso.categoria) + '20',
            color: getCategoriaColor(adiso.categoria),
            marginLeft: '12px',
            whiteSpace: 'nowrap',
          }}
        >
          {getCategoriaNombre(adiso.categoria)}
        </span>
      </div>

      {adiso.descripcion && (
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          margin: '0 0 12px 0',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {adiso.descripcion}
        </p>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '12px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          {adiso.ubicacion && (
            <span style={{ marginRight: '12px' }}>
              📍 {typeof adiso.ubicacion === 'string' ? adiso.ubicacion : adiso.ubicacion.distrito}
            </span>
          )}
          {adiso.fechaPublicacion && (
            <span>
              📅 {new Date(adiso.fechaPublicacion).toLocaleDateString('es-PE')}
            </span>
          )}
        </div>

        {showActions && (
          <button
            onClick={handleContact}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent-color)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Contactar
          </button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Listing Grid - Container for multiple listing cards
 */
export interface ListingGridProps {
  items: Adiso[];
  onContact?: (adiso: Adiso) => void;
  onView?: (adiso: Adiso) => void;
  maxItems?: number;
}

export function ListingGrid({
  items,
  onContact,
  onView,
  maxItems = 5,
}: ListingGridProps) {
  const displayItems = items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: '12px',
      }}>
        Encontré {items.length} resultado{items.length !== 1 ? 's' : ''}:
      </div>

      {displayItems.map((item) => (
        <ListingCard
          key={item.id}
          adiso={item}
          onContact={onContact}
          onView={onView}
        />
      ))}

      {hasMore && (
        <div style={{
          textAlign: 'center',
          padding: '12px',
          fontSize: '13px',
          color: 'var(--text-tertiary)',
        }}>
          Y {items.length - maxItems} resultado{items.length - maxItems !== 1 ? 's' : ''} más...
        </div>
      )}
    </div>
  );
}
