'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { useConversations } from '@/hooks/useConversations';
import { useNotifications } from '@/hooks/useNotifications';
import AuthModal from './AuthModal';
import { IconStore } from './Icons';
import { FaChartLine } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';

interface UserMenuProps {
  onProgressClick?: () => void;
  onSidebarToggle?: () => void;
}

export default function UserMenu({ onProgressClick, onSidebarToggle }: UserMenuProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile, isAnunciante, isVerificado } = useUser();
  const { unreadCount: unreadMessages } = useConversations();
  const { unreadCount: unreadNotifications } = useNotifications();
  const { t } = useTranslation();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [mostrarMenu, setMostrarMenu] = useState(false);
  const [mostrarAuthModal, setMostrarAuthModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMostrarMenu(false);
      }
    };

    if (mostrarMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mostrarMenu]);

  const goTo = (tab?: string) => {
    setMostrarMenu(false);
    router.push(tab ? `/perfil?tab=${tab}` : '/perfil');
  };

  const handleSignOut = async () => {
    await signOut();
    setMostrarMenu(false);
  };

  const nombreCompleto = profile
    ? `${profile.nombre || ''} ${profile.apellido || ''}`.trim() || profile.email || 'Usuario'
    : user?.email || 'Usuario';

  const iniciales = nombreCompleto
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  if (!user) {
    return (
      <>
        <button
          onClick={() => setMostrarAuthModal(true)}
          style={{
            backgroundColor: 'var(--brand-blue)',
            color: '#fff',
            padding: '0.5rem 1.25rem',
            borderRadius: '0.5rem',
            fontWeight: 600,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
          className="hover:opacity-90 transition-opacity"
        >
          Ingresar
        </button>
        <AuthModal abierto={mostrarAuthModal} onCerrar={() => setMostrarAuthModal(false)} />
      </>
    );
  }

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setMostrarMenu(!mostrarMenu)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isDesktop ? '0.75rem' : '0',
          padding: isDesktop ? '4px' : '2px',
          paddingRight: isDesktop ? '12px' : '2px',
          border: '1px solid var(--border-color)',
          borderRadius: '50px',
          cursor: 'pointer',
          backgroundColor: mostrarMenu ? 'var(--bg-secondary)' : 'var(--bg-primary)',
          transition: 'all 0.2s ease',
          position: 'relative',
        }}
        aria-label="Menú de usuario"
        className="hover:shadow-sm"
      >
        {(unreadMessages > 0 || unreadNotifications > 0) && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: 'var(--brand-blue)',
              border: '2px solid var(--bg-primary)',
            }}
          />
        )}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            backgroundColor: profile?.avatar_url ? 'transparent' : 'var(--brand-blue-light)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
          }}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={nombreCompleto}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span>{iniciales}</span>
          )}
        </div>

        {isDesktop && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '0 4px',
            }}
          >
            <span
              style={{
                width: '16px',
                height: '2px',
                backgroundColor: 'var(--text-secondary)',
                borderRadius: '2px',
              }}
            />
            <span
              style={{
                width: '16px',
                height: '2px',
                backgroundColor: 'var(--text-secondary)',
                borderRadius: '2px',
              }}
            />
            <span
              style={{
                width: '16px',
                height: '2px',
                backgroundColor: 'var(--text-secondary)',
                borderRadius: '2px',
              }}
            />
          </div>
        )}
      </button>

      {mostrarMenu && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.75rem)',
            right: 0,
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            minWidth: '260px',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'slideDown 0.2s ease-out',
          }}
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `,
            }}
          />

          <div
            style={{
              padding: '1.25rem',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
            }}
          >
            <button
              type="button"
              onClick={() => goTo()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                padding: 0,
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid var(--bg-primary)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={nombreCompleto}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'var(--brand-blue-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    {iniciales}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '0.925rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {nombreCompleto}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Ver mi perfil →
                </div>
              </div>
            </button>
            <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
              {isVerificado && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: '#fff',
                    backgroundColor: '#22c55e',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: 600,
                  }}
                >
                  Verificado
                </span>
              )}
              {isAnunciante && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: '#fff',
                    backgroundColor: 'var(--brand-blue)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: 600,
                  }}
                >
                  Anunciante
                </span>
              )}
            </div>
          </div>

          <div style={{ padding: '0.5rem' }}>
            <MenuItem
              icon={<IconStore size={18} />}
              label="Mi Negocio"
              onClick={() => {
                setMostrarMenu(false);
                router.push('/mi-negocio');
              }}
            />
            <MenuItem
              icon={<span style={{ fontSize: '1.1rem' }}>💬</span>}
              label="Mensajes"
              badge={unreadMessages}
              onClick={() => goTo('mensajes')}
            />
            <MenuItem
              icon={<span style={{ fontSize: '1.1rem' }}>🔔</span>}
              label="Notificaciones"
              badge={unreadNotifications}
              onClick={() => goTo('inicio')}
            />
            <MenuItem
              icon={<span style={{ fontSize: '1.1rem' }}>♥</span>}
              label="Guardados"
              onClick={() => goTo('guardados')}
            />
            <MenuItem
              icon={<span style={{ fontSize: '1.1rem' }}>⚙️</span>}
              label="Ajustes"
              onClick={() => goTo('ajustes')}
            />
            {onProgressClick && (
              <MenuItem
                icon={<FaChartLine size={16} />}
                label={t('header.progress')}
                onClick={() => {
                  setMostrarMenu(false);
                  onProgressClick();
                }}
              />
            )}

            <div
              style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.5rem 0' }}
            />

            <div style={{ padding: '0.5rem 0.75rem' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                  letterSpacing: '0.05em',
                }}
              >
                Configuración
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <LanguageSelector />
                <ThemeToggle />
              </div>
            </div>

            <div
              style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.5rem 0' }}
            />

            <MenuItem
              icon={<span style={{ fontSize: '1.1rem' }}>🚪</span>}
              label="Cerrar Sesión"
              onClick={handleSignOut}
              danger
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  badge,
  visible = true,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  badge?: number;
  visible?: boolean;
}) {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '0.75rem 1rem',
        textAlign: 'left',
        background: 'none',
        border: 'none',
        color: danger ? '#ef4444' : 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: 500,
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = danger
          ? 'rgba(239, 68, 68, 0.05)'
          : 'var(--hover-bg)';
        if (!danger) e.currentTarget.style.transform = 'translateX(4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          color: danger ? '#ef4444' : 'var(--text-secondary)',
        }}
      >
        {icon}
      </div>
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && badge > 0 && (
        <span
          style={{
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: 'var(--brand-blue)',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
          }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}
