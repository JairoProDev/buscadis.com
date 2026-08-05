'use client';

/**
 * PDF del catálogo: portada tipo tarjeta de presentación + una página por
 * producto (imagen a ancho completo, estilo feed).
 * Se guarda en IndexedDB; solo se regenera si cambia el catálogo o la portada.
 */

import { useState, useCallback } from 'react';
import { BusinessProfile } from '@/types/business';
import { Adiso } from '@/types';
import {
  buildCatalogPdfFingerprint,
  idbGetCatalogPdf,
  idbSetCatalogPdf,
} from '@/lib/catalog-pdf';
import {
  BUSCADIS_BLUE,
  hexToRgb,
  imageAspectRatio,
  imageFormatFromDataUrl,
  loadImageDataUrl,
  type Rgb,
} from '@/lib/pdf/canvas-assets';
import { drawCatalogCover } from '@/lib/pdf/cover-page';
import { getBuscadisProfileUrl } from '@/lib/business/publicadis';

const MARGIN = 12;
const FOOTER_H = 10;

type CatalogRow = {
  id: string;
  updated_at?: string;
  images?: unknown;
};

export function useCatalogPDF() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const openCatalogPdf = useCallback(
    async (
      profile: Partial<BusinessProfile>,
      products: Adiso[],
      catalogRows?: CatalogRow[]
    ) => {
      if (!profile?.id || products.length === 0) return;

      setGenerating(true);
      setProgress(2);

      try {
        const fingerprint = buildCatalogPdfFingerprint(
          profile.id,
          profile.updated_at,
          catalogRows ?? products
        );

        const cached = await idbGetCatalogPdf(profile.id, fingerprint);
        if (cached) {
          setProgress(100);
          openPdfBlob(cached, profile);
          return;
        }

        setProgress(8);
        const blob = await buildInstagramFeedPdfBlob(profile, products, (p) => {
          setProgress(8 + Math.round(p * 85));
        });

        await idbSetCatalogPdf(profile.id, fingerprint, blob);
        setProgress(100);
        openPdfBlob(blob, profile);
      } catch (error) {
        console.error('[useCatalogPDF] Error:', error);
        throw error;
      } finally {
        setGenerating(false);
        setTimeout(() => setProgress(0), 2000);
      }
    },
    []
  );

  /** @deprecated usar openCatalogPdf */
  const generatePDF = openCatalogPdf;

  return { openCatalogPdf, generatePDF, generating, progress };
}

function openPdfBlob(blob: Blob, profile: Partial<BusinessProfile>) {
  const url = URL.createObjectURL(blob);
  const slug = (profile.slug || profile.name || 'catalogo').toLowerCase().replace(/\s+/g, '-');
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalogo-${slug}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

async function buildInstagramFeedPdfBlob(
  profile: Partial<BusinessProfile>,
  products: Adiso[],
  onProgress: (ratio: number) => void
): Promise<Blob> {
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const contentW = pageW - MARGIN * 2;
  const brandRgb = hexToRgb(profile.theme_color, BUSCADIS_BLUE);

  await drawCatalogCover(doc, { profile, productCount: products.length });

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    doc.addPage();
    await drawProductPage(doc, product, profile, pageW, pageH, contentW, MARGIN, brandRgb, i + 1, products.length);
    onProgress((i + 1) / products.length);
  }

  return doc.output('blob') as Blob;
}

async function drawProductPage(
  doc: any,
  product: Adiso,
  profile: Partial<BusinessProfile>,
  pageW: number,
  pageH: number,
  contentW: number,
  margin: number,
  brandRgb: Rgb,
  index: number,
  total: number
) {
  const imgUrl = product.imagenesUrls?.[0] || product.imagenUrl;
  let y = 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(profile.name || 'Catálogo', margin, 10);
  doc.text(`${index} / ${total}`, pageW - margin, 10, { align: 'right' });

  const textBlockMm = measureTextBlockMm(doc, product, contentW);
  const maxImgH = pageH - MARGIN - FOOTER_H - textBlockMm - y - 4;

  if (imgUrl) {
    const imgData = await loadImageDataUrl(imgUrl);
    if (imgData) {
      const naturalH = contentW / (await imageAspectRatio(imgData));
      const drawH = naturalH > Math.max(40, maxImgH) ? maxImgH : naturalH;

      doc.addImage(imgData, imageFormatFromDataUrl(imgData), margin, y, contentW, drawH, undefined, 'FAST');
      y = y + drawH + 5;
    } else {
      drawNoImage(doc, margin, y, contentW, 30);
      y += 35;
    }
  } else {
    drawNoImage(doc, margin, y, contentW, 30);
    y += 35;
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(product.titulo || 'Producto', contentW).slice(0, 3);
  for (const line of titleLines) {
    doc.text(line, margin, y);
    y += 5.5;
  }

  if (product.descripcion) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const desc = (product.descripcion || '').replace('Precio:', '').trim().substring(0, 280);
    const descLines = doc.splitTextToSize(desc, contentW).slice(0, 5);
    y += 2;
    for (const line of descLines) {
      doc.text(line, margin, y);
      y += 4;
    }
  }

  if (product.precio) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(brandRgb.r, brandRgb.g, brandRgb.b);
    doc.text(`S/ ${product.precio}`, margin, pageH - FOOTER_H - 4);
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageH - FOOTER_H, pageW - margin, pageH - FOOTER_H);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('Precios sujetos a cambios sin previo aviso', margin, pageH - 5);

  const profileUrl = getBuscadisProfileUrl(profile);
  if (profileUrl) {
    doc.text(profileUrl.replace(/^https?:\/\//, ''), pageW - margin, pageH - 5, { align: 'right' });
  }
}

function measureTextBlockMm(doc: any, product: Adiso, contentW: number): number {
  let h = 5.5 * Math.min(3, doc.splitTextToSize(product.titulo || 'Producto', contentW).length) + 4;
  if (product.descripcion) {
    const desc = (product.descripcion || '').substring(0, 280);
    h += 2 + 4 * Math.min(5, doc.splitTextToSize(desc, contentW).length);
  }
  if (product.precio) h += 10;
  return h;
}

function drawNoImage(doc: any, x: number, y: number, w: number, h: number) {
  doc.setFillColor(241, 245, 249);
  doc.rect(x, y, w, h, 'F');
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(8);
  doc.text('Sin imagen', x + w / 2, y + h / 2, { align: 'center' });
}
