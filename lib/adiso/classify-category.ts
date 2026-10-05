import type { Categoria } from '@/types';

const CATEGORIAS: Categoria[] = [
  'empleos',
  'inmuebles',
  'vehiculos',
  'servicios',
  'productos',
  'eventos',
  'negocios',
  'comunidad',
];

export type ClassifyConfidence = 'high' | 'medium' | 'low';

export interface ClassifyCategoryResult {
  categoria: Categoria;
  confidence: ClassifyConfidence;
  /** Puntuación del ganador vs segundo (mayor = más claro). */
  margin: number;
}

function scoreCategory(text: string, tituloLower: string): Record<Categoria, number> {
  const scores: Record<Categoria, number> = {
    empleos: 0,
    inmuebles: 0,
    vehiculos: 0,
    servicios: 0,
    productos: 0,
    eventos: 0,
    negocios: 0,
    comunidad: 0,
  };

  const bump = (cat: Categoria, n: number) => {
    scores[cat] += n;
  };

  // —— Título (máxima prioridad) ——
  if (
    /^(se alquila|alquilo|en alquiler|se vende|vendo|venta de|anticresis|anticr[eé]tico|traspaso local)/i.test(
      tituloLower,
    ) ||
    /^(local comercial|habitaci[oó]n|departamento|terreno|lote|casa |mini departamento|oficina )/i.test(
      tituloLower,
    )
  ) {
    bump('inmuebles', 12);
  }

  if (
    /^(se requiere|se solicita|se necesita|buscamos|necesitamos|vacante|oportunidad laboral|trabajo|personal para|únete|unete|empresa .+ (contratando|requiere|busca))/i.test(
      tituloLower,
    ) ||
    /\b(cv|curr[ií]culum)\b/i.test(tituloLower)
  ) {
    bump('empleos', 12);
  }

  if (/^(vendo|venta|remato|oferta|precio)\b/i.test(tituloLower) && !/departamento|casa |terreno|local /.test(tituloLower)) {
    bump('productos', 4);
  }

  // —— Empleos ——
  if (
    /oferta de trabajo|contratando|oferta laboral|postula|presentar cv|enviar cv|planilla|essalud|cts|gratificaci[oó]n|sueldo b[aá]sico|remuneraci[oó]n|jornada|turno|horario\d|propina|experiencia m[ií]nima|requisitos:|beneficios:|ampliamos (equipo|plantilla)|unete al equipo|únete al equipo|trabajo inmediato|full time|part time|medio tiempo|pr[aá]cticas? pagadas?|sueldo s\/|se paga s\/|pago quincenal|liquidaci[oó]n|boleta de pago|se busca \d|se busca señor|se busca j[oó]ven|se busca personal|por apertura:|necesito (un |una )?(vendedor|mec[aá]nico|carpintero|señorit|j[oó]ven)|se nesecita|solicita (varones|mujeres|personal)|empresa de .+ solicita|por campaña/.test(
      text,
    )
  ) {
    bump('empleos', 8);
    bump('comunidad', -4);
    bump('productos', -5);
  }
  if (
    /niñer|nan[ny]|requeri|necesitamos|se necesita|se requiere|vacante|curriculum|currículum|\bcv\b|personal para |mozos?|cociner|ayudante de |chofer |conductor |recepcionista|practicante|busca personal|solicita personal|housekeeping|maitre|barman|meser|meser[ao]|operador de|steward|hostess|anfitriona|asistente contable|contador\b|ingeniero\b|t[eé]cnico en|supervisor de ventas/.test(
      text,
    )
  ) {
    bump('empleos', 4);
  }

  // —— Inmuebles ——
  if (
    /\bdepartamentos?\b|\bambientes?\b|anticresis|habitaci[oó]n|alquilo|se alquila|en alquiler|terreno|casa ampl|vendo casa|vendo edificio|se vende terreno|en venta terreno|vendo terreno|vendo lote|local comercial|oficina en |inmueble|canch[oó]n|lote de |lotes de |lote \d|airbnb|condominio|m²|m2|hect[aá]reas?|registros p[uú]blicos|rr\.?\s*pp|mini departamento|alquiler de|se alquila local|alquiler de local|cochera|estacionamiento incluido/.test(
      text,
    )
  ) {
    bump('inmuebles', 5);
  }

  // —— Vehículos ——
  if (
    /\b(auto|carro|camioneta|motocicleta|motokar|moto lineal)\b|kilometraje|placa [a-z]{3}|toyota |hyundai |nissan |chevrolet |kia |honda |suzuki |bmw |mercedes/.test(
      text,
    )
  ) {
    bump('vehiculos', 6);
  }

  // —— Negocios ——
  if (
    /traspaso de (tienda|negocio|restaurante|botica|bar)|fondo de comercio|negocio en marcha|socio inversionista|inversi[oó]n busca socio|franquicia en venta|cafeter[ií]a en venta|restaurante en venta|poller[ií]a en venta|vendo empresa/.test(
      text,
    )
  ) {
    bump('negocios', 7);
  }

  // —— Servicios ——
  if (
    /peluquer[ií]a|grooming|baño de (gato|perro)|veterinar|cl[ií]nica dental|gasfiter|electricista|plomer|servicio de |clases de |reparaci[oó]n de|limpieza a domicilio|mudanza|diseño gráfico|fotograf[ií]a|est[eé]tica|barber[ií]a|spa |tatuaje|abogad|contador externo|psic[oó]log|consultor[ií]a|asesor[ií]a|instalaci[oó]n de|mantenimiento de/.test(
      text,
    )
  ) {
    bump('servicios', 5);
  }

  // —— Eventos ——
  if (
    /entrada(?:s)?(?: general| vip)?|concierto|festival|feria|exposici[oó]n|show en vivo|fiesta de|evento corporativo|boleter[ií]a/.test(
      text,
    )
  ) {
    bump('eventos', 5);
  }

  // —— Comunidad (avisos civiles, no laborales) ——
  const jobSeeking =
    /se busca|se necesita|requiere|contratando|vacante|personal|postula|sueldo|horario|turno|experiencia en|a tiempo completo|medio tiempo/.test(
      text,
    );
  if (
    !jobSeeking &&
    /perd[ií]|encontrado|mascota perdida|adopci[oó]n responsable|donaci[oó]n de|voluntariado|trueque|grupo de vecinos|aviso comunitario|se necesita sangre|extraviado/.test(
      text,
    )
  ) {
    bump('comunidad', 5);
  }

  // —— Productos (bienes tangibles) ——
  const sellingGoods =
    /vendo|venta de|remato|precio:|s\/\.\s*\d|nuevo en caja|seminuevo/.test(text) &&
    !/se busca|se necesita|requiere|contratando|personal para|vacante|señorit|jóvenes|practicante|postula|sueldo|horario|turno/.test(
      text,
    );
  if (
    /\b\d+\s*(g|gr|kg|ml|l|litros?|unidades?|pack|paquete)\b|cacao|chocolate|miel |aceite de|laptop|celular|iphone|samsung|refrigerador|microondas|muebles|zapatillas|cosm[eé]tico en stock|suplemento|vitamina|herramienta|baranda|vidrio templado|porcelanato|cer[aá]mica/.test(
      text,
    )
  ) {
    bump('productos', 4);
  }
  if (sellingGoods) {
    bump('productos', 2);
  }

  // Maestro / profesional ofrece servicio (no venta de mercancía ni vacante laboral en fábrica)
  if (
    /maestro (de obra |contratista|realiza)|ofrece (su |sus )?servicio|realizo trabajos|ofrezco servicio|servicio de construcci|albañil|gasfitero|electricista a domicilio/.test(
      text,
    ) &&
    !/necesit[ao]|requiere|solicita|contratando|vacante|señorit|jóvenes/.test(text)
  ) {
    bump('servicios', 8);
    bump('productos', -4);
    bump('empleos', -3);
  }

  // Conflictos frecuentes
  if (scores.empleos >= 4 && scores.inmuebles >= 4) {
    if (/^(se requiere|buscamos|vacante|personal)/i.test(tituloLower)) {
      scores.inmuebles -= 3;
    } else if (/^(se alquila|alquilo|vendo casa|terreno)/i.test(tituloLower)) {
      scores.empleos -= 3;
    } else if (/requeri|vacante|\bcv\b|sueldo|horario|propina|contratando/.test(text)) {
      scores.inmuebles -= 2;
    } else if (/alquiler|m²|anticresis|habitaci[oó]n/.test(text)) {
      scores.empleos -= 2;
    }
  }

  if (scores.negocios >= 5 && scores.inmuebles >= 5 && /traspaso|fondo de comercio/.test(text)) {
    scores.inmuebles -= 2;
  }

  return scores;
}

