import QRCode from 'qrcode';

export interface QrMatrix {
  size: number;
  get: (row: number, col: number) => boolean;
  version: number;
}

export function createQrMatrix(data: string): QrMatrix {
  const qr = QRCode.create(data, { errorCorrectionLevel: 'H' });
  const modules = qr.modules;
  return {
    size: modules.size,
    get: (row, col) => Boolean(modules.get(row, col)),
    version: qr.version,
  };
}

/** Finder + timing + format — never halftone these cells. */
export function isProtectedModule(matrix: QrMatrix, row: number, col: number): boolean {
  const { size } = matrix;
  if (row < 0 || col < 0 || row >= size || col >= size) return true;

  if (isInFinderZone(row, col, size)) return true;
  if (row === 6 || col === 6) return true;

  return isAlignmentZone(matrix.version, row, col, size);
}

function isInFinderZone(row: number, col: number, size: number): boolean {
  if (row <= 8 && col <= 8) return true;
  if (row <= 8 && col >= size - 9) return true;
  if (row >= size - 9 && col <= 8) return true;
  return false;
}

/** Alignment pattern centers by QR version (ISO 18004). */
const ALIGNMENT_CENTERS: Record<number, number[]> = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

function isAlignmentZone(version: number, row: number, col: number, size: number): boolean {
  const centers = ALIGNMENT_CENTERS[version] || [];
  if (centers.length === 0) return false;

  for (const cy of centers) {
    for (const cx of centers) {
      if (cx === 6 && cy === 6) continue;
      if (isInFinderZone(cy, cx, size)) continue;
      if (Math.abs(row - cy) <= 2 && Math.abs(col - cx) <= 2) return true;
    }
  }
  return false;
}

export function getQuietZoneModules(configured?: number): number {
  return Math.max(4, configured ?? 4);
}
