'use client';

import { useEffect, useRef, useState } from 'react';
import type { BusinessProfile } from '@/types/business';
import { drawCatalogCover } from '@/lib/pdf/cover-page';

const PDFJS_VERSION = '3.11.174';

type PdfJsLib = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (src: { data: ArrayBuffer }) => { promise: Promise<PdfDocument> };
};

type PdfDocument = {
  getPage: (n: number) => Promise<{
    getViewport: (opts: { scale: number }) => { width: number; height: number };
    render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => {
      promise: Promise<void>;
    };
  }>;
};

async function loadPdfJs(): Promise<PdfJsLib> {
  const win = window as unknown as { pdfjsLib?: PdfJsLib };
  if (win.pdfjsLib) return win.pdfjsLib;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar pdf.js'));
    document.head.appendChild(script);
  });

  const lib = (window as unknown as { pdfjsLib?: PdfJsLib }).pdfjsLib;
  if (!lib) throw new Error('pdf.js no disponible');
  lib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;
  return lib;
}

export default function CoverPreview({
  profile,
  productCount,
  slug,
}: {
  profile: BusinessProfile;
  productCount: number;
  slug: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState('generando…');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { default: JsPDF } = await import('jspdf');
        const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        await drawCatalogCover(doc, { profile, productCount });
        const bytes = doc.output('arraybuffer');
        if (cancelled) return;

        setPdfUrl(URL.createObjectURL(doc.output('blob') as Blob));

        const lib = await loadPdfJs();
        const pdf = await lib.getDocument({ data: bytes }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.4 });
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) setStatus('ok');
      } catch (error) {
        console.error(error);
        if (!cancelled) setStatus(`error: ${(error as Error).message}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile, productCount]);

  return (
    <main style={{ padding: 24, background: '#e2e8f0', minHeight: '100vh', fontFamily: 'system-ui' }}>
      <p style={{ marginBottom: 12, fontSize: 13, color: '#334155' }}>
        <strong data-testid="preview-status">{status}</strong> · {slug} · {productCount} productos
        {pdfUrl ? (
          <>
            {' · '}
            <a href={pdfUrl} target="_blank" rel="noreferrer">
              abrir PDF
            </a>
          </>
        ) : null}
      </p>
      <canvas
        ref={canvasRef}
        style={{
          width: 640,
          maxWidth: '100%',
          display: 'block',
          background: '#fff',
          boxShadow: '0 10px 30px rgba(15,23,42,.18)',
        }}
      />
    </main>
  );
}
