/** Campos derivados del texto del aviso para CRM / Sheets. */

export function extractSueldoTexto(text: string): string {
  const m =
    text.match(/SUELDO\s*:?\s*(S\/\.?\s*[\d,.]+(?:\s*soles?)?[^.]{0,40})/i) ||
    text.match(/(S\/\.?\s*[\d,.]+)\s*(?:soles?|mensual)/i) ||
    text.match(/sueldo\s+(?:a\s+tratar|conversable|m[aá]s del promedio)/i);
  return m ? m[0].replace(/\s+/g, ' ').trim() : '';
}

export function extractHorarioTexto(text: string): string {
  const m = text.match(/HORARIO[S]?\s*:?\s*[^.]{10,120}/i);
  return m ? m[0].replace(/\s+/g, ' ').trim().slice(0, 120) : '';
}

const ROL_KNOWN =
  /\b(anfitriona|cocinero|mozo|mesero|steward|chofer|griferos?|niñera|vendedor|cajero|administrativo|recepcionista|guardia|operari[oa]s?|almacén|almacen|contador|asistente|técnico|tecnico|barista|barman|hostess|host|guía|guia)\b/i;

function truncWords(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  const slice = s.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > 14 ? slice.slice(0, lastSpace) : slice).trim() + '…';
}

function titleCaseRole(s: string): string {
  const w = s.trim().toLowerCase();
  return w.charAt(0).toUpperCase() + w.slice(1);
}

/** Gancho para WA: usa título + descripción (evita “Café Perla” cuando el aviso es otro bloque). */
export function resumenGanchoVacante(titulo: string, descripcion?: string, maxLen = 52): string {
  const full = `${titulo}\n${descripcion || ''}`.replace(/\s+/g, ' ').trim();
  const lower = full.toLowerCase();

  if (/trabajo\s+artesanal/i.test(lower)) {
    if (/atenci[oó]n\s+al\s+cliente/i.test(lower)) {
      return truncWords('trabajo artesanal y atención al cliente', maxLen);
    }
    return truncWords('personal para trabajo artesanal', maxLen);
  }

  const found: string[] = [];
  const labels: [RegExp, string][] = [
    [/\bbarman\b/i, 'barman'],
    [/\bcociner[oa]s?\b/i, 'cocinero'],
    [/\bmozos?\b|\bmozas?\b|\bmeser[oa]s?\b/i, 'mozos'],
    [/\bayudante\s+de\s+cocina\b/i, 'ayudante de cocina'],
    [/\brecepcionista\b/i, 'recepcionista'],
    [/\bcorredor(es)?\b/i, 'corredores'],
    [/\bpoller[oa]\b/i, 'pollero'],
    [/\bconductor(es)?\b/i, 'conductores'],
    [/\bniñera\b/i, 'niñera'],
    [/\badministrativ[oa]\b/i, 'asistente administrativo'],
    [/\bt[eé]cnic[oa]\b/i, 'personal técnico'],
  ];
  for (const [re, label] of labels) {
    if (re.test(full) && !found.includes(label)) found.push(label);
  }
  if (found.length >= 2) return truncWords(found.slice(0, 3).join(', '), maxLen);
  if (found.length === 1) return found[0];

  return limpiarTituloVacante(titulo, maxLen);
}