function pickWinner(scores: Record<Categoria, number>): { cat: Categoria; top: number; second: number } {
  const ranked = CATEGORIAS
    .map((cat) => ({ cat, score: scores[cat] }))
    .sort((a, b) => b.score - a.score);

  const top = ranked[0]?.score ?? 0;
  const second = ranked[1]?.score ?? 0;
  const cat = ranked[0]?.cat ?? 'servicios';
  return { cat, top, second };
}

/**
 * Clasifica un aviso en una de las 8 categorías del marketplace.
 * Pensado para corrección masiva y extracción Rueda (sin default ciego a productos).
 */
export function classifyAdisoCategory(
  titulo: string,
  descripcion: string,
  current?: Categoria | null,
): ClassifyCategoryResult {
  const tituloTrim = (titulo || '').trim();
  const descTrim = (descripcion || '').trim();
  const tituloLower = tituloTrim.toLowerCase();
  const text = `${tituloTrim} ${descTrim}`.toLowerCase();

  const scores = scoreCategory(text, tituloLower);
  for (const c of CATEGORIAS) {
    if (scores[c] < 0) scores[c] = 0;
  }
  const { cat, top, second } = pickWinner(scores);
  const margin = top - second;

  if (top >= 10 && margin >= 4) {
    return { categoria: cat, confidence: 'high', margin };
  }
  if (top >= 6 && margin >= 3) {
    return { categoria: cat, confidence: 'high', margin };
  }
  if (top >= 4 && margin >= 2) {
    return { categoria: cat, confidence: 'medium', margin };
  }
  if (top >= 3 && margin >= 1) {
    return { categoria: cat, confidence: 'medium', margin };
  }

  if (current && CATEGORIAS.includes(current)) {
    return { categoria: current, confidence: 'low', margin: 0 };
  }

  if (top > 0) {
    return { categoria: cat, confidence: 'low', margin };
  }

  return { categoria: 'servicios', confidence: 'low', margin: 0 };
}

