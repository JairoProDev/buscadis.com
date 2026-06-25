'use client';

import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { IconQrcode, IconSparkles } from '@/components/Icons';
import { cn } from '@/lib/utils';
import { buildQrStudioDefaults, normalizeStyleConfig } from '@/lib/qr/default-style';
import type { QrStyleConfig } from '@/lib/qr/types';
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
  const [styleConfig, setStyleConfig] = useState<QrStyleConfig>(() =>
    buildQrStudioDefaults(themeColor)
  );
  const [shortUrl, setShortUrl] = useState('');
  const [hasLogoRemote, setHasLogoRemote] = useState(hasLogo);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [qaStatus, setQaStatus] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const previewStyle = useDeferredValue(styleConfig);
  const logoOk = hasLogo || hasLogoRemote;

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/business/${encodeURIComponent(slug)}/qr-style`);
        if (res.ok) {
          const data = await res.json();
          if (data.qr?.style_config) {
            setStyleConfig(normalizeStyleConfig(data.qr.style_config, themeColor));
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
    setStyleConfig((c) => normalizeStyleConfig({ ...c, ...patch }, themeColor));
    setDirty(true);
  }, [themeColor]);

  const saveStyle = useCallback(async () => {
    setSaving(true);
    setSaveMsg(null);
    setSaveOk(false);
    const payload = normalizeStyleConfig(styleConfig, themeColor);
    try {
      const res = await fetch(`/api/business/${encodeURIComponent(slug)}/qr-style`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ styleConfig: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveOk(false);
        setSaveMsg(data.error || 'Error al guardar');
        return;
      }
      setStyleConfig(payload);
      setPreviewKey((k) => k + 1);
      setDirty(false);
      if (data.qr?.qa_status) setQaStatus(data.qr.qa_status);
      setSaveOk(true);
      setSaveMsg('Guardado');
      setTimeout(() => {
        setSaveMsg(null);
        setSaveOk(false);
      }, 2500);
    } catch {
      setSaveOk(false);
      setSaveMsg('Error de conexión');
    } finally {
      setSaving(false);
    }
  }, [slug, styleConfig, themeColor, session?.access_token]);

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
          />
          {dirty && (
            <p className="text-[11px] text-amber-700 text-center px-2">
              Vista previa en vivo · pulsa Guardar para descargas e impresión
            </p>
          )}
          {shortUrl && (
            <p className="text-[11px] font-mono text-blue-600 truncate max-w-full px-2">{shortUrl}</p>
          )}
          {saveMsg && (
            <p
              className={cn(
                'text-xs font-medium',
                saveOk ? 'text-green-600' : 'text-red-600'
              )}
            >
              {saveMsg}
            </p>
          )}
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
              {!logoOk && (
                <p className="text-xs text-amber-800 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
                  Sube un logo en tu perfil para que aparezca en el centro del código QR.
                </p>
              )}

              <div className={cn('grid gap-3', styleConfig.transparentBackground ? 'grid-cols-1' : 'grid-cols-2')}>
                <HexColorInput
                  label="Color del QR"
                  value={styleConfig.dotsColor || themeColor}
                  onChange={(hex) => patchStyle({ dotsColor: hex })}
                />
                {!styleConfig.transparentBackground && (
                  <HexColorInput
                    label="Fondo"
                    value={styleConfig.backgroundColor || '#ffffff'}
                    onChange={(hex) => patchStyle({ backgroundColor: hex })}
                  />
                )}
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(styleConfig.transparentBackground)}
                  onChange={(e) => patchStyle({ transparentBackground: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Fondo transparente (solo el código, sin placa blanca)
              </label>

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
