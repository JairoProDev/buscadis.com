import type { AvisoEmpleo } from './aviso-data';
import { formatPhone } from './aviso-data';

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderAvisoPng(
  aviso: AvisoEmpleo,
  fonts: { display: string; body: string },
  format: 'feed' | 'estado' = 'feed',
): Promise<Blob> {
  const W = 1080;
  const H = format === 'estado' ? 1920 : 1350;
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar la imagen');

  const ink = '#14343F';
  const paper = '#F7F9FA';
  const ticket = '#E7EEF1';
  const muted = '#3E5560';
  const gold = '#8A5A12';

  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, W, 168);
  ctx.fillStyle = '#E2B657';
  ctx.fillRect(0, 168, W, 8);

  ctx.fillStyle = '#F4E7C3';
  ctx.font = `600 28px ${fonts.body}`;
  ctx.fillText(aviso.rubro.toUpperCase(), 72, 78);
  ctx.font = `700 42px ${fonts.display}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(aviso.negocio, 72, 132);

  let y = 250;
  ctx.fillStyle = gold;
  ctx.font = `600 28px ${fonts.body}`;
  ctx.fillText(aviso.cubierta ? 'VACANTE CUBIERTA' : 'SE BUSCA', 72, y);

  y += 86;
  ctx.fillStyle = ink;
  ctx.font = `800 92px ${fonts.display}`;
  const titleLines = wrap(ctx, aviso.puesto, 936);
  for (const line of titleLines.slice(0, 2)) {
    ctx.fillText(line, 72, y);
    y += 96;
  }

  y += 8;
  ctx.fillStyle = muted;
  ctx.font = `600 32px ${fonts.body}`;
  ctx.fillText(aviso.zona, 72, y);
  y += 56;

  for (const turno of aviso.turnos.slice(0, 2)) {
    ctx.fillStyle = ticket;
    roundRect(ctx, 56, y, 968, 168, 28);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.font = `700 30px ${fonts.body}`;
    ctx.fillText(turno.nombre, 96, y + 52);
    ctx.font = `800 64px ${fonts.display}`;
    ctx.fillText(`S/ ${turno.pago}`, 96, y + 124);
    ctx.fillStyle = muted;
    ctx.font = `600 26px ${fonts.body}`;
    ctx.fillText(turno.horario, 520, y + 78);
    ctx.fillText(turno.complemento, 520, y + 118);
    y += 192;
  }

  y += 12;
  ctx.fillStyle = ink;
  ctx.font = `600 30px ${fonts.body}`;
  for (const item of aviso.condiciones.slice(0, 3)) {
    ctx.fillText(`·  ${item}`, 72, y);
    y += 46;
  }

  ctx.fillStyle = ink;
  ctx.fillRect(0, H - 120, W, 120);
  ctx.fillStyle = '#F4E7C3';
  ctx.font = `600 28px ${fonts.body}`;
  const phone = formatPhone(aviso.whatsapp);
  ctx.fillText(aviso.cubierta ? 'Este aviso ya no recibe postulaciones' : `WhatsApp  ${phone}`, 72, H - 68);
  ctx.font = `500 22px ${fonts.body}`;
  ctx.fillStyle = '#C9D5DA';
  ctx.fillText('buscadis.com', 860, H - 68);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('No se pudo crear el archivo');
  return blob;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
