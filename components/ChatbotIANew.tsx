'use client';

/**
 * ADIS AI - Tu Asistente de Búsqueda Personalizada
 * Version Premium 2.0 - LLM Standard Design
 */

import React, { useState, useRef, useEffect } from 'react';
import { Adiso } from '@/types';
import { FaPaperPlane, FaSpinner, FaSearch, FaImage, FaMapMarkerAlt, FaTag, FaRobot, FaUser } from 'react-icons/fa';
import { AiOutlineClear } from 'react-icons/ai';
import { nanoid } from 'nanoid';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/useAuth';
import { AIChatResponse } from '@/lib/ai/contracts';
import { routeChatMessage } from '@/lib/chat/ChatIntentRouter';
import { buildSearchIntroMessage } from '@/lib/chat/search-picks';
import ChatSearchPicks from '@/components/chat/ChatSearchPicks';

interface Mensaje {
  id: string;
  tipo: 'usuario' | 'asistente';
  contenido: string;
  timestamp: Date;
  resultados?: Adiso[];
  searchQuery?: string;
  component?: React.ReactNode;
}

interface ChatbotIAProps {
  onPublicar?: (adiso: Adiso) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  onMinimize?: () => void;
}

export default function ChatbotIANew({ onPublicar, onError, onSuccess, onMinimize }: ChatbotIAProps) {
  const useUnifiedChat = process.env.NEXT_PUBLIC_AI_UNIFIED_CHAT !== 'false';
  const { abrirAdiso } = useNavigation();
  const { user } = useAuth();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      // Max height limit
      if (textareaRef.current.scrollHeight > 150) {
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [inputMensaje]);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('adis_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hydrated = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMensajes(hydrated);
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
    // Don't set initial message if loaded, let EmptyState handle empty history
    setIsInitialized(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('adis_chat_history', JSON.stringify(mensajes));
    }
  }, [mensajes, isInitialized]);

  const scrollToBottom = () => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const agregarMensaje = (
    tipo: 'usuario' | 'asistente',
    contenido: string,
    resultados?: Adiso[],
    component?: React.ReactNode,
    searchQuery?: string,
  ) => {
    const nuevoMensaje: Mensaje = {
      id: nanoid(),
      tipo,
      contenido,
      timestamp: new Date(),
      resultados,
      searchQuery,
      component,
    };
    setMensajes(prev => {
      const updated = [...prev, nuevoMensaje];
      if (updated.length > 50) return updated.slice(updated.length - 50);
      return updated;
    });
  };

  const handleClearHistory = () => {
    if (confirm('¿Estás seguro de borrar el historial de chat?')) {
      setMensajes([]);
      localStorage.removeItem('adis_chat_history');
    }
  };

  const callUnifiedChat = async (message: string): Promise<AIChatResponse> => {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        imageUrl: imageUrl || undefined,
        userId: user?.id || undefined,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.error || 'No se pudo procesar tu mensaje');
    }
    return response.json();
  };

  const persistDraft = async (sessionId: string, draft: {
    categoria: any;
    titulo: string;
    descripcion: string;
    precio?: number;
    ubicacion?: string;
    contacto?: string;
    imageUrl?: string;
  }) => {
    const res = await fetch('/api/ai/publish-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, data: draft }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.draft?.id as string | null;
  };

  const procesarMensaje = async (texto: string) => {
    setProcesando(true);
    agregarMensaje('usuario', imageUrl ? '[Imagen] ' + texto : texto);

    try {
      const route = routeChatMessage(texto, Boolean(imageUrl));

      if (route.intent === 'search' && route.searchQuery && !route.useAI) {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: route.searchQuery, maxResults: 8 }),
        });
        const data = await res.json();
        const items = (data.adisos ?? []) as Adiso[];
        agregarMensaje(
          'asistente',
          buildSearchIntroMessage(items.length, route.searchQuery),
          items,
          undefined,
          route.searchQuery,
        );
        setImageUrl('');
        return;
      }

      if (!useUnifiedChat) {
        agregarMensaje('asistente', 'El chat unificado está desactivado en este entorno.');
        return;
      }
      const data = await callUnifiedChat(texto);

      if (data.payload?.type === 'search_results') {
        agregarMensaje(
          'asistente',
          data.text || buildSearchIntroMessage(data.payload.items.length, texto),
          data.payload.items,
          undefined,
          texto,
        );
      } else if (data.payload?.type === 'publish_draft') {
        const draft = data.payload.draft;
        const savedDraftId = await persistDraft(data.sessionId, {
          categoria: draft.categoria,
          titulo: draft.titulo,
          descripcion: draft.descripcion,
          precio: draft.precio,
          ubicacion: draft.ubicacion,
          contacto: draft.contacto,
          imageUrl: draft.imageUrl,
        });
        const draftText = [
          data.text,
          '',
          `Categoria: ${draft.categoria}`,
          `Titulo: ${draft.titulo}`,
          `Descripcion: ${draft.descripcion}`,
          draft.precio ? `Precio sugerido: S/ ${draft.precio}` : null,
          savedDraftId ? `Draft ID: ${savedDraftId}` : null,
        ]
          .filter(Boolean)
          .join('\n');
        agregarMensaje('asistente', draftText);
      } else if (data.payload?.type === 'recommendations') {
        agregarMensaje(
          'asistente',
          data.text,
          data.payload.items,
          undefined,
          texto,
        );
      } else {
        agregarMensaje('asistente', data.text);
      }

      setImageUrl('');
    } catch (error: any) {
      agregarMensaje('asistente', `Lo siento, hubo un error técnico.`);
      onError?.(error.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((inputMensaje.trim() || imageUrl) && !procesando) {
      const texto = inputMensaje.trim() || (imageUrl ? 'Analiza esta imagen' : '');
      if (texto) {
        setInputMensaje('');
        // Reset textarea height
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        procesarMensaje(texto);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError?.('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onError?.('La imagen es muy grande. Máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
      if (textareaRef.current) textareaRef.current.focus();
    };
    reader.readAsDataURL(file);
  };

  // Render Functions
  const renderMessageContent = (msg: Mensaje) => {
    return (
      <div className={`prose dark:prose-invert max-w-none text-sm break-words whitespace-pre-wrap leading-relaxed ${msg.tipo === 'usuario' ? 'text-white' : 'text-gray-800 dark:text-gray-200'
        }`}>
        {msg.contenido}
      </div>
    );
  };

  const renderResults = (resultados: Adiso[], searchQuery?: string) => (
    <ChatSearchPicks
      items={resultados}
      query={searchQuery}
      onOpen={(adiso) => abrirAdiso(adiso.id)}
      onRefine={(text) => {
        if (!procesando) void procesarMensaje(text);
      }}
    />
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 font-sans">

      {/* Top Bar - Minimalist */}
      {/* If minimizing is allowed (modal mode), show header else hidden or simple */}
      {onMinimize && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white text-sm shadow-md">
              <FaRobot />
            </div>
            <span className="font-bold text-gray-800 dark:text-white">Adis AI</span>
          </div>
          <div className="flex gap-2 text-gray-400">
            <button onClick={handleClearHistory} title="Borrar historial" className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <AiOutlineClear size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-3xl mx-auto w-full h-full flex flex-col p-4 md:p-6 pb-4">

          {/* Empty State */}
          {mensajes.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-0 animate-in fade-in zoom-in duration-700 delay-200 min-h-[60vh]">
              <div className="relative mb-8 group">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-violet-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl shadow-2xl shadow-blue-500/30 transform group-hover:scale-110 transition-transform duration-500">
                  <FaRobot />
                </div>
              </div>

              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
                ¿Cómo puedo ayudarte hoy?
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mb-10 text-lg leading-relaxed">
                Soy tu asistente AI. Pregúntame sobre alquileres, empleos o productos y encontraré lo mejor para ti.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full max-w-xl">
                {[
                  { icon: FaSearch, text: "Buscar departamento en Wanchaq", color: "text-blue-500" },
                  { icon: FaTag, text: "Vender mi laptop usada", color: "text-emerald-500" },
                  { icon: FaUser, text: "Encontrar trabajo de medio tiempo", color: "text-violet-500" },
                  { icon: FaMapMarkerAlt, text: "Tiendas de ropa cerca de mí", color: "text-amber-500" },
                  ...(user ? [{ icon: FaRobot, text: "Recomiéndame algo según mis intereses", color: "text-pink-500" }] : []),
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputMensaje(item.text);
                      if (textareaRef.current) textareaRef.current.focus();
                    }}
                    className={`group p-4 text-sm text-left bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-gray-700 dark:text-gray-300 flex items-center gap-4 active:scale-95 ${idx === 4 ? 'md:col-span-2' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gray-50 dark:bg-zinc-700/50 flex items-center justify-center ${item.color} group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors`}>
                      <item.icon size={14} />
                    </div>
                    <span className="font-medium">{item.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages List */}
          <div className="space-y-6 pb-4">
            {mensajes.map((msg) => (
              <div
                key={msg.id}
                className={`flex w-full ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Avatar */}
                {msg.tipo === 'asistente' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/30 dark:to-violet-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mr-3 mt-1">
                    <FaRobot size={14} />
                  </div>
                )}

                <div className={`flex flex-col ${msg.resultados?.length ? 'max-w-full w-full' : 'max-w-[85%] md:max-w-[75%]'}`}>
                  <div
                    className={`px-5 py-3.5 rounded-2xl shadow-sm ${msg.tipo === 'usuario'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-transparent dark:border-zinc-700'
                      }`}
                  >
                    {renderMessageContent(msg)}
                  </div>

                  {/* Results attached to message */}
                  {msg.resultados && msg.resultados.length > 0 && (
                    <div className="mt-2 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                      {renderResults(msg.resultados, msg.searchQuery)}
                    </div>
                  )}
                </div>

                {/* User Avatar (Optional - can use icon) */}
                {msg.tipo === 'usuario' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0 ml-3 mt-1">
                    <FaUser size={12} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div ref={mensajesEndRef} className="h-4" />
        </div>
      </div>

      {/* Input Area - Sticky Bottom */}
      <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 z-20">
        <div className="max-w-3xl mx-auto relative">

          {/* Image Preview Overlay */}
          {imageUrl && (
            <div className="absolute bottom-full left-0 mb-3 p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-700 flex items-center gap-3 animate-in slide-in-from-bottom-2">
              <img src={imageUrl} alt="Upload preview" className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
              <button
                onClick={() => setImageUrl('')}
                className="w-6 h-6 rounded-full bg-gray-100 dark:bg-zinc-700 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors"
              >
                &times;
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className={`
                    relative flex items-end gap-2 p-2 rounded-[26px] border transition-all duration-300
                    ${procesando ? 'bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700' : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 focus-within:border-blue-300 dark:focus-within:border-blue-700'}
                `}
          >
            {/* Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-white dark:hover:bg-zinc-700"
              title="Subir imagen"
            >
              <FaImage size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Text Input */}
            <textarea
              ref={textareaRef}
              value={inputMensaje}
              onChange={(e) => setInputMensaje(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              rows={1}
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-1 max-h-[120px] text-gray-900 dark:text-white placeholder-gray-400 text-[15px] leading-relaxed"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!inputMensaje.trim() && !imageUrl) || procesando}
              className={`
                        p-3 rounded-full transition-all duration-200 shrink-0
                        ${(!inputMensaje.trim() && !imageUrl) || procesando
                  ? 'bg-gray-200 dark:bg-zinc-700 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg active:scale-95'}
                    `}
            >
              {procesando ? <FaSpinner className="animate-spin" size={16} /> : <FaPaperPlane size={16} />}
            </button>
          </form>

          <div className="text-center mt-2 text-[11px] text-gray-400 dark:text-gray-500">
            Adis AI puede cometer errores. Considera verificar la información importante.
          </div>
        </div>
      </div>
    </div>
  );
}
