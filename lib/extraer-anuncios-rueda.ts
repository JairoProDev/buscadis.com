/**
 * Extracción/separación de anuncios de Rueda de Negocios (texto de página).
 * Enfocado en: 1 anuncio = 1 contacto+oferta, títulos útiles, sin masthead.
 */
export type CalidadIssue =
  | 'sin_telefono'
  | 'muy_corto'
  | 'muy_largo'
  | 'multi_inicio' // varios "Vendo/Alquilo/…" en un solo bloque → posible fusión
  | 'muchos_telefonos'
  | 'ruido_masthead'
  | 'titulo_debil'
  | 'descripcion_con_telefono';

export interface AnuncioExtraido {
  textoRaw: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  telefonos: string[];
  issues: CalidadIssue[];
  score: number; // 0–100
}

/** Starters fuertes: sirven para CORTAR anuncios (evitar Casa/Local sueltos). */
const SPLIT_START =
  String.raw`¡?(?:Urgente!?|GRAN(?:DE)?(?:\s+OPORTUNIDAD(?:\s+DE\s+INVERSI[OÓ]N)?)?|REMATO|Remato|SE\s+REMATA|Vendo|VENDO|Se\s+vende|SE\s+VENDE|En\s+venta|Alquilo|ALQUILO|Se\s+alquila|SE\s+ALQUILA|Por\s+(?:motivo|viaje|emergencia|ocasi[oó]n)|Por\s+ocasi[oó]n|OCASI[OÓ]N(?:\s*[-–])?\s*(?:VENDO|Vendo|SE\s+VENDE)?|¡?GRAN\s+REMAT|A\s+solo\s+S|Anticresis|Traspaso\s+de|Busco\s+(?:local|terreno|casa|departamento|personal)|Necesito\s+(?:personal|operador|mozo|Operador)|AMPLIAMOS|AGENCIA\s+DE|¡?TRABAJO\s+INMEDIATO|DISTRIBUIDORA|SE\s+SOLICITA|SE\s+REQUIERE|REQUIERE(?:\s+PERSONAL)?|BUSCAMOS|CAFETER[IÍ]A|RESTAURANTE|HOTEL\s+\w+\s+SOLICITA|HOSTAL\s+\w+|MACHU\s+TRAVEL|¡URGENTE!\s+BUSCAMOS|VENDO\s+(?:TERRENO|CASA|LOTE|DEPARTAMENTO|LOCAL|LOTES)|SE\s+VENDE\s+TERRENO|EN\s+VENTA\s+(?:MODERNOS\s+)?DEPARTAMENT|INMOBILIARIA|INSTITUCI[OÓ]N|¡?OPORTUNIDAD\s+LABORAL|¡?ÚNETE)`;

/** Contar fusiones reales (no “casa” mid-frase). */
const FUSION_START =
  String.raw`(?:Vendo|VENDO|Se\s+vende|SE\s+VENDE|Alquilo|Se\s+alquila|En\s+venta|Remato|REMATO|Por\s+(?:motivo|viaje|ocasi[oó]n)|SE\s+SOLICITA|SE\s+REQUIERE|BUSCAMOS|AGENCIA\s+DE)`;

/** Normaliza teléfonos espaciados/guionados a 9 dígitos pegados para facilitar splits */
export function normalizarTelefonosEnTexto(texto: string): string {
  let t = texto;
  // 9XX XXX XXX o 9XX-XXX-XXX o 9XX XXXXXX
  t = t.replace(/\b(9\d{2})[\s.\-]+(\d{3})[\s.\-]+(\d{3})\b/g, '$1$2$3');
  // A veces: 9XXXXXXXX con espacios internos raros 98 4766 770
  t = t.replace(/\b(9\d)[\s.\-]+(\d{3})[\s.\-]+(\d{4})\b/g, '$1$2$3');
  return t;
}

