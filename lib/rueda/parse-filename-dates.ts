const MONTH: Record<string, number> = {
  ene: 1,
  jan: 1,
  feb: 2,
  mar: 3,
  abr: 4,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dic: 12,
  dec: 12,
};

function inferYear(edicion: string): number {
  const n = parseInt(edicion.replace(/^R/i, ''), 10);
  if (n >= 2760) return 2026;
  if (n >= 2650) return 2025;
  if (n >= 2580) return 2024;
  return 2026;
}

function parseMonthDay(token: string): { month: number; day: number } | null {
  const m = token.match(/^([A-Za-z]{3,9})(\d{1,2})$/i);
  if (!m) return null;
  const month = MONTH[m[1].slice(0, 3).toLowerCase()];
  if (!month) return null;
  return { month, day: parseInt(m[2], 10) };
}

function toIso(y: number, month: number, day: number): string {
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Parsea `R2765-Oct1-4.pdf` o `R2747-Jul27-Ago2.pdf` → fechas ISO. */
export function parseEditionDatesFromArchivo(
  archivo: string,
  edicion: string,
): { fecha_inicio: string; fecha_fin: string } | null {
  const base = archivo.replace(/\.pdf$/i, '');
  const rest = base.replace(/^R\d{3,4}-/i, '');
  if (!rest || rest === base) return null;

  const year = inferYear(edicion);
  const parts = rest.split('-').filter(Boolean);

  if (parts.length === 1) {
    const a = parseMonthDay(parts[0]);
    if (!a) return null;
    const d = toIso(year, a.month, a.day);
    return { fecha_inicio: d, fecha_fin: d };
  }

  if (parts.length === 2) {
    const a = parseMonthDay(parts[0]);
    const b = parseMonthDay(parts[1]);
    if (a && b && parts[1].match(/^[A-Za-z]+\d+$/)) {
      let y2 = year;
      if (b.month < a.month) y2 = year + 1;
      return {
        fecha_inicio: toIso(year, a.month, a.day),
        fecha_fin: toIso(y2, b.month, b.day),
      };
    }
    // Oct1-4
    const head = parts[0].match(/^([A-Za-z]{3,9})(\d{1,2})$/i);
    const endDay = parseInt(parts[1], 10);
    if (head) {
      const month = MONTH[head[1].slice(0, 3).toLowerCase()];
      const d1 = parseInt(head[2], 10);
      if (month && d1 && endDay) {
        return {
          fecha_inicio: toIso(year, month, d1),
          fecha_fin: toIso(year, month, endDay),
        };
      }
    }
  }

  return null;
}
