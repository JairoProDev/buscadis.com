'use client';

/**
 * AI profile builder ("Crear con IA") — magical zero-to-one chat.
 * Multimodal: text, files, photos, PDFs, audio, links.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { BusinessProfile } from '@/types/business';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface FollowUp {
  id: string;
  question: string;
  field?: string;
}

interface BuilderSummary {
  createdProducts: number;
  createdCategories: string[];
  appliedFields: string[];
  skippedFields: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  summary?: BuilderSummary;
  followUps?: FollowUp[];
}

interface AiProfileBuilderProps {
  profile: Partial<BusinessProfile>;
  onUpdate: (patch: Partial<BusinessProfile>) => void;
  onProfileCreated?: (businessId: string, slug?: string | null) => void;
  onProductsChanged?: () => void;
  /** Compact for sidebar; full for dedicated create page. */
  variant?: 'embedded' | 'hero';
  className?: string;
}

interface Attachment {
  id: string;
  file: File;
  kind: 'image' | 'audio' | 'doc';
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Nombre',
  slug: 'Usuario (@)',
  tagline: 'Eslogan',
  description: 'Descripción',
  contact_whatsapp: 'WhatsApp',
  contact_phone: 'Teléfono',
  contact_email: 'Email',
  contact_address: 'Dirección',
  contact_maps_url: 'Mapa',
  theme_color: 'Color',
  social_links: 'Redes',
  business_hours: 'Horario',
  profile_hashtags: 'Hashtags',
};

const GREETING =
  '¡Hola! Soy Adis. En menos de un minuto armo tu página profesional con catálogo.\n\n' +
  'Mándame lo que tengas: un audio contándome tu negocio, fotos de productos, un PDF, un enlace o simplemente escribe. Yo hago el resto.';

const STARTERS = [
  'Vendo ropa y accesorios en Cusco',
  'Tengo un restaurante / cafeteria',
  'Ofrezco servicios (belleza, reparaciones…)',
];

const LOADING_STEPS = [
  'Leyendo lo que me enviaste…',
  'Entendiendo tu negocio…',
  'Armando tu perfil y catálogo…',
  'Casi listo…',
];

function attachmentKind(file: File): Attachment['kind'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'doc';
}