export function filtrarMetadatos(texto: string): string {
  let t = texto;
  const linePatterns = [
    /^\d+\s*$/gm,
    /^Estamos trabajando.*$/gim,
    /^\d+\s*años uniendo.*$/gim,
    /^Revista:.*$/gim,
    /^RN Radio.*$/gim,
    /^LA RADIO$/gim,
    /^96\.1$/gm,
    /^FM$/gim,
    /^R$/gm,
    /^Cusco, del .*Edición Nº?\s*\d+.*$/gim,
    /^Precio\s+S\/\.?\s*$/gim,
    /^Precio\s+S\/\.?\s*\d+.*$/gim,
    /^Edición Regional.*$/gim,
    /^Www\..*$/gim,
    /^Oficina .*$/gim,
    /^RuedadeNegocios.*$/gim,
    /^Encuentranos en:.*$/gim,
    /^Buscanos como.*$/gim,
    /^Más cerca a ti.*$/gim,
    /^Año:\s*\d+.*$/gim,
    /^e\s*s\s*c\s*u\s*c\s*h\s*a\s*n\s*o\s*s.*$/gim,
  ];
  for (const p of linePatterns) t = t.replace(p, '');

  // Cabecera de edición embebida: "Cusco, 23, 24… Edición Nº 2746 Precio …"
  t = t.replace(
    /\bCusco,?\s+\d{1,2}(?:,\s*\d{1,2})*(?:\s+y\s+\d{1,2})?\s+de\s+\w+\s+del\s+\d{4}\s*[-–]?\s*Edici[oó]n\s+N[ºo°]?\s*\d+/gi,
    ''
  );
  t = t.replace(/\bCusco,?\s+del\s+\d{1,2}\s+al\s+\d{1,2}\s+de\s+\w+\s+del\s+\d{4}\s*[-–]?\s*Edici[oó]n\s+N[ºo°]?\s*\d+/gi, '');
  // Masthead pegado: "Precio ocasión Vendo…" / "Precio Vendo"
  t = t.replace(/\bPrecio\s+ocasi[oó]n\s+(?=Vendo|Alquilo|Se\s+)/gi, '');
  t = t.replace(/\bPrecio\s+(?=Vendo|Alquilo|Se\s+vende|ocasi[oó]n)/gi, '');

  return t.replace(/\n{3,}/g, '\n\n').trim();
}

export function detectarCategoria(texto: string): string {
  const t = texto.toLowerCase();
  // Empleos primero (requiere/CV pisan “vendo”)
  if (
    /trabajo|empleo|necesito personal|requiere|requeri|solicita|vacante|cocinero|mozo|ayudante|asistente|vendedor|chofer|conductor|curriculum|currículum|\bcv\b|sueldo|postul|housekeeping|briefing|recepcionista|operador para/.test(
      t
    )
  ) {
    return 'empleos';
  }
  if (
    /anticresis|habitaci[oó]n|departamento|alquilo|se alquila|en alquiler|terreno|casa ampl|vendo casa|vendo edificio|se vende terreno|en venta terreno|vendo terreno|vendo lote|local comercial|oficina en |inmueble|canch[oó]n|lote de |lote \d|airbnb|condominio|m²|m2|hect[aá]reas?|registros p[uú]blicos|rr\.?\s*pp/.test(
      t
    )
  ) {
    return 'inmuebles';
  }
  if (/auto |carro |camioneta|\bmoto\b|motocicleta|kilometraje|toyota|hyundai|nissan|blubier/.test(t)) {
    return 'vehiculos';
  }
  if (/traspaso|negocio en marcha|buscar socio|fondo de comercio/.test(t)) {
    return 'negocios';
  }
  if (/servicio de |reparaci[oó]n|limpieza|veterinario|clases de |gasfiter|electricista/.test(t)) {
    return 'servicios';
  }
  if (/fiesta|evento|show|concierto/.test(t)) {
    return 'eventos';
  }
  if (/vendo|venta|remato/.test(t) && !/departamento|casa |terreno|local |oficina|habitaci|alquilo/.test(t)) {
    return 'productos';
  }
  return 'productos';
}

function contarIniciosFusion(texto: string): number {
  const re = new RegExp(FUSION_START, 'gi');
  let n = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    n++;
    if (n > 8) break;
  }
  return n;
}

function empiezaConStarterFuerte(texto: string): boolean {
  return new RegExp(String.raw`^\s*${SPLIT_START}`, 'i').test(texto);
}

function extraerTelefonos9(texto: string): string[] {
  const set = new Set<string>();
  for (const m of texto.match(/\b9\d{8}\b/g) || []) set.add(m);
  return [...set];
}

/**
 * Parte el texto en anuncios con escaneo lineal (sin lookahead pesado).
 */
