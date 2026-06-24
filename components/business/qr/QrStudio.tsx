'use client';

import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { IconQrcode, IconSparkles } from '@/components/Icons';
import { cn } from '@/lib/utils';
import { QR_PRESETS } from '@/lib/qr/presets';
import type { QrRenderMode, QrStyleConfig } from '@/lib/qr/types';
import { PRO_QR_FEATURES, PRO_QR_MONTHLY_PRICE_PEN } from '@/lib/business/subscription';
import QrDownloadMenu from './QrDownloadMenu';
import QrAnalyticsPanel from './QrAnalyticsPanel';
import { useAuth } from '@/hooks/useAuth';

const QrPreviewLazy = dynamic(() => import('./QrPreview'), { ssr: false });

type Tab = 'style' | 'customize' | 'download' | 'stats';

interface QrStudioProps {
  slug: string;
  businessName: string;
  businessId?: string;
  themeColor?: string;
  isPro: boolean;
  hasLogo?: boolean;
  compact?: boolean;
  onUpgrade?: () => void;
  refreshToken?: number;
}

const RENDER_MODES: { id: QrRenderMode; label: string; desc: string; wire: string; needsLogo?: boolean }[] = [
  { id: 'classic', label: 'Clásico', desc: 'Cuadrados · máxima compatibilidad', wire: '▣▣▣' },
  { id: 'branded', label: 'Marca', desc: 'Logo centrado · esquinas redondeadas', wire: '◉▣◉' },
  { id: 'visual', label: 'Visual', desc: 'Logo fusionado · halftone', wire: '∴∵∴', needsLogo: true },
];