export default function AiProfileBuilder({
  profile,
  onUpdate,
  onProfileCreated,
  onProductsChanged,
  variant = 'embedded',
  className,
}: AiProfileBuilderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const sessionIdRef = useRef<string>(`builder_${Date.now().toString(36)}`);
  const businessIdRef = useRef<string | undefined>(profile.id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    businessIdRef.current = profile.id;
  }, [profile.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const id = setInterval(() => {
      setLoadingStep((s) => (s + 1) % LOADING_STEPS.length);
    }, 2200);
    return () => clearInterval(id);
  }, [loading]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const next = Array.from(files).map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      kind: attachmentKind(file),
    }));
    setAttachments((prev) => [...prev, ...next].slice(0, 12));
  }, []);

  const removeAttachment = (id: string) => setAttachments((prev) => prev.filter((a) => a.id !== id));

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        addFiles([file]);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError('No pude acceder al micrófono. Revisa los permisos del navegador.');
    }
  }, [addFiles]);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }, []);

  const send = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if ((!text && attachments.length === 0) || loading) return;

      setError(null);
      setInput('');
      const userLabel =
        text ||
        (attachments.length === 1
          ? attachments[0].file.name
          : `${attachments.length} archivos adjuntos`);
      setMessages((m) => [...m, { role: 'user', content: userLabel }]);
      setLoading(true);

      try {
        const { data } = await supabase!.auth.getSession();
        const token = data?.session?.access_token;
        if (!token) throw new Error('Debes iniciar sesión');

        const form = new FormData();
        if (text) form.append('message', text);
        if (businessIdRef.current) form.append('businessId', businessIdRef.current);
        form.append('sessionId', sessionIdRef.current);
        const urls = text.match(/https?:\/\/\S+/gi);
        if (urls?.length) form.append('links', JSON.stringify(urls));
        for (const a of attachments) form.append('files', a.file, a.file.name);

        const res = await fetch('/api/business/ai-builder', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `Error ${res.status}`);

        setAttachments([]);

        if (json.businessId && !businessIdRef.current) {
          businessIdRef.current = json.businessId;
          onProfileCreated?.(json.businessId, json.slug);
        }
        if (json.profile) {
          onUpdate(json.profile as Partial<BusinessProfile>);
        } else if (json.appliedPatch && Object.keys(json.appliedPatch).length > 0) {
          onUpdate({ ...(json.appliedPatch as Partial<BusinessProfile>) });
        }
        if (json.createdBusiness && json.businessId) {
          onUpdate({ id: json.businessId, ...(json.slug ? { slug: json.slug } : {}) } as Partial<BusinessProfile>);
          onProfileCreated?.(json.businessId, json.slug);
        }
        if (json.createdProducts > 0) onProductsChanged?.();

        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: json.reply || 'Listo, actualicé tu perfil. Mira la vista previa.',
            summary: {
              createdProducts: json.createdProducts || 0,
              createdCategories: json.createdCategories || [],
              appliedFields: json.appliedFields || Object.keys(json.appliedPatch || {}),
              skippedFields: json.skippedFields || [],
            },
            followUps: json.followUpQuestions || [],
          },
        ]);
      } catch (e) {
        setError((e as Error).message);
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content:
              'Tuve un problema al procesar eso. Prueba de nuevo con un mensaje más corto o una foto.',
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, attachments, loading, onUpdate, onProfileCreated, onProductsChanged]
  );

  const showStarters = messages.length <= 1 && !loading;

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden bg-white border border-slate-200',
        variant === 'hero' ? 'rounded-3xl shadow-xl h-[min(680px,78vh)]' : 'rounded-2xl h-[420px]',
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
      }}
    >
      <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-teal-50 via-white to-cyan-50">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-black text-slate-800 tracking-tight">Crear con IA</p>
            <p className="text-[11px] text-slate-500">
              Texto, fotos, audio, PDF o enlaces — yo armo tu página.
            </p>
          </div>
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-teal-100 text-teal-800">
            Magia en ~30s
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className={cn(
          'flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50',
          dragOver && 'ring-2 ring-inset ring-teal-400 bg-teal-50/40'
        )}
      >
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}>
            <div
              className={cn(
                'text-sm rounded-2xl px-3.5 py-2.5 max-w-[94%] whitespace-pre-wrap leading-relaxed',
                msg.role === 'user'
                  ? 'bg-teal-600 text-white'
                  : 'bg-white border border-slate-100 text-slate-700 shadow-sm'
              )}
            >
              {msg.content}
            </div>

            {msg.summary &&
              (msg.summary.appliedFields.length > 0 ||
                msg.summary.createdProducts > 0 ||
                msg.summary.createdCategories.length > 0) && (
                <div className="mt-1.5 text-[11px] rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 px-3 py-2.5 max-w-[94%] w-full">
                  <p className="font-bold mb-1">Listo — esto ya está en tu página</p>
                  {msg.summary.appliedFields.length > 0 && (
                    <p>
                      •{' '}
                      {msg.summary.appliedFields
                        .map((f) => FIELD_LABELS[f] || f)
                        .slice(0, 8)
                        .join(', ')}
                    </p>
                  )}
                  {msg.summary.createdProducts > 0 && (
                    <p>• {msg.summary.createdProducts} producto(s) en el catálogo</p>
                  )}
                  {msg.summary.createdCategories.length > 0 && (
                    <p>• Categorías: {msg.summary.createdCategories.join(', ')}</p>
                  )}
                  <p className="mt-1 text-emerald-700/80">Mira la vista previa — puedes seguir afinando o publicar.</p>
                </div>
              )}

            {msg.followUps && msg.followUps.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5 max-w-[94%]">
                {msg.followUps.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => void send(q.question)}
                    className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-white text-teal-800 border border-teal-200 hover:bg-teal-50"
                  >
                    {q.question}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setMessages((m) => [
                      ...m,
                      {
                        role: 'assistant',
                        content:
                          'Perfecto, omitimos eso. Cuando quieras, manda más fotos o datos — o publica cuando estés listo.',
                      },
                    ])
                  }
                  className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200"
                >
                  Omitir por ahora
                </button>
              </div>
            )}
          </div>
        ))}

        {showStarters && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-800"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-teal-700 font-medium">
            <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-teal-200 border-t-teal-600 animate-spin" />
            {LOADING_STEPS[loadingStep]}
          </div>
        )}
        {error && <p className="text-xs text-rose-500">{error}</p>}
        {dragOver && (
          <p className="text-center text-sm font-semibold text-teal-700 py-6">Suelta aquí tus archivos</p>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-slate-100 bg-white">
          {attachments.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1 text-[11px] bg-slate-100 rounded-full px-2.5 py-1 text-slate-600"
            >
              {a.kind === 'image' ? 'Foto' : a.kind === 'audio' ? 'Audio' : 'Archivo'}:{' '}
              {a.file.name.slice(0, 18)}
              <button
                type="button"
                onClick={() => removeAttachment(a.id)}
                className="text-slate-400 hover:text-rose-500 ml-0.5"
                aria-label="Quitar"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1.5 p-2.5 border-t bg-white">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,audio/*,application/pdf,.doc,.docx,.txt,.csv"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 p-2.5 rounded-full text-slate-500 hover:bg-slate-100"
          title="Adjuntar fotos, PDF o documentos"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3 3 0 014.24 4.24l-9.2 9.19a1 1 0 01-1.41-1.41l8.49-8.49" />
          </svg>
        </button>
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          className={cn(
            'shrink-0 p-2.5 rounded-full transition-colors',
            recording ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-500 hover:bg-slate-100'
          )}
          title={recording ? 'Detener grabación' : 'Grabar audio'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4" />
          </svg>
        </button>
        <textarea
          className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 outline-none resize-none max-h-28 focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          rows={1}
          placeholder="Cuéntame tu negocio o pega un enlace…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={loading || (!input.trim() && attachments.length === 0)}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold disabled:opacity-50 transition-colors"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
