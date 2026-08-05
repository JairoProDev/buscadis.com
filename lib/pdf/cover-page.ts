/**
 * Portada del catálogo PDF: tarjeta de presentación digital del negocio.
 *
 * Es la página que el cliente comparte, así que carga la identidad completa
 * (banner, logo, slogan, contactos, redes con usuario y QR al perfil) y cierra
 * con la firma de Buscadis para que quien reciba el PDF sepa de dónde viene.
 */

import type { jsPDF } from 'jspdf';
import type { BusinessProfile } from '@/types/business';
import {
  BUSCADIS_BLUE,
  BUSCADIS_YELLOW,
  INK,
  SLATE_200,
  SLATE_400,
  SLATE_500,
  WHITE,
  brandOnWhite,
  flattenImage,
  hexToRgb,
  loadImageDataUrl,
  mix,
  rasterizeIcon,
  readableInk,
  renderCoverBanner,
  renderLogoTile,
  tint,
  type Rgb,
} from '@/lib/pdf/canvas-assets';
import {
  buildContactRows,
  buildSocialPills,
  formatPhone,
  resolveProfileQr,
} from '@/lib/pdf/business-identity';
import { getBuscadisProfileUrl } from '@/lib/business/publicadis';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;

const BANNER_H = 96;
const ACCENT_BAR_H = 2.6;

const LOGO_X = MARGIN;
const LOGO_Y = 72;
const LOGO_SIZE = 44;

const HEADER_Y = 128;
const INFO_Y_MIN = 172;
const INFO_Y_MAX = 184;

const CONTACT_COL_W = 100;
const CONTACT_ROW_PITCH_MIN = 9.4;
const CONTACT_ROW_PITCH_MAX = 12.4;
const MAX_CONTACT_ROWS = 5;

const QR_CARD_X = 130;
const QR_CARD_W = 64;
const QR_CARD_H = 60;
const QR_SIZE = 40;

const CTA_Y = 248;
const CTA_H = 21;
const CTA_PILL_H = 8.6;
const MAX_SOCIAL_PILLS = 3;

const BAND_Y = 273;
const BAND_H = PAGE_H - BAND_Y;

type CoverArgs = {
  profile: Partial<BusinessProfile>;
  productCount: number;
};

export async function drawCatalogCover(doc: jsPDF, { profile, productCount }: CoverArgs) {
  const brand = hexToRgb(profile.theme_color, BUSCADIS_BLUE);
  const brandInk = brandOnWhite(brand);
  const accent = hexToRgb(profile.theme_accent_color, BUSCADIS_YELLOW);

  const [bannerSource, logoSource, buscadisSource] = await Promise.all([
    profile.banner_url ? loadImageDataUrl(profile.banner_url) : Promise.resolve(null),
    profile.logo_url ? loadImageDataUrl(profile.logo_url) : Promise.resolve(null),
    loadImageDataUrl('/logo.png'),
  ]);

  const [banner, logoTile, buscadisMark, qr] = await Promise.all([
    renderCoverBanner(bannerSource, { brand }),
    renderLogoTile(logoSource, 520),
    flattenImage(buscadisSource, 240, INK),
    resolveProfileQr(profile),
  ]);

  doc.addImage(banner, 'JPEG', 0, 0, PAGE_W, BANNER_H, 'cover-banner', 'FAST');

  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.rect(0, BANNER_H - ACCENT_BAR_H, PAGE_W, ACCENT_BAR_H, 'F');

  drawBannerBadges(doc, { accent, productCount });
  await drawLogoCard(doc, { profile, logoTile, brand, brandInk });

  const headerEnd = drawHeaderBlock(doc, { profile, brandInk });
  const infoY = Math.min(INFO_Y_MAX, Math.max(INFO_Y_MIN, headerEnd + 12));

  doc.setDrawColor(SLATE_200.r, SLATE_200.g, SLATE_200.b);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, infoY - 12, PAGE_W - MARGIN, infoY - 12);

  eyebrow(doc, 'CONTACTO DIRECTO', MARGIN, infoY - 4);
  await drawContactRows(doc, { profile, brand, brandInk, y: infoY });

  eyebrow(doc, 'ESCANEA Y EXPLORA', QR_CARD_X, infoY - 4);
  await drawQrCard(doc, { profile, qr, brandInk, y: infoY });

  await drawOrderStrip(doc, { profile, brand, brandInk });
  drawBuscadisBand(doc, buscadisMark);
}

/** Ancho real del texto: getTextWidth ignora el tracking aplicado con setCharSpace. */
function trackedWidth(doc: jsPDF, text: string, charSpace: number): number {
  return doc.getTextWidth(text) + charSpace * Math.max(0, text.length - 1);
}

