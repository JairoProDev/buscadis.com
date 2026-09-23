'use client';

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { IconCrop, IconDownload, IconPen, IconSmile, IconText, IconUndo, IconX } from '@/components/Icons';

export type CoverTool = 'hd' | 'crop' | 'sticker' | 'text' | 'draw' | null;

export interface PublishCoverEditorHandle {
  hasEdits: () => boolean;
  exportJpeg: () => Promise<Blob | null>;
}

interface TextMark {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
}

interface StickerMark {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

interface Stroke {
  color: string;
  width: number;
  points: Array<{ x: number; y: number }>;
}

const STICKERS = ['😀', '😍', '🔥', '⭐', '✅', '❤️', '🏠', '🚗', '💼', '📍', '🎉', '👀'];
const COLORS = ['#ffffff', '#111827', '#facc15', '#ef4444', '#2563eb', '#16a34a'];

const circle =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#8e8e93] text-white disabled:opacity-40';

interface PublishCoverEditorProps {
  hd: boolean;
  onToggleHd: () => void;
  onLeave: () => void;
  onNotify?: (msg: string, type?: 'info' | 'error' | 'success') => void;
  heroUrl?: string;
  titulo?: string;
  descripcion?: string;
  onTitle: (value: string) => void;
  onDescription: (value: string) => void;
  autoDownload: boolean;
  onAutoDownload: (value: boolean) => void;
  onReplaceCover: (file: File) => Promise<void>;
  tool: CoverTool;
  onTool: (tool: CoverTool) => void;
  children: ReactNode;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const PublishCoverEditor = forwardRef<PublishCoverEditorHandle, PublishCoverEditorProps>(
  function PublishCoverEditor(
    {
      hd,
      onToggleHd,
      onLeave,
      onNotify,
      heroUrl,
      titulo,
      descripcion,
      onTitle,
      onDescription,
      autoDownload,
      onAutoDownload,
      onReplaceCover,
      tool,
      onTool,
      children,
    },
    ref,
  ) {
    const stageRef = useRef<HTMLDivElement>(null);
    const [texts, setTexts] = useState<TextMark[]>([]);
    const [stickers, setStickers] = useState<StickerMark[]>([]);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [draftStroke, setDraftStroke] = useState<Stroke | null>(null);
    const [penColor, setPenColor] = useState('#ffffff');
    const [penWidth, setPenWidth] = useState(6);
    const [textValue, setTextValue] = useState('');
    const [textColor, setTextColor] = useState('#ffffff');
    const [cropZoom, setCropZoom] = useState(1);
    const [cropRot, setCropRot] = useState(0);
    const [cropPan, setCropPan] = useState({ x: 0, y: 0 });
    const dragRef = useRef<{ id: string; kind: 'text' | 'sticker'; px: number; py: number; x: number; y: number } | null>(null);
    const cropDrag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

    const hasEdits = () => texts.length > 0 || stickers.length > 0 || strokes.length > 0;

    const exportJpeg = async (): Promise<Blob | null> => {
      const node = stageRef.current;
      if (!node) return null;
      try {
        const { toJpeg } = await import('html-to-image');
        const dataUrl = await toJpeg(node, {
          quality: hd ? 0.95 : 0.82,
          pixelRatio: hd ? 2 : 1.25,
          cacheBust: true,
          backgroundColor: '#ffffff',
        });
        const res = await fetch(dataUrl);
        return await res.blob();
      } catch {
        onNotify?.('No se pudo exportar la portada', 'error');
        return null;
      }
    };

    useImperativeHandle(ref, () => ({ hasEdits, exportJpeg }), [hd, texts, stickers, strokes]);

    const download = async () => {
      const blob = await exportJpeg();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buscadis-portada.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onNotify?.('Portada descargada', 'success');
    };

    const toggle = (next: CoverTool) => {
      onTool(tool === next ? null : next);
    };

    const pointOf = (event: ReactPointerEvent) => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      };
    };

