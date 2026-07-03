export const IMAGE_ENHANCE_PRESETS = {
  remove_bg: {
    id: 'remove_bg',
    label: 'Quitar fondo',
    action: 'remove_bg' as const,
    prompt: 'Remove background, keep product/subject clean',
  },
  white_bg: {
    id: 'white_bg',
    label: 'Fondo blanco',
    action: 'remove_bg' as const,
    prompt: 'Remove background and place on pure white studio background',
  },
  enhance: {
    id: 'enhance',
    label: 'Mejorar foto',
    action: 'upscale' as const,
    prompt: 'Enhance image quality, improve lighting and sharpness for marketplace listing',
  },
  professional: {
    id: 'professional',
    label: 'Look profesional',
    action: 'upscale' as const,
    prompt: 'Make this product photo look professional for e-commerce: clean lighting, sharp details',
  },
} as const;

export const FLYER_PROMPT =
  'Create a professional marketplace flyer/ad poster with the product info visible. ' +
  'Include subtle "Buscadis" watermark, logo placement area, and QR code placeholder area at bottom. ' +
  'Modern clean design suitable for WhatsApp sharing.';

export type ImageEnhanceAction = 'remove_bg' | 'upscale' | 'analyze' | 'generate_flyer';
