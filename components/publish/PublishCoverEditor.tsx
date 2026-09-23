'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { IconChevronLeft, IconCrop, IconForms, IconLayers, IconPen, IconRedo, IconSmile, IconText, IconUndo } from '@/components/Icons';
import { EMPTY_COVER_OVERLAY, type PublishCoverOverlay } from '@/lib/publish/publish-draft-types';

export type CoverTool = 'crop' | 'sticker' | 'text' | 'draw' | null;

export interface PublishCoverEditorHandle {
  hasEdits: () => boolean;
  cropPending: () => boolean;
  exportJpeg: () => Promise<Blob | null>;
  commitCrop: () => Promise<string | null>;
}

type CoverFont = 'classic' | 'modern' | 'strong' | 'type' | 'script';
type CoverBg = 'none' | 'solid' | 'soft';
type CoverAlign = 'left' | 'center' | 'right';

interface TextMark {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  font: CoverFont;
  size: number;
  align: CoverAlign;
  bg: CoverBg;
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
const COLORS = ['#ffffff', '#111827', '#facc15', '#ef4444', '#2563eb', '#16a34a', '#a855f7', '#f97316'];

const TEXT_FONTS: Array<{ id: CoverFont; label: string; fontFamily: string; fontWeight: number }> = [
  { id: 'classic', label: 'Clásica', fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 700 },
  { id: 'modern', label: 'Moderna', fontFamily: 'ui-sans-serif, system-ui, sans-serif', fontWeight: 700 },
  { id: 'strong', label: 'Fuerte', fontFamily: 'Impact, "Arial Black", sans-serif', fontWeight: 900 },
  { id: 'type', label: 'Máquina', fontFamily: 'ui-monospace, monospace', fontWeight: 600 },
  { id: 'script', label: 'Manuscrita', fontFamily: '"Segoe Script", "Brush Script MT", cursive', fontWeight: 500 },
];

function toolButton(active: boolean) {
  return `flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
    active
      ? 'bg-[var(--brand-blue)] text-white'
      : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
  }`;
}

interface PublishCoverEditorProps {
  onLeave: () => void;
  onNotify?: (msg: string, type?: 'info' | 'error' | 'success') => void;
  heroUrl?: string;
  onReplaceCover: (file: File) => Promise<string | void>;
  onOpenTemplates: () => void;
  templatesOpen: boolean;
  formOpen: boolean;
  onToggleForm: () => void;
  tool: CoverTool;
  onTool: (tool: CoverTool) => void;
  overlay?: PublishCoverOverlay;
  onOverlayChange: (next: PublishCoverOverlay, options?: { history?: boolean }) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  paidTools?: boolean;
  above?: ReactNode;
  below?: ReactNode;
  children: ReactNode;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function blankText(id = uid()): TextMark {
  return { id, text: '', x: 0.5, y: 0.46, color: '#ffffff', font: 'strong', size: 1, align: 'center', bg: 'none' };
}

function fontOf(id: CoverFont) {
  return TEXT_FONTS.find((font) => font.id === id) || TEXT_FONTS[2];
}

function contrastColor(hex: string) {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return '#111827';
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111827' : '#ffffff';
}

function textLook(mark: TextMark, stageSize: number): CSSProperties {
  const font = fontOf(mark.font);
  const fontSize = Math.round(Math.max(stageSize, 220) * 0.078 * mark.size);
  const shared: CSSProperties = {
    fontFamily: font.fontFamily,
    fontWeight: font.fontWeight,
    fontSize,
    lineHeight: 1.15,
    textAlign: mark.align,
    letterSpacing: mark.font === 'strong' ? '0.01em' : undefined,
  };
  if (mark.bg === 'solid') {
    return { ...shared, color: contrastColor(mark.color), background: mark.color, padding: '0.12em 0.38em', borderRadius: '0.2em' };
  }
  if (mark.bg === 'soft') {
    return { ...shared, color: '#ffffff', background: `${mark.color}99`, padding: '0.12em 0.38em', borderRadius: '0.2em' };
  }
  return { ...shared, color: mark.color, textShadow: '0 1px 6px rgba(0,0,0,0.55)' };
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
      onReplaceCover,
      onOpenTemplates,
      templatesOpen,
      formOpen,
      onToggleForm,
      tool,
      onTool,
      overlay,
      onOverlayChange,
      canUndo,
      canRedo,
      onUndo,
      onRedo,
      paidTools = false,
      above,
      below,
      children,
    },
    ref,
  ) {
    const stageRef = useRef<HTMLDivElement>(null);
    const texts = (overlay?.texts || []) as TextMark[];
    const stickers = overlay?.stickers || [];
    const strokes = overlay?.strokes || [];
    const [draftStroke, setDraftStroke] = useState<Stroke | null>(null);
    const draftStrokeRef = useRef<Stroke | null>(null);
    const [penColor, setPenColor] = useState('#ffffff');
    const [penWidth, setPenWidth] = useState(6);
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    const [cropZoom, setCropZoom] = useState(1);
    const [cropPan, setCropPan] = useState({ x: 0, y: 0 });
    const [photoSize, setPhotoSize] = useState<{ w: number; h: number } | null>(null);
    const [stageSize, setStageSize] = useState(0);
    const dragRef = useRef<{ id: string; kind: 'text' | 'sticker'; px: number; py: number; x: number; y: number; moved: boolean; recorded: boolean } | null>(null);
    const resizeRef = useRef<{ id: string; py: number; size: number } | null>(null);
    const textEls = useRef<Record<string, HTMLTextAreaElement | null>>({});
    const cropDrag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

    const hasEdits = () => texts.some((mark) => mark.text.trim()) || stickers.length > 0 || strokes.length > 0;

    const writeOverlay = (next: PublishCoverOverlay, options?: { history?: boolean }) => {
      onOverlayChange(next, options);
    };

    useEffect(() => {
      if (tool !== 'text' || texts.length > 0) return;
      writeOverlay({ ...EMPTY_COVER_OVERLAY, ...overlay, texts: [blankText()] });
      // Solo al abrir la herramienta, para dejar un texto listo para escribir.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tool]);

    useEffect(() => {
      if (tool !== 'text' || texts.length === 0) return;
      if (!selectedTextId || !texts.some((mark) => mark.id === selectedTextId)) {
        setSelectedTextId(texts[texts.length - 1].id);
      }
    }, [tool, texts, selectedTextId]);

    useEffect(() => {
      if (tool !== 'text' || !selectedTextId) return;
      textEls.current[selectedTextId]?.focus();
    }, [tool, selectedTextId]);

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

    const holdPointer = (event: ReactPointerEvent) => {
      event.preventDefault();
      stageRef.current?.setPointerCapture(event.pointerId);
    };

    const beginMarkDrag = (
      event: ReactPointerEvent,
      kind: 'text' | 'sticker',
      id: string,
      x: number,
      y: number,
    ) => {
      event.stopPropagation();
      holdPointer(event);
      dragRef.current = { id, kind, px: event.clientX, py: event.clientY, x, y, moved: false, recorded: false };
    };

    const patchText = (id: string, patch: Partial<TextMark>, options?: { history?: boolean }) => {
      writeOverlay(
        { texts: texts.map((item) => (item.id === id ? { ...item, ...patch } : item)), stickers, strokes },
        options,
      );
    };

    const addText = () => {
      const mark = blankText();
      writeOverlay({ texts: [...texts, mark], stickers, strokes });
      setSelectedTextId(mark.id);
    };

    const onStagePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
      if (tool === 'draw') {
        const stroke = { color: penColor, width: penWidth, points: [pointOf(event)] };
        draftStrokeRef.current = stroke;
        setDraftStroke(stroke);
        holdPointer(event);
        return;
      }
      if (tool === 'crop' && heroUrl) {
        cropDrag.current = { px: event.clientX, py: event.clientY, x: cropPan.x, y: cropPan.y };
        holdPointer(event);
      }
    };

    const onStagePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
      const drawing = draftStrokeRef.current;
      if (tool === 'draw' && drawing) {
        const next = { ...drawing, points: [...drawing.points, pointOf(event)] };
        draftStrokeRef.current = next;
        setDraftStroke(next);
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
      const resizing = resizeRef.current;
      if (resizing) {
        const size = Math.min(2.4, Math.max(0.45, resizing.size + (event.clientY - resizing.py) / 120));
        patchText(resizing.id, { size });
        return;
      }
      const drag = dragRef.current;
      if (!drag || !stageRef.current) return;
      const dx = event.clientX - drag.px;
      const dy = event.clientY - drag.py;
      if (!drag.moved && Math.hypot(dx, dy) < 8) return;
      if (!drag.moved) {
        drag.moved = true;
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      }
      const rect = stageRef.current.getBoundingClientRect();
      const x = Math.min(0.92, Math.max(0.08, drag.x + dx / rect.width));
      const y = Math.min(0.92, Math.max(0.08, drag.y + dy / rect.height));
      const history = !drag.recorded;
      drag.recorded = true;
      if (drag.kind === 'text') {
        writeOverlay(
          { texts: texts.map((item) => (item.id === drag.id ? { ...item, x, y } : item)), stickers, strokes },
          { history },
        );
      } else {
        writeOverlay(
          { texts, stickers: stickers.map((item) => (item.id === drag.id ? { ...item, x, y } : item)), strokes },
          { history },
        );
      }
    };

    const onStagePointerUp = () => {
      const stroke = draftStrokeRef.current;
      if (stroke && stroke.points.length > 1) {
        writeOverlay({ texts, stickers, strokes: [...strokes, stroke] });
      }
      draftStrokeRef.current = null;
      setDraftStroke(null);
      const drag = dragRef.current;
      dragRef.current = null;
      resizeRef.current = null;
      cropDrag.current = null;
      if (drag?.kind === 'text' && !drag.moved) {
        setSelectedTextId(drag.id);
        requestAnimationFrame(() => textEls.current[drag.id]?.focus());
      }
    };

    const allStrokes = draftStroke ? [...strokes, draftStroke] : strokes;
    const selectedMark = texts.find((mark) => mark.id === selectedTextId) || null;

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 px-2 pt-[max(0.4rem,env(safe-area-inset-top))] pb-1">
          <button
            type="button"
            onClick={onLeave}
            className="flex h-10 w-10 items-center justify-center text-[var(--text-primary)]"
            aria-label="Salir"
            title="Salir"
          >
            <IconChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="flex h-10 w-10 items-center justify-center text-[var(--text-primary)] disabled:opacity-30"
            aria-label="Deshacer"
            title="Deshacer"
          >
            <IconUndo size={16} />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="flex h-10 w-10 items-center justify-center text-[var(--text-primary)] disabled:opacity-30"
            aria-label="Rehacer"
            title="Rehacer"
          >
            <IconRedo size={16} />
          </button>
          <div className="ml-auto flex items-center gap-0.5 rounded-2xl bg-[var(--bg-secondary)] p-1 ring-1 ring-[var(--border-color)]">
            {paidTools && heroUrl && (
              <button
                type="button"
                className={toolButton(tool === 'crop')}
                onClick={() => toggle('crop')}
                aria-label="Reencuadrar foto"
                title="Reencuadrar"
              >
                <IconCrop size={16} />
              </button>
            )}
            <button
              type="button"
              className={toolButton(templatesOpen)}
              onClick={onOpenTemplates}
              aria-label="Plantillas"
              title="Plantillas"
            >
              <IconLayers size={16} />
            </button>
            {paidTools && (
              <button
                type="button"
                className={toolButton(tool === 'sticker')}
                onClick={() => toggle('sticker')}
                aria-label="Stickers"
                title="Stickers"
              >
                <IconSmile size={16} />
              </button>
            )}
            {paidTools && (
              <button
                type="button"
                className={toolButton(tool === 'text')}
                onClick={() => toggle('text')}
                aria-label="Texto"
                title="Texto"
              >
                <IconText size={16} />
              </button>
            )}
            {paidTools && (
              <button
                type="button"
                className={toolButton(tool === 'draw')}
                onClick={() => toggle('draw')}
                aria-label="Dibujar"
                title="Dibujar"
              >
                <IconPen size={16} />
              </button>
            )}
            <button
              type="button"
              className={toolButton(formOpen)}
              onClick={onToggleForm}
              aria-label="Formulario"
              aria-pressed={formOpen}
              title="Formulario"
            >
              <IconForms size={16} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-1 [container-type:size]">
          <div className="mx-auto flex flex-col" style={{ width: 'min(100%, 58cqh)' }}>
          {above}
          <div
            ref={stageRef}
            className="relative aspect-square w-full shrink-0 touch-none overflow-hidden rounded-2xl bg-[var(--bg-secondary)]"
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
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none text-4xl leading-none active:cursor-grabbing"
                style={{ left: `${sticker.x * 100}%`, top: `${sticker.y * 100}%` }}
                onPointerDown={(event) => beginMarkDrag(event, 'sticker', sticker.id, sticker.x, sticker.y)}
              >
                {sticker.emoji}
              </button>
            ))}
            {texts.map((mark) => {
              const selected = tool === 'text' && mark.id === selectedTextId;
              const look = textLook(mark, stageSize);
              return (
                <div
                  key={mark.id}
                  className={`absolute max-w-[86%] -translate-x-1/2 -translate-y-1/2 touch-none ${selected ? 'rounded-md ring-2 ring-white' : ''}`}
                  style={{ left: `${mark.x * 100}%`, top: `${mark.y * 100}%` }}
                  onPointerDown={(event) => {
                    if ((event.target as HTMLElement).closest('[data-resize]')) return;
                    beginMarkDrag(event, 'text', mark.id, mark.x, mark.y);
                  }}
                >
                  <div className="min-w-[3.5rem] whitespace-pre-wrap" style={look}>
                    {mark.text || (selected ? 'Texto' : '')}
                  </div>
                  {selected && (
                    <textarea
                      ref={(node) => {
                        textEls.current[mark.id] = node;
                      }}
                      value={mark.text}
                      rows={2}
                      aria-label="Texto sobre la foto"
                      placeholder="Texto"
                      onChange={(event) => patchText(mark.id, { text: event.target.value })}
                      className="absolute inset-0 resize-none overflow-hidden bg-transparent outline-none"
                      style={{ ...look, color: 'transparent', background: 'transparent', caretColor: String(look.color || '#fff') }}
                    />
                  )}
                  {selected && (
                    <button
                      type="button"
                      data-resize
                      aria-label="Cambiar tamaño"
                      title="Tamaño"
                      className="absolute -bottom-3 -right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-black text-slate-900 shadow"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        holdPointer(event);
                        resizeRef.current = { id: mark.id, py: event.clientY, size: mark.size };
                      }}
                    >
                      ↘
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          </div>
          {below}
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
                onClick={() => writeOverlay({ texts, stickers: [...stickers, { id: uid(), emoji, x: 0.5, y: 0.5 }], strokes })}
              >
                {emoji}
              </button>
            ))}
            <button type="button" className="shrink-0 text-xs font-semibold text-red-600" onClick={() => writeOverlay({ texts, stickers: stickers.slice(0, -1), strokes })} disabled={!stickers.length}>
              Quitar
            </button>
          </div>
        )}

        {tool === 'text' && selectedMark && (
          <div className="shrink-0 space-y-2 px-3 pb-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {TEXT_FONTS.map((font) => (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => patchText(selectedMark.id, { font: font.id })}
                  className={`shrink-0 rounded-full px-3 py-1 text-sm ${
                    selectedMark.font === font.id
                      ? 'bg-[var(--brand-blue)] text-white'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                  }`}
                  style={{ fontFamily: font.fontFamily, fontWeight: font.fontWeight }}
                >
                  {font.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="h-6 w-6 shrink-0 rounded-full ring-1 ring-black/15"
                  style={{ background: color, outline: selectedMark.color === color ? '2px solid var(--brand-blue)' : undefined }}
                  onClick={() => patchText(selectedMark.id, { color })}
                  aria-label={color}
                />
              ))}
              <button
                type="button"
                className="shrink-0 rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-bold"
                onClick={() =>
                  patchText(selectedMark.id, {
                    bg: selectedMark.bg === 'none' ? 'solid' : selectedMark.bg === 'solid' ? 'soft' : 'none',
                  })
                }
              >
                {selectedMark.bg === 'none' ? 'Sin fondo' : selectedMark.bg === 'solid' ? 'Fondo' : 'Fondo suave'}
              </button>
              <button
                type="button"
                className="shrink-0 rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-bold"
                onClick={() =>
                  patchText(selectedMark.id, {
                    align: selectedMark.align === 'center' ? 'left' : selectedMark.align === 'left' ? 'right' : 'center',
                  })
                }
              >
                {selectedMark.align === 'center' ? 'Centro' : selectedMark.align === 'left' ? 'Izquierda' : 'Derecha'}
              </button>
              <button
                type="button"
                className="shrink-0 rounded-full bg-[var(--bg-secondary)] px-2 py-1 text-xs font-bold"
                onClick={() => patchText(selectedMark.id, { size: Math.max(0.45, +(selectedMark.size - 0.12).toFixed(2)) })}
                aria-label="Achicar"
              >
                A−
              </button>
              <button
                type="button"
                className="shrink-0 rounded-full bg-[var(--bg-secondary)] px-2 py-1 text-xs font-bold"
                onClick={() => patchText(selectedMark.id, { size: Math.min(2.4, +(selectedMark.size + 0.12).toFixed(2)) })}
                aria-label="Agrandar"
              >
                A+
              </button>
              <button type="button" className="shrink-0 rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-bold" onClick={addText}>
                Otro
              </button>
              <button
                type="button"
                className="shrink-0 text-xs font-semibold text-red-600"
                onClick={() => {
                  writeOverlay({ texts: texts.filter((item) => item.id !== selectedMark.id), stickers, strokes });
                  setSelectedTextId(null);
                }}
              >
                Quitar
              </button>
            </div>
          </div>
        )}

        {tool === 'draw' && (
          <div className="flex shrink-0 items-center gap-2 px-3 pb-2">
            {COLORS.map((color) => (
              <button key={color} type="button" className="h-6 w-6 rounded-full ring-1 ring-black/10" style={{ background: color, outline: penColor === color ? '2px solid var(--brand-blue)' : undefined }} onClick={() => setPenColor(color)} aria-label={color} />
            ))}
            <button type="button" className="ml-auto flex items-center gap-1 text-xs font-semibold" onClick={() => writeOverlay({ texts, stickers, strokes: strokes.slice(0, -1) })} disabled={!strokes.length}>
              <IconUndo size={12} /> Deshacer
            </button>
          </div>
        )}
      </div>
    );
  },
);

export default PublishCoverEditor;
