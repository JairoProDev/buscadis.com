'use client';

import { chatGradient } from '@/lib/bs-tokens';

import React, { useState, useRef, useEffect } from 'react';
import { Adiso, Categoria } from '@/types';
import { FaPaperPlane, FaSpinner, FaSearch, FaPlus, FaCheck, FaTimes } from 'react-icons/fa';
import ModalAdiso from './ModalAdiso';

interface Mensaje {
  id: string;
  tipo: 'usuario' | 'asistente';
  contenido: string;
  timestamp: Date;
  resultados?: Adiso[];
  procesando?: boolean;
}

interface ChatbotIAProps {
  onPublicar?: (adiso: Adiso) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export default function ChatbotIA({ onPublicar, onError, onSuccess }: ChatbotIAProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: '1',
      tipo: 'asistente',
      contenido: '¡Hola! Soy tu asistente de IA. Puedo ayudarte a buscar adisos o publicar uno nuevo. ¿Qué te gustaría hacer?',
      timestamp: new Date()
    }
  ]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [adisoAbierto, setAdisoAbierto] = useState<Adiso | null>(null);
  const [modoPublicacion, setModoPublicacion] = useState(false);
  const [datosPublicacion, setDatosPublicacion] = useState<Partial<Adiso>>({});
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const agregarMensaje = (tipo: 'usuario' | 'asistente', contenido: string, resultados?: Adiso[]) => {
    const nuevoMensaje: Mensaje = {
      id: Date.now().toString(),
      tipo,
      contenido,
      timestamp: new Date(),
      resultados
    };
    setMensajes(prev => [...prev, nuevoMensaje]);
  };

  const procesarMensaje = async (texto: string) => {
    setProcesando(true);
    
    // Agregar mensaje del usuario
    agregarMensaje('usuario', texto);
    
    // Agregar mensaje de procesamiento
    const mensajeProcesando: Mensaje = {
      id: `procesando-${Date.now()}`,
      tipo: 'asistente',
      contenido: '',
      timestamp: new Date(),
      procesando: true
    };
    setMensajes(prev => [...prev, mensajeProcesando]);

    try {
      // Enviar a la API para procesar
      const response = await fetch('/api/chatbot/procesar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mensaje: texto, datosPublicacion, modoPublicacion }),
      });

      const data = await response.json();

      // Remover mensaje de procesamiento
      setMensajes(prev => prev.filter(m => m.id !== mensajeProcesando.id));

      if (data.intencion === 'buscar') {
        // Búsqueda de adisos
        const resultados = data.resultados || [];
        if (resultados.length > 0) {
          agregarMensaje('asistente', data.respuesta, resultados);
        } else {
          agregarMensaje('asistente', 'No encontré adisos que coincidan con tu búsqueda. ¿Puedes ser más específico?');
        }
      } else if (data.intencion === 'publicar') {
        // Modo publicación
        if (!modoPublicacion) {
          setModoPublicacion(true);
          setDatosPublicacion({});
          // El mensaje inicial ya viene en data.respuesta
          agregarMensaje('asistente', data.respuesta || 'Perfecto, vamos a publicar tu adiso. Te haré algunas preguntas para completar la información.\n\n¿Qué categoría es? (empleos, inmuebles, vehículos, servicios, productos, eventos, negocios, comunidad)');
        } else {
          // Procesar datos de publicación
          const nuevosDatos = { ...datosPublicacion, ...data.datosExtraidos };
          setDatosPublicacion(nuevosDatos);

          if (data.siguientePaso) {
            agregarMensaje('asistente', data.respuesta);
          } else if (data.completo) {
            // Agregar mensaje de confirmación antes de publicar
            agregarMensaje('asistente', data.respuesta);
            
            // Agregar mensaje de procesamiento de publicación
            const mensajePublicando: Mensaje = {
              id: `publicando-${Date.now()}`,
              tipo: 'asistente',
              contenido: 'Publicando tu adiso...',
              timestamp: new Date(),
              procesando: true
            };
            setMensajes(prev => [...prev, mensajePublicando]);
            
            // Publicar el adiso con un pequeño delay para efecto visual
            setTimeout(async () => {
              try {
                const adisoCompleto = await finalizarPublicacion(nuevosDatos);
                // Remover mensaje de procesamiento
                setMensajes(prev => prev.filter(m => m.id !== mensajePublicando.id));
                agregarMensaje('asistente', '✅ ¡Listo! Tu adiso ha sido publicado con éxito.\n\n¿Te gustaría buscar algo más o publicar otro adiso?');
                setModoPublicacion(false);
                setDatosPublicacion({});
                onPublicar?.(adisoCompleto);
                onSuccess?.('¡Adiso publicado con éxito!');
              } catch (error: any) {
                // Remover mensaje de procesamiento
                setMensajes(prev => prev.filter(m => m.id !== mensajePublicando.id));
                agregarMensaje('asistente', `❌ Lo siento, hubo un error al publicar: ${error.message}\n\n¿Quieres intentar nuevamente?`);
                onError?.(error.message);
              }
            }, 1500);
          } else {
            agregarMensaje('asistente', data.respuesta);
          }
        }
      } else if (data.intencion === 'cancelar') {
        setModoPublicacion(false);
        setDatosPublicacion({});
        agregarMensaje('asistente', 'Publicación cancelada. ¿En qué más puedo ayudarte?');
      } else {
        agregarMensaje('asistente', data.respuesta || 'No estoy seguro de cómo ayudarte con eso. ¿Quieres buscar adisos o publicar uno nuevo?');
      }
    } catch (error: any) {
      // Remover mensaje de procesamiento
      setMensajes(prev => prev.filter(m => m.id !== mensajeProcesando.id));
      agregarMensaje('asistente', 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta nuevamente.');
      console.error('Error al procesar mensaje:', error);
    } finally {
      setProcesando(false);
    }
  };

  const finalizarPublicacion = async (datos: any): Promise<Adiso> => {
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const hora = ahora.toTimeString().split(' ')[0].substring(0, 5);
    const idUnico = `adiso-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const nuevoAdiso: Adiso = {
      id: idUnico,
      categoria: datos.categoria || 'servicios',
      titulo: (datos.titulo || 'Sin título').substring(0, 100),
      descripcion: (datos.descripcion || datos.titulo || '').substring(0, 500),
      contacto: datos.contacto || '',
      ubicacion: datos.ubicacion || '',
      tamaño: datos.tamaño || 'miniatura',
      fechaPublicacion: fecha,
      horaPublicacion: hora
    };

    // Guardar usando la API
    const response = await fetch('/api/adisos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nuevoAdiso),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al publicar adiso');
    }

    return await response.json();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMensaje.trim() && !procesando) {
      const texto = inputMensaje.trim();
      setInputMensaje('');
      procesarMensaje(texto);
    }
  };

  const handleClickAdiso = (adiso: Adiso) => {
    setAdisoAbierto(adiso);
  };

  const getCategoriaNombre = (categoria: Categoria): string => {
    const nombres: Record<Categoria, string> = {
      empleos: 'Empleos',
      inmuebles: 'Inmuebles',
      vehiculos: 'Vehículos',
      servicios: 'Servicios',
      productos: 'Productos',
      eventos: 'Eventos',
      negocios: 'Negocios',
      comunidad: 'Comunidad'
    };
    return nombres[categoria] || categoria;
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: chatGradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
          }}
        >
          AI
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            Asistente de IA
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            {modoPublicacion ? 'Modo: Publicar' : 'Listo para ayudarte'}
          </div>
        </div>
        {modoPublicacion && (
          <button
            onClick={() => {
              setModoPublicacion(false);
              setDatosPublicacion({});
              agregarMensaje('asistente', 'Publicación cancelada. ¿En qué más puedo ayudarte?');
            }}
            style={{
              padding: '0.5rem',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem'
            }}
          >
            <FaTimes size={12} />
            Cancelar
          </button>
        )}
      </div>

      {/* Mensajes */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {mensajes.map((mensaje) => (
          <div
            key={mensaje.id}
            style={{
              display: 'flex',
              justifyContent: mensaje.tipo === 'usuario' ? 'flex-end' : 'flex-start',
              animation: 'fadeIn 0.4s ease-out',
              opacity: 0,
              animationFillMode: 'forwards'
            }}
          >
            {mensaje.tipo === 'asistente' && (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: chatGradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  marginRight: '0.5rem',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                }}
              >
                AI
              </div>
            )}
            <div
              style={{
                maxWidth: '85%',
                padding: '0.75rem 1rem',
                borderRadius: mensaje.tipo === 'usuario' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                backgroundColor: mensaje.tipo === 'usuario' 
                  ? 'var(--accent-color)' 
                  : 'var(--bg-secondary)',
                color: mensaje.tipo === 'usuario' 
                  ? 'white' 
                  : 'var(--text-primary)',
                boxShadow: mensaje.tipo === 'usuario' 
                  ? '0 2px 8px rgba(0,0,0,0.15)' 
                  : '0 2px 6px rgba(0,0,0,0.08)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: 1.6,
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                if (mensaje.tipo === 'asistente') {
                  e.currentTarget.style.transform = 'translateX(2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                }
              }}
              onMouseLeave={(e) => {
                if (mensaje.tipo === 'asistente') {
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
                }
              }}
            >
              {mensaje.procesando ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>Pensando...</span>
                </div>
              ) : (
                <span style={{ animation: 'slideIn 0.3s ease-out' }}>{mensaje.contenido}</span>
              )}
            </div>
          </div>
        ))}

        {/* Resultados de búsqueda */}
        {mensajes.map((mensaje) => {
          if (mensaje.resultados && mensaje.resultados.length > 0) {
            return (
              <div
                key={`resultados-${mensaje.id}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginTop: '0.5rem'
                }}
              >
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Encontré {mensaje.resultados.length} resultado{mensaje.resultados.length !== 1 ? 's' : ''}:
                </div>
                {mensaje.resultados.slice(0, 5).map((adiso) => (
                  <div
                    key={adiso.id}
                    onClick={() => handleClickAdiso(adiso)}
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {adiso.titulo}
                      </div>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                          backgroundColor: 'var(--accent-color)',
                          color: 'white'
                        }}
                      >
                        {getCategoriaNombre(adiso.categoria)}
                      </span>
                    </div>
                    {adiso.descripcion && (
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {adiso.descripcion.substring(0, 100)}
                        {adiso.descripcion.length > 100 ? '...' : ''}
                      </div>
                    )}
                    {adiso.ubicacion && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        📍 {typeof adiso.ubicacion === 'string' ? adiso.ubicacion : `${adiso.ubicacion.distrito || ''}, ${adiso.ubicacion.provincia || ''}`}
                      </div>
                    )}
                  </div>
                ))}
                {mensaje.resultados.length > 5 && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '0.5rem' }}>
                    Y {mensaje.resultados.length - 5} resultado{mensaje.resultados.length - 5 !== 1 ? 's' : ''} más...
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}

        <div ref={mensajesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputMensaje}
            onChange={(e) => setInputMensaje(e.target.value)}
            placeholder={modoPublicacion ? "Responde las preguntas..." : "Escribe tu mensaje..."}
            disabled={procesando}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '1.5rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-color)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          />
          <button
            type="submit"
            disabled={!inputMensaje.trim() || procesando}
            style={{
              padding: '0.75rem 1.25rem',
              border: 'none',
              borderRadius: '1.5rem',
              backgroundColor: procesando || !inputMensaje.trim() ? 'var(--border-color)' : 'var(--accent-color)',
              color: 'white',
              cursor: procesando || !inputMensaje.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              fontWeight: 600
            }}
          >
            {procesando ? (
              <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </form>
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setInputMensaje('Buscar departamentos en Cusco');
              inputRef.current?.focus();
            }}
            style={{
              padding: '0.4rem 0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '1rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <FaSearch size={10} />
            Buscar
          </button>
          <button
            onClick={() => {
              setInputMensaje('Quiero publicar un adiso');
              inputRef.current?.focus();
            }}
            style={{
              padding: '0.4rem 0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '1rem',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <FaPlus size={10} />
            Publicar
          </button>
        </div>
      </div>

      {/* Modal de adiso */}
      {adisoAbierto && (
        <ModalAdiso
          adiso={adisoAbierto}
          onCerrar={() => setAdisoAbierto(null)}
          onAnterior={() => {}}
          onSiguiente={() => {}}
          puedeAnterior={false}
          puedeSiguiente={false}
          dentroSidebar={true}
        />
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        @keyframes slideIn {
          from {
            transform: translateX(-10px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
