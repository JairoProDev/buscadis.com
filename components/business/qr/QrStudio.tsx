'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { IconQrcode, IconSparkles } from '@/components/Icons';
import { cn } from '@/lib/utils';
import { QR_PRESETS } from '@/lib/qr/presets';
import type { QrStyleConfig } from '@/lib/qr/types';
import { PRO_QR_FEATURES, PRO_QR_MONTHLY_PRICE_PEN } from '@/lib/business/subscription';
import QrPreview from './QrPreview';
import QrDownloadMenu from './QrDownloadMenu';
import QrAnalyticsPanel from './QrAnalyticsPanel';
import { useAuth } from '@/hooks/useAuth';

const QrPreviewLazy = dynamic(() => import('./QrPreview'), { ssr: false });

type Tab = 'customize' | 'templates' | 'download' | 'stats';

interface QrStudioProps {
  slug: string;
  businessName: string;
  businessId?: string;
  themeColor?: string;
  isPro: boolean;
  compact?: boolean;
  onUpgrade?: () => void;
  refreshToken?: number;
}

export default function QrStudio({
  slug,
  businessName,
  themeColor = '#2563eb',
  isPro,
  compact = false,
  onUpgrade,
  refreshToken = 0,
}: QrStudioProps) {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>(isPro ? 'customize' : 'download');
  const [styleConfig, setStyleConfig] = useState<QrStyleConfig>({
    dotsColor: themeColor,
    backgroundColor: '#ffffff',
    dotType: 'square',
  });
  const [shortUrl, setShortUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/business/${encodeURIComponent(slug)}/qr-style`);
        if (res.ok) {
          const data = await res.json();
          if (data.qr?.style_config) setStyleConfig(data.qr.style_config);
          if (data.shortUrl) setShortUrl(data.shortUrl);
          else if (data.qr?.short_code) setShortUrl(`/q/${data.qr.short_code}`);
        }
      } catch {
        /* */
      }
    })();
  }, [slug]);

  const copyShortLink = useCallback(async () => {
    if (!shortUrl) return;
    await navigator.clipboard.writeText(shortUrl);
    setSaveMsg('Enlace copiado');
    setTimeout(() => setSaveMsg(null), 2000);
  }, [shortUrl]);

  const saveStyle = useCallback(async () => {
    if (!isPro) return;
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
      setSaveMsg('Estilo guardado');
    } catch {
      setSaveMsg('Error de conexión');
    } finally {
      setSaving(false);
    }
  }, [slug, styleConfig, isPro, session?.access_token]);

  const tabs: { id: Tab; label: string; pro?: boolean }[] = [
    { id: 'download', label: 'Descargar' },
    { id: 'customize', label: 'Personalizar', pro: true },
    { id: 'templates', label: 'Plantillas', pro: true },
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
              {isPro ? 'Dinámico · Personalizable · Analítica Pro' : 'Dinámico · Listo para compartir'}
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
        <div className="flex flex-col items-center gap-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={previewKey + JSON.stringify(styleConfig.dotType)}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              <QrPreviewLazy
                slug={slug}
                businessName={businessName}
                tier={isPro ? 'pro' : 'free'}
                size={compact ? 160 : 220}
                refreshToken={refreshToken}
              />
            </motion.div>
          </AnimatePresence>
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
                  'flex-1 min-w-[70px] px-2 py-2 rounded-lg text-xs font-bold transition-all',
                  tab === t.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                  t.pro && !isPro && 'opacity-60'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'download' && (
            <QrDownloadMenu slug={slug} isPro={isPro} shortUrl={shortUrl} />
          )}

          {tab === 'customize' && (
            <div className="space-y-4 relative">
              {!isPro && (
                <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-white/60 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                  <IconSparkles size={24} className="text-amber-500 mb-2" />
                  <p className="text-sm font-bold text-slate-800">Personalización Pro</p>
                  <p className="text-xs text-slate-500 mt-1 mb-3">Gradientes, formas y tu logo</p>
                  <button
                    type="button"
                    onClick={onUpgrade}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-full"
                  >
                    Probar Pro — S/ {PRO_QR_MONTHLY_PRICE_PEN}/mes
                  </button>
                </div>
              )}
              <label className="block text-xs font-bold text-slate-600">
                Color módulos
                <input
                  type="color"
                  value={styleConfig.dotsColor || themeColor}
                  onChange={(e) => setStyleConfig({ ...styleConfig, dotsColor: e.target.value })}
                  className="mt-1 w-full h-10 rounded-lg cursor-pointer"
                  disabled={!isPro}
                />
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Fondo
                <input
                  type="color"
                  value={styleConfig.backgroundColor || '#ffffff'}
                  onChange={(e) => setStyleConfig({ ...styleConfig, backgroundColor: e.target.value })}
                  className="mt-1 w-full h-10 rounded-lg cursor-pointer"
                  disabled={!isPro}
                />
              </label>
              <label className="block text-xs font-bold text-slate-600">
                Forma de puntos
                <select
                  value={styleConfig.dotType || 'rounded'}
                  onChange={(e) =>
                    setStyleConfig({
                      ...styleConfig,
                      dotType: e.target.value as QrStyleConfig['dotType'],
                    })
                  }
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  disabled={!isPro}
                >
                  <option value="square">Cuadrado</option>
                  <option value="dots">Puntos</option>
                  <option value="rounded">Redondeado</option>
                  <option value="classy-rounded">Elegante</option>
                </select>
              </label>
              {isPro && (
                <button
                  type="button"
                  onClick={saveStyle}
                  disabled={saving}
                  className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl disabled:opacity-50"
                >
                  {saving ? 'Guardando…' : 'Guardar estilo'}
                </button>
              )}
            </div>
          )}

          {tab === 'templates' && (
            <div className="grid grid-cols-2 gap-2 relative">
              {!isPro && (
                <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-white/60 rounded-xl flex items-center justify-center p-4">
                  <button
                    type="button"
                    onClick={onUpgrade}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-full"
                  >
                    Desbloquear plantillas Pro
                  </button>
                </div>
              )}
              {QR_PRESETS.filter((p) => isPro || p.tier === 'free').map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setStyleConfig({ ...preset.config, presetId: preset.id });
                    if (isPro) void saveStyle();
                  }}
                  className="p-3 rounded-xl border border-slate-200 text-left hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                >
                  <p className="text-xs font-bold text-slate-800">{preset.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{preset.description}</p>
                </button>
              ))}
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
              QR Pro
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