export function separarAnuncios(textoPagina: string): string[] {
  const limpio = filtrarMetadatos(normalizarTelefonosEnTexto(textoPagina));
  const one = limpio.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
  if (!one) return [];

  // Pase 1: cortar tras teléfono cuando sigue starter fuerte / extra
  const chunks = cortarTrasTelefonos(one);

  // Pase 2: desfusionar inicios fuertes dentro de cada chunk
  const refined: string[] = [];
  for (const chunk of chunks) {
    refined.push(...desfusionarPorInicios(chunk));
  }

  // Pase 3: partir enormes restantes
  const fragmented: string[] = [];
  for (const chunk of refined) {
    fragmented.push(...fragmentarBloqueEnorme(chunk));
  }

  return fragmented
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => {
      if (p.length < 50 || !/\b9\d{8}\b/.test(p)) return false;
      if (
        !empiezaConStarterFuerte(p) &&
        !/(vendo|alquilo|vende|requiere|solicita|buscamos|necesito|anticresis|traspaso|remata|inmobiliaria|oportunidad laboral|únete)/i.test(
          p.slice(0, 100)
        )
      ) {
        if (!/(vendo|alquilo|se vende|se alquila|m²|terreno|departamento|cv|whatsapp|sueldo)/i.test(p)) return false;
      }
      return true;
    });
}

/** Corta tras cada teléfono si lo que sigue parece un anuncio nuevo. */
function cortarTrasTelefonos(text: string): string[] {
  const phones = [...text.matchAll(/\b9\d{8}\b/g)];
  if (!phones.length) return text.length > 50 ? [text] : [];

  const cutAt: number[] = [];
  for (let i = 0; i < phones.length; i++) {
    let end = phones[i].index! + 9;
    let guard = 0;
    while (guard++ < 4) {
      const more = text.slice(end).match(/^\s*[-–,;/y]+\s*(9\d{8})\b/);
      if (!more) break;
      end += more[0].length;
    }
    while (end < text.length && /[\s.,;!]/.test(text[end])) end++;
    if (end >= text.length - 40) continue;
    if (empiezaNuevoAnuncio(text.slice(end)) || empiezaConStarterFuerte(text.slice(end))) {
      cutAt.push(end);
    }
  }

  if (!cutAt.length) return [text];

  const parts: string[] = [];
  let last = 0;
  for (const cut of cutAt) {
    const piece = text.slice(last, cut).trim();
    if (piece.length > 35) parts.push(piece);
    last = cut;
  }
  const tail = text.slice(last).trim();
  if (tail.length > 35) parts.push(tail);
  return parts.length ? parts : [text];
}

/** Marcadores extra (strings literales / regex simples, sin nested quantifiers). */
const EXTRA_MARKERS: RegExp[] = [
  /\bSE\s+REMATA\b/i,
  /\bVENTA\s+Y\/?O\s+ALQUILER\b/i,
  /\bINMOBILIARIA\b/i,
  /\bINSTITUCI[OÓ]N\s+EDUCATIVA\b/i,
  /¡?OPORTUNIDAD\s+LABORAL/i,
  /\bNecesito\s+(?:Operador|personal|mozo)/i,
  /\bEstamos\s+en\s+busca/i,
  /¡?ÚNETE\s+A\s+NUESTRO/i,
  /\bHOTEL\s+\w+\s+SOLICITA\b/i,
  /\bPrestigiosa\s+Cl[ií]nica\b/i,
  /\bImportante\s+empresa\b/i,
  /¡?TRABAJO\s+INMEDIATO/i,
  /\bGRAN\s+MINER[IÍ]A\b/i,
  /\bAGENCIA\s+DE\s+VIAJES\b/i,
  /\bRESTAURANTE\s+\w+\s+REQUER/i,
  /\b_TE\s+ESTAMOS\s+BUSCANDO/i,
];

function empiezaNuevoAnuncio(slice: string): boolean {
  const s = slice.trimStart();
  if (!s) return false;
  if (empiezaConStarterFuerte(s)) return true;
  return EXTRA_MARKERS.some((re) => {
    re.lastIndex = 0;
    const m = re.exec(s);
    return m !== null && m.index < 3;
  });
}

/**
 * Parte bloques largos sin regex de lookahead complejos (evita backtracking).
 * Recorre teléfonos; si tras el teléfono(s) empieza un nuevo anuncio, corta.
 */