function correctionGuards(
  stored: Categoria,
  inferred: Categoria,
  text: string,
): { allow: boolean; forced?: Categoria } {
  const looksLikeJob =
    /oferta de trabajo|necesit[ao]|requiere|solicita|contratando|vacante|personal|señorit|jóvenes|varones y mujeres|turno|horario|sueldo|planilla|nesecita/.test(
      text,
    );
  const looksLikeServiceOffer =
    /ofrece (su |sus )?servicio|maestro (de obra |contratista)|realizo trabajos/.test(text) &&
    !looksLikeJob;

  if (stored === 'empleos' && inferred === 'productos' && looksLikeJob) {
    return { allow: false };
  }
  if (stored === 'empleos' && inferred === 'servicios' && looksLikeJob) {
    return { allow: false };
  }
  if (stored === 'empleos' && looksLikeServiceOffer && inferred === 'servicios') {
    return { allow: true, forced: 'servicios' };
  }
  return { allow: true };
}

/** Si la categoría almacenada no coincide con la inferida con confianza suficiente. */
export function shouldCorrectCategory(
  stored: Categoria,
  titulo: string,
  descripcion: string,
): { fix: boolean; next: Categoria; confidence: ClassifyConfidence; margin: number } {
  const text = `${titulo} ${descripcion}`.toLowerCase();
  const inferred = classifyAdisoCategory(titulo, descripcion, stored);

  if (inferred.categoria === stored) {
    return { fix: false, next: stored, confidence: inferred.confidence, margin: inferred.margin };
  }

  const guards = correctionGuards(stored, inferred.categoria, text);
  if (!guards.allow) {
    return { fix: false, next: stored, confidence: inferred.confidence, margin: inferred.margin };
  }

  const target = guards.forced ?? inferred.categoria;

  if (inferred.confidence === 'high') {
    return { fix: true, next: target, confidence: inferred.confidence, margin: inferred.margin };
  }
  if (inferred.confidence === 'medium' && inferred.margin >= 2) {
    return { fix: true, next: target, confidence: inferred.confidence, margin: inferred.margin };
  }
  // Caso grave: empleo disfrazado de productos (default histórico de importación)
  if (stored === 'productos' && target === 'empleos' && inferred.margin >= 1) {
    if (/horario|propina|sueldo|contratando|vacante|cv|planilla|essalud|se paga s\//.test(text)) {
      return { fix: true, next: 'empleos', confidence: 'medium', margin: inferred.margin };
    }
  }

  return { fix: false, next: stored, confidence: inferred.confidence, margin: inferred.margin };
}