function displayUrl(url: string | null | undefined): string {
  return (url || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}

function drawBannerBadges(
  doc: jsPDF,
  { accent, productCount }: { accent: Rgb; productCount: number }
) {
  const accentInk = readableInk(accent);
  const tracking = 0.5;
  const padX = 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.6);
  doc.setCharSpace(tracking);

  const label = 'CATÁLOGO DIGITAL';
  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.roundedRect(MARGIN, 14, trackedWidth(doc, label, tracking) + padX * 2, 8.4, 4.2, 4.2, 'F');
  doc.setTextColor(accentInk.r, accentInk.g, accentInk.b);
  doc.text(label, MARGIN + padX, 19.6);

  const updated = new Date().toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const stat = `${productCount} ${productCount === 1 ? 'PRODUCTO' : 'PRODUCTOS'} · ${updated.toUpperCase()}`;
  const statW = trackedWidth(doc, stat, tracking);
  doc.setFillColor(INK.r, INK.g, INK.b);
  doc.roundedRect(PAGE_W - MARGIN - statW - padX * 2, 14, statW + padX * 2, 8.4, 4.2, 4.2, 'F');
  doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
  doc.text(stat, PAGE_W - MARGIN - padX - statW, 19.6);

  doc.setCharSpace(0);
}

