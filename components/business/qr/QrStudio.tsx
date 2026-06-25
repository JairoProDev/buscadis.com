'use client';

import { useCallback, useDeferredValue, useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { IconQrcode, IconSparkles } from '@/components/Icons';
import { cn } from '@/lib/utils';
import { QR_PRESETS } from '@/lib/qr/presets';
import { harmoniousCorners } from '@/lib/qr/dot-harmony';
import type { QrDotType, QrRenderMode, QrStyleConfig } from '@/lib/qr/types';
import { PRO_QR_FEATURES, PRO_QR_MONTHLY_PRICE_PEN } from '@/lib/business/subscription';
import QrDownloadMenu from './QrDownloadMenu';
import QrAnalyticsPanel from './QrAnalyticsPanel';
import { HexColorInput } from './HexColorInput';
import { useAuth } from '@/hooks/useAuth';

const QrPreviewLazy = dynamic(() => import('./QrPreview'), { ssr: false });

type Tab = 'design' | 'download' | 'stats';

interface QrStudioProps {
  slug: string;
  businessName: string;
  themeColor?: string;
  isPro: boolean;
  hasLogo?: boolean;
  compact?: boolean;
  onUpgrade?: () => void;
  refreshToken?: number;
}

/** Tres estilos principales — nombre autoexplicativo + miniatura */
const QR_STYLES: {
  id: QrRenderMode;
  name: string;
  needsLogo?: boolean;
  preview: ReactNode;
}[] = [
  {
    id: 'classic',
    name: 'Básico',
    preview: (
      <svg viewBox="0 0 40 40" className="w-11 h-11" aria-hidden>
        <rect width="40" height="40" rx="6" fill="#f1f5f9" />
        <rect x="5" y="5" width="10" height="10" fill="#334155" />
        <rect x="25" y="5" width="10" height="10" fill="#334155" />
        <rect x="5" y="25" width="10" height="10" fill="#334155" />
        <rect x="18" y="18" width="3" height="3" fill="#334155" />
        <rect x="23" y="18" width="3" height="3" fill="#334155" />
        <rect x="18" y="23" width="3" height="3" fill="#334155" />
      </svg>
    ),
  },
  {
    id: 'branded',
    name: 'Con logo',
    preview: (
      <svg viewBox="0 0 40 40" className="w-11 h-11" aria-hidden>
        <rect width="40" height="40" rx="6" fill="#f1f5f9" />
        <rect x="5" y="5" width="10" height="10" rx="2" fill="#b91c1c" />
        <rect x="25" y="5" width="10" height="10" rx="2" fill="#b91c1c" />
        <rect x="5" y="25" width="10" height="10" rx="2" fill="#b91c1c" />
        <circle cx="20" cy="20" r="7" fill="#b91c1c" opacity="0.9" />
        <circle cx="20" cy="20" r="4" fill="#fff" />
      </svg>
    ),
  },
  {
    id: 'visual',
    name: 'Logo integrado',
    needsLogo: true,
    preview: (
      <svg viewBox="0 0 40 40" className="w-11 h-11" aria-hidden>
        <rect width="40" height="40" rx="6" fill="#f1f5f9" />
        <circle cx="10" cy="10" r="5" fill="#b91c1c" opacity="0.35" />
        <circle cx="30" cy="10" r="5" fill="#b91c1c" opacity="0.35" />
        <circle cx="10" cy="30" r="5" fill="#b91c1c" opacity="0.35" />
        <circle cx="16" cy="16" r="2" fill="#b91c1c" />
        <circle cx="22" cy="14" r="1.5" fill="#b91c1c" opacity="0.6" />
        <circle cx="20" cy="20" r="3" fill="#b91c1c" />
        <circle cx="26" cy="22" r="2" fill="#b91c1c" opacity="0.7" />
        <circle cx="18" cy="26" r="1.8" fill="#b91c1c" opacity="0.5" />
        <ellipse cx="20" cy="20" rx="6" ry="4" fill="#b91c1c" opacity="0.25" />
      </svg>
    ),
  },
];

export default function QrStudio({
  slug,
  businessName,
  themeColor = '#53acc5',
  isPro,
  hasLogo = false,
  compact = false,
  onUpgrade,
  refreshToken = 0,
}: QrStudioProps) {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>('design');
  const [styleConfig, setStyleConfig] = useState<QrStyleConfig>({
    renderMode: 'branded',
    dotsColor: themeColor,
    backgroundColor: '#ffffff',
    dotType: 'rounded',
    halftoneIntensity: 0.8,
    dotScale: 0.35,
    buscadisFinderMark: true,
  });
  const [shortUrl, setShortUrl] = useState('');
  const [hasLogoRemote, setHasLogoRemote] = useState(hasLogo);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [qaStatus, setQaStatus] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const previewStyle = useDeferredValue(styleConfig);
  const logoOk = hasLogo || hasLogoRemote;
  const renderMode = styleConfig.renderMode || 'branded';

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/business/${encodeURIComponent(slug)}/qr-style`);
        if (res.ok) {
          const data = await res.json();
          if (data.qr?.style_config) {
            setStyleConfig((c) => ({
              ...c,
              ...data.qr.style_config,
              dotsColor: data.qr.style_config.dotsColor || themeColor,
            }));
          }
          if (data.shortUrl) setShortUrl(data.shortUrl);
          if (data.hasLogo) setHasLogoRemote(true);
          if (data.qr?.qa_status) setQaStatus(data.qr.qa_status);
        }
      } catch {
        /* */
      }
    })();
  }, [slug, themeColor]);

  const patchStyle = useCallback((patch: Partial<QrStyleConfig>) => {
    setStyleConfig((c) => ({ ...c, ...patch }));
    setDirty(true);
  }, []);

  const selectMode = (mode: QrRenderMode) => {
    patchStyle({ renderMode: mode, presetId: undefined });
  };

  const applyProPreset = (presetId: string) => {
    const preset = QR_PRESETS.find((p) => p.id === presetId);
    if (!preset || preset.tier === 'free') return;
    setStyleConfig({
      ...preset.config,
      dotsColor: preset.config.dotsColor || styleConfig.dotsColor || themeColor,
      backgroundColor: preset.config.backgroundColor || '#ffffff',
      presetId: preset.id,
    });
    setDirty(true);
  };

  const saveStyle = useCallback(async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/business/${encodeURIComponent(slug)}/qr-style`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ styleConfig }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveMsg(data.error || 'Error al guardar');
        return;
      }
      setPreviewKey((k) => k + 1);
      setDirty(false);
      if (data.qr?.qa_status) setQaStatus(data.qr.qa_status);
      setSaveMsg('Guardado');
      setTimeout(() => setSaveMsg(null), 2500);
    } catch {
      setSaveMsg('Error de conexión');
    } finally {
      setSaving(false);
    }
  }, [slug, styleConfig, session?.access_token]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'design', label: 'Diseño' },
    { id: 'download', label: 'Descargar' },
    { id: 'stats', label: 'Estadísticas' },
  ];

  return (
    <div
      className={cn(
        'overflow-hidden',
        compact
          ? ''
          : 'rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 shadow-lg'
      )}
    >
      {!compact && (
        <div className="p-5 border-b border-slate-100 bg-white/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <IconQrcode size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Tu código QR</h3>
              <p className="text-xs text-slate-500">{businessName}</p>
            </div>
            {isPro && (
              <span className="ml-auto text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                Pro
              </span>
            )}
          </div>
        </div>
      )}

      <div className={cn('grid gap-5', compact ? 'grid-cols-1' : 'p-5 lg:grid-cols-2')}>
        <div className="flex flex-col items-center gap-2">
          <QrPreviewLazy
            slug={slug}
            businessName={businessName}
            tier={isPro ? 'pro' : 'free'}
            size={compact ? 168 : 228}
            styleConfig={previewStyle}
            livePreview
            refreshToken={refreshToken + previewKey}
            qaStatus={dirty ? null : (qaStatus as 'passed' | 'degraded' | null)}
            renderMode={renderMode}
          />
          {dirty && (
            <p className="text-[11px] text-amber-700 text-center px-2">
              Vista previa en vivo · pulsa Guardar para descargas e impresión
            </p>
          )}
          {shortUrl && (
            <p className="text-[11px] font-mono text-blue-600 truncate max-w-full px-2">{shortUrl}</p>
          )}
          {saveMsg && <p className="text-xs text-green-600 font-medium">{saveMsg}</p>}
        </div>

        <div className="space-y-4">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-xs font-bold transition-colors',
                  tab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'design' && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Estilo del código
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {QR_STYLES.map((s) => {
                    const disabled = s.needsLogo && !logoOk;
                    const active = renderMode === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => selectMode(s.id)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all',
                          active
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-slate-200 hover:border-slate-300 bg-white',
                          disabled && 'opacity-40 cursor-not-allowed'
                        )}
                      >
                        {s.preview}
                        <span className="text-[11px] font-bold text-slate-800 text-center leading-tight">
                          {s.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {!logoOk && (
                  <p className="text-[11px] text-slate-500 mt-2">
                    Sube un logo en tu perfil para usar &quot;Con logo&quot; o &quot;Logo integrado&quot;.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <HexColorInput
                  label="Color del QR"
                  value={styleConfig.dotsColor || themeColor}
                  onChange={(hex) => patchStyle({ dotsColor: hex })}
                />
                <HexColorInput
                  label="Fondo"
                  value={styleConfig.backgroundColor || '#ffffff'}
                  onChange={(hex) => patchStyle({ backgroundColor: hex })}
                />
              </div>

              <label className="block text-xs font-bold text-slate-600">
                Forma de los puntos
                <select
                  value={styleConfig.dotType || 'rounded'}
                  onChange={(e) => {
                    const dotType = e.target.value as QrDotType;
                    const harmony = harmoniousCorners(dotType);
                    patchStyle({
                      dotType,
                      cornerSquareType: harmony.cornerSquareType,
                      cornerDotType: harmony.cornerDotType,
                    });
                  }}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  <option value="square">Cuadrados</option>
                  <option value="dots">Puntos finos</option>
                  <option value="rounded">Suaves</option>
                  <option value="extra-rounded">Muy redondeados</option>
                  <option value="classy">Clásicos</option>
                  <option value="classy-rounded">Clásicos suaves</option>
                </select>
              </label>


              {(renderMode === 'classic' || renderMode === 'branded') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-1.5">Marco de esquinas</p>
                    <div className="flex gap-1.5">
                      {(
                        [
                          ['square', '■'],
                          ['extra-rounded', '▢'],
                          ['dot', '●'],
                        ] as const
                      ).map(([id, icon]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => patchStyle({ cornerSquareType: id })}
                          className={cn(
                            'flex-1 py-2 rounded-lg border text-sm font-bold transition-colors',
                            (styleConfig.cornerSquareType || 'extra-rounded') === id
                              ? 'border-blue-500 bg-blue-50 text-blue-800'
                              : 'border-slate-200 bg-white text-slate-600'
                          )}
                          title={id}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-1.5">Centro de esquinas</p>
                    <div className="flex gap-1.5">
                      {(
                        [
                          ['square', '■'],
                          ['dot', '●'],
                        ] as const
                      ).map(([id, icon]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => patchStyle({ cornerDotType: id })}
                          className={cn(
                            'flex-1 py-2 rounded-lg border text-sm font-bold transition-colors',
                            (styleConfig.cornerDotType || 'dot') === id
                              ? 'border-blue-500 bg-blue-50 text-blue-800'
                              : 'border-slate-200 bg-white text-slate-600'
                          )}
                          title={id}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {renderMode === 'visual' && (
                <div className="space-y-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <label className="block text-xs font-bold text-slate-600">
                    Presencia del logo ({Math.round((styleConfig.halftoneIntensity ?? 0.75) * 100)}%)
                    <input
                      type="range"
                      min={50}
                      max={100}
                      value={Math.round((styleConfig.halftoneIntensity ?? 0.75) * 100)}
                      onChange={(e) =>
                        patchStyle({ halftoneIntensity: Number(e.target.value) / 100 })
                      }
                      className="mt-1 w-full accent-blue-600"
                    />
                  </label>
                  <label className="block text-xs font-bold text-slate-600">
                    Detalle de puntos ({Math.round((styleConfig.dotScale ?? 0.35) * 100)}%)
                    <input
                      type="range"
                      min={25}
                      max={55}
                      value={Math.round((styleConfig.dotScale ?? 0.35) * 100)}
                      onChange={(e) => patchStyle({ dotScale: Number(e.target.value) / 100 })}
                      className="mt-1 w-full accent-blue-600"
                    />
                  </label>
                </div>
              )}

              {isPro && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                    Estilos Pro
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QR_PRESETS.filter((p) => p.tier === 'pro').map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyProPreset(p.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors',
                          styleConfig.presetId === p.id
                            ? 'bg-amber-100 border-amber-300 text-amber-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        )}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={saveStyle}
                disabled={saving}
                className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          )}

          {tab === 'download' && (
            <>
              {dirty && (
                <p className="text-[11px] text-amber-700 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
                  Los kits de impresión usan el estilo guardado. Pulsa Guardar en Diseño para
                  actualizarlos.
                </p>
              )}
              <QrDownloadMenu
                slug={slug}
                isPro={isPro}
                shortUrl={shortUrl}
                styleConfig={styleConfig}
              />
            </>
          )}

          {tab === 'stats' && <QrAnalyticsPanel slug={slug} isPro={isPro} />}
        </div>
      </div>

      {!isPro && !compact && (
        <div className="px-5 pb-5">
          <div className="rounded-2xl bg-slate-900 text-white p-4">
            <p className="text-sm font-bold flex items-center gap-2">
              <IconSparkles size={16} className="text-amber-400" />
              Buscadis Pro
            </p>
            <ul className="mt-2 space-y-1">
              {PRO_QR_FEATURES.slice(0, 4).map((f) => (
                <li key={f} className="text-xs text-slate-300 flex gap-2">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onUpgrade}
              className="mt-3 w-full py-2.5 bg-white text-slate-900 text-sm font-bold rounded-xl"
            >
              Activar Pro — S/ {PRO_QR_MONTHLY_PRICE_PEN}/mes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
