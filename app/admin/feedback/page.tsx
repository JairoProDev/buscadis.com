'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaCheck, FaTimes, FaEye, FaEyeSlash, FaChartBar, FaLightbulb, FaExclamationTriangle } from 'react-icons/fa';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { semantic } from '@/lib/bs-tokens';

interface Feedback {
  id: string;
  tipo: 'sugerencia' | 'problema';
  texto: string;
  fecha: string;
  hora: string;
  url?: string;
  user_agent?: string;
  created_at: string;
  leido: boolean;
  imagen_url?: string;
}

interface Estadisticas {
  total: number;
  sugerencias: number;
  problemas: number;
  noLeidos: number;
  leidos: number;
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const { toasts, removeToast, success, error } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    total: 0,
    sugerencias: 0,
    problemas: 0,
    noLeidos: 0,
    leidos: 0
  });
  const [cargando, setCargando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'sugerencia' | 'problema'>('todos');
  const [filtroLeido, setFiltroLeido] = useState<'todos' | 'leidos' | 'noLeidos'>('todos');

  const cargarFeedbacks = useCallback(async () => {
    try {
      setCargando(true);
      const response = await fetch('/api/admin/feedback');
      if (!response.ok) {
        throw new Error('Error al cargar feedbacks');
      }
      const data = await response.json();
      setFeedbacks(data.feedbacks || []);
      setEstadisticas(
        data.estadisticas || {
          total: 0,
          sugerencias: 0,
          problemas: 0,
          noLeidos: 0,
          leidos: 0,
        }
      );
    } catch (err: any) {
      console.error('Error al cargar feedbacks:', err);
      error('Error al cargar feedbacks. Verifica la conexión.');
    } finally {
      setCargando(false);
    }
  }, [error]);

  useEffect(() => {
    void cargarFeedbacks();
  }, [cargarFeedbacks]);

  const marcarComoLeido = async (id: string, leido: boolean) => {
    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leido })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar feedback');
      }

      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, leido } : f));
      setEstadisticas(prev => ({
        ...prev,
        leidos: leido ? prev.leidos + 1 : prev.leidos - 1,
        noLeidos: leido ? prev.noLeidos - 1 : prev.noLeidos + 1
      }));
      success(leido ? 'Feedback marcado como leído' : 'Feedback marcado como no leído');
    } catch (err: any) {
      console.error('Error al marcar como leído:', err);
      error('Error al actualizar el feedback');
    }
  };

  const feedbacksFiltrados = feedbacks.filter(f => {
    if (filtroTipo !== 'todos' && f.tipo !== filtroTipo) return false;
    if (filtroLeido === 'leidos' && !f.leido) return false;
    if (filtroLeido === 'noLeidos' && f.leido) return false;
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{
        flex: 1,
        padding: '1rem',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
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
            Volver
          </button>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Dashboard de Feedback
          </h1>
        </div>

        {/* Estadísticas */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {estadisticas.total}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total</div>
          </div>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: semantic.action, marginBottom: '0.5rem' }}>
              {estadisticas.sugerencias}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <FaLightbulb size={14} />
              Sugerencias
            </div>
          </div>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: semantic.dangerFg, marginBottom: '0.5rem' }}>
              {estadisticas.problemas}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <FaExclamationTriangle size={14} />
              Problemas
            </div>
          </div>
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: semantic.warningFg, marginBottom: '0.5rem' }}>
              {estadisticas.noLeidos}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No Leídos</div>
          </div>
        </div>

        {/* Filtros */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as any)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="todos">Todos los tipos</option>
            <option value="sugerencia">Solo Sugerencias</option>
            <option value="problema">Solo Problemas</option>
          </select>
          <select
            value={filtroLeido}
            onChange={(e) => setFiltroLeido(e.target.value as any)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="todos">Todos</option>
            <option value="noLeidos">No Leídos</option>
            <option value="leidos">Leídos</option>
          </select>
        </div>

        {/* Lista de Feedbacks */}
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Cargando feedbacks...
          </div>
        ) : feedbacksFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No hay feedbacks con estos filtros
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {feedbacksFiltrados.map((feedback) => (
              <div
                key={feedback.id}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  border: `1px solid ${feedback.leido ? 'var(--border-color)' : semantic.warningFg}`,
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: feedback.leido ? 'none' : '0 2px 8px rgba(245, 158, 11, 0.2)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem',
                  gap: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                      }}>
                        {feedback.tipo === 'sugerencia' ? <FaLightbulb size={18} color={semantic.action} /> : <FaExclamationTriangle size={18} color={semantic.dangerFg} />}
                      </span>
                      <span style={{
                        fontSize: '0.875rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '6px',
                        backgroundColor: feedback.tipo === 'sugerencia' ? semantic.action : semantic.dangerFg,
                        color: 'white',
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}>
                        {feedback.tipo}
                      </span>
                      {!feedback.leido && (
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: semantic.warningFg,
                          color: 'white',
                          fontWeight: 600
                        }}>
                          Nuevo
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.75rem'
                    }}>
                      {feedback.fecha} a las {feedback.hora}
                    </div>
                    <div style={{
                      fontSize: '1rem',
                      color: 'var(--text-primary)',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      marginBottom: '0.75rem'
                    }}>
                      {feedback.texto}
                    </div>
                    {feedback.url && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <a
                          href={feedback.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.875rem',
                            color: semantic.action,
                            textDecoration: 'none'
                          }}
                        >
                          {feedback.url}
                        </a>
                      </div>
                    )}
                    {feedback.imagen_url && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <img
                          src={feedback.imagen_url}
                          alt="Captura de pantalla"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)'
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => marcarComoLeido(feedback.id, !feedback.leido)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
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
                    {feedback.leido ? (
                      <>
                        <FaEyeSlash size={14} />
                        Marcar no leído
                      </>
                    ) : (
                      <>
                        <FaEye size={14} />
                        Marcar leído
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

