'use client';

import React from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  FaSearch, FaMap, FaBullhorn, FaStore, FaGift,
  FaRobot, FaHeart, FaEyeSlash, FaUserCircle, FaCog,
  FaChartLine, FaBook, FaQuestionCircle, FaSignOutAlt,
  FaTimes
} from 'react-icons/fa';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import { Adiso } from '@/types';
import { SeccionSidebar } from './SidebarDesktop';
import ModalAdiso from './ModalAdiso';
import MapaInteractivo from './MapaInteractivo';
import FormularioPublicar from './FormularioPublicar';
import AdisosGratuitos from './AdisosGratuitos';
import ChatbotIANew from './ChatbotIANew';
import { IconSparkles } from './Icons';

interface ModalNavegacionMobileProps {
  abierto: boolean;
  onCerrar: () => void;
  onOpenFavorites?: () => void;
  onOpenHidden?: () => void;
  seccionInicial?: SeccionSidebar;
  adisoAbierto?: Adiso | null;
  onCerrarAdiso?: () => void;
  onAnterior?: () => void;
  onSiguiente?: () => void;
  puedeAnterior?: boolean;
  puedeSiguiente?: boolean;
  onPublicar?: (adiso: Adiso) => void;
  todosLosAdisos?: Adiso[];
  onError?: (msg: string) => void;
  onSuccess?: (msg: string) => void;
  onCambiarSeccion?: (seccion: SeccionSidebar) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
  authenticated?: boolean; // true = solo autenticados, false = solo invitados, undefined = todos
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function ModalNavegacionMobile({
  abierto,
  onCerrar,
  onOpenFavorites,
  onOpenHidden,
  seccionInicial,
  adisoAbierto,
  onCerrarAdiso,
  onAnterior,
  onSiguiente,
  puedeAnterior = false,
  puedeSiguiente = false,
  onPublicar,
  todosLosAdisos = [],
  onError,
  onSuccess,
  onCambiarSeccion
}: ModalNavegacionMobileProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { user, signOut } = useAuth();
  const router = useRouter();
  const isAuthenticated = !!user;

  // Don't show if not open
  if (!abierto) {
    return null;
  }

  const handleItemClick = (item: MenuItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      router.push(item.href);
    }
    onCerrar();
  };

  const menuSections: MenuSection[] = [
    {
      title: '🔍 Explorar',
      items: [
        {
          id: 'negocio',
          label: 'Mi Negocio',
          icon: FaStore,
          href: '/mi-negocio'
        },
        {
          id: 'buscar',
          label: 'Buscar Anuncios',
          icon: FaSearch,
          href: '/'
        },
        {
          id: 'mapa',
          label: 'Mapa Interactivo',
          icon: FaMap,
          href: '/mapa'
        },
        {
          id: 'gratuitos',
          label: 'Anuncios Gratuitos',
          icon: FaGift,
          href: '/gratuitos'
        },
      ]
    },
    {
      title: '📢 Mis Acciones',
      items: [
        {
          id: 'publicar',
          label: 'Publicar Anuncio',
          icon: FaBullhorn,
          href: '/publicar',
          authenticated: true
        },
        {
          id: 'negocio',
          label: 'Mi Negocio',
          icon: FaStore,
          href: '/mi-negocio',
          authenticated: true
        },
        {
          id: 'favoritos',
          label: 'Mis Favoritos',
          icon: FaHeart,
          href: '/favoritos',
          authenticated: true
        },
        {
          id: 'ocultos',
          label: 'Anuncios Ocultos',
          icon: FaEyeSlash,
          href: '/ocultos',
          authenticated: true
        },
      ]
    },
    {
      title: '🤖 Asistente',
      items: [
        {
          id: 'chatbot',
          label: 'Chat IA',
          icon: FaRobot,
          href: '/chat'
        },
      ]
    },
    {
      title: '👤 Mi Cuenta',
      items: [
        {
          id: 'perfil',
          label: 'Mi Perfil',
          icon: FaUserCircle,
          href: '/perfil',
          authenticated: true
        },
        {
          id: 'progreso',
          label: 'Mi Progreso',
          icon: FaChartLine,
          href: '/progreso',
          authenticated: true
        },
        /*
      {
        id: 'configuracion',
        label: 'Configuración',
        icon: FaCog,
        href: '/configuracion'
      },
        */
      ]
    },
    {
      title: '📚 Ayuda',
      items: [
        {
          id: 'ayuda',
          label: 'Centro de Ayuda',
          icon: FaQuestionCircle,
          href: '/ayuda'
        },
        {
          id: 'guia',
          label: 'Guía de Uso',
          icon: FaBook,
          href: '/guia'
        },
      ]
    }
  ];

