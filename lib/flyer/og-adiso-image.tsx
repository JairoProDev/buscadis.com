import type { FlyerConfig, FlyerContent, FlyerTemplateId } from '@/lib/flyer/types';
import { truncateFlyerTitle } from '@/lib/flyer/layout';

const W = 1080;
const H = 1920;

type OgAdisoImageProps = {
  templateId: FlyerTemplateId;
  config: Required<
    Pick<FlyerConfig, 'primary' | 'secondary' | 'align' | 'showCategory' | 'showLocation'>
  >;
  content: FlyerContent;
  premium?: boolean;
};

/** Misma plantilla/colores que FlyerCanvas en el feed, en formato 9:16 para historias. */
export function OgAdisoFlyerImage({ templateId, config, content, premium }: OgAdisoImageProps) {
  const title = truncateFlyerTitle(content.title || 'Adiso en Buscadis', 110);
  const align = config.align === 'center' ? 'center' : 'flex-start';
  const textAlign = config.align === 'center' ? 'center' : 'left';
  const category = config.showCategory ? content.categoryLabel : null;
  const location = config.showLocation ? content.locationLabel : null;

  const isDarkBg =
    templateId === 'bold-type' ||
    templateId === 'gradient-dusk' ||
    templateId === 'diagonal-band';
  const ink = isDarkBg ? '#ffffff' : '#0f172a';
  const muted = isDarkBg ? 'rgba(255,255,255,0.82)' : '#475569';
  const panelBg = isDarkBg ? config.primary : config.secondary;
  const accent = config.primary;

  return (
    <div
      style={{
        width: W,
        height: H,
        display: 'flex',
        flexDirection: 'column',
        background: config.secondary,
        fontFamily: 'Georgia, serif',
        position: 'relative',
      }}
    >
      {templateId === 'diagonal-band' && (
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -80,
            width: 520,
            height: 520,
            background: config.primary,
            transform: 'rotate(35deg)',
            opacity: 0.95,
          }}
        />
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px 64px',
          background: panelBg,
          margin: templateId === 'editorial' ? '48px 40px' : 0,
          border:
            templateId === 'urgent' || templateId === 'ticket'
              ? `8px solid ${accent}`
              : 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 32,
          }}
        >
          {category ? (
            <div
              style={{
                display: 'flex',
                padding: '10px 18px',
                borderRadius: 999,
                background: isDarkBg ? 'rgba(0,0,0,0.28)' : accent,
                color: isDarkBg ? '#fff' : '#fff',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {category}
            </div>
          ) : (
            <span />
          )}
          {premium ? (
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
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: align,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: title.length > 70 ? 52 : 64,
              fontWeight: 800,
              lineHeight: 1.08,
              color: ink,
              textAlign,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 40,
            fontFamily: 'Arial, sans-serif',
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700, color: accent }}>BUSCADIS</div>
          {location ? (
            <div style={{ fontSize: 24, color: muted, maxWidth: 420, textAlign: 'right' }}>
              {location}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export const OG_ADISO_STORY_SIZE = { width: W, height: H };
