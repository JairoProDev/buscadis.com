'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { IconCrop, IconLayers, IconPen, IconSmile, IconText, IconUndo, IconX } from '@/components/Icons';

export type CoverTool = 'crop' | 'sticker' | 'text' | 'draw' | null;

export interface PublishCoverEditorHandle {
  hasEdits: () => boolean;
  cropPending: () => boolean;
  exportJpeg: () => Promise<Blob | null>;
  commitCrop: () => Promise<string | null>;
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
  onLeave: () => void;
  onNotify?: (msg: string, type?: 'info' | 'error' | 'success') => void;
  heroUrl?: string;
  titulo?: string;
  descripcion?: string;
  onTitle: (value: string) => void;
  onDescription: (value: string) => void;
  autoDownload: boolean;
  onAutoDownload: (value: boolean) => void;
  onReplaceCover: (file: File) => Promise<string | void>;
  onOpenTemplates: () => void;
  templatesOpen: boolean;
  tool: CoverTool;
  onTool: (tool: CoverTool) => void;
  children: ReactNode;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function clampCropPan(
  pan: { x: number; y: number },
  zoom: number,
  stage: number,
  photo: { w: number; h: number },
) {
  if (stage <= 0 || photo.w <= 0 || photo.h <= 0) return { x: 0, y: 0 };
  const scale = Math.max(stage / photo.w, stage / photo.h) * zoom;
  const maxX = Math.max(0, (photo.w * scale - stage) / 2);
  const maxY = Math.max(0, (photo.h * scale - stage) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, pan.x)),
    y: Math.min(maxY, Math.max(-maxY, pan.y)),
  };
}

function cropDrawRect(
  stage: number,
  photo: { w: number; h: number },
  zoom: number,
  pan: { x: number; y: number },
) {
  const scale = Math.max(stage / photo.w, stage / photo.h) * zoom;
  const width = photo.w * scale;
  const height = photo.h * scale;
  const clamped = clampCropPan(pan, zoom, stage, photo);
  return {
    width,
    height,
    left: stage / 2 - width / 2 + clamped.x,
    top: stage / 2 - height / 2 + clamped.y,
  };
}