  // Filter items based on authentication
  const filteredSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.authenticated === undefined) return true;
      if (item.authenticated === true) return isAuthenticated;
      if (item.authenticated === false) return !isAuthenticated;
      return true;
    })
  })).filter(section => section.items.length > 0);

  return (
    <>
      {/* Overlay - only render when open */}
      {abierto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 2000,
            transition: 'opacity 0.3s ease'
          }}
          onClick={onCerrar}
        />
      )}

      {/* Sidebar Panel - only render when open */}
      {abierto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            left: 'auto',
            bottom: 0,
            width: '60vw',
            minWidth: '250px',
            maxWidth: '400px',
            backgroundColor: 'var(--bg-primary)',
            zIndex: 2001,
            display: 'flex',
            flexDirection: 'column',
            transform: abierto ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: 'var(--shadow-lg)',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isAuthenticated && user ? '1rem' : '0' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                {seccionInicial ? (
                  seccionInicial === 'adiso' ? 'Detalle de Adiso' :
                    seccionInicial === 'mapa' ? 'Mapa' :
                      seccionInicial === 'publicar' ? 'Publicar' :
                        seccionInicial === 'chatbot' ? 'Asistente' :
                          seccionInicial === 'gratuitos' ? 'Gratuitos' :
                            'Sección'
                ) : 'Menú Principal'}
              </h2>
              <button
                onClick={onCerrar}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* User Info if authenticated */}
            {isAuthenticated && user && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-blue)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 700
                }}>
                  {user.email?.[0]?.toUpperCase() || '👤'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                    {user.email}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Usuario verificado ✓
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Menu Content or Section Content */}
          <div style={{ flex: 1, padding: seccionInicial ? '0' : '0.5rem', overflowY: 'auto' }}>
            {seccionInicial ? (
              <div style={{ height: '100%' }}>
                {seccionInicial === 'adiso' && adisoAbierto && (
                  <ModalAdiso
                    adiso={adisoAbierto}
                    onCerrar={onCerrarAdiso || onCerrar}
                    {...(onAnterior && { onAnterior })}
                    {...(onSiguiente && { onSiguiente })}
                    puedeAnterior={puedeAnterior}
                    puedeSiguiente={puedeSiguiente}
                    dentroSidebar={true}
                  />
                )}
                {seccionInicial === 'mapa' && (
                  <MapaInteractivo
                    adisos={todosLosAdisos}
                    onAbrirAdiso={(adiso) => {
                      if (onCambiarSeccion) onCambiarSeccion('adiso');
                    }}
                  />
                )}
                {seccionInicial === 'publicar' && (
                  <FormularioPublicar
                    onPublicar={onPublicar || (() => { })}
                    onCerrar={onCerrar}
                    onError={onError}
                    onSuccess={onSuccess}
                    dentroSidebar={true}
                  />
                )}
                {seccionInicial === 'gratuitos' && (
                  <AdisosGratuitos todosLosAdisos={todosLosAdisos} />
                )}
                {seccionInicial === 'chatbot' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
                    <ChatbotIANew
                      onPublicar={onPublicar}
                      onError={onError}
                      onSuccess={onSuccess}
                      onMinimize={onCerrar}
                    />
                  </div>
                )}
              </div>
            ) : (
              filteredSections.map((section, sectionIdx) => (
                <div key={section.title} style={{ marginBottom: '1.5rem' }}>
                  {/* Section Title */}
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.5rem',
                    paddingLeft: '0.75rem'
                  }}>
                    {section.title}
                  </div>

                  {/* Section Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {section.items.map((item) => {
                      const Icon = item.icon;

                      const content = (
                        <>
                          {/* Icon */}
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-secondary)',
                            flexShrink: 0
                          }}>
                            <Icon size={18} />
                          </div>

                          {/* Label */}
                          <span style={{
                            fontSize: '0.9375rem',
                            fontWeight: 500,
                            flex: 1,
                            color: 'var(--text-primary)'
                          }}>
                            {item.label}
                          </span>

                          {/* Badge if exists */}
                          {item.badge && (
                            <span style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '10px',
                              minWidth: '20px',
                              textAlign: 'center'
                            }}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      );

                      const commonStyle = {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        textAlign: 'left' as const,
                        width: '100%',
                        textDecoration: 'none'
                      };

                      if (item.href) {
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => {
                              if (item.onClick) item.onClick();
                              onCerrar();
                            }}
                            style={commonStyle}
                            className="hover:bg-gray-100 dark:hover:bg-zinc-800"
                          >
                            {content}
                          </Link>
                        );
                      }

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          style={commonStyle}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {content}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Settings */}
          <div style={{
            padding: '1rem',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: '0.75rem' }}>
                ⚙️ Preferencias
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <ThemeToggle />
                <LanguageSelector />
              </div>
            </div>

            {/* Logout Button */}
            {isAuthenticated && (
              <button
                onClick={() => {
                  signOut();
                  onCerrar();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <FaSignOutAlt size={18} />
                Cerrar Sesión
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
