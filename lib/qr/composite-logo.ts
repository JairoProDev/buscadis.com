import QRCode from 'qrcode';
import sharp from 'sharp';
import { fetchLogoDataUrl } from './logo-image';

/** Superpone logo del negocio sobre un PNG QR (fiable con SVG/raster). */
export async function compositeLogoOnQr(
  qrPng: Buffer,
  logoUrl: string,
  width: number
): Promise<Buffer> {
  const dataUrl = await fetchLogoDataUrl(logoUrl, Math.round(width * 0.4));
  if (!dataUrl) return qrPng;

  const logoBuf = Buffer.from(dataUrl.split(',')[1]!, 'base64');
  const logoSize = Math.round(width * 0.22);
  const pad = Math.round(logoSize * 0.12);
  const plateSize = logoSize + pad * 2;

  const plate = await sharp({
    create: {
      width: plateSize,
      height: plateSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const logo = await sharp(logoBuf)
    .resize(logoSize, logoSize, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  const left = Math.round((width - plateSize) / 2);
  const top = Math.round((width - plateSize) / 2);

  return sharp(qrPng)
    .composite([
      { input: plate, left, top },
      { input: logo, left: left + pad, top: top + pad },
    ])
    .png()
    .toBuffer();
}

/** QR plano EC-H listo para composición de logo. */
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
