'use client';

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { getCategoriaIcon, getCategoriaLabel } from '@/lib/categoria-icons';
import { formatUbicacionCorta } from '@/lib/adiso-display';
import {
  DEFAULT_CARD_LAYOUT,
  type CardPieceId,
  type CardPieceLayout,
  type PublishDraft,
} from '@/lib/publish/publish-draft-types';
import type { FlyerConfig } from '@/lib/flyer/types';
import { categoryAsksLocation } from '@/lib/publish/category-tree';

const COLORS = ['#53acc5', '#111827', '#ffffff', '#b91c1c', '#166534', '#1d4ed8', '#c2410c', '#7c3aed'];

interface PublishCardCanvasProps {
  heroUrl?: string;
  background: string;
  color: string;
  draft: PublishDraft;
  onFlyer?: (patch: Partial<FlyerConfig>) => void;
  onLayout: (next: PublishDraft['cardLayout'], options?: { history?: boolean }) => void;
}

function placeOf(layout: PublishDraft['cardLayout'], id: CardPieceId): CardPieceLayout {
  return { ...DEFAULT_CARD_LAYOUT[id], ...layout?.[id] };
}

function priceLabel(draft: PublishDraft) {
  if (!draft.precio || draft.precio <= 0) return 'Precio';
  return `S/ ${draft.precio.toLocaleString('es-PE')}`;
}

function locationLabel(draft: PublishDraft) {
  if (!draft.ubicacion) return 'Ubicación';
  if (typeof draft.ubicacion === 'string') return formatUbicacionCorta(draft.ubicacion) || 'Ubicación';
  return formatUbicacionCorta(draft.ubicacion) || draft.ubicacion.direccion || 'Ubicación';
}

export default function PublishCardCanvas({
  heroUrl,
  background,
  color,
  draft,
  onFlyer,
  onLayout,
}: PublishCardCanvasProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: CardPieceId;
    px: number;
    py: number;
    x: number;
    y: number;
    moved: boolean;
    recorded: boolean;
  } | null>(null);
  const resizeRef = useRef<{ id: CardPieceId; py: number; scale: number; recorded: boolean } | null>(null);
  const [selected, setSelected] = useState<CardPieceId | null>(null);

  const showLocation = categoryAsksLocation(
    draft.categoria,
    draft.subcategoria,
    Boolean(draft.atributos.productos_entrega),
  );

  const write = (id: CardPieceId, patch: Partial<CardPieceLayout>, options?: { history?: boolean }) => {
    const current = placeOf(draft.cardLayout, id);
    onLayout({ ...draft.cardLayout, [id]: { ...current, ...patch } }, options);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const resizing = resizeRef.current;
    if (resizing) {
      const scale = Math.min(2.4, Math.max(0.55, resizing.scale + (resizing.py - event.clientY) / 140));
      const history = !resizing.recorded;
      resizing.recorded = true;
      resizing.scale = scale;
      resizing.py = event.clientY;
      write(resizing.id, { scale }, { history });
      return;
    }
    const drag = dragRef.current;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    const dx = event.clientX - drag.px;
    const dy = event.clientY - drag.py;
    if (!drag.moved && Math.hypot(dx, dy) < 8) return;
    drag.moved = true;
    const history = !drag.recorded;
    drag.recorded = true;
    const x = Math.min(0.86, Math.max(0.02, drag.x + dx / rect.width));
    const y = Math.min(0.88, Math.max(0.02, drag.y + dy / rect.height));
    write(drag.id, { x, y }, { history });
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    resizeRef.current = null;
    if (drag && !drag.moved) setSelected(drag.id);
  };

  const beginDrag = (event: ReactPointerEvent, id: CardPieceId) => {
    event.stopPropagation();
    event.preventDefault();
    stageRef.current?.setPointerCapture(event.pointerId);
    const place = placeOf(draft.cardLayout, id);
    dragRef.current = { id, px: event.clientX, py: event.clientY, x: place.x, y: place.y, moved: false, recorded: false };
    setSelected(id);
  };

  const beginResize = (event: ReactPointerEvent, id: CardPieceId) => {
    event.stopPropagation();
    event.preventDefault();
    stageRef.current?.setPointerCapture(event.pointerId);
    resizeRef.current = { id, py: event.clientY, scale: placeOf(draft.cardLayout, id).scale, recorded: false };
  };

  const pieces: CardPieceId[] = showLocation
    ? ['categoria', 'titulo', 'precio', 'ubicacion']
    : ['categoria', 'titulo', 'precio'];

  return (
    <div
      ref={stageRef}
      className="absolute inset-0 touch-none"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerDown={() => setSelected(null)}
    >
      {heroUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={heroUrl} alt="" crossOrigin="anonymous" draggable={false} className="pointer-events-none h-full w-full object-cover" />
      ) : (
        <div className="pointer-events-none absolute inset-0" style={{ background }} />
      )}
      {pieces.map((id) => (
        <CardPiece
          key={id}
          id={id}
          draft={draft}
          color={color}
          place={placeOf(draft.cardLayout, id)}
          selected={selected === id}
          onDragStart={beginDrag}
          onResizeStart={beginResize}
          onFlyer={onFlyer}
        />
      ))}
    </div>
  );
}