export function fragmentarBloqueEnorme(chunk: string): string[] {
  const phones = [...chunk.matchAll(/\b9\d{8}\b/g)];
  if (chunk.length < 650 && phones.length < 3) return [chunk];

  const cutAfter: number[] = [];
  for (let i = 0; i < phones.length; i++) {
    let end = phones[i].index! + phones[i][0].length;
    // consumir teléfonos siguientes en lista: ", 994687060"
    let guard = 0;
    while (guard++ < 4) {
      const rest = chunk.slice(end);
      const more = rest.match(/^\s*[-–,;/y]+\s*(9\d{8})\b/);
      if (!more) break;
      end += more[0].length;
    }
    // saltar puntuación
    while (end < chunk.length && /[\s.,;!]/.test(chunk[end])) end++;
    if (end >= chunk.length - 40) continue;
    if (empiezaNuevoAnuncio(chunk.slice(end))) {
      cutAfter.push(end);
    }
  }

  if (!cutAfter.length) {
    return fragmentarPorMarcadoresExtra(chunk);
  }

  const parts: string[] = [];
  let last = 0;
  for (const cut of cutAfter) {
    // cut es el inicio del nuevo anuncio; el anterior termina justo antes
    const piece = chunk.slice(last, cut).trim();
    if (piece.length > 40) parts.push(piece);
    last = cut;
  }
  const tail = chunk.slice(last).trim();
  if (tail.length > 40) parts.push(tail);

  return parts.length > 1 ? parts.filter((p) => /\b9\d{8}\b/.test(p) && p.length >= 50) : fragmentarPorMarcadoresExtra(chunk);
}

function fragmentarPorMarcadoresExtra(chunk: string): string[] {
  const indices: number[] = [0];
  for (const re of EXTRA_MARKERS) {
    const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
    const g = new RegExp(re.source, flags);
    let m: RegExpExecArray | null;
    while ((m = g.exec(chunk)) !== null) {
      if (m.index > 40) indices.push(m.index);
    }
  }
  indices.sort((a, b) => a - b);
  const uniq = indices.filter((v, i, arr) => i === 0 || v - arr[i - 1] > 60);
  if (uniq.length <= 1) return [chunk];

  const pieces: string[] = [];
  for (let i = 0; i < uniq.length; i++) {
    const start = uniq[i];
    const end = i + 1 < uniq.length ? uniq[i + 1] : chunk.length;
    pieces.push(chunk.slice(start, end).trim());
  }

  const merged: string[] = [];
  let buf = '';
  for (const p of pieces) {
    if (!buf) {
      buf = p;
      continue;
    }
    if (/\b9\d{8}\b/.test(buf) && buf.length >= 50) {
      merged.push(buf);
      buf = p;
    } else {
      buf = `${buf} ${p}`.trim();
    }
  }
  if (buf) merged.push(buf);
  return merged.length ? merged.filter((p) => /\b9\d{8}\b/.test(p) && p.length >= 50) : [chunk];
}

/** Si un bloque tiene 2+ inicios FUERTES y hay teléfono entre ellos, corta. */
function desfusionarPorInicios(chunk: string): string[] {
  const inicios: number[] = [];
  const re = new RegExp(String.raw`(^|[\s.])(${SPLIT_START})`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(chunk)) !== null) {
    const idx = m.index + (m[1] ? m[1].length : 0);
    if (inicios.length === 0 || idx - inicios[inicios.length - 1] > 50) {
      inicios.push(idx);
    }
  }
  if (inicios.length <= 1) return [chunk];

  const parts: string[] = [];
  for (let i = 0; i < inicios.length; i++) {
    const start = inicios[i];
    const end = i + 1 < inicios.length ? inicios[i + 1] : chunk.length;
    parts.push(chunk.slice(start, end).trim());
  }

  const merged: string[] = [];
  let buf = '';
  for (const p of parts) {
    if (!buf) {
      buf = p;
      continue;
    }
    if (/\b9\d{8}\b/.test(buf)) {
      merged.push(buf);
      buf = p;
    } else {
      buf = `${buf} ${p}`.trim();
    }
  }
  if (buf) merged.push(buf);

  return merged.length ? merged : [chunk];
}