function ModeWireframe({ mode }: { mode: QrRenderMode }) {
  if (mode === 'classic') {
    return (
      <svg viewBox="0 0 48 48" className="w-10 h-10 text-slate-400" aria-hidden>
        <rect x="4" y="4" width="14" height="14" fill="currentColor" />
        <rect x="30" y="4" width="14" height="14" fill="currentColor" />
        <rect x="4" y="30" width="14" height="14" fill="currentColor" />
        <rect x="22" y="22" width="4" height="4" fill="currentColor" />
        <rect x="28" y="22" width="4" height="4" fill="currentColor" />
        <rect x="22" y="28" width="4" height="4" fill="currentColor" />
      </svg>
    );
  }
  if (mode === 'visual') {
    return (
      <svg viewBox="0 0 48 48" className="w-10 h-10 text-slate-400" aria-hidden>
        <circle cx="11" cy="11" r="7" fill="currentColor" opacity="0.3" />
        <circle cx="37" cy="11" r="7" fill="currentColor" opacity="0.3" />
        <circle cx="11" cy="37" r="7" fill="currentColor" opacity="0.3" />
        <circle cx="24" cy="24" r="3" fill="currentColor" />
        <circle cx="30" cy="20" r="2" fill="currentColor" opacity="0.6" />
        <circle cx="18" cy="28" r="2" fill="currentColor" opacity="0.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10 text-slate-400" aria-hidden>
      <rect x="4" y="4" width="14" height="14" rx="3" fill="currentColor" />
      <rect x="30" y="4" width="14" height="14" rx="3" fill="currentColor" />
      <rect x="4" y="30" width="14" height="14" rx="3" fill="currentColor" />
      <rect x="18" y="18" width="12" height="12" rx="2" fill="white" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="24" r="4" fill="currentColor" />
    </svg>
  );
}

export default function QrStudio({
  slug,
  businessName,
  themeColor = '#2563eb',
  isPro,
  hasLogo = false,
  compact = false,
  onUpgrade,
  refreshToken = 0,
}: QrStudioProps) {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>('style');
  const [styleConfig, setStyleConfig] = useState<QrStyleConfig>({
    renderMode: 'branded',
    dotsColor: themeColor,
    backgroundColor: '#ffffff',
    dotType: 'rounded',
    halftoneIntensity: 0.75,
    dotScale: 0.35,
    buscadisFinderMark: true,
  });
  const [shortUrl, setShortUrl] = useState<string>('');
  const [hasLogoRemote, setHasLogoRemote] = useState(hasLogo);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [qaStatus, setQaStatus] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const previewStyle = useDeferredValue(styleConfig);

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
          else if (data.qr?.short_code) setShortUrl(`/q/${data.qr.short_code}`);
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

  const copyShortLink = useCallback(async () => {
    if (!shortUrl) return;
    const full = shortUrl.startsWith('http') ? shortUrl : `${window.location.origin}${shortUrl}`;
    await navigator.clipboard.writeText(full);
    setSaveMsg('Enlace copiado');
    setTimeout(() => setSaveMsg(null), 2000);
  }, [shortUrl]);

  const saveStyle = useCallback(async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/business/${encodeURIComponent(slug)}/qr-style`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
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
      setSaveMsg('Estilo guardado');
    } catch {
      setSaveMsg('Error de conexión');
    } finally {
      setSaving(false);
    }
  }, [slug, styleConfig, session?.access_token]);

  const applyPreset = (presetId: string) => {
    const preset = QR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    if (preset.tier === 'pro' && !isPro) return;
    setStyleConfig({
      ...preset.config,
      dotsColor: preset.config.dotsColor || styleConfig.dotsColor || themeColor,
      backgroundColor: preset.config.backgroundColor || '#ffffff',
      finderBrandColor: themeColor,
      presetId: preset.id,
    });
    setDirty(true);
  };

  const logoOk = hasLogo || hasLogoRemote;
  const renderMode = styleConfig.renderMode || 'branded';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'style', label: 'Estilo' },
    { id: 'customize', label: 'Personalizar' },
    { id: 'download', label: 'Descargar' },
    { id: 'stats', label: 'Estadísticas' },
  ];

  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 overflow-hidden',
        compact ? 'shadow-sm' : 'shadow-lg'
      )}
    >
      <div className="p-5 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <IconQrcode size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Tu código QR</h3>
            <p className="text-xs text-slate-500">
              Vista previa en vivo · guarda para descargas e impresión
            </p>
          </div>
          {isPro && (
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
              Pro
            </span>
          )}
        </div>
      </div>

      <div className={cn('grid gap-6 p-5', compact ? 'grid-cols-1' : 'lg:grid-cols-2')}>
        <div className="flex flex-col items-center gap-3">
          <QrPreviewLazy
            slug={slug}
            businessName={businessName}
            tier={isPro ? 'pro' : 'free'}
            size={compact ? 160 : 220}
            styleConfig={previewStyle}
            livePreview
            refreshToken={refreshToken + previewKey}
            qaStatus={dirty ? null : (qaStatus as 'passed' | 'degraded' | 'pending' | 'failed' | null)}
            renderMode={renderMode}
          />
          {dirty && (
            <p className="text-[11px] text-amber-700 text-center px-2">
              Cambios sin guardar — la vista previa es orientativa hasta que pulses Guardar.
            </p>
          )}
          {shortUrl && (
            <button
              type="button"
              onClick={copyShortLink}
              className="text-xs font-mono text-blue-600 hover:text-blue-800 truncate max-w-full px-3 py-1.5 rounded-lg bg-blue-50"
            >
              {shortUrl}
            </button>
          )}
          {saveMsg && <p className="text-xs text-green-600 font-medium">{saveMsg}</p>}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex-1 min-w-[70px] px-2 py-2 rounded-lg text-xs font-bold transition-colors',
                  tab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'style' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-600 mb-2">Modo de QR</p>
                <div className="grid grid-cols-1 gap-2">
                  {RENDER_MODES.map((m) => {
                    const disabled = m.needsLogo && !logoOk;
                    const active = renderMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => patchStyle({ renderMode: m.id })}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border text-left transition-colors',
                          active ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300',
                          disabled && 'opacity-40 cursor-not-allowed'
                        )}
                      >
                        <ModeWireframe mode={m.id} />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{m.label}</p>
                          <p className="text-[10px] text-slate-500">{m.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-600 mb-2">Plantillas</p>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {QR_PRESETS.filter((p) => isPro || p.tier === 'free').map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border text-left transition-colors',
                        styleConfig.presetId === preset.id
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-slate-200 hover:border-blue-300'
                      )}
                    >
                      <ModeWireframe mode={preset.config.renderMode || 'branded'} />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{preset.name}</p>
                        <p className="text-[10px] text-slate-500">{preset.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={saveStyle}
                disabled={saving}
                className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl disabled:opacity-50"
              >
                {saving ? 'Guardando…' : dirty ? 'Guardar estilo' : 'Guardar estilo'}
              </button>
            </div>
          )}

          {tab === 'download' && (
            <QrDownloadMenu slug={slug} isPro={isPro} shortUrl={shortUrl} renderMode={renderMode} />
          )}

          {tab === 'customize' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-bold text-slate-600">
                  Color módulos
                  <input
                    type="color"
                    value={styleConfig.dotsColor || themeColor}
                    onChange={(e) => patchStyle({ dotsColor: e.target.value })}
                    className="mt-1 w-full h-9 rounded-lg cursor-pointer border border-slate-200"
                  />
                </label>
                <label className="block text-xs font-bold text-slate-600">
                  Fondo
                  <input
                    type="color"
                    value={styleConfig.backgroundColor || '#ffffff'}
                    onChange={(e) => patchStyle({ backgroundColor: e.target.value })}
                    className="mt-1 w-full h-9 rounded-lg cursor-pointer border border-slate-200"
                  />
                </label>
              </div>

              <label className="block text-xs font-bold text-slate-600">
                Forma de puntos
                <select
                  value={styleConfig.dotType || 'rounded'}
                  onChange={(e) =>
                    patchStyle({ dotType: e.target.value as QrStyleConfig['dotType'] })
                  }
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  <option value="square">Cuadrado</option>
                  <option value="dots">Puntos</option>
                  <option value="rounded">Redondeado</option>
                  <option value="classy-rounded">Elegante</option>
                </select>
              </label>

              {renderMode === 'visual' && (
                <>
                  <label className="block text-xs font-bold text-slate-600">
                    Intensidad halftone ({Math.round((styleConfig.halftoneIntensity ?? 0.75) * 100)}%)
                    <input
                      type="range"
                      min={40}
                      max={100}
                      value={Math.round((styleConfig.halftoneIntensity ?? 0.75) * 100)}
                      onChange={(e) =>
                        patchStyle({ halftoneIntensity: Number(e.target.value) / 100 })
                      }
                      className="mt-1 w-full"
                    />
                  </label>
                  <label className="block text-xs font-bold text-slate-600">
                    Tamaño puntos ({Math.round((styleConfig.dotScale ?? 0.35) * 100)}%)
                    <input
                      type="range"
                      min={25}
                      max={50}
                      value={Math.round((styleConfig.dotScale ?? 0.35) * 100)}
                      onChange={(e) => patchStyle({ dotScale: Number(e.target.value) / 100 })}
                      className="mt-1 w-full"
                    />
                  </label>
                </>
              )}

              {isPro && (
                <p className="text-[11px] text-slate-500">
                  Pro: gradientes y plantillas avanzadas en la pestaña Estilo.
                </p>
              )}

              <button
                type="button"
                onClick={saveStyle}
                disabled={saving}
                className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Guardar personalización'}
              </button>
            </div>
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
              {PRO_QR_FEATURES.map((f) => (
                <li key={f} className="text-xs text-slate-300 flex items-center gap-2">
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