async function drawLogoCard(
  doc: jsPDF,
  {
    profile,
    logoTile,
    brand,
    brandInk,
  }: {
    profile: Partial<BusinessProfile>;
    logoTile: string | null;
    brand: Rgb;
    brandInk: Rgb;
  }
) {
  doc.setFillColor(WHITE.r, WHITE.g, WHITE.b);
  doc.setDrawColor(SLATE_200.r, SLATE_200.g, SLATE_200.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(LOGO_X, LOGO_Y, LOGO_SIZE, LOGO_SIZE, 6, 6, 'FD');

  if (logoTile) {
    const inset = 3.5;
    doc.addImage(
      logoTile,
      'PNG',
      LOGO_X + inset,
      LOGO_Y + inset,
      LOGO_SIZE - inset * 2,
      LOGO_SIZE - inset * 2,
      'cover-logo',
      'FAST'
    );
  } else {
    const soft = tint(brand, 0.86);
    doc.setFillColor(soft.r, soft.g, soft.b);
    doc.roundedRect(LOGO_X + 3.5, LOGO_Y + 3.5, LOGO_SIZE - 7, LOGO_SIZE - 7, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(brandInk.r, brandInk.g, brandInk.b);
    doc.text(initials(profile.name), LOGO_X + LOGO_SIZE / 2, LOGO_Y + LOGO_SIZE / 2 + 4, {
      align: 'center',
    });
  }

  if (!profile.is_verified) return;

  const badgeR = 4.6;
  const cx = LOGO_X + LOGO_SIZE - 1.5;
  const cy = LOGO_Y + LOGO_SIZE - 1.5;
  doc.setFillColor(WHITE.r, WHITE.g, WHITE.b);
  doc.circle(cx, cy, badgeR + 1, 'F');
  doc.setFillColor(BUSCADIS_BLUE.r, BUSCADIS_BLUE.g, BUSCADIS_BLUE.b);
  doc.circle(cx, cy, badgeR, 'F');
  const check = await rasterizeIcon('check', WHITE, BUSCADIS_BLUE, 72, 0.58);
  if (check) {
    doc.addImage(check, 'PNG', cx - badgeR * 0.72, cy - badgeR * 0.72, badgeR * 1.44, badgeR * 1.44);
  }
}

function drawHeaderBlock(
  doc: jsPDF,
  { profile, brandInk }: { profile: Partial<BusinessProfile>; brandInk: Rgb }
): number {
  let y = HEADER_Y;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.setTextColor(INK.r, INK.g, INK.b);
  const nameLines = fitLines(doc, profile.name || 'Catálogo', CONTENT_W, 2);
  for (const line of nameLines) {
    doc.text(line, MARGIN, y);
    y += 8.6;
  }

  if (profile.slug) {
    doc.setFontSize(11);
    doc.setTextColor(brandInk.r, brandInk.g, brandInk.b);
    const handle = `@${profile.slug}`;
    doc.text(handle, MARGIN, y);

    const handleW = doc.getTextWidth(handle);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(SLATE_400.r, SLATE_400.g, SLATE_400.b);
    doc.text(displayUrl(getBuscadisProfileUrl(profile)), MARGIN + handleW + 14, y);
    y += 8;
  }

  if (profile.tagline?.trim()) {
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(12.5);
    doc.setTextColor(brandInk.r, brandInk.g, brandInk.b);
    const taglineLines = fitLines(doc, profile.tagline.trim(), CONTENT_W, nameLines.length > 1 ? 1 : 2);
    for (const line of taglineLines) {
      doc.text(line, MARGIN, y);
      y += 6.4;
    }
    y += 1.6;
  }

  if (profile.description?.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.6);
    doc.setTextColor(SLATE_500.r, SLATE_500.g, SLATE_500.b);
    const room = Math.max(1, Math.floor((INFO_Y_MIN - 13 - y) / 5));
    const descLines = fitLines(doc, profile.description.trim(), CONTENT_W, Math.min(3, room));
    for (const line of descLines) {
      doc.text(line, MARGIN, y);
      y += 5;
    }
  }

  return y;
}

async function drawContactRows(
  doc: jsPDF,
  {
    profile,
    brand,
    brandInk,
    y,
  }: { profile: Partial<BusinessProfile>; brand: Rgb; brandInk: Rgb; y: number }
) {
  const rows = buildContactRows(profile).slice(0, MAX_CONTACT_ROWS);
  if (rows.length === 0) return;

  const chip = 7.4;
  const chipBg = tint(brand, 0.88);
  // Reparte las filas en el alto disponible para que la columna izquierda
  // acompañe al alto de la tarjeta del QR aunque haya pocos contactos.
  const pitch = Math.min(
    CONTACT_ROW_PITCH_MAX,
    Math.max(CONTACT_ROW_PITCH_MIN, (QR_CARD_H - chip) / Math.max(1, rows.length - 1))
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const top = y + i * pitch;

    doc.setFillColor(chipBg.r, chipBg.g, chipBg.b);
    doc.roundedRect(MARGIN, top, chip, chip, 2.2, 2.2, 'F');
    const glyph = chip * 0.6;
    const icon = await rasterizeIcon(row.icon, brandInk, chipBg, 96, 0.98);
    if (icon) {
      doc.addImage(
        icon,
        'PNG',
        MARGIN + (chip - glyph) / 2,
        top + (chip - glyph) / 2,
        glyph,
        glyph,
        `chip-${row.icon}`,
        'FAST'
      );
    }

    const textX = MARGIN + chip + 4;
    const valueW = CONTACT_COL_W - (chip + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(SLATE_400.r, SLATE_400.g, SLATE_400.b);
    doc.setCharSpace(0.28);
    doc.text(row.label.toUpperCase(), textX, top + 2.6);
    doc.setCharSpace(0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.4);
    doc.setTextColor(INK.r, INK.g, INK.b);
    doc.text(truncate(doc, row.value, valueW), textX, top + 6.9);
  }
}

async function drawQrCard(
  doc: jsPDF,
  {
    profile,
    qr,
    brandInk,
    y,
  }: { profile: Partial<BusinessProfile>; qr: string | null; brandInk: Rgb; y: number }
) {
  doc.setFillColor(WHITE.r, WHITE.g, WHITE.b);
  doc.setDrawColor(SLATE_200.r, SLATE_200.g, SLATE_200.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(QR_CARD_X, y, QR_CARD_W, QR_CARD_H, 5, 5, 'FD');

  const centerX = QR_CARD_X + QR_CARD_W / 2;

  if (qr) {
    const flat = await flattenImage(qr, 720, WHITE);
    if (flat) {
      doc.addImage(flat, 'PNG', centerX - QR_SIZE / 2, y + 5, QR_SIZE, QR_SIZE, 'cover-qr', 'FAST');
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(SLATE_500.r, SLATE_500.g, SLATE_500.b);
  doc.text('Escanea para ver el catálogo', centerX, y + QR_SIZE + 11, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.4);
  doc.setTextColor(brandInk.r, brandInk.g, brandInk.b);
  const profileUrl = displayUrl(getBuscadisProfileUrl(profile)) || 'buscadis.com';
  doc.text(truncate(doc, profileUrl, QR_CARD_W - 8), centerX, y + QR_SIZE + 16, {
    align: 'center',
  });
}

/**
 * Franja de cierre anclada al pie: el canal de pedidos a la izquierda y las
 * redes con su usuario a la derecha. Al estar fija, la portada no queda con un
 * hueco raro cuando el negocio tiene poca información.
 */
async function drawOrderStrip(
  doc: jsPDF,
  {
    profile,
    brand,
    brandInk,
  }: { profile: Partial<BusinessProfile>; brand: Rgb; brandInk: Rgb }
) {
  const stripBg = tint(brand, 0.9);
  doc.setFillColor(stripBg.r, stripBg.g, stripBg.b);
  doc.roundedRect(MARGIN, CTA_Y, CONTENT_W, CTA_H, 5, 5, 'F');

  const orderChannel = formatPhone(profile.contact_whatsapp || profile.contact_phone);
  const textX = MARGIN + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setCharSpace(0.5);
  const eyebrowColor = mix(brandInk, WHITE, 0.42);
  doc.setTextColor(eyebrowColor.r, eyebrowColor.g, eyebrowColor.b);
  doc.text(orderChannel ? 'PEDIDOS POR WHATSAPP' : 'CATÁLOGO EN LÍNEA', textX, CTA_Y + 7.6);
  doc.setCharSpace(0);

  const iconSize = 5.4;
  const value = orderChannel || displayUrl(getBuscadisProfileUrl(profile));
  const icon = await rasterizeIcon(orderChannel ? 'whatsapp' : 'website', brandInk, stripBg, 96, 0.95);
  if (icon) doc.addImage(icon, 'PNG', textX, CTA_Y + 10.4, iconSize, iconSize, 'cta-icon', 'FAST');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.text(value, textX + iconSize + 3.4, CTA_Y + 15.2);

  const pills = buildSocialPills(profile, MAX_SOCIAL_PILLS);
  if (pills.length === 0) return;

  const pillIcon = 4.4;
  const gap = 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  const widths = pills.map((pill) => pillIcon + 6.4 + doc.getTextWidth(pill.handle) + 9);
  const total = widths.reduce((sum, w) => sum + w, 0) + gap * (pills.length - 1);

  let x = PAGE_W - MARGIN - 8 - total;
  const minX = textX + iconSize + 3.4 + doc.getTextWidth(value) + 8;
  if (x < minX) return;

  const top = CTA_Y + (CTA_H - CTA_PILL_H) / 2;
  for (let i = 0; i < pills.length; i++) {
    const pill = pills[i];
    doc.setFillColor(WHITE.r, WHITE.g, WHITE.b);
    doc.setDrawColor(pill.color.r, pill.color.g, pill.color.b);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, top, widths[i], CTA_PILL_H, CTA_PILL_H / 2, CTA_PILL_H / 2, 'FD');

    const glyph = await rasterizeIcon(pill.icon, pill.color, WHITE, 96, 0.95);
    if (glyph) {
      doc.addImage(
        glyph,
        'PNG',
        x + 4.5,
        top + (CTA_PILL_H - pillIcon) / 2,
        pillIcon,
        pillIcon,
        `social-${pill.icon}`,
        'FAST'
      );
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(INK.r, INK.g, INK.b);
    doc.text(pill.handle, x + 4.5 + pillIcon + 3.2, top + CTA_PILL_H / 2 + 1.35);

    x += widths[i] + gap;
  }
}

function drawBuscadisBand(doc: jsPDF, buscadisMark: string | null) {
  doc.setFillColor(INK.r, INK.g, INK.b);
  doc.rect(0, BAND_Y, PAGE_W, BAND_H, 'F');
  doc.setFillColor(BUSCADIS_BLUE.r, BUSCADIS_BLUE.g, BUSCADIS_BLUE.b);
  doc.rect(0, BAND_Y, PAGE_W, 1, 'F');

  const markSize = 12;
  const markY = BAND_Y + (BAND_H - markSize) / 2 + 0.5;
  if (buscadisMark) {
    doc.addImage(buscadisMark, 'PNG', MARGIN, markY, markSize, markSize, 'buscadis-mark', 'FAST');
  }

  const textX = MARGIN + markSize + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
  doc.text('Buscadis', textX, BAND_Y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(SLATE_400.r, SLATE_400.g, SLATE_400.b);
  doc.text('Catálogos, perfiles y anuncios de negocios reales', textX, BAND_Y + 17.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(BUSCADIS_YELLOW.r, BUSCADIS_YELLOW.g, BUSCADIS_YELLOW.b);
  doc.text('buscadis.com', PAGE_W - MARGIN, BAND_Y + 11, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(SLATE_400.r, SLATE_400.g, SLATE_400.b);
  doc.text('Crea gratis el catálogo de tu negocio', PAGE_W - MARGIN, BAND_Y + 16.4, {
    align: 'right',
  });
}

/** Etiqueta pequeña en mayúsculas con tracking, usada como título de sección. */
function eyebrow(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(SLATE_400.r, SLATE_400.g, SLATE_400.b);
  doc.setCharSpace(0.5);
  doc.text(text, x, y);
  doc.setCharSpace(0);
}

function initials(name: string | undefined): string {
  const words = (name || 'Catálogo').trim().split(/\s+/).slice(0, 2);
  return words.map((w) => w.charAt(0).toUpperCase()).join('');
}

function fitLines(doc: jsPDF, text: string, maxW: number, maxLines: number): string[] {
  const lines = doc.splitTextToSize(text, maxW) as string[];
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = truncate(doc, `${kept[maxLines - 1]} ${lines[maxLines]}`, maxW);
  return kept;
}

function truncate(doc: jsPDF, text: string, maxW: number): string {
  if (doc.getTextWidth(text) <= maxW) return text;
  let out = text;
  while (out.length > 1 && doc.getTextWidth(`${out}…`) > maxW) {
    out = out.slice(0, -1);
  }
  return `${out.trimEnd()}…`;
}
