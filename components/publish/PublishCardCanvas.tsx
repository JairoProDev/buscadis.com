'use client';

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import CardDeleteZone, { hitTrash } from '@/components/publish/CardDeleteZone';
import { getCategoriaIcon, getCategoriaLabel } from '@/lib/categoria-icons';
import { formatUbicacionCorta } from '@/lib/adiso-display';
import {
  DEFAULT_CARD_LAYOUT,
  type CardPieceId,
  type CardPieceLayout,
  type PublishDraft,
} from '@/lib/publish/publish-draft-types';
import type { FlyerConfig, FlyerTemplateId } from '@/lib/flyer/types';
import { softWashFromAccent } from '@/lib/flyer/templates';
import { categoryAsksLocation } from '@/lib/publish/category-tree';
import { flyerMetaFontSize, flyerPriceFontSize, flyerTitleFontSize } from '@/lib/flyer/typography';
import { flyer, publishUi } from '@/lib/bs-tokens';

const COLORS = [...publishUi.cardPalette];

interface PublishCardCanvasProps {
  heroUrl?: string;
  templateId?: FlyerTemplateId;
  badge?: string;
  background: string;
  color: string;
  titleScale?: FlyerConfig['titleScale'];
  draft: PublishDraft;
  onFlyer?: (patch: Partial<FlyerConfig>) => void;
  onLayout: (next: PublishDraft['cardLayout'], options?: { history?: boolean }) => void;
  onHidePiece?: (id: CardPieceId) => void;
}

function placeOf(layout: PublishDraft['cardLayout'], id: CardPieceId): CardPieceLayout {
  return { ...DEFAULT_CARD_LAYOUT[id], ...layout?.[id] };
}

function priceLabel(draft: PublishDraft) {
  if (!draft.precio || draft.precio <= 0) return 'Precio';
  const symbol = draft.moneda === 'USD' ? '$' : 'S/';
  return `${symbol} ${draft.precio.toLocaleString('es-PE')}`;
}

function locationLabel(draft: PublishDraft) {
  if (!draft.ubicacion) return 'Ubicación';
  if (typeof draft.ubicacion === 'string') return formatUbicacionCorta(draft.ubicacion) || 'Ubicación';
  return formatUbicacionCorta(draft.ubicacion) || draft.ubicacion.direccion || 'Ubicación';
}

function TemplateBackdrop({
  templateId,
  background,
  color,
  badge,
}: {
  templateId?: FlyerTemplateId;
  background: string;
  color: string;
  badge?: string;
}) {
  const mark = badge?.trim();
  if (templateId === 'diagonal-band') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ background }}>
        <div className="absolute -left-[20%] top-[18%] h-[55%] w-[140%] -rotate-12" style={{ background: color }} />
      </div>
    );
  }
  if (templateId === 'gradient-dusk') {
    return (
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(160deg, ${color} 0%, ${background} 55%, ${flyer.deep} 100%)` }}
      />
    );
  }
  if (templateId === 'split') {
    return (
      <div className="pointer-events-none absolute inset-0" style={{ background }}>
        <div className="absolute inset-x-0 top-0 h-[22%]" style={{ background: color }} />
      </div>
    );
  }
  if (templateId === 'urgent') {
    return (
      <div className="pointer-events-none absolute inset-0 p-[6%]" style={{ background }}>
        <div className="h-full w-full border-[6px]" style={{ borderColor: color }} />
      </div>
    );
  }
  if (templateId === 'poster-serif' || templateId === 'bold-type') {
    return (
      <div className="pointer-events-none absolute inset-0" style={{ background: color }}>
        <div className="absolute inset-[5%] border border-white/35" />
      </div>
    );
  }
  if (templateId === 'ribbon') {
    return (
      <div className="pointer-events-none absolute inset-0" style={{ background }}>
        <div className="absolute inset-x-0 top-[12%] py-1.5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white" style={{ background: color }}>
          {mark || 'Buscadis'}
        </div>
      </div>
    );
  }
  if (templateId === 'duo-tone') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0" style={{ background: color }} />
        <div className="absolute inset-x-0 bottom-0 h-[48%]" style={{ background, clipPath: 'polygon(0 18%, 100% 0, 100% 100%, 0 100%)' }} />
      </div>
    );
  }
  if (templateId === 'editorial') {
    return (
      <div className="pointer-events-none absolute inset-0" style={{ background }}>
        <div className="absolute inset-x-[8%] top-[8%] border-b-2" style={{ borderColor: color }} />
        <div className="absolute inset-x-[8%] bottom-[8%] border-t border-black/10" />
      </div>
    );
  }
  if (templateId === 'stamp') {
    return (
      <div className="pointer-events-none absolute inset-0 p-[8%]" style={{ background }}>
        <div className="h-full w-full rounded-2xl border-[3px] border-dashed" style={{ borderColor: color }} />
      </div>
    );
  }
  if (templateId === 'soft-wash') {
    return (
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(120% 80% at 10% 0%, ${color}33 0%, ${background} 45%, ${flyer.surface} 100%)` }}
      />
    );
  }
  if (templateId === 'ticket') {
    return (
      <div className="pointer-events-none absolute inset-0 p-[7%]" style={{ background }}>
        <div className="h-full w-full rounded-2xl border-2 border-dashed bg-white/70" style={{ borderColor: color }} />
      </div>
    );
  }
  if (templateId === 'corner-mark') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ background }}>
        <div className="absolute -right-6 -top-6 h-[42%] w-[42%] rotate-45" style={{ background: color }} />
      </div>
    );
  }
  if (templateId === 'minimal-cream') {
    return (
      <div className="pointer-events-none absolute inset-0" style={{ background }}>
        <div className="absolute left-[9%] top-[9%] h-1 w-[28%]" style={{ background: color }} />
      </div>
    );
  }
  if (templateId === 'negocio') {
    return (
      <div className="pointer-events-none absolute inset-0 bg-white">
        <div className="absolute inset-x-[9%] top-[8%] h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${color}, ${background})` }} />
        <div className="absolute inset-x-[9%] bottom-[12%] border-t border-slate-200" />
      </div>
    );
  }
  if (templateId === 'marketplace-tag') {
    return (
      <div className="pointer-events-none absolute inset-0" style={{ background }}>
        <div className="absolute left-1/2 top-[10%] -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: color }}>
          {mark || 'Aviso'}
        </div>
      </div>
    );
  }
  return <div className="pointer-events-none absolute inset-0" style={{ background }} />;
}