function CardPiece({
  id,
  draft,
  color,
  place,
  selected,
  onDragStart,
  onResizeStart,
  onFlyer,
}: {
  id: CardPieceId;
  draft: PublishDraft;
  color: string;
  place: CardPieceLayout;
  selected: boolean;
  onDragStart: (event: ReactPointerEvent, id: CardPieceId) => void;
  onResizeStart: (event: ReactPointerEvent, id: CardPieceId) => void;
  onFlyer?: (patch: Partial<FlyerConfig>) => void;
}) {
  const CategoryIcon = draft.categoria ? getCategoriaIcon(draft.categoria) : null;
  const category = draft.categoria ? getCategoriaLabel(draft.categoria) : 'Categoría';
  const title = draft.titulo?.trim() || 'Título';
  const price = priceLabel(draft);
  const location = locationLabel(draft);
  const missing =
    (id === 'categoria' && !draft.categoria) ||
    (id === 'titulo' && !draft.titulo?.trim()) ||
    (id === 'precio' && !(draft.precio && draft.precio > 0)) ||
    (id === 'ubicacion' && !draft.ubicacion);

  const fontSize =
    id === 'titulo' ? `${1.35 * place.scale}rem`
    : id === 'precio' ? `${1.15 * place.scale}rem`
    : `${0.78 * place.scale}rem`;

  const colorsAbove = place.y > 0.28;

  return (
    <div
      className="absolute max-w-[88%] cursor-grab touch-none active:cursor-grabbing"
      style={{ left: `${place.x * 100}%`, top: `${place.y * 100}%`, fontSize }}
      onPointerDown={(event) => onDragStart(event, id)}
    >
      <div
        className={`relative px-1 ${selected ? 'rounded-md ring-2 ring-[var(--brand-blue)] ring-offset-2' : ''}`}
        style={{ color: missing ? 'rgba(15,23,42,0.45)' : id === 'precio' || id === 'titulo' ? color : '#0f172a' }}
      >
        {id === 'categoria' && (
          <span className="inline-flex items-center gap-1 font-bold">
            {CategoryIcon ? <CategoryIcon size={Math.round(16 * place.scale)} color={missing ? 'rgba(15,23,42,0.45)' : color} /> : null}
            {category}
          </span>
        )}
        {id === 'titulo' && <span className="block font-extrabold leading-tight tracking-tight">{title}</span>}
        {id === 'precio' && <span className="block font-black leading-none">{price}</span>}
        {id === 'ubicacion' && <span className="block font-semibold leading-tight">{location}</span>}
        {selected && (
          <span
            role="slider"
            aria-label="Redimensionar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={50}
            className="absolute -bottom-1.5 -right-1.5 z-10 h-3 w-3 cursor-nwse-resize rounded-[2px] border-2 border-[var(--brand-blue)] bg-white shadow-sm"
            onPointerDown={(event) => onResizeStart(event, id)}
          />
        )}
      </div>
      {selected && (id === 'titulo' || id === 'precio') && (
        <div
          className={`absolute left-0 z-20 flex max-w-[15rem] gap-1 rounded-full bg-white/95 p-1 shadow-lg ring-1 ring-black/10 ${
            colorsAbove ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={swatch}
              className="h-5 w-5 rounded-full ring-1 ring-black/15"
              style={{ background: swatch, outline: color === swatch ? '2px solid var(--brand-blue)' : undefined }}
              onClick={() => onFlyer?.({ primary: swatch })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
