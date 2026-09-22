'use client';

import type { CSSProperties, ReactNode, Ref } from 'react';
import type { FlyerConfig, FlyerContent, FlyerTemplateId } from '@/lib/flyer/types';
import { resolveFlyerConfig } from '@/lib/flyer/templates';
import { truncateFlyerTitle } from '@/lib/flyer/layout';

/** comfortable = studio/detalle/export; compact = feed/grid (~150–220px) */
export type FlyerDensity = 'comfortable' | 'compact';

export interface FlyerCanvasProps {
  templateId: FlyerTemplateId;
  config?: FlyerConfig | null;
  content: FlyerContent;
  className?: string;
  exportRef?: Ref<HTMLDivElement>;
  /** En feed el contenedor es chico: tipografía cqi sin floors altos en rem. */
  density?: FlyerDensity;
}

function titleSize(scale: FlyerConfig['titleScale'], density: FlyerDensity): string {
  if (density === 'compact') {
    // Mínimos bajos para que cqi mande en tiles ~50vw; sin esto el rem floor rebalsa.
    if (scale === 's') return 'clamp(0.52rem, 6.2cqi, 1.05rem)';
    if (scale === 'l') return 'clamp(0.58rem, 7cqi, 1.15rem)';
    return 'clamp(0.55rem, 6.6cqi, 1.1rem)';
  }
  if (scale === 's') return 'clamp(1.1rem, 7cqi, 2.4rem)';
  if (scale === 'l') return 'clamp(1.55rem, 9.5cqi, 3.2rem)';
  return 'clamp(1.3rem, 8.2cqi, 2.8rem)';
}

function metaSize(density: FlyerDensity): string {
  return density === 'compact'
    ? 'clamp(0.4rem, 3.2cqi, 0.7rem)'
    : 'clamp(0.65rem, 3.2cqi, 0.95rem)';
}

function priceSize(density: FlyerDensity): string {
  return density === 'compact'
    ? 'clamp(0.55rem, 5cqi, 0.95rem)'
    : 'clamp(1.05rem, 5.5cqi, 1.85rem)';
}

function badgeSize(density: FlyerDensity): string {
  return density === 'compact'
    ? 'clamp(0.38rem, 3cqi, 0.62rem)'
    : 'clamp(0.65rem, 3.2cqi, 0.95rem)';
}

