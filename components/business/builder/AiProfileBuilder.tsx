'use client';

/**
 * AI profile builder ("Crear con IA").
 *
 * A warm, human chat where the user sends anything — text, files, photos,
 * PDFs, audio, links — and Adis builds/edits their profile + catalog via the
 * Vector engine. Applied patches flow through `onUpdate` so the live preview
 * and the other edit modes stay in sync.
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
  onProfileCreated?: (businessId: string) => void;
  onProductsChanged?: () => void;
}

interface Attachment {
  id: string;
  file: File;
  kind: 'image' | 'audio' | 'doc';
}

const GREETING =
  '¡Hola! Soy Adis. Cuéntame de tu negocio y yo armo tu perfil por ti. ' +
  'Puedes escribir, mandarme fotos de tus productos o local, un audio contándome, ' +
  'documentos, PDFs o enlaces. Mientras más me compartas, mejor quedará. ¿Empezamos?';

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
}: AiProfileBuilderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: GREETING }]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionIdRef = useRef<string>(`builder_${Date.now().toString(36)}`);
  const businessIdRef = useRef<string | undefined>(profile.id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    businessIdRef.current = profile.id;
  }, [profile.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

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
      const userLabel = text || `${attachments.length} archivo(s) adjunto(s)`;
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
          onProfileCreated?.(json.businessId);
        }
        if (json.appliedPatch && Object.keys(json.appliedPatch).length > 0) {
          onUpdate({ ...(json.appliedPatch as Partial<BusinessProfile>) });
        }
        if (json.createdBusiness && json.businessId) {
          onUpdate({ id: json.businessId } as Partial<BusinessProfile>);
        }
        if (json.createdProducts > 0) onProductsChanged?.();

        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: json.reply || 'Listo, actualicé tu perfil.',
            summary: {
              createdProducts: json.createdProducts || 0,
              createdCategories: json.createdCategories || [],
              skippedFields: json.skippedFields || [],
            },
            followUps: json.followUpQuestions || [],
          },
        ]);
      } catch (e) {
        setError((e as Error).message);
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: 'Ups, tuve un problema. ¿Lo intentamos otra vez?' },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, attachments, loading, onUpdate, onProfileCreated, onProductsChanged]
  );

  return (
    <div className="flex flex-col h-[420px] rounded-2xl border border-slate-200 overflow-hidden bg-white">
      <div className="px-3 py-2 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-fuchsia-50">
        <p className="text-xs font-bold text-slate-700">Crear con IA</p>
        <p className="text-[11px] text-slate-500">
          Mándame texto, fotos, audios, PDFs o enlaces. Yo armo tu perfil.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex flex-col', msg.role === 'user' ? 'items-end' : 'items-start')}>
            <div
              className={cn(
                'text-sm rounded-2xl px-3 py-2 max-w-[92%] whitespace-pre-wrap',
                msg.role === 'user'
                  ? 'bg-[var(--brand-color,#4f46e5)] text-white'
                  : 'bg-white border border-slate-100 text-slate-700'
              )}
            >
              {msg.content}
            </div>

            {msg.summary && (msg.summary.createdProducts > 0 || msg.summary.createdCategories.length > 0) && (
              <div className="mt-1.5 text-[11px] rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 px-3 py-2 max-w-[92%]">
                <p className="font-bold mb-0.5">Esto es lo que creé</p>
                {msg.summary.createdProducts > 0 && <p>• {msg.summary.createdProducts} producto(s) al catálogo</p>}
                {msg.summary.createdCategories.length > 0 && (
                  <p>• Categorías: {msg.summary.createdCategories.join(', ')}</p>
                )}
              </div>
            )}

            {msg.followUps && msg.followUps.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5 max-w-[92%]">
                {msg.followUps.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setInput(q.question)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100"
                  >
                    {q.question}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <p className="text-xs text-slate-400 animate-pulse">Analizando y creando tu perfil…</p>}
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-2 py-1.5 border-t border-slate-100 bg-white">
          {attachments.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1 text-[11px] bg-slate-100 rounded-full px-2 py-1 text-slate-600"
            >
              {a.kind === 'image' ? '🖼️' : a.kind === 'audio' ? '🎙️' : '📄'} {a.file.name.slice(0, 18)}
              <button type="button" onClick={() => removeAttachment(a.id)} className="text-slate-400 hover:text-rose-500">
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-1.5 p-2 border-t bg-white">
        <label className="shrink-0 cursor-pointer p-2 rounded-full text-slate-500 hover:bg-slate-100" title="Adjuntar">
          <input
            type="file"
            multiple
            accept="image/*,audio/*,application/pdf,.doc,.docx,.txt,.csv"
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3 3 0 014.24 4.24l-9.2 9.19a1 1 0 01-1.41-1.41l8.49-8.49" />
          </svg>
        </label>
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          className={cn(
            'shrink-0 p-2 rounded-full transition-colors',
            recording ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-500 hover:bg-slate-100'
          )}
          title={recording ? 'Detener' : 'Grabar audio'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4" />
          </svg>
        </button>
        <textarea
          className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none resize-none max-h-24"
          rows={1}
          placeholder="Escribe o pega un enlace…"
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
          className="shrink-0 px-4 py-2 rounded-xl bg-[var(--brand-color,#4f46e5)] text-white text-sm font-bold disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
