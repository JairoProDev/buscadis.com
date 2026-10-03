import type { FlyerConfig, FlyerContent, FlyerTemplateId } from '@/lib/flyer/types';
import { truncateFlyerTitle } from '@/lib/flyer/layout';

const W = 1080;
const H = 1920;
const PAD = 64;

type OgAdisoImageProps = {
  templateId: FlyerTemplateId;
  config: Required<
    Pick<FlyerConfig, 'primary' | 'secondary' | 'align' | 'showCategory' | 'showLocation'>
  >;
  content: FlyerContent;
  premium?: boolean;
};

function isDarkTemplate(templateId: FlyerTemplateId): boolean {
  return (
    templateId === 'bold-type' ||
    templateId === 'gradient-dusk' ||
    templateId === 'diagonal-band' ||
    templateId === 'poster-serif' ||
    templateId === 'duo-tone'
  );
}

/** Misma plantilla/colores que FlyerCanvas en el feed, en formato 9:16 para historias. */
export function OgAdisoFlyerImage({ templateId, config, content, premium }: OgAdisoImageProps) {
  const title = truncateFlyerTitle(content.title || 'Adiso en Buscadis', 110);
  const textAlign = config.align === 'center' ? 'center' : 'left';
  const category = config.showCategory ? content.categoryLabel : null;
  const location = config.showLocation ? content.locationLabel : null;
  const primary = config.primary;
  const secondary = config.secondary;
  const dark = isDarkTemplate(templateId);
  const ink = dark ? '#ffffff' : '#0f172a';
  const muted = dark ? 'rgba(255,255,255,0.82)' : '#475569';
  const titleSize = title.length > 70 ? 52 : 64;

  const titleBlock = (
    <div
      style={{
        fontSize: titleSize,
        fontWeight: 800,
        lineHeight: 1.08,
        color: ink,
        textAlign,
        letterSpacing: '-0.02em',
        fontFamily: templateId === 'editorial' || templateId === 'minimal-cream'
          ? 'Georgia, serif'
          : 'system-ui, sans-serif',
      }}
    >
      {title}
    </div>
  );

  const premiumBadge = premium ? (
    <div
      style={{
        display: 'flex',
        padding: '8px 14px',
        borderRadius: 8,
        background: '#f59e0b',
        color: '#111',
        fontSize: 18,
        fontWeight: 800,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      PREMIUM
    </div>
  ) : null;

  const categoryPill = (label: string, bg: string, fg: string) => (
    <div
      style={{
        display: 'flex',
        padding: '10px 18px',
        borderRadius: 999,
        background: bg,
        color: fg,
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {label}
    </div>
  );

  let body: JSX.Element;

  switch (templateId) {
    case 'negocio':
      body = (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: secondary,
            padding: PAD,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: `linear-gradient(90deg, ${primary}, ${secondary})`,
              marginBottom: 28,
            }}
          />
          {category ? (
            <div style={{ fontSize: 22, fontWeight: 600, color: muted, letterSpacing: 2, marginBottom: 16 }}>
              {category}
            </div>
          ) : null}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>{titleBlock}</div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '2px solid #e2e8f0',
              paddingTop: 28,
              fontSize: 24,
              color: muted,
            }}
          >
            <span style={{ fontWeight: 800, color: primary }}>BUSCADIS</span>
            {location ? <span style={{ maxWidth: 420, textAlign: 'right' }}>{location}</span> : null}
          </div>
        </div>
      );
      break;

    case 'ribbon':
      body = (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: secondary,
            padding: PAD,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '10%',
              padding: '14px 0',
              textAlign: 'center',
              background: primary,
              color: '#fff',
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: 4,
              textTransform: 'uppercase',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {category || 'BUSCADIS'}
          </div>
          <div style={{ marginTop: '22%' }}>{titleBlock}</div>
          {location ? (
            <div style={{ fontSize: 24, color: muted, fontFamily: 'Arial, sans-serif' }}>{location}</div>
          ) : (
            <div />
          )}
        </div>
      );
      break;

    case 'corner-mark':
      body = (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: secondary,
            padding: PAD,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -48,
              top: -48,
              width: 420,
              height: 420,
              background: primary,
              transform: 'rotate(45deg)',
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {category ? categoryPill(category, primary, '#fff') : <span />}
            <div style={{ maxWidth: '92%' }}>{titleBlock}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, color: muted }}>
              <span style={{ fontWeight: 700, color: primary }}>BUSCADIS</span>
              {location ? <span>{location}</span> : null}
            </div>
          </div>
        </div>
      );
      break;

    case 'minimal-cream':
      body = (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: secondary,
            padding: PAD,
          }}
        >
          <div style={{ width: '28%', height: 6, background: primary }} />
          <div>
            {category ? (
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: primary,
                  letterSpacing: 2,
                  marginBottom: 20,
                  textAlign,
                }}
              >
                {category}
              </div>
            ) : null}
            <div style={{ color: primary }}>{titleBlock}</div>
          </div>
          {location ? (
            <div style={{ fontSize: 24, color: muted, textAlign, fontFamily: 'Arial, sans-serif' }}>
              {location}
            </div>
          ) : (
            <div />
          )}
        </div>
      );
      break;

    case 'editorial':
      body = (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: secondary,
            padding: PAD,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: `4px solid ${primary}`,
              paddingBottom: 16,
              fontFamily: 'Arial, sans-serif',
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 700, color: primary, letterSpacing: 2 }}>
              {category || 'Adiso'}
            </span>
            <span style={{ fontSize: 22, color: muted }}>Buscadis</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '24px 0' }}>
            {titleBlock}
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(0,0,0,0.1)',
              paddingTop: 20,
              fontSize: 24,
              color: muted,
              fontFamily: 'Arial, sans-serif',
            }}
          >
            <span style={{ fontWeight: 800, color: primary }}>BUSCADIS</span>
            {location ? <span>{location}</span> : null}
          </div>
        </div>
      );
      break;

    case 'diagonal-band':
      body = (
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            background: secondary,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -120,
              right: -80,
              width: 520,
              height: 520,
              background: primary,
              transform: 'rotate(35deg)',
              opacity: 0.95,
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: PAD,
            }}
          >
            {category ? categoryPill(category, 'rgba(0,0,0,0.28)', '#fff') : null}
            <div style={{ marginTop: 32, color: '#fff' }}>{titleBlock}</div>
            {location ? (
              <div style={{ marginTop: 40, fontSize: 24, color: 'rgba(255,255,255,0.85)' }}>{location}</div>
            ) : null}
          </div>
        </div>
      );
      break;

    case 'bold-type':
    default:
      body = (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: primary,
            padding: PAD,
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {category ? categoryPill(category, 'rgba(0,0,0,0.25)', '#fff') : <span />}
            {premiumBadge}
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', color: '#fff' }}>{titleBlock}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, opacity: 0.9 }}>
            <span style={{ fontWeight: 700 }}>BUSCADIS</span>
            {location ? <span style={{ maxWidth: 420, textAlign: 'right' }}>{location}</span> : null}
          </div>
        </div>
      );
      break;
  }

  const showFloatingPremium = premium && templateId !== 'bold-type';

  return (
    <div style={{ width: W, height: H, display: 'flex', fontFamily: 'Georgia, serif', position: 'relative' }}>
      {body}
      {showFloatingPremium ? (
        <div style={{ position: 'absolute', top: 48, right: 48, zIndex: 2 }}>{premiumBadge}</div>
      ) : null}
    </div>
  );
}

export const OG_ADISO_STORY_SIZE = { width: W, height: H };