const PublishCoverEditor = forwardRef<PublishCoverEditorHandle, PublishCoverEditorProps>(
  function PublishCoverEditor(
    {
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
      onOpenTemplates,
      templatesOpen,
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
    const [cropPan, setCropPan] = useState({ x: 0, y: 0 });
    const [photoSize, setPhotoSize] = useState<{ w: number; h: number } | null>(null);
    const [stageSize, setStageSize] = useState(0);
    const dragRef = useRef<{ id: string; kind: 'text' | 'sticker'; px: number; py: number; x: number; y: number } | null>(null);
    const cropDrag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

    const hasEdits = () => texts.length > 0 || stickers.length > 0 || strokes.length > 0;

    useEffect(() => {
      const node = stageRef.current;
      if (!node) return;
      const update = () => setStageSize(Math.round(node.clientWidth));
      update();
      const observer = new ResizeObserver(update);
      observer.observe(node);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      setCropZoom(1);
      setCropPan({ x: 0, y: 0 });
      if (!heroUrl) {
        setPhotoSize(null);
        return;
      }
      let cancelled = false;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!cancelled) setPhotoSize({ w: img.naturalWidth, h: img.naturalHeight });
      };
      img.src = heroUrl;
      return () => {
        cancelled = true;
      };
    }, [heroUrl]);

    const exportJpeg = async (): Promise<Blob | null> => {
      const node = stageRef.current;
      if (!node) return null;
      try {
        const { toJpeg } = await import('html-to-image');
        const dataUrl = await toJpeg(node, {
          quality: 0.92,
          pixelRatio: 2,
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

    useImperativeHandle(
      ref,
      () => ({
        hasEdits,
        cropPending: () =>
          tool === 'crop' && !!heroUrl && (cropZoom !== 1 || cropPan.x !== 0 || cropPan.y !== 0),
        exportJpeg,
        commitCrop: async () => {
          const dirty = cropZoom !== 1 || cropPan.x !== 0 || cropPan.y !== 0;
          if (!dirty || !heroUrl || tool !== 'crop') return null;
          const url = await applyCrop();
          if (url) onTool(null);
          return url;
        },
      }),
      // applyCrop closes over the latest crop state on each render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [texts, stickers, strokes, cropZoom, cropPan, heroUrl, tool, photoSize, stageSize],
    );

    const toggle = (next: CoverTool) => {
      const opening = tool === next ? null : next;
      if (tool === 'crop' && opening !== 'crop') {
        void finishCrop(opening);
        return;
      }
      onTool(opening);
    };

    const pointOf = (event: ReactPointerEvent) => {
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      };
    };

    const applyCrop = async (): Promise<string | null> => {
      if (!heroUrl || !photoSize) {
        onNotify?.('Primero toma o sube una foto', 'info');
        return null;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = heroUrl;
      try {
        await img.decode();
      } catch {
        onNotify?.('No se pudo recortar esta foto', 'error');
        return null;
      }
      const size = 1080;
      const stage = stageRef.current?.clientWidth || stageSize || size;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, size, size);
      const rect = cropDrawRect(size, photoSize, cropZoom, {
        x: cropPan.x * (size / stage),
        y: cropPan.y * (size / stage),
      });
      ctx.drawImage(img, rect.left, rect.top, rect.width, rect.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      if (!blob) return null;
      const url = await onReplaceCover(new File([blob], `recorte-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      if (!url) return null;
      setCropZoom(1);
      setCropPan({ x: 0, y: 0 });
      onNotify?.('Recorte aplicado', 'success');
      return url;
    };

    const finishCrop = async (next: CoverTool) => {
      const dirty = cropZoom !== 1 || cropPan.x !== 0 || cropPan.y !== 0;
      if (dirty && heroUrl) {
        const url = await applyCrop();
        if (!url) return;
      }
      onTool(next);
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
      if (tool === 'crop' && cropDrag.current && photoSize && stageSize > 0) {
        setCropPan(
          clampCropPan(
            {
              x: cropDrag.current.x + (event.clientX - cropDrag.current.px),
              y: cropDrag.current.y + (event.clientY - cropDrag.current.py),
            },
            cropZoom,
            stageSize,
            photoSize,
          ),
        );
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
        <div className="flex shrink-0 items-center justify-between gap-2 px-3 pt-[max(0.65rem,env(safe-area-inset-top))] pb-2">
          <button type="button" className={circle} onClick={onLeave} aria-label="Salir" title="Salir">
            <IconX size={18} />
          </button>
          {heroUrl && (
            <button
              type="button"
              className={tool === 'crop' ? `${circle} bg-[var(--brand-blue)]` : circle}
              onClick={() => toggle('crop')}
              aria-label="Reencuadrar foto"
              title="Reencuadrar"
            >
              <IconCrop size={16} />
            </button>
          )}
          <button
            type="button"
            className={templatesOpen ? `${circle} bg-[var(--brand-blue)]` : circle}
            onClick={onOpenTemplates}
            aria-label="Plantillas"
            title="Plantillas"
          >
            <IconLayers size={16} />
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

        <div className="flex min-h-0 w-full flex-1 items-center justify-center px-4 py-3 [container-type:size]">
          <div
            ref={stageRef}
            className="relative shrink-0 overflow-hidden rounded-2xl bg-[var(--bg-secondary)]"
            style={{ width: 'min(100cqw, 100cqh)', height: 'min(100cqw, 100cqh)', aspectRatio: '1 / 1' }}
            onPointerDown={onStagePointerDown}
            onPointerMove={onStagePointerMove}
            onPointerUp={onStagePointerUp}
            onPointerCancel={onStagePointerUp}
          >
            {tool === 'crop' && heroUrl && photoSize && stageSize > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroUrl}
                alt=""
                draggable={false}
                crossOrigin="anonymous"
                className="pointer-events-none absolute max-w-none select-none"
                style={cropDrawRect(stageSize, photoSize, cropZoom, cropPan)}
              />
            ) : (
              <div className="absolute inset-0">{children}</div>
            )}
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

        {tool === 'crop' && heroUrl && (
          <div className="flex shrink-0 items-center justify-center gap-2 px-3 pb-2">
            <p className="m-0 text-xs text-[var(--text-secondary)]">Arrastra la foto dentro del cuadrado</p>
            <button
              type="button"
              className="rounded-full bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-bold"
              onClick={() => {
                const next = Math.max(1, +(cropZoom - 0.15).toFixed(2));
                setCropZoom(next);
                if (photoSize && stageSize > 0) setCropPan((pan) => clampCropPan(pan, next, stageSize, photoSize));
              }}
            >
              −
            </button>
            <button
              type="button"
              className="rounded-full bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-bold"
              onClick={() => {
                const next = Math.min(3, +(cropZoom + 0.15).toFixed(2));
                setCropZoom(next);
                if (photoSize && stageSize > 0) setCropPan((pan) => clampCropPan(pan, next, stageSize, photoSize));
              }}
            >
              +
            </button>
            <button type="button" className="rounded-full bg-[var(--brand-blue)] px-3 py-1.5 text-xs font-bold text-white" onClick={() => void finishCrop(null)}>
              Listo
            </button>
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
