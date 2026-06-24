import type { QrRenderMode, QrStyleConfig } from './types';

export interface QrPreset {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'pro';
  config: QrStyleConfig;
}

export const QR_PRESETS: QrPreset[] = [
  {
    id: 'buscadis-classic',
    name: 'Clásico',
    description: 'QR estándar negro sobre blanco — máxima compatibilidad',
    tier: 'free',
    config: {
      renderMode: 'classic',
      dotsColor: '#1e293b',
      backgroundColor: '#ffffff',
      dotType: 'square',
      cornerSquareType: 'square',
      cornerDotType: 'square',
      buscadisFinderMark: true,
    },
  },
  {
    id: 'brand-theme',
    name: 'Marca',
    description: 'Logo en el centro + color de tu negocio',
    tier: 'free',
    config: {
      renderMode: 'branded',
      dotType: 'rounded',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'dot',
      hideBackgroundDots: true,
      imageSize: 0.28,
      buscadisFinderMark: true,
    },
  },
  {
    id: 'visual-fusion',
    name: 'Visual',
    description: 'Logo fusionado con el código — ideal para packaging',
    tier: 'free',
    config: {
      renderMode: 'visual',
      halftoneIntensity: 0.75,
      dotScale: 0.35,
      hideBackgroundDots: true,
      buscadisFinderMark: true,
    },
  },
  {
    id: 'packaging-pro',
    name: 'Packaging Pro',
    description: 'Visual de alta resolución para impresión profesional',
    tier: 'pro',
    config: {
      renderMode: 'visual',
      halftoneIntensity: 0.85,
      dotScale: 0.32,
      dotType: 'dots',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'dot',
      buscadisFinderMark: true,
    },
  },
  {
    id: 'instagram-soft',
    name: 'Suave',
    description: 'Puntos redondeados estilo Instagram',
    tier: 'pro',
    config: {
      renderMode: 'branded',
      dotsColor: '#0f172a',
      backgroundColor: '#ffffff',
      dotType: 'rounded',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'dot',
      hideBackgroundDots: true,
      imageSize: 0.35,
      buscadisFinderMark: true,
    },
  },
  {
    id: 'neon-gradient',
    name: 'Neón',
    description: 'Gradiente vibrante para redes sociales',
    tier: 'pro',
    config: {
      renderMode: 'branded',
      backgroundColor: '#0f172a',
      dotType: 'classy-rounded',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'dot',
      gradient: {
        type: 'linear',
        rotation: 45,
        colorStops: [
          { offset: 0, color: '#3b82f6' },
          { offset: 1, color: '#ec4899' },
        ],
      },
      hideBackgroundDots: true,
      imageSize: 0.35,
      buscadisFinderMark: true,
    },
  },
  {
    id: 'minimal-dots',
    name: 'Minimal',
    description: 'Puntos circulares sobre fondo claro',
    tier: 'pro',
    config: {
      renderMode: 'branded',
      dotsColor: '#334155',
      backgroundColor: '#f8fafc',
      dotType: 'dots',
      cornerSquareType: 'dot',
      cornerDotType: 'dot',
      hideBackgroundDots: true,
      imageSize: 0.3,
      buscadisFinderMark: true,
    },
  },
  {
    id: 'executive',
    name: 'Ejecutivo',
    description: 'Elegante para tarjetas y recepción',
    tier: 'pro',
    config: {
      renderMode: 'branded',
      dotsColor: '#1e3a5f',
      backgroundColor: '#ffffff',
      dotType: 'classy',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'square',
      hideBackgroundDots: true,
      imageSize: 0.32,
      buscadisFinderMark: true,
    },
  },
];

export function getPresetById(id: string): QrPreset | undefined {
  return QR_PRESETS.find((p) => p.id === id);
}

export function resolveRenderMode(config: QrStyleConfig, fallback: QrRenderMode = 'branded'): QrRenderMode {
  return config.renderMode || fallback;
}

export function buildFreeStyleConfig(themeColor?: string): QrStyleConfig {
  return {
    renderMode: 'branded',
    dotsColor: themeColor && /^#[0-9a-fA-F]{6}$/.test(themeColor) ? themeColor : '#1e293b',
    backgroundColor: '#ffffff',
    dotType: 'rounded',
    cornerSquareType: 'extra-rounded',
    cornerDotType: 'dot',
    hideBackgroundDots: true,
    imageSize: 0.28,
    halftoneIntensity: 0.75,
    dotScale: 0.35,
    buscadisFinderMark: true,
    quietZoneModules: 4,
    presetId: 'brand-theme',
  };
}