export default function PublishCardCanvas({
  heroUrl,
  templateId,
  badge,
  background,
  color,
  titleScale = 'm',
  draft,
  onFlyer,
  onLayout,
  onHidePiece,
}: PublishCardCanvasProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
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
  const [dragging, setDragging] = useState(false);
  const [trashHot, setTrashHot] = useState(false);

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
    if (!drag.moved) {
      drag.moved = true;
      setDragging(true);
    }
    const history = !drag.recorded;
    drag.recorded = true;
    const x = Math.min(0.86, Math.max(0.02, drag.x + dx / rect.width));
    const y = Math.min(0.88, Math.max(0.02, drag.y + dy / rect.height));
    setTrashHot(hitTrash(event.clientX, event.clientY, trashRef.current));
    write(drag.id, { x, y }, { history });
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    resizeRef.current = null;
    const overTrash = drag?.moved && hitTrash(event.clientX, event.clientY, trashRef.current);
    setDragging(false);
    setTrashHot(false);
    if (overTrash && drag) {
      onHidePiece?.(drag.id);
      setSelected(null);
      return;
    }
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

  const hidden = draft.cardHidden || {};
  const allPieces: CardPieceId[] = showLocation
    ? ['categoria', 'titulo', 'precio', 'ubicacion']
    : ['categoria', 'titulo', 'precio'];
  const pieces = allPieces.filter((id) => !hidden[id]);

  return (
    <div
      ref={stageRef}
      className="absolute inset-0 touch-none [container-type:inline-size]"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerDown={() => setSelected(null)}
    >
      {heroUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={heroUrl} alt="" crossOrigin="anonymous" draggable={false} className="pointer-events-none h-full w-full object-cover" />
      ) : (
        <TemplateBackdrop templateId={templateId} background={background} color={color} badge={badge} />
      )}
      <CardDeleteZone ref={trashRef} active={dragging} hot={trashHot} />
      {pieces.map((id) => (
        <CardPiece
          key={id}
          id={id}
          draft={draft}
          color={color}
          onDark={!heroUrl && (templateId === 'bold-type' || templateId === 'poster-serif' || templateId === 'gradient-dusk')}
          place={placeOf(draft.cardLayout, id)}
          titleScale={titleScale}
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
  onDark,
  place,
  titleScale,
  selected,
  onDragStart,
  onResizeStart,
  onFlyer,
}: {
  id: CardPieceId;
  draft: PublishDraft;
  color: string;
  onDark?: boolean;
  place: CardPieceLayout;
  titleScale?: FlyerConfig['titleScale'];
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

  const ink = onDark ? publishUi.onDark : color;
  const fontSize =
    id === 'titulo'
      ? flyerTitleFontSize(titleScale, 'comfortable', place.scale)
      : id === 'precio'
        ? flyerPriceFontSize('comfortable', place.scale)
        : flyerMetaFontSize('comfortable', place.scale);
  const iconEm = place.scale * 0.95;

  const colorsAbove = place.y > 0.28;

  return (
    <div
      className="absolute max-w-[88%] cursor-grab touch-none active:cursor-grabbing"
      style={{ left: `${place.x * 100}%`, top: `${place.y * 100}%`, fontSize }}
      onPointerDown={(event) => onDragStart(event, id)}
    >
      <div
        className={`relative px-1 ${selected ? 'rounded-md ring-2 ring-[var(--brand-blue)] ring-offset-2' : ''}`}
        style={{ color: missing ? (onDark ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.45)') : id === 'precio' || id === 'titulo' || onDark ? ink : flyer.ink }}
      >
        {id === 'categoria' && (
          <span className="inline-flex items-center gap-1 font-bold">
            {CategoryIcon ? (
              <CategoryIcon
                size={Math.round(16 * iconEm)}
                color={missing ? (onDark ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.45)') : ink}
              />
            ) : null}
            {category}
          </span>
        )}
        {id === 'titulo' && (
          <span className="block max-w-full font-extrabold leading-tight tracking-tight line-clamp-3">{title}</span>
        )}
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
              onClick={() =>
                onFlyer?.({ primary: swatch, paletteId: 'custom', secondary: softWashFromAccent(swatch) })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
