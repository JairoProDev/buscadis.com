'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFavoritos } from '@/contexts/FavoritosContext';
import { Adiso, UbicacionDetallada } from '@/types';
import { getAdisoByIdFromSupabase } from '@/lib/supabase';
import ModalAdiso from './ModalAdiso';
import { IconClose } from './Icons';
import { semantic } from '@/lib/bs-tokens';

interface FavoritosListProps {
  abierto: boolean;
  onCerrar: () => void;
}

// Función helper para formatear ubicación
function formatearUbicacion(ubicacion: string | UbicacionDetallada | undefined): string {
  if (typeof ubicacion === 'object' && ubicacion !== null && 'distrito' in ubicacion) {
    const ubi = ubicacion as UbicacionDetallada;
    let texto = `${ubi.distrito || ''}, ${ubi.provincia || ''}, ${ubi.departamento || ''}`.replace(/^,\s*|,\s*$/g, '');
    if (ubi.direccion) {
      texto += `, ${ubi.direccion}`;
    }
    return texto;
  }
  return typeof ubicacion === 'string' ? ubicacion : 'Sin ubicación';
}

export default function FavoritosList({ abierto, onCerrar }: FavoritosListProps) {
  const { user } = useAuth();
  const { favoritosIds, loadFavorites, removeFavorite } = useFavoritos();
  const [adisos, setAdisos] = useState<Adiso[]>([]);
  const [cargando, setCargando] = useState(false);
  const [adisoSeleccionado, setAdisoSeleccionado] = useState<Adiso | null>(null);


  const cargarFavoritos = React.useCallback(async () => {
    if (!user?.id) return;

    setCargando(true);
    try {
      // Cargar favoritos desde el contexto (1 petición)
      await loadFavorites();

      // Cargar datos completos de los adisos
      const adisosPromises = Array.from(favoritosIds).map(async (adisoId) => {
        try {
          const adiso = await getAdisoByIdFromSupabase(adisoId);
          return adiso;
        } catch (error) {
          console.error(`Error al cargar adiso ${adisoId}:`, error);
          return null;
        }
      });

      const adisosData = (await Promise.all(adisosPromises)).filter(
        (a): a is Adiso => a !== null
      );
      setAdisos(adisosData);
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
    } finally {
      setCargando(false);
    }
  }, [user, loadFavorites, favoritosIds]);

  useEffect(() => {
    if (abierto && user?.id) {
      cargarFavoritos();
    }
  }, [abierto, user?.id, cargarFavoritos]);

  const handleEliminarFavorito = async (adisoId: string) => {
    if (!user?.id) return;

    try {
      await removeFavorite(adisoId);
      setAdisos(adisos.filter(a => a.id !== adisoId));
    } catch (error) {
      console.error('Error al eliminar favorito:', error);
      alert('Error al eliminar favorito');
    }
  };

  if (!abierto) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem'
        }}
        onClick={onCerrar}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '12px',
            padding: '1.5rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              ⭐ Mis Favoritos
            </h2>
            <button
              onClick={onCerrar}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              aria-label="Cerrar"
            >
              <IconClose size={20} />
            </button>
          </div>

          {/* Lista de favoritos */}
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              Cargando favoritos...
            </div>
          ) : adisos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              No tienes favoritos guardados aún.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {adisos.map((adiso) => (
                <div
                  key={adiso.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => setAdisoSeleccionado(adiso)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                        {adiso.titulo}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {adiso.descripcion.substring(0, 100)}...
                      </p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                        {adiso.categoria} • {formatearUbicacion(adiso.ubicacion)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEliminarFavorito(adiso.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: semantic.dangerFg,
                        padding: '0.5rem',
                        fontSize: '1.25rem'
                      }}
                      aria-label="Eliminar de favoritos"
                    >
                      ⭐
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de adiso seleccionado */}
      {adisoSeleccionado && (
        <ModalAdiso
          adiso={adisoSeleccionado}
          onCerrar={() => setAdisoSeleccionado(null)}
          onAnterior={() => {
            const indice = adisos.findIndex(a => a.id === adisoSeleccionado.id);
            if (indice > 0) {
              setAdisoSeleccionado(adisos[indice - 1]);
            }
          }}
          onSiguiente={() => {
            const indice = adisos.findIndex(a => a.id === adisoSeleccionado.id);
            if (indice < adisos.length - 1) {
              setAdisoSeleccionado(adisos[indice + 1]);
            }
          }}
          puedeAnterior={adisos.findIndex(a => a.id === adisoSeleccionado.id) > 0}
          puedeSiguiente={adisos.findIndex(a => a.id === adisoSeleccionado.id) < adisos.length - 1}
        />
      )}
    </>
  );
}







