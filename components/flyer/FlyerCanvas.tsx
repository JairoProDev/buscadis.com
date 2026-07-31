'use client';

import type { CSSProperties, Ref } from 'react';
import type { FlyerConfig, FlyerContent, FlyerTemplateId } from '@/lib/flyer/types';
import { resolveFlyerConfig } from '@/lib/flyer/templates';
import { truncateFlyerTitle } from '@/lib/flyer/layout';

export interface FlyerCanvasProps {
  templateId: FlyerTemplateId;
  config?: FlyerConfig | null;
  content: FlyerContent;
  className?: string;
  exportRef?: Ref<HTMLDivElement>;
}

function titleSize(scale: FlyerConfig['titleScale']): string {
  if (scale === 's') return 'clamp(1.1rem, 7cqi, 2.4rem)';
  if (scale === 'l') return 'clamp(1.6rem, 10cqi, 3.4rem)';
  return 'clamp(1.35rem, 8.5cqi, 2.9rem)';
}

export default function FlyerCanvas({
  templateId,
  config,
  content,
  className = '',
  exportRef,
}: FlyerCanvasProps) {
  const cfg = resolveFlyerConfig(content.categoria, templateId, config);
  const title = truncateFlyerTitle(content.title || 'Aviso en Buscadis');
  const align = cfg.align === 'center' ? 'center' : 'left';
  const primary = cfg.primary;
  const secondary = cfg.secondary;
  const badge = (cfg.badge || '').trim();

  const metaBits = [
    cfg.showCategory && content.categoryLabel ? content.categoryLabel : null,
    cfg.showLocation && content.locationLabel ? content.locationLabel : null,
  ].filter(Boolean) as string[];

  const price = cfg.showPrice && content.priceLabel ? content.priceLabel : null;

  const rootStyle: CSSProperties = {
    containerType: 'inline-size',
    background: secondary,
    color: '#0f172a',
    fontFamily: 'Georgia, "Times New Roman", ui-serif, serif',
  };

  const titleStyle: CSSProperties = {
    fontSize: titleSize(cfg.titleScale),
    lineHeight: 1.05,
    fontWeight: 800,
    textAlign: align,
    letterSpacing: '-0.02em',
    wordBreak: 'break-word',
  };

  let body: React.ReactNode;

  switch (templateId) {
    case 'diagonal-band':
      body = (
        <div className="absolute inset-0 overflow-hidden" style={{ background: secondary }}>
          <div
            className="absolute -left-[20%] top-[18%] h-[55%] w-[140%] rotate-[-12deg]"
            style={{ background: primary }}
          />
          <div className="absolute inset-0 flex flex-col justify-between p-[8%]">
            {badge || metaBits[0] ? (
              <span
                className="self-start rounded-full px-3 py-1 text-[clamp(0.65rem,3.2cqi,0.95rem)] font-bold uppercase tracking-wide text-white"
                style={{ background: 'rgba(15,23,42,0.55)' }}
              >
                {badge || metaBits[0]}
              </span>
            ) : (
              <span />
            )}
            <div>
              <h2 className="m-0 text-white drop-shadow-sm" style={titleStyle}>
                {title}
              </h2>
              {price && (
                <p
                  className="mt-3 m-0 font-sans text-[clamp(1rem,5cqi,1.6rem)] font-bold text-white"
                  style={{ textAlign: align }}
                >
                  {price}
                </p>
              )}
            </div>
            {metaBits.length > 0 && (
              <p className="m-0 font-sans text-[clamp(0.7rem,3.2cqi,1rem)] font-medium text-white/90">
                {metaBits.join(' · ')}
              </p>
            )}
          </div>
        </div>
      );
      break;

    case 'minimal-cream':
      body = (
        <div className="absolute inset-0 flex flex-col justify-between p-[9%]" style={{ background: secondary || '#f1f5f9' }}>
          <div className="h-1.5 w-[28%]" style={{ background: primary }} />
          <div>
            {cfg.showCategory && content.categoryLabel && (
              <p className="m-0 mb-2 font-sans text-[clamp(0.65rem,3cqi,0.9rem)] font-semibold uppercase tracking-[0.12em]" style={{ color: primary, textAlign: align }}>
                {content.categoryLabel}
              </p>
            )}
            <h2 className="m-0" style={{ ...titleStyle, color: primary }}>
              {title}
            </h2>
            {price && (
              <p className="mt-4 m-0 font-sans text-[clamp(1.1rem,5.5cqi,1.8rem)] font-bold" style={{ color: primary, textAlign: align }}>
                {price}
              </p>
            )}
          </div>
          {cfg.showLocation && content.locationLabel && (
            <p className="m-0 font-sans text-[clamp(0.7rem,3.2cqi,1rem)]" style={{ color: '#64748b', textAlign: align }}>
              {content.locationLabel}
            </p>
          )}
        </div>
      );
      break;

    case 'marketplace-tag':
      body = (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-[10%]" style={{ background: secondary }}>
          {(badge || (cfg.showCategory && content.categoryLabel)) && (
            <span
              className="rounded-full px-4 py-1.5 font-sans text-[clamp(0.7rem,3.4cqi,1rem)] font-bold uppercase tracking-wide text-white"
              style={{ background: primary }}
            >
              {badge || content.categoryLabel}
            </span>
          )}
          <h2 className="m-0 max-w-full" style={{ ...titleStyle, color: '#0f172a', textAlign: 'center' }}>
            {title}
          </h2>
          {price && (
            <p className="m-0 font-sans text-[clamp(1.2rem,6cqi,2rem)] font-bold" style={{ color: primary }}>
              {price}
            </p>
          )}
          {cfg.showLocation && content.locationLabel && (
            <p className="m-0 font-sans text-[clamp(0.7rem,3.2cqi,1rem)] text-slate-500">{content.locationLabel}</p>
          )}
        </div>
      );
      break;

    case 'gradient-dusk':
      body = (
        <div
          className="absolute inset-0 flex flex-col justify-end p-[9%]"
          style={{
            background: `linear-gradient(160deg, ${primary} 0%, ${secondary} 55%, #020617 100%)`,
          }}
        >
          {badge && (
            <span className="mb-auto self-start rounded-md bg-white/15 px-3 py-1 font-sans text-[clamp(0.65rem,3cqi,0.9rem)] font-bold uppercase tracking-wider text-white">
              {badge}
            </span>
          )}
          <h2 className="m-0 text-white" style={titleStyle}>
            {title}
          </h2>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
            {price ? (
              <p className="m-0 font-sans text-[clamp(1.1rem,5.5cqi,1.85rem)] font-bold text-white">{price}</p>
            ) : (
              <span />
            )}
            {metaBits.length > 0 && (
              <p className="m-0 font-sans text-[clamp(0.65rem,3cqi,0.95rem)] text-white/80">{metaBits.join(' · ')}</p>
            )}
          </div>
        </div>
      );
      break;

    case 'split':
      body = (
        <div className="absolute inset-0 flex">
          <div className="w-[38%] shrink-0" style={{ background: primary }} />
          <div className="flex flex-1 flex-col justify-between p-[8%] pl-[6%]" style={{ background: secondary }}>
            {cfg.showCategory && content.categoryLabel && (
              <p className="m-0 font-sans text-[clamp(0.65rem,3cqi,0.9rem)] font-bold uppercase tracking-wider" style={{ color: primary }}>
                {content.categoryLabel}
              </p>
            )}
            <h2 className="m-0" style={{ ...titleStyle, color: '#0f172a' }}>
              {title}
            </h2>
            <div>
              {price && (
                <p className="m-0 font-sans text-[clamp(1.05rem,5cqi,1.7rem)] font-bold" style={{ color: primary }}>
                  {price}
                </p>
              )}
              {cfg.showLocation && content.locationLabel && (
                <p className="mt-1 m-0 font-sans text-[clamp(0.65rem,3cqi,0.9rem)] text-slate-500">{content.locationLabel}</p>
              )}
            </div>
          </div>
        </div>
      );
      break;

    case 'urgent':
      body = (
        <div className="absolute inset-0 p-[6%]" style={{ background: secondary }}>
          <div className="flex h-full flex-col items-center justify-center gap-3 border-[6px] p-[8%]" style={{ borderColor: primary }}>
            <span
              className="rounded-sm px-3 py-1 font-sans text-[clamp(0.7rem,3.4cqi,1rem)] font-black uppercase tracking-[0.18em] text-white"
              style={{ background: primary }}
            >
              {badge || 'DISPONIBLE'}
            </span>
            <h2 className="m-0 text-center" style={{ ...titleStyle, textAlign: 'center', color: '#0f172a' }}>
              {title}
            </h2>
            {price && (
              <p className="m-0 font-sans text-[clamp(1.4rem,7cqi,2.4rem)] font-black" style={{ color: primary }}>
                {price}
              </p>
            )}
            {metaBits.length > 0 && (
              <p className="m-0 text-center font-sans text-[clamp(0.65rem,3cqi,0.95rem)] text-slate-600">
                {metaBits.join(' · ')}
              </p>
            )}
          </div>
        </div>
      );
      break;

    case 'negocio':
      body = (
        <div className="absolute inset-0 flex flex-col p-[9%]" style={{ background: '#ffffff' }}>
          <div className="mb-4 h-2 w-full rounded-full" style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }} />
          {cfg.showCategory && content.categoryLabel && (
            <p className="m-0 mb-2 font-sans text-[clamp(0.65rem,3cqi,0.85rem)] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {content.categoryLabel}
            </p>
          )}
          <h2 className="m-0 flex-1" style={{ ...titleStyle, color: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
            {title}
          </h2>
          <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-200 pt-4">
            {price ? (
              <p className="m-0 font-sans text-[clamp(1rem,5cqi,1.6rem)] font-bold" style={{ color: primary }}>
                {price}
              </p>
            ) : (
              <span />
            )}
            {cfg.showLocation && content.locationLabel && (
              <p className="m-0 max-w-[50%] truncate text-right font-sans text-[clamp(0.65rem,3cqi,0.9rem)] text-slate-500">
                {content.locationLabel}
              </p>
            )}
          </div>
        </div>
      );
      break;

    case 'bold-type':
    default:
      body = (
        <div className="absolute inset-0 flex flex-col justify-between p-[9%]" style={{ background: primary, color: '#fff' }}>
          <div className="flex items-start justify-between gap-2">
            {(badge || (cfg.showCategory && content.categoryLabel)) && (
              <span className="rounded-full bg-black/25 px-3 py-1 font-sans text-[clamp(0.65rem,3.2cqi,0.95rem)] font-bold uppercase tracking-wide">
                {badge || content.categoryLabel}
              </span>
            )}
            <span className="font-sans text-[clamp(0.6rem,2.8cqi,0.8rem)] font-semibold tracking-widest opacity-80">
              BUSCADIS
            </span>
          </div>
          <h2 className="m-0 text-white" style={titleStyle}>
            {title}
          </h2>
          <div className="flex items-end justify-between gap-2">
            {price ? (
              <p className="m-0 font-sans text-[clamp(1.15rem,5.8cqi,1.9rem)] font-bold">{price}</p>
            ) : (
              <span />
            )}
            {cfg.showLocation && content.locationLabel && (
              <p className="m-0 max-w-[45%] truncate text-right font-sans text-[clamp(0.65rem,3cqi,0.95rem)] opacity-90">
                {content.locationLabel}
              </p>
            )}
          </div>
        </div>
      );
  }

  return (
    <div
      ref={exportRef}
      role="img"
      aria-label={title}
      className={`relative aspect-square w-full overflow-hidden ${className}`}
      style={rootStyle}
      data-flyer-template={templateId}
    >
      {body}
    </div>
  );
}
