import type { QrRenderMode, QrStyleConfig } from './types';
import { buildQrStudioDefaults } from './default-style';

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
    name: 'Básico',
    description: 'QR estándar — máxima compatibilidad al escanear',
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
    name: 'Con logo',
    description: 'Tu logo en el centro con el color de tu marca',
    tier: 'free',
    config: {
      renderMode: 'branded',
      dotType: 'rounded',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'dot',
      hideBackgroundDots: true,
      imageSize: 0.5,
      buscadisFinderMark: true,
    },
  },
  {
    id: 'visual-fusion',
    name: 'Logo integrado',
    description: 'Tu logo forma parte del código — ideal para empaque',
    tier: 'free',
    config: {
      renderMode: 'visual',
      halftoneIntensity: 0.8,
      dotScale: 0.38,
      imageSize: 0.5,
      hideBackgroundDots: true,
      buscadisFinderMark: true,
    },
  },
  {
    id: 'packaging-pro',
    name: 'Packaging Pro',
    description: 'Puntos finos y logo equilibrado — ideal para etiquetas de producto',
    tier: 'pro',
    config: {
      renderMode: 'branded',
      dotType: 'dots',
      cornerSquareType: 'extra-rounded',
      cornerDotType: 'dot',
      hideBackgroundDots: true,
      imageSize: 0.22,
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
      imageSize: 0.5,
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
      imageSize: 0.5,
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
  return buildQrStudioDefaults(themeColor);
}
