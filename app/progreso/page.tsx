'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes, FaRocket, FaCheckCircle, FaBug, FaStar, FaCog, FaLightbulb, FaExclamationTriangle, FaArrowLeft, FaHeart } from 'react-icons/fa';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import LeftSidebar from '@/components/LeftSidebar';
import NavbarMobile from '@/components/NavbarMobile';
import { enviarFeedbackInmediato, enviarFeedbacksAAPI } from '@/lib/feedback';
import { catalogUi, semantic } from '@/lib/bs-tokens';

import progresoDataRaw from '@/data/progreso.json';

interface ProgresoEntry {
  version: string;
  date: string;
  time: string;
  type: 'feature' | 'improvement' | 'fix' | 'ui';
  title: string;
  description: string;
  userBenefits: string[];
  technicalDetails: string[];
  impact: 'major' | 'minor' | 'patch';
}

const progresoData: ProgresoEntry[] = (progresoDataRaw as any[]).map(entry => ({
  ...entry,
  // Asegurar que el tipo sea válido para la interfaz
  type: (['feature', 'improvement', 'fix', 'ui'].includes(entry.type) ? entry.type : 'improvement') as ProgresoEntry['type'],
  impact: (['major', 'minor', 'patch'].includes(entry.impact) ? entry.impact : 'minor') as ProgresoEntry['impact']
}));

