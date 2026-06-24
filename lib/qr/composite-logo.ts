import QRCode from 'qrcode';
import sharp from 'sharp';
import { fetchLogoDataUrl } from './logo-image';

/**
 * Superpone el logo respetando su forma, transparencia y contorno real.
 * Sin placa cuadrada blanca — solo los píxeles del logo tapan el QR.
 */
export async function compositeLogoOnQr(
  qrPng: Buffer,
  logoUrl: string,
  width: number,
  logoRatio = 0.26
): Promise<Buffer> {
  const dataUrl = await fetchLogoDataUrl(logoUrl, Math.round(width * 0.5));
  if (!dataUrl) return qrPng;

  const logoBuf = Buffer.from(dataUrl.split(',')[1]!, 'base64');
  const maxLogo = Math.round(width * Math.min(0.38, Math.max(0.14, logoRatio)));

  const logo = await sharp(logoBuf)
    .resize(maxLogo, maxLogo, {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const meta = await sharp(logo).metadata();
  const lw = meta.width || maxLogo;
  const lh = meta.height || maxLogo;
  const left = Math.round((width - lw) / 2);
  const top = Math.round((width - lh) / 2);

  return sharp(qrPng)
    .composite([{ input: logo, left, top }])
    .png()
    .toBuffer();
}

export async function plainQrPng(
  data: string,
  width: number,
  dark: string,
  light: string
): Promise<Buffer> {
  return QRCode.toBuffer(data, {
    type: 'png',
    errorCorrectionLevel: 'H',
    margin: 2,
    width,
    color: { dark, light },
  });
}