    const applyCrop = async () => {
      if (!heroUrl) {
        onNotify?.('Primero toma o sube una foto', 'info');
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = heroUrl;
      try {
        await img.decode();
      } catch {
        onNotify?.('No se pudo recortar esta foto', 'error');
        return;
      }
      const size = hd ? 1600 : 1080;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.save();
      ctx.translate(size / 2 + cropPan.x, size / 2 + cropPan.y);
      ctx.rotate((cropRot * Math.PI) / 180);
      ctx.scale(cropZoom, cropZoom);
      const scale = Math.max(size / img.width, size / img.height);
      ctx.drawImage(img, (-img.width * scale) / 2, (-img.height * scale) / 2, img.width * scale, img.height * scale);
      ctx.restore();
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', hd ? 0.95 : 0.82));
      if (!blob) return;
      await onReplaceCover(new File([blob], `recorte-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      setCropZoom(1);
      setCropRot(0);
      setCropPan({ x: 0, y: 0 });
      onTool(null);
      onNotify?.('Recorte aplicado', 'success');
    };

    const onStagePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
      if (tool === 'draw') {
        const stroke = { color: penColor, width: penWidth, points: [pointOf(event)] };
        setDraftStroke(stroke);
        event.currentTarget.setPointerCapture(event.pointerId);
        return;
      }
      if (tool === 'crop' && heroUrl) {
        cropDrag.current = { px: event.clientX, py: event.clientY, x: cropPan.x, y: cropPan.y };
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    };

    const onStagePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
      if (tool === 'draw' && draftStroke) {
        const p = pointOf(event);
        setDraftStroke({ ...draftStroke, points: [...draftStroke.points, p] });
        return;
      }
      if (tool === 'crop' && cropDrag.current) {
        setCropPan({
          x: cropDrag.current.x + (event.clientX - cropDrag.current.px),
          y: cropDrag.current.y + (event.clientY - cropDrag.current.py),
        });
        return;
      }
      const drag = dragRef.current;
      if (!drag || !stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const x = drag.x + (event.clientX - drag.px) / rect.width;
      const y = drag.y + (event.clientY - drag.py) / rect.height;
      if (drag.kind === 'text') {
        setTexts((list) => list.map((item) => (item.id === drag.id ? { ...item, x, y } : item)));
      } else {
        setStickers((list) => list.map((item) => (item.id === drag.id ? { ...item, x, y } : item)));
      }
    };

    const onStagePointerUp = () => {
      if (draftStroke && draftStroke.points.length > 1) {
        setStrokes((list) => [...list, draftStroke]);
      }
      setDraftStroke(null);
      dragRef.current = null;
      cropDrag.current = null;
    };

    const allStrokes = draftStroke ? [...strokes, draftStroke] : strokes;

    return (
      <>
        <div className="flex shrink-0 items-center justify-between gap-1 px-3 pt-[max(0.65rem,env(safe-area-inset-top))] pb-2">
          <button type="button" className={circle} onClick={onLeave} aria-label="Salir" title="Salir">
            <IconX size={18} />
          </button>
          <button type="button" className={circle} onClick={() => void download()} aria-label="Descargar portada" title="Descargar">
            <IconDownload size={16} />
          </button>
          <button
            type="button"
            className={hd ? `${circle} bg-[var(--brand-blue)]` : circle}
            onClick={onToggleHd}
            aria-pressed={hd}
            aria-label={hd ? 'Alta calidad activada' : 'Activar alta calidad'}
            title={hd ? 'Alta calidad' : 'Calidad estándar'}
          >
            <span className="text-[11px] font-black tracking-tight">HD</span>
          </button>
          <button
            type="button"
            className={tool === 'crop' ? `${circle} bg-[var(--brand-blue)]` : circle}
            onClick={() => toggle('crop')}
            aria-label="Recortar"
            title="Recortar"
          >
            <IconCrop size={16} />
          </button>
          <button
            type="button"
            className={tool === 'sticker' ? `${circle} bg-[var(--brand-blue)]` : circle}
            onClick={() => toggle('sticker')}
            aria-label="Stickers"
            title="Stickers"
          >
            <IconSmile size={16} />
          </button>
          <button
            type="button"
            className={tool === 'text' ? `${circle} bg-[var(--brand-blue)]` : circle}
            onClick={() => toggle('text')}
            aria-label="Texto"
            title="Texto"
          >
            <IconText size={16} />
          </button>
          <button
            type="button"
            className={tool === 'draw' ? `${circle} bg-[var(--brand-blue)]` : circle}
            onClick={() => toggle('draw')}
            aria-label="Dibujar"
            title="Dibujar"
          >
            <IconPen size={16} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-2">
          <div
            ref={stageRef}
            className="relative aspect-square h-full max-h-full w-auto max-w-full overflow-hidden rounded-2xl bg-[var(--bg-secondary)]"
            onPointerDown={onStagePointerDown}
            onPointerMove={onStagePointerMove}
            onPointerUp={onStagePointerUp}
            onPointerCancel={onStagePointerUp}
          >
            <div
              className="absolute inset-0"
              style={
                tool === 'crop' && heroUrl
                  ? {
                      transform: `translate(${cropPan.x}px, ${cropPan.y}px) rotate(${cropRot}deg) scale(${cropZoom})`,
                    }
                  : undefined
              }
            >
              {children}
            </div>
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {allStrokes.map((stroke, index) => (
                <polyline
                  key={index}
                  fill="none"
                  stroke={stroke.color}
                  strokeWidth={stroke.width / 4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  points={stroke.points.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
                />
              ))}
            </svg>
            {stickers.map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                className="absolute -translate-x-1/2 -translate-y-1/2 text-4xl leading-none"
                style={{ left: `${sticker.x * 100}%`, top: `${sticker.y * 100}%` }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  dragRef.current = { id: sticker.id, kind: 'sticker', px: event.clientX, py: event.clientY, x: sticker.x, y: sticker.y };
                }}
              >
                {sticker.emoji}
              </button>
            ))}
            {texts.map((mark) => (
              <button
                key={mark.id}
                type="button"
                className="absolute max-w-[80%] -translate-x-1/2 -translate-y-1/2 text-center text-xl font-black leading-tight drop-shadow"
                style={{ left: `${mark.x * 100}%`, top: `${mark.y * 100}%`, color: mark.color }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  dragRef.current = { id: mark.id, kind: 'text', px: event.clientX, py: event.clientY, x: mark.x, y: mark.y };
                }}
              >
                {mark.text}
              </button>
            ))}
          </div>
        </div>

        {tool === 'crop' && (
          <div className="flex shrink-0 items-center justify-center gap-2 px-3 pb-2">
            <button type="button" className="rounded-full bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-bold" onClick={() => setCropZoom((z) => Math.max(1, z - 0.15))}>−</button>
            <button type="button" className="rounded-full bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-bold" onClick={() => setCropZoom((z) => Math.min(3, z + 0.15))}>+</button>
            <button type="button" className="rounded-full bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-bold" onClick={() => setCropRot((r) => (r + 90) % 360)}>Girar</button>
            <button type="button" className="rounded-full bg-[var(--brand-blue)] px-3 py-1.5 text-xs font-bold text-white" onClick={() => void applyCrop()}>Aplicar</button>
          </div>
        )}

        {tool === 'sticker' && (
          <div className="flex shrink-0 gap-2 overflow-x-auto px-3 pb-2">
            {STICKERS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="shrink-0 text-2xl"
                onClick={() => setStickers((list) => [...list, { id: uid(), emoji, x: 0.5, y: 0.5 }])}
              >
                {emoji}
              </button>
            ))}
            <button type="button" className="shrink-0 text-xs font-semibold text-red-600" onClick={() => setStickers((list) => list.slice(0, -1))} disabled={!stickers.length}>
              Quitar
            </button>
          </div>
        )}

        {tool === 'text' && (
          <div className="shrink-0 space-y-2 px-3 pb-2">
            <div className="flex gap-2">
              <input
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder="Texto sobre la portada"
                className="min-w-0 flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
              />
              <button
                type="button"
                className="rounded-xl bg-[var(--brand-blue)] px-3 text-xs font-bold text-white"
                onClick={() => {
                  const text = textValue.trim();
                  if (!text) return;
                  setTexts((list) => [...list, { id: uid(), text, x: 0.5, y: 0.42, color: textColor }]);
                  setTextValue('');
                }}
              >
                Poner
              </button>
            </div>
            <div className="flex gap-1.5">
              {COLORS.map((color) => (
                <button key={color} type="button" className="h-6 w-6 rounded-full ring-1 ring-black/10" style={{ background: color }} onClick={() => setTextColor(color)} aria-label={color} />
              ))}
            </div>
            <input
              value={titulo || ''}
              onChange={(e) => onTitle(e.target.value)}
              placeholder="Título del aviso"
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
            />
            <input
              value={descripcion || ''}
              onChange={(e) => onDescription(e.target.value)}
              placeholder="Descripción"
              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input type="checkbox" checked={autoDownload} onChange={(e) => onAutoDownload(e.target.checked)} />
              Descargar el aviso al publicar
            </label>
          </div>
        )}

        {tool === 'draw' && (
          <div className="flex shrink-0 items-center gap-2 px-3 pb-2">
            {COLORS.map((color) => (
              <button key={color} type="button" className="h-6 w-6 rounded-full ring-1 ring-black/10" style={{ background: color, outline: penColor === color ? '2px solid var(--brand-blue)' : undefined }} onClick={() => setPenColor(color)} aria-label={color} />
            ))}
            <button type="button" className="ml-auto flex items-center gap-1 text-xs font-semibold" onClick={() => setStrokes((list) => list.slice(0, -1))} disabled={!strokes.length}>
              <IconUndo size={12} /> Deshacer
            </button>
          </div>
        )}
      </>
    );
  },
);

export default PublishCoverEditor;
