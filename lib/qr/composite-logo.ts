import QRCode from 'qrcode';
import sharp from 'sharp';
import { fetchLogoPngBuffer } from './logo-image';
import { QR_LOGO_COMPOSITE_RATIO } from './logo-constants';

/**
 * Superpone el logo respetando su forma, transparencia y contorno real.
 * Sin placa cuadrada blanca — solo los píxeles del logo tapan el QR.
 */
export async function compositeLogoOnQr(
  qrPng: Buffer,
  logoUrl: string,
  width: number
): Promise<Buffer> {
  const fetchSize = Math.round(width * QR_LOGO_COMPOSITE_RATIO * 1.2);
  const logoBuf = await fetchLogoPngBuffer(logoUrl, fetchSize);
  if (!logoBuf) {
    console.warn('[qr] compositeLogoOnQr: logo unavailable', logoUrl.slice(0, 120));
    return qrPng;
  }

  const maxLogo = Math.round(width * QR_LOGO_COMPOSITE_RATIO);

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
