'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { updateProfile, updateUserPreferences } from '@/lib/user';
import { Profile, UserPreferences } from '@/types';
import VerificationBadge from './VerificationBadge';
import LocationPrompt from './LocationPrompt';
import { IconClose } from './Icons';
import { semantic, tokens } from '@/lib/bs-tokens';

interface UserProfileProps {
  abierto: boolean;
  onCerrar: () => void;
}

export default function UserProfile({ abierto, onCerrar }: UserProfileProps) {
  const { user, profile: profileContext, refreshProfile } = useAuth();
  const { profile, preferences } = useUser();
  const [editando, setEditando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mostrarLocationPrompt, setMostrarLocationPrompt] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    bio: '',
    website: '',
    fecha_nacimiento: '',
    genero: '' as 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir' | ''
  });

  useEffect(() => {
    if (profile && abierto) {
      setFormData({
        nombre: profile.nombre || '',
        apellido: profile.apellido || '',
        telefono: profile.telefono || '',
        bio: profile.bio || '',
        website: profile.website || '',
        fecha_nacimiento: profile.fecha_nacimiento || '',
        genero: profile.genero || ''
      });
    }
  }, [profile, abierto]);

  if (!abierto || !user) return null;

  const handleGuardar = async () => {
    if (!user?.id) return;

    setCargando(true);
    try {
      // Convertir cadena vacía a undefined para genero (compatibilidad con tipo Genero)
      const profileData = {
        ...formData,
        genero: formData.genero === '' ? undefined : (formData.genero as 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir' | undefined)
      };
      await updateProfile(user.id, profileData);
      await refreshProfile();
      setEditando(false);
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      alert('Error al actualizar perfil');
    } finally {
      setCargando(false);
    }
  };

  const nombreCompleto = profile
    ? `${profile.nombre || ''} ${profile.apellido || ''}`.trim() || profile.email || 'Usuario'
    : user?.email || 'Usuario';

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
          zIndex: 3000,
          padding: '1rem'
        }}
        onClick={onCerrar}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              👤 Mi Perfil
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

          {!editando ? (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Nombre completo
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {nombreCompleto}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Email
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {user.email}
                </div>
              </div>

              {profile?.telefono && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Teléfono
                  </div>
                  <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {profile.telefono}
                  </div>
                </div>
              )}

              {profile?.bio && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Biografía
                  </div>
                  <div style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                    {profile.bio}
                  </div>
                </div>
              )}

              {profile?.ubicacion && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Ubicación
                  </div>
                  <div style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                    {profile.ubicacion}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <VerificationBadge esVerificado={profile?.es_verificado || false} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                <button
                  onClick={() => setEditando(true)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: 'var(--text-primary)',
                    color: 'var(--bg-primary)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Editar Perfil
                </button>
                {!profile?.ubicacion && (
                  <button
                    onClick={() => setMostrarLocationPrompt(true)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    📍 Agregar Ubicación
                  </button>
                )}
              </div>

              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                  Negocio & Tienda
                </h3>
                <button
                  onClick={() => {
                    window.location.href = '/mi-negocio';
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: `linear-gradient(to right, ${semantic.action}, ${tokens['--bs-cat-eventos-fg']})`,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                  }}
                >
                  <span>🛍️</span> Crear / Gestionar Mi Negocio Digital
                </button>
                <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Tu propia página web con catálogo, linktree y más.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Apellido
                </label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Biografía
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setEditando(false)}
                  disabled={cargando}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: cargando ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={cargando}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: cargando ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    color: 'var(--bg-primary)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: cargando ? 'not-allowed' : 'pointer'
                  }}
                >
                  {cargando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <LocationPrompt
        abierto={mostrarLocationPrompt}
        onCerrar={() => setMostrarLocationPrompt(false)}
        onAceptar={() => {
          refreshProfile();
          setMostrarLocationPrompt(false);
        }}
      />
    </>
  );
}