export default function ProgresoPage() {
  const router = useRouter();
  const { toasts, removeToast, success } = useToast();

  // Enviar feedbacks pendientes periódicamente (cada 30 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      enviarFeedbacksAAPI();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mostrarFeedback, setMostrarFeedback] = useState(false);
  const [feedbackTipo, setFeedbackTipo] = useState<'sugerencia' | 'problema'>('sugerencia');
  const [feedbackTexto, setFeedbackTexto] = useState('');
  const [enviado, setEnviado] = useState(false);

  const getTypeIcon = (type: ProgresoEntry['type']) => {
    switch (type) {
      case 'feature':
        return <FaRocket size={18} color={semantic.action} />;
      case 'improvement':
        return <FaStar size={18} color={semantic.successFg} />;
      case 'fix':
        return <FaBug size={18} color={semantic.dangerFg} />;
      case 'ui':
        return <FaCog size={18} color={semantic.warningFg} />;
      default:
        return <FaCheckCircle size={18} color={semantic.muted} />;
    }
  };

  const getTypeLabel = (type: ProgresoEntry['type']) => {
    switch (type) {
      case 'feature':
        return 'Nueva Funcionalidad';
      case 'improvement':
        return 'Mejora';
      case 'fix':
        return 'Corrección';
      case 'ui':
        return 'Interfaz';
      default:
        return 'Actualización';
    }
  };

  const getImpactBadge = (impact: ProgresoEntry['impact']) => {
    const styles = {
      major: { bg: semantic.action, label: 'Mayor' },
      minor: { bg: semantic.successFg, label: 'Menor' },
      patch: { bg: semantic.muted, label: 'Parche' }
    };
    const style = styles[impact];
    return (
      <span style={{
        fontSize: '0.75rem',
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        backgroundColor: style.bg,
        color: catalogUi.onAction,
        fontWeight: 500
      }}>
        {style.label}
      </span>
    );
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackTexto.trim()) return;

    setEnviado(true);

    // Intentar enviar inmediatamente
    const enviado = await enviarFeedbackInmediato({
      tipo: feedbackTipo,
      texto: feedbackTexto.trim()
    });

    if (enviado) {
      success('¡Gracias por tu feedback! Lo revisaremos pronto.');
    } else {
      success('¡Gracias por tu feedback! Se guardó localmente y se enviará pronto.');
    }

    setTimeout(() => {
      setFeedbackTexto('');
      setMostrarFeedback(false);
      setEnviado(false);
      setFeedbackTipo('sugerencia');
    }, 2000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)' }}>

      <Header
        onToggleLeftSidebar={() => setSidebarOpen(true)}
        seccionActiva={'feed' as any} // Using feed as a safe default or make param optional
      />
      <main style={{
        flex: 1,
        padding: '2rem 1rem',
        maxWidth: '1000px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Header de la página */}
        <div style={{
          marginBottom: '3rem',
          textAlign: 'center'
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              background: 'none',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '0.5rem 1rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <FaArrowLeft size={14} />
            Volver al inicio
          </button>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            Nuestro Progreso
          </h1>
          <p style={{
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Registro de nuestras mejoras continuas, avances e implementaciones.
            Cada día trabajamos para hacer buscadis.com mejor para ti.
          </p>
        </div>

        {/* Botón de Feedback */}
        <div style={{
          marginBottom: '3rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setMostrarFeedback(true)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-primary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <FaLightbulb size={16} />
            Sugerir una mejora
          </button>
          <button
            onClick={() => {
              setFeedbackTipo('problema');
              setMostrarFeedback(true);
            }}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
            }}
          >
            <FaExclamationTriangle size={16} />
            Reportar un problema
          </button>
        </div>

        {/* Entradas de Progreso */}
        <div>
          {progresoData.map((entry, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem',
                border: '1px solid var(--border-color)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}
            >
              {/* Header de entrada */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  flexShrink: 0
                }}>
                  {getTypeIcon(entry.type)}
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <h2 style={{
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      margin: 0
                    }}>
                      {entry.title}
                    </h2>
                    <span style={{
                      fontSize: '0.875rem',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontFamily: 'monospace'
                    }}>
                      v{entry.version}
                    </span>
                    {getImpactBadge(entry.impact)}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)'
                    }}>
                      {new Date(`${entry.date}T${entry.time}`).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} a las {entry.time}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)'
                    }}>
                      {getTypeLabel(entry.type)}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '0.9375rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    margin: 0
                  }}>
                    {entry.description}
                  </p>
                </div>
              </div>

              {/* Beneficios para el usuario */}
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                borderLeft: `4px solid ${semantic.successFg}`
              }}>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FaHeart size={14} color={semantic.successFg} />
                  Beneficios para ti
                </h3>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0
                }}>
                  {entry.userBenefits.map((benefit, i) => (
                    <li key={i} style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem',
                      paddingLeft: '1.5rem',
                      position: 'relative',
                      lineHeight: 1.6
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        color: semantic.successFg
                      }}>
                        ✓
                      </span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Detalles técnicos */}
              <details style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1rem'
              }}>
                <summary style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}>
                  Detalles técnicos (para desarrolladores)
                </summary>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '1rem 0 0 0'
                }}>
                  {entry.technicalDetails.map((detail, i) => (
                    <li key={i} style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem',
                      paddingLeft: '1.5rem',
                      position: 'relative',
                      lineHeight: 1.6
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        color: 'var(--text-tertiary)'
                      }}>
                        •
                      </span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
      </main>

      <LeftSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="block md:hidden">
        <NavbarMobile
          seccionActiva={null}
          tieneAdisoAbierto={false}
          onCambiarSeccion={() => router.push('/')}
        />
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Modal de Feedback */}
      {mostrarFeedback && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '12px',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            {!enviado ? (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    {feedbackTipo === 'sugerencia' ? 'Sugerir una mejora' : 'Reportar un problema'}
                  </h3>
                  <button
                    onClick={() => setMostrarFeedback(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px'
                    }}
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.5rem'
                  }}>
                    {feedbackTipo === 'sugerencia' ? '¿Qué te gustaría ver en Buscadis?' : '¿Qué problema encontraste?'}
                  </label>
                  <textarea
                    value={feedbackTexto}
                    onChange={(e) => setFeedbackTexto(e.target.value)}
                    placeholder={feedbackTipo === 'sugerencia'
                      ? 'Ej: Me gustaría poder filtrar por rango de precios...'
                      : 'Ej: El botón de publicar no funciona en Safari...'}
                    style={{
                      width: '100%',
                      height: '120px',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9375rem',
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                    autoFocus
                  />
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem'
                }}>
                  <button
                    onClick={() => setMostrarFeedback(false)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleFeedbackSubmit}
                    disabled={!feedbackTexto.trim()}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'var(--text-primary)',
                      color: 'var(--bg-primary)',
                      cursor: !feedbackTexto.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      opacity: !feedbackTexto.trim() ? 0.7 : 1
                    }}
                  >
                    Enviar Feedback
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <FaCheckCircle size={48} color={semantic.successFg} style={{ marginBottom: '1rem', display: 'inline-block' }} />
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem',
                  marginTop: 0
                }}>
                  ¡Gracias!
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  margin: 0
                }}>
                  Tu feedback ha sido guardado. Lo revisaremos pronto.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