/** Título corto y legible para el primer mensaje (sin cortar a mitad de palabra en UI). */
export function limpiarTituloVacante(titulo: string, maxLen = 42): string {
  let t = titulo.replace(/\s+/g, ' ').trim();
  t = t.replace(/^PARA\s+[^:]+:\s*/i, '');
  t = t.replace(/interesadas?\s+enviar\s+cv[^•]*/gi, ' ').trim();

  const dashRole = t.match(/-\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ()/.\s]{2,32})/);
  if (dashRole) {
    const r = dashRole[1].split(/\s-\s*/)[0].replace(/\s+/g, ' ').trim();
    if (r.length >= 3) return truncWords(titleCaseRole(r), maxLen);
  }

  const known = t.match(ROL_KNOWN);
  if (known) return truncWords(titleCaseRole(known[1]), maxLen);

  const bulletRole = t.match(/[•·]\s*([A-ZÁÉÍÓÚÑ*][A-ZÁÉÍÓÚÑa-záéíóúñ()/.\s]{2,36})/);
  if (bulletRole) {
    const r = bulletRole[1].replace(/^\*+\s*/, '').split(/[•·]/)[0].trim();
    if (r.length >= 3 && !/^sin\s+experiencia/i.test(r)) {
      return truncWords(titleCaseRole(r), maxLen);
    }
  }

  const afterNeed = t.match(
    /(?:SE\s+(?:SOLICITA|REQUIERE|NECESITA)|BUSCAMOS)\s+(?:UNA?\s+)?(.+)/i,
  );
  if (afterNeed) {
    let rest = afterNeed[1]
      .replace(/^persona\s+/i, '')
      .replace(/\s+para\s+.+$/i, '')
      .replace(/\s+con\s+.+$/i, '')
      .trim();
    const capsLead = rest.match(/^([A-ZÁÉÍÓÚÑ][^\n•.]{2,40})/);
    if (capsLead) rest = capsLead[1].trim();
    if (/responsable|proactiva|honesta|buen trato|buen car[aá]cter/i.test(rest)) {
      return 'personal de confianza';
    }
    rest = rest.split(/\s[-–—]\s|\s•\s|,/)[0]?.trim() || rest;
    if (rest.length >= 4) return truncWords(titleCaseRole(rest), maxLen);
  }

  t = t.replace(/^(?:SE\s+(?:SOLICITA|REQUIERE|NECESITA)|BUSCAMOS|URGENTE)\s*:?\s*/i, '');
  t = t.replace(/^[-•·]+\s*/, '');
  const segment = t.split(/\s[-–—]\s|\s•\s|\.{1,2}\s/)[0]?.trim() || t;
  return truncWords(titleCaseRole(segment), maxLen);
}

function pickVariant(seed: string, n: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % n;
}

/**
 * Primer mensaje WA para anunciantes de empleo (Cusco).
 * Prioridad: gancho + vacante concreta; sin mencionar “Rueda” (suena raro en frío).
 */
export function mensajeWaEmpleoCusco(params: {
  titulo: string;
  descripcion?: string;
  edicion?: string;
  pagina?: number;
  sueldoTexto?: string;
  importKey?: string;
  telefono?: string;
  urlAviso?: string;
}): string {
  const rol = resumenGanchoVacante(params.titulo, params.descripcion);
  const sueldo = (params.sueldoTexto || extractSueldoTexto(`${params.titulo}\n${params.descripcion || ''}`))
    .replace(/\s+/g, ' ')
    .trim();
  const sueldoCorto = sueldo.length > 28 ? sueldo.slice(0, 25).trim() + '…' : sueldo;
  const seed = params.importKey || params.telefono || rol;

  const cierres = [
    '¿Sigue abierta? Si quieren más postulantes por internet, les cuento en 1 min.',
    '¿Les está costando cubrir el puesto? Hay forma de que más gente lo vea — ¿les explico rápido?',
    '¿Aún lo están buscando? Puedo comentarles cómo ampliar el alcance del aviso, si les sirve.',
  ];
  const cierre = cierres[pickVariant(seed, cierres.length)];

  const hooks: string[] = [];
  if (sueldoCorto) {
    hooks.push(`Vi su aviso de ${rol} (${sueldoCorto}).`);
  }
  hooks.push(`¿Siguen buscando ${rol}?`);
  hooks.push(`Buenas — pregunta corta sobre la vacante de ${rol}.`);
  hooks.push(`¿La vacante de ${rol} sigue activa?`);

  const hook = hooks[pickVariant(seed + 'h', hooks.length)];

  let msg = `${hook} ${cierre}`;
  if (params.urlAviso) {
    msg += ` Link: ${params.urlAviso}`;
  }

  // Una línea, sin muro de texto; evita cortes raros en Sheets (~320 chars visibles en muchas UIs).
  msg = msg.replace(/\s+/g, ' ').trim();
  if (msg.length > 340) {
    msg = msg.slice(0, 337).trimEnd() + '…';
  }
  return msg;
}