export function tituloYDesc(texto: string): { titulo: string; descripcion: string } {
  // Limpiar prefijos débiles / masthead
  let t = texto
    .replace(/^Precio\s+/i, '')
    .replace(/^Edici[oó]n\s+N[ºo°]?\s*\d+\s*/i, '')
    .trim();

  const WEAK_LEFT = /^(?:por\s+)?ocasi[oó]n$|^requiere$|^se\s+requiere$|^se\s+solicita$|^urgente!?$|^buscamos$|^necesito$/i;

  // "TITULO: resto"
  const colon = t.match(/^(.{3,90}?):\s+(.+)$/s);
  if (colon && !/\d{9}/.test(colon[1]) && colon[1].length < 90) {
    const left = colon[1].trim();
    const right = colon[2].trim().replace(/^[\s•]+/g, '');
    if (WEAK_LEFT.test(left) || left.length < 14) {
      const words = right.split(/\s+/).slice(0, 10).join(' ');
      return {
        titulo: limpiarTitulo(`${left}: ${words}`).slice(0, 100),
        descripcion: right,
      };
    }
    return { titulo: limpiarTitulo(left), descripcion: right };
  }

  // Quitar "Por ocasión" suelto al inicio sin aportar
  t = t.replace(/^(?:por\s+)?ocasi[oó]n\s*[-–]?\s*/i, '').trim();

  // Preferir hasta m² / tipo de bien
  const corte = t.match(
    /^(.{15,95}?(?:\d[\d.,]*\s*(?:m²|m2)|hect[aá]reas?|terreno|casa|departamento|habitaci[oó]n|local|lote|oficina|condominio))(?=[,.\s])/i
  );
  if (corte && corte[1].split(/\s+/).length >= 4) {
    return { titulo: limpiarTitulo(corte[1]), descripcion: t };
  }

  const words = t.split(/\s+/);
  let n = Math.min(12, Math.max(6, words.length > 20 ? 9 : 7));
  return { titulo: limpiarTitulo(words.slice(0, n).join(' ')), descripcion: t };
}

function limpiarTitulo(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/[,:.\-–]+$/, '')
    .trim()
    .slice(0, 100);
}

export function evaluarCalidad(
  textoRaw: string,
  titulo: string,
  descripcion: string,
  telefonos: string[],
  categoria?: string
): { issues: CalidadIssue[]; score: number } {
  const issues: CalidadIssue[] = [];
  if (!telefonos.length) issues.push('sin_telefono');
  if (textoRaw.length < 60) issues.push('muy_corto');
  // Empleos multi-puesto suelen ser largos; umbral más alto
  const largoLimite = categoria === 'empleos' ? 1600 : 900;
  if (textoRaw.length > largoLimite) issues.push('muy_largo');
  if (contarIniciosFusion(textoRaw) >= 3) issues.push('multi_inicio');
  if (telefonos.length >= 5) issues.push('muchos_telefonos');
  if (/precio\s+ocasi|años uniendo|la radio|edici[oó]n\s+n/i.test(textoRaw)) issues.push('ruido_masthead');
  if (
    titulo.length < 15 ||
    /^(vendo|alquilo|se vende|por ocasi[oó]n|requiere)\s*$/i.test(titulo.trim())
  ) {
    issues.push('titulo_debil');
  }
  if (/\b9\d{8}\b/.test(descripcion)) issues.push('descripcion_con_telefono');

  let score = 100;
  const penal: Record<CalidadIssue, number> = {
    sin_telefono: 40,
    muy_corto: 25,
    muy_largo: 15,
    multi_inicio: 25,
    muchos_telefonos: 15,
    ruido_masthead: 20,
    titulo_debil: 10,
    descripcion_con_telefono: 5,
  };
  for (const i of issues) score -= penal[i];
  return { issues, score: Math.max(0, score) };
}

/** Gate UX: solo auto-publicar si score alto y sin fallas críticas */
export function esPublicable(a: AnuncioExtraido): boolean {
  if (a.score < 85) return false;
  if (a.issues.includes('sin_telefono')) return false;
  if (a.issues.includes('ruido_masthead')) return false;
  if (a.issues.includes('multi_inicio')) return false;
  if (a.issues.includes('muy_corto')) return false;
  return true;
}

export function estructurarAnuncios(textoPagina: string): AnuncioExtraido[] {
  const partes = separarAnuncios(textoPagina);
  return partes.map((textoRaw) => {
    const { titulo, descripcion } = tituloYDesc(textoRaw);
    const telefonos = extraerTelefonos9(textoRaw);
    // Quitar teléfonos de descripción (simple)
    let desc = descripcion;
    for (const tel of telefonos) {
      desc = desc.replace(new RegExp(tel, 'g'), '');
    }
    desc = desc
      .replace(/\b(?:Cel|Cels|Cel\.|Cels\.|Telf|Telf\.|Tel|Tel\.|WhatsApp|WA)\s*:?\s*[-–,/\s]*\.?/gi, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([.,])/g, '$1')
      .trim();

    const categoria = detectarCategoria(textoRaw);
    const { issues, score } = evaluarCalidad(textoRaw, titulo, desc, telefonos, categoria);
    return { textoRaw, titulo, descripcion: desc.slice(0, 2000), categoria, telefonos, issues, score };
  });
}
