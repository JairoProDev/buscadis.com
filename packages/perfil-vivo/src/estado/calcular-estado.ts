import type { DiaSemana, EstadoVivo, Horario } from '../types';

const DIAS: DiaSemana[] = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatHora12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  let h = Number(hStr);
  const m = mStr ?? '00';
  const suf = h >= 12 ? 'p. m.' : 'a. m.';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${suf}`;
}

function minutesNowInZone(now: Date, timeZone: string): { dia: DiaSemana; mins: number; ymd: string } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value])
  );
  const weekdayMap: Record<string, DiaSemana> = {
    Sun: 'dom',
    Mon: 'lun',
    Tue: 'mar',
    Wed: 'mie',
    Thu: 'jue',
    Fri: 'vie',
    Sat: 'sab',
  };
  const dia = weekdayMap[parts.weekday ?? 'Mon'] ?? 'lun';
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0;
  const mins = hour * 60 + Number(parts.minute);
  const ymd = `${parts.year}-${parts.month}-${parts.day}`;
  return { dia, mins, ymd };
}

function parseHm(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Calcula estado vivo desde horario. Nunca inventa actividad ni "personas viendo".
 */
export function calcularEstadoVivo(
  horario: Horario | undefined,
  now: Date = new Date(),
  extras?: { respuestaMedianaMin?: number; deliveryActivo?: boolean }
): EstadoVivo {
  if (!horario) {
    return {
      abierto: false,
      porCerrar: false,
      mensaje: 'Horario no publicado',
      respuestaMedianaMin: extras?.respuestaMedianaMin,
      deliveryActivo: extras?.deliveryActivo,
    };
  }

  const { dia, mins, ymd } = minutesNowInZone(now, horario.zona);
  const excepcion = horario.excepciones?.find((e) => e.fecha === ymd);
  const franjas = excepcion ? excepcion.franjas : horario.semana[dia] ?? [];

  if (!franjas.length) {
    return {
      abierto: false,
      porCerrar: false,
      mensaje: 'Cerrado hoy',
      respuestaMedianaMin: extras?.respuestaMedianaMin,
      deliveryActivo: extras?.deliveryActivo,
    };
  }

  for (const f of franjas) {
    const desde = parseHm(f.desde);
    const hasta = parseHm(f.hasta);
    if (mins >= desde && mins < hasta) {
      const porCerrar = hasta - mins < 60;
      return {
        abierto: true,
        cierraEn: f.hasta,
        porCerrar,
        mensaje: porCerrar
          ? `Abierto · cierra ${formatHora12(f.hasta)}`
          : `Abierto · cierra ${formatHora12(f.hasta)}`,
        respuestaMedianaMin: extras?.respuestaMedianaMin,
        deliveryActivo: extras?.deliveryActivo,
      };
    }
  }

  // Próxima apertura hoy o mañana
  const proximasHoy = franjas
    .map((f) => parseHm(f.desde))
    .filter((d) => d > mins)
    .sort((a, b) => a - b);
  if (proximasHoy.length) {
    const hm = franjas.find((f) => parseHm(f.desde) === proximasHoy[0])!.desde;
    return {
      abierto: false,
      abreEn: hm,
      porCerrar: false,
      mensaje: `Cerrado · abre hoy ${formatHora12(hm)}`,
      respuestaMedianaMin: extras?.respuestaMedianaMin,
      deliveryActivo: extras?.deliveryActivo,
    };
  }

  const nextDiaIdx = (DIAS.indexOf(dia) + 1) % 7;
  const nextDia = DIAS[nextDiaIdx];
  const nextFranjas = horario.semana[nextDia] ?? [];
  if (nextFranjas[0]) {
    return {
      abierto: false,
      abreEn: nextFranjas[0].desde,
      porCerrar: false,
      mensaje: `Cerrado · abre mañana ${formatHora12(nextFranjas[0].desde)}`,
      respuestaMedianaMin: extras?.respuestaMedianaMin,
      deliveryActivo: extras?.deliveryActivo,
    };
  }

  return {
    abierto: false,
    porCerrar: false,
    mensaje: 'Cerrado',
    respuestaMedianaMin: extras?.respuestaMedianaMin,
    deliveryActivo: extras?.deliveryActivo,
  };
}

export function formatPrecio(valor: number, moneda: 'PEN' | 'USD' = 'PEN'): string {
  const prefix = moneda === 'PEN' ? 'S/' : 'US$';
  const formatted = valor.toLocaleString('es-PE', {
    minimumFractionDigits: valor % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${prefix} ${formatted}`;
}

export { pad };