export default function FlyerCanvas({
  templateId,
  config,
  content,
  className = '',
  exportRef,
  density = 'comfortable',
}: FlyerCanvasProps) {
  const cfg = resolveFlyerConfig(content.categoria, templateId, config);
  const compact = density === 'compact';
  // En compact forzamos escala S y truncamos más: el feed no necesita el título completo.
  const effectiveScale: FlyerConfig['titleScale'] = compact ? 's' : cfg.titleScale;
  const title = truncateFlyerTitle(
    content.title || 'Aviso en Buscadis',
    compact ? 48 : 90
  );
  const align = cfg.align === 'center' ? 'center' : 'left';
  const primary = cfg.primary;
  const secondary = cfg.secondary;
  const badge = (cfg.badge || '').trim();

  const metaBits = [
    cfg.showCategory && content.categoryLabel ? content.categoryLabel : null,
    cfg.showLocation && content.locationLabel ? content.locationLabel : null,
  ].filter(Boolean) as string[];

  const price = cfg.showPrice && content.priceLabel ? content.priceLabel : null;
  const fillParent = /\bh-full\b/.test(className);
  const pad = compact ? '5.5%' : '9%';
  const showBrand = !compact;

  const rootStyle: CSSProperties = {
    containerType: 'inline-size',
    background: secondary,
    color: '#0f172a',
    fontFamily: 'Georgia, "Times New Roman", ui-serif, serif',
  };

  const titleStyle: CSSProperties = {
    fontSize: titleSize(effectiveScale, density),
    lineHeight: compact ? 1.12 : 1.08,
    fontWeight: 800,
    textAlign: align,
    letterSpacing: '-0.02em',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
    ...(compact
      ? {
          display: '-webkit-box',
          WebkitLineClamp: 5,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }
      : {}),
  };

  const metaStyle: CSSProperties = {
    fontSize: metaSize(density),
    lineHeight: 1.25,
  };

  const priceStyle: CSSProperties = {
    fontSize: priceSize(density),
    fontWeight: 700,
    lineHeight: 1.15,
  };

  const badgeStyle: CSSProperties = {
    fontSize: badgeSize(density),
    fontWeight: 700,
    lineHeight: 1.2,
  };

  const Title = ({
    children,
    style,
    className: cn = '',
  }: {
    children: ReactNode;
    style?: CSSProperties;
    className?: string;
  }) => (
    <h2 className={`m-0 min-w-0 ${cn}`} style={{ ...titleStyle, ...style }}>
      {children}
    </h2>
  );

  let body: React.ReactNode;

  switch (templateId) {
    case 'diagonal-band':
      body = (
        <div className="absolute inset-0 overflow-hidden" style={{ background: secondary }}>
          <div
            className="absolute -left-[20%] top-[18%] h-[55%] w-[140%] rotate-[-12deg]"
            style={{ background: primary }}
          />
          <div
            className="absolute inset-0 flex min-h-0 flex-col justify-between overflow-hidden"
            style={{ padding: pad }}
          >
            {badge || metaBits[0] ? (
              <span
                className="self-start rounded-full px-2 py-0.5 font-bold uppercase tracking-wide text-white"
                style={{ ...badgeStyle, background: 'rgba(15,23,42,0.55)' }}
              >
                {badge || metaBits[0]}
              </span>
            ) : (
              <span />
            )}
            <div className="min-h-0 overflow-hidden">
              <Title className="text-white drop-shadow-sm">{title}</Title>
              {price && (
                <p className="mt-2 m-0 font-sans text-white" style={{ ...priceStyle, textAlign: align }}>
                  {price}
                </p>
              )}
            </div>
            {metaBits.length > 0 && (
              <p className="m-0 font-sans font-medium text-white/90" style={metaStyle}>
                {metaBits.join(' · ')}
              </p>
            )}
          </div>
        </div>
      );
      break;

    case 'minimal-cream':
      body = (
        <div
          className="absolute inset-0 flex min-h-0 flex-col justify-between overflow-hidden"
          style={{ background: secondary || '#fff7ed', padding: pad }}
        >
          <div className="h-1 w-[28%] shrink-0" style={{ background: primary }} />
          <div className="min-h-0 overflow-hidden">
            {cfg.showCategory && content.categoryLabel && (
              <p
                className="m-0 mb-1 font-sans font-semibold uppercase tracking-[0.12em]"
                style={{ ...metaStyle, color: primary, textAlign: align }}
              >
                {content.categoryLabel}
              </p>
            )}
            <Title style={{ color: primary }}>{title}</Title>
            {price && (
              <p className="mt-2 m-0 font-sans" style={{ ...priceStyle, color: primary, textAlign: align }}>
                {price}
              </p>
            )}
          </div>
          {cfg.showLocation && content.locationLabel && (
            <p className="m-0 font-sans" style={{ ...metaStyle, color: '#64748b', textAlign: align }}>
              {content.locationLabel}
            </p>
          )}
        </div>
      );
      break;

    case 'marketplace-tag':
      body = (
        <div
          className="absolute inset-0 flex min-h-0 flex-col items-center justify-center gap-2 overflow-hidden"
          style={{ background: secondary, padding: pad }}
        >
          {(badge || (cfg.showCategory && content.categoryLabel)) && (
            <span
              className="shrink-0 rounded-full px-3 py-1 font-sans font-bold uppercase tracking-wide text-white"
              style={{ ...badgeStyle, background: primary }}
            >
              {badge || content.categoryLabel}
            </span>
          )}
          <Title className="max-w-full" style={{ color: '#0f172a', textAlign: 'center' }}>
            {title}
          </Title>
          {price && (
            <p className="m-0 shrink-0 font-sans" style={{ ...priceStyle, color: primary }}>
              {price}
            </p>
          )}
          {cfg.showLocation && content.locationLabel && (
            <p className="m-0 shrink-0 font-sans text-slate-500" style={metaStyle}>
              {content.locationLabel}
            </p>
          )}
        </div>
      );
      break;

    case 'gradient-dusk':
      body = (
        <div
          className="absolute inset-0 flex min-h-0 flex-col justify-end overflow-hidden"
          style={{
            background: `linear-gradient(160deg, ${primary} 0%, ${secondary} 55%, #020617 100%)`,
            padding: pad,
          }}
        >
          {badge && (
            <span
              className="mb-auto shrink-0 self-start rounded-md bg-white/15 px-2 py-0.5 font-sans font-bold uppercase tracking-wider text-white"
              style={badgeStyle}
            >
              {badge}
            </span>
          )}
          <Title className="text-white">{title}</Title>
          <div className="mt-2 flex shrink-0 flex-wrap items-end justify-between gap-2">
            {price ? (
              <p className="m-0 font-sans text-white" style={priceStyle}>
                {price}
              </p>
            ) : (
              <span />
            )}
            {metaBits.length > 0 && (
              <p className="m-0 font-sans text-white/80" style={metaStyle}>
                {metaBits.join(' · ')}
              </p>
            )}
          </div>
        </div>
      );
      break;

    case 'split':
      body = (
        <div className="absolute inset-0 flex min-h-0 flex-col overflow-hidden" style={{ background: secondary }}>
          <div
            className={`relative shrink-0 overflow-hidden ${compact ? 'h-[16%]' : 'h-[22%]'}`}
            style={{ background: primary }}
          >
            <div
              className="absolute -right-[8%] -top-[40%] h-[180%] w-[42%] rotate-12 bg-white/15"
              aria-hidden
            />
            <div className="absolute inset-0 flex items-center justify-between px-[8%]">
              {(badge || (cfg.showCategory && content.categoryLabel)) && (
                <span
                  className="rounded-full bg-black/20 px-2 py-0.5 font-sans font-bold uppercase tracking-wide text-white"
                  style={badgeStyle}
                >
                  {badge || content.categoryLabel}
                </span>
              )}
              {showBrand && (
                <span className="font-sans text-[clamp(0.55rem,2.6cqi,0.75rem)] font-semibold tracking-[0.2em] text-white/85">
                  BUSCADIS
                </span>
              )}
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden" style={{ padding: pad }}>
            <Title style={{ color: '#0f172a' }}>{title}</Title>
            <div className="shrink-0">
              {price && (
                <p className="m-0 font-sans" style={{ ...priceStyle, color: primary }}>
                  {price}
                </p>
              )}
              {cfg.showLocation && content.locationLabel && (
                <p className="mt-0.5 m-0 font-sans text-slate-500" style={metaStyle}>
                  {content.locationLabel}
                </p>
              )}
            </div>
          </div>
        </div>
      );
      break;

    case 'urgent':
      body = (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ background: secondary, padding: compact ? '4%' : '6%' }}
        >
          <div
            className="flex h-full min-h-0 flex-col items-center justify-center gap-2 overflow-hidden"
            style={{
              borderColor: primary,
              borderWidth: compact ? 3 : 6,
              borderStyle: 'solid',
              padding: pad,
            }}
          >
            <span
              className="shrink-0 rounded-sm px-2 py-0.5 font-sans font-black uppercase tracking-[0.18em] text-white"
              style={{ ...badgeStyle, background: primary }}
            >
              {badge || 'DISPONIBLE'}
            </span>
            <Title className="text-center" style={{ textAlign: 'center', color: '#0f172a' }}>
              {title}
            </Title>
            {price && (
              <p className="m-0 shrink-0 font-sans font-black" style={{ ...priceStyle, color: primary }}>
                {price}
              </p>
            )}
            {metaBits.length > 0 && (
              <p className="m-0 shrink-0 text-center font-sans text-slate-600" style={metaStyle}>
                {metaBits.join(' · ')}
              </p>
            )}
          </div>
        </div>
      );
      break;

    case 'negocio':
      body = (
        <div
          className="absolute inset-0 flex min-h-0 flex-col overflow-hidden"
          style={{ background: '#ffffff', padding: pad }}
        >
          <div
            className={`mb-2 w-full shrink-0 rounded-full ${compact ? 'h-1' : 'h-2'}`}
            style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }}
          />
          {cfg.showCategory && content.categoryLabel && (
            <p className="m-0 mb-1 shrink-0 font-sans font-semibold uppercase tracking-[0.14em] text-slate-500" style={metaStyle}>
              {content.categoryLabel}
            </p>
          )}
          <Title className="min-h-0 flex-1" style={{ color: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
            {title}
          </Title>
          <div
            className={`mt-auto flex shrink-0 items-end justify-between gap-2 border-t border-slate-200 ${compact ? 'pt-2' : 'pt-4'}`}
          >
            {price ? (
              <p className="m-0 font-sans" style={{ ...priceStyle, color: primary }}>
                {price}
              </p>
            ) : (
              <span />
            )}
            {cfg.showLocation && content.locationLabel && (
              <p className="m-0 max-w-[50%] truncate text-right font-sans text-slate-500" style={metaStyle}>
                {content.locationLabel}
              </p>
            )}
          </div>
        </div>
      );
      break;

    case 'poster-serif':
      body = (
        <div
          className="absolute inset-0 flex min-h-0 flex-col items-center justify-center overflow-hidden"
          style={{ background: primary, padding: pad }}
        >
          {!compact && <div className="absolute inset-[5%] border border-white/35" aria-hidden />}
          {(badge || metaBits[0]) && (
            <p className="m-0 mb-2 shrink-0 font-sans font-bold uppercase tracking-[0.22em] text-white/85" style={metaStyle}>
              {badge || metaBits[0]}
            </p>
          )}
          <Title className="text-center text-white" style={{ textAlign: 'center', fontFamily: 'Georgia, ui-serif, serif' }}>
            {title}
          </Title>
          {price && (
            <p className="mt-2 m-0 shrink-0 font-sans text-white/95" style={priceStyle}>
              {price}
            </p>
          )}
          {cfg.showLocation && content.locationLabel && (
            <p className="mt-1 m-0 shrink-0 font-sans text-white/75" style={metaStyle}>
              {content.locationLabel}
            </p>
          )}
        </div>
      );
      break;

    case 'ribbon':
      body = (
        <div
          className="absolute inset-0 flex min-h-0 flex-col justify-between overflow-hidden"
          style={{ background: secondary, padding: pad }}
        >
          <div
            className="absolute left-0 right-0 top-[10%] py-1 text-center font-sans font-black uppercase tracking-[0.2em] text-white shadow-sm"
            style={{ ...badgeStyle, background: primary }}
          >
            {badge || content.categoryLabel || 'BUSCADIS'}
          </div>
          <span className="invisible shrink-0">.</span>
          <div className={`min-h-0 overflow-hidden ${compact ? 'mt-[14%]' : 'mt-[18%]'}`}>
            <Title style={{ color: '#0f172a' }}>{title}</Title>
            {price && (
              <p className="mt-2 m-0 font-sans" style={{ ...priceStyle, color: primary }}>
                {price}
              </p>
            )}
          </div>
          {cfg.showLocation && content.locationLabel && (
            <p className="m-0 shrink-0 font-sans text-slate-500" style={metaStyle}>
              {content.locationLabel}
            </p>
          )}
        </div>
      );
      break;

    case 'duo-tone':
      body = (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0" style={{ background: primary }} />
          <div
            className="absolute inset-x-0 bottom-0 h-[48%]"
            style={{ background: secondary, clipPath: 'polygon(0 18%, 100% 0, 100% 100%, 0 100%)' }}
          />
          <div
            className="absolute inset-0 flex min-h-0 flex-col justify-between overflow-hidden"
            style={{ padding: pad }}
          >
            {showBrand && (
              <span className="self-end font-sans text-[clamp(0.55rem,2.6cqi,0.75rem)] font-semibold tracking-[0.18em] text-white/80">
                BUSCADIS
              </span>
            )}
            {!showBrand && <span />}
            <div className="min-h-0 overflow-hidden">
              <Title className="text-white">{title}</Title>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
                {price ? (
                  <p className="m-0 font-sans" style={{ ...priceStyle, color: primary }}>
                    {price}
                  </p>
                ) : (
                  <span />
                )}
                {metaBits.length > 0 && (
                  <p className="m-0 font-sans text-slate-600" style={metaStyle}>
                    {metaBits.join(' · ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
      break;

    case 'editorial':
      body = (
        <div
          className="absolute inset-0 flex min-h-0 flex-col justify-between overflow-hidden"
          style={{ background: secondary || '#fef3c7', padding: pad }}
        >
          <div className="flex shrink-0 items-baseline justify-between gap-2 border-b-2 pb-1" style={{ borderColor: primary }}>
            <span className="font-sans font-bold uppercase tracking-[0.16em]" style={{ ...metaStyle, color: primary }}>
              {badge || content.categoryLabel || 'Aviso'}
            </span>
            {showBrand && (
              <span className="font-sans text-slate-500" style={metaStyle}>
                Buscadis
              </span>
            )}
          </div>
          <Title className="min-h-0 py-2" style={{ color: '#0f172a', fontFamily: 'Georgia, ui-serif, serif' }}>
            {title}
          </Title>
          <div className="flex shrink-0 items-end justify-between gap-2 border-t border-black/10 pt-2">
            {price ? (
              <p className="m-0 font-sans" style={{ ...priceStyle, color: primary }}>
                {price}
              </p>
            ) : (
              <span />
            )}
            {cfg.showLocation && content.locationLabel && (
              <p className="m-0 font-sans text-slate-600" style={metaStyle}>
                {content.locationLabel}
              </p>
            )}
          </div>
        </div>
      );
      break;

    case 'stamp':
      body = (
        <div
          className="absolute inset-0 flex min-h-0 flex-col items-center justify-center overflow-hidden"
          style={{ background: secondary, padding: compact ? '5%' : '8%' }}
        >
          <div
            className="flex max-h-full max-w-full flex-col items-center gap-2 overflow-hidden rounded-[1.25rem] border-dashed px-[6%] py-[8%]"
            style={{ borderColor: primary, borderWidth: compact ? 2 : 3 }}
          >
            {(badge || (cfg.showCategory && content.categoryLabel)) && (
              <span
                className="shrink-0 rotate-[-6deg] rounded-md px-2 py-0.5 font-sans font-black uppercase tracking-wider text-white"
                style={{ ...badgeStyle, background: primary }}
              >
                {badge || content.categoryLabel}
              </span>
            )}
            <Title className="text-center" style={{ textAlign: 'center', color: '#0f172a' }}>
              {title}
            </Title>
            {price && (
              <p className="m-0 shrink-0 font-sans" style={{ ...priceStyle, color: primary }}>
                {price}
              </p>
            )}
          </div>
          {cfg.showLocation && content.locationLabel && (
            <p className="mt-2 m-0 shrink-0 font-sans text-slate-500" style={metaStyle}>
              {content.locationLabel}
            </p>
          )}
        </div>
      );
      break;

    case 'soft-wash':
      body = (
        <div
          className="absolute inset-0 flex min-h-0 flex-col justify-between overflow-hidden"
          style={{
            background: `radial-gradient(120% 80% at 10% 0%, ${primary}33 0%, ${secondary} 45%, #ffffff 100%)`,
            padding: pad,
          }}
        >
          {cfg.showCategory && content.categoryLabel && (
            <p
              className="m-0 shrink-0 font-sans font-semibold uppercase tracking-[0.14em]"
              style={{ ...metaStyle, color: primary }}
            >
              {content.categoryLabel}
            </p>
          )}
          <Title style={{ color: '#0f172a' }}>{title}</Title>
          <div className="shrink-0">
            {price && (
              <p className="m-0 font-sans" style={{ ...priceStyle, color: primary }}>
                {price}
              </p>
            )}
            {cfg.showLocation && content.locationLabel && (
              <p className="mt-0.5 m-0 font-sans text-slate-600" style={metaStyle}>
                {content.locationLabel}
              </p>
            )}
          </div>
        </div>
      );
      break;

    case 'ticket':
      body = (
        <div
          className="absolute inset-0 flex min-h-0 flex-col justify-between overflow-hidden"
          style={{ background: secondary, padding: pad }}
        >
          <div
            className="min-h-0 flex-1 overflow-hidden rounded-2xl border-2 border-dashed bg-white/70"
            style={{ borderColor: `${primary}99`, padding: compact ? '6%' : '8%' }}
          >
            <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
              <span className="font-sans font-black uppercase tracking-[0.18em]" style={{ ...metaStyle, color: primary }}>
                {badge || 'ENTRADA'}
              </span>
              {!compact && <span className="font-sans text-[clamp(0.55rem,2.5cqi,0.7rem)] text-slate-400">★★★</span>}
            </div>
            <Title style={{ color: '#0f172a' }}>{title}</Title>
            {price && (
              <p className="mt-2 m-0 font-sans font-black" style={{ ...priceStyle, color: primary }}>
                {price}
              </p>
            )}
          </div>
          {metaBits.length > 0 && (
            <p className="m-0 shrink-0 pt-1 text-center font-sans text-slate-600" style={metaStyle}>
              {metaBits.join(' · ')}
            </p>
          )}
        </div>
      );
      break;

    case 'corner-mark':
      body = (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ background: secondary, padding: pad }}
        >
          <div
            className={`absolute -right-6 -top-6 rotate-45 ${compact ? 'h-[32%] w-[32%]' : 'h-[42%] w-[42%]'}`}
            style={{ background: primary }}
            aria-hidden
          />
          <div className="relative z-[1] flex h-full min-h-0 flex-col justify-between overflow-hidden">
            {(badge || (cfg.showCategory && content.categoryLabel)) && (
              <span
                className="shrink-0 self-start rounded-md px-2 py-0.5 font-sans font-bold uppercase tracking-wide text-white"
                style={{ ...badgeStyle, background: primary }}
              >
                {badge || content.categoryLabel}
              </span>
            )}
            <Title className="max-w-[92%]" style={{ color: '#0f172a' }}>
              {title}
            </Title>
            <div className="flex shrink-0 items-end justify-between gap-2">
              {price ? (
                <p className="m-0 font-sans" style={{ ...priceStyle, color: primary }}>
                  {price}
                </p>
              ) : (
                <span />
              )}
              {cfg.showLocation && content.locationLabel && (
                <p className="m-0 font-sans text-slate-500" style={metaStyle}>
                  {content.locationLabel}
                </p>
              )}
            </div>
          </div>
        </div>
      );
      break;

    case 'bold-type':
    default:
      body = (
        <div
          className="absolute inset-0 flex min-h-0 flex-col justify-between overflow-hidden"
          style={{ background: primary, color: '#fff', padding: pad }}
        >
          <div className="flex shrink-0 items-start justify-between gap-2">
            {(badge || (cfg.showCategory && content.categoryLabel)) && (
              <span
                className="rounded-full bg-black/25 px-2 py-0.5 font-sans font-bold uppercase tracking-wide"
                style={badgeStyle}
              >
                {badge || content.categoryLabel}
              </span>
            )}
            {showBrand && (
              <span className="font-sans text-[clamp(0.6rem,2.8cqi,0.8rem)] font-semibold tracking-widest opacity-80">
                BUSCADIS
              </span>
            )}
          </div>
          <Title className="text-white">{title}</Title>
          <div className="flex shrink-0 items-end justify-between gap-2">
            {price ? (
              <p className="m-0 font-sans font-bold" style={priceStyle}>
                {price}
              </p>
            ) : (
              <span />
            )}
            {cfg.showLocation && content.locationLabel && (
              <p className="m-0 max-w-[45%] truncate text-right font-sans opacity-90" style={metaStyle}>
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
      lang="es"
      className={`relative w-full overflow-hidden ${fillParent ? 'h-full min-h-0' : 'aspect-square'} ${className}`}
      style={rootStyle}
      data-flyer-template={templateId}
      data-flyer-density={density}
    >
      {body}
    </div>
  );
}
