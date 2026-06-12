import { Adiso } from '@/types';
import { adisoTieneImagen } from '@/lib/adiso-display';

function textBlob(adiso: Adiso): string {
  return `${adiso.titulo} ${adiso.descripcion}`.toLowerCase();
}

function hasKeyword(adiso: Adiso, patterns: RegExp[]): boolean {
  const t = textBlob(adiso);
  return patterns.some((p) => p.test(t));
}

export function matchFacetValue(adiso: Adiso, facetId: string, value: string): boolean {
  switch (facetId) {
    case 'empleos_modalidad':
      if (value === 'remoto') return hasKeyword(adiso, [/remoto|teletrabajo|home\s*office|desde casa/i]);
      if (value === 'presencial') return hasKeyword(adiso, [/presencial|en sitio|oficina|local/i]) || !hasKeyword(adiso, [/remoto|teletrabajo/i]);
      if (value === 'hibrido') return hasKeyword(adiso, [/h[ií]brido|mixto/i]);
      return true;

    case 'empleos_jornada':
      if (value === 'completo') return hasKeyword(adiso, [/tiempo completo|full\s*time|jornada completa/i]);
      if (value === 'medio') return hasKeyword(adiso, [/medio tiempo|part\s*time|por horas/i]);
      if (value === 'practicas') return hasKeyword(adiso, [/pr[aá]ctica|pasant[ií]a|bachiller|practicante/i]);
      return true;

    case 'empleos_experiencia':
      if (value === 'sin_experiencia') return hasKeyword(adiso, [/sin experiencia|no requiere experiencia|sin exp|experiencia no indispensable|primer empleo/i]);
      if (value === 'junior') return hasKeyword(adiso, [/1 año de experiencia|2 años de experiencia|junior|jr/i]);
      if (value === 'pleno') return hasKeyword(adiso, [/3 años de experiencia|4 años de experiencia|5 años de experiencia|semi[- ]senior|semi senior|ssr|pleno/i]);
      if (value === 'senior') return hasKeyword(adiso, [/senior|sr|lider|jefe|gerente|director|mas de 5 años|más de 5 años|6 años de experiencia|7 años de experiencia|8 años de experiencia/i]);
      return true;

    case 'empleos_educacion':
      if (value === 'secundaria') return hasKeyword(adiso, [/secundaria|bachillerato|colegio/i]);
      if (value === 'tecnico') return hasKeyword(adiso, [/t[eé]cnico|tecnolog[ií]a/i]);
      if (value === 'universitario') return hasKeyword(adiso, [/universitario|universidad|bachiller|licenciado|profesional/i]);
      if (value === 'postgrado') return hasKeyword(adiso, [/postgrado|posgrado|maestr[ií]a|master|mba|doctorado/i]);
      return true;

    case 'empleos_contrato':
      if (value === 'planilla') return hasKeyword(adiso, [/planilla|indefinido|contrato indeterminado|permanente/i]);
      if (value === 'temporal') return hasKeyword(adiso, [/temporal|contrato plazo fijo|por meses|reemplazo/i]);
      if (value === 'freelance') return hasKeyword(adiso, [/freelance|por proyectos|locaci[oó]n de servicios|recibo por honorarios/i]);
      if (value === 'practicas') return hasKeyword(adiso, [/pr[aá]cticas|pasant[ií]a|trainee/i]);
      return true;

    case 'inmuebles_operacion':
      if (value === 'venta') return hasKeyword(adiso, [/venta|vendo|en venta|se vende/i]);
      if (value === 'alquiler') return hasKeyword(adiso, [/alquiler|alquilo|arriendo|arrendar|renta/i]);
      return true;

    case 'inmuebles_tipo':
      if (value === 'casa') return hasKeyword(adiso, [/casa|chalet|vivienda/i]);
      if (value === 'departamento') return hasKeyword(adiso, [/departamento|depto|flat|piso/i]);
      if (value === 'local') return hasKeyword(adiso, [/local comercial|local|tienda|oficina|negocio/i]);
      if (value === 'terreno') return hasKeyword(adiso, [/terreno|lote|predio/i]);
      return true;

    case 'inmuebles_habitaciones':
      if (value === '1') return hasKeyword(adiso, [/1 dorm|1 hab|un dorm|un cuarto|1 cuarto/i]);
      if (value === '2') return hasKeyword(adiso, [/2 dorm|2 hab|dos dorm|dos cuartos|2 cuartos/i]);
      if (value === '3plus') return hasKeyword(adiso, [/3 dorm|4 dorm|5 dorm|3 hab|4 hab|tres dorm|cuatro dorm/i]);
      return true;

    case 'vehiculos_tipo':
      if (value === 'auto') return hasKeyword(adiso, [/auto|carro|sed[aá]n|suv|camioneta/i]);
      if (value === 'moto') return hasKeyword(adiso, [/moto|motocicleta|scooter/i]);
      if (value === 'camioneta') return hasKeyword(adiso, [/camioneta|pickup|4x4/i]);
      return true;

    case 'vehiculos_condicion':
      if (value === 'nuevo') return hasKeyword(adiso, [/nuevo|cero km|0 km|0km|sin uso/i]);
      if (value === 'usado') return hasKeyword(adiso, [/usado|seminuevo|de segundo uso|segunda mano/i]);
      return true;

    case 'vehiculos_combustible':
      if (value === 'gasolina') return hasKeyword(adiso, [/gasolina/i]);
      if (value === 'diesel') return hasKeyword(adiso, [/di[eé]sel|petr[oó]leo/i]);
      if (value === 'gnv_glp') return hasKeyword(adiso, [/gnv|glp|gas/i]);
      if (value === 'electrico_hibrido') return hasKeyword(adiso, [/el[eé]ctrico|h[ií]brido/i]);
      return true;

    case 'servicios_modalidad':
      if (value === 'domicilio') return hasKeyword(adiso, [/a domicilio|delivery|en casa/i]);
      if (value === 'local') return hasKeyword(adiso, [/en local|en tienda|presencial/i]);
      return true;

    case 'servicios_tipo':
      if (value === 'hogar') return hasKeyword(adiso, [/limpieza|gasfiter|plomero|electricista|hogar|mudanza/i]);
      if (value === 'tecnico') return hasKeyword(adiso, [/soporte|t[eé]cnico|reparaci[oó]n|computador|celular/i]);
      if (value === 'salud_estetica') return hasKeyword(adiso, [/masaje|est[eé]tica|salud|manicure|peluquer[ií]a|terapia/i]);
      if (value === 'clases') return hasKeyword(adiso, [/clases|profesor|tutor|curso|ingl[eé]s|matem[aá]ticas/i]);
      if (value === 'transporte') return hasKeyword(adiso, [/taxis|transporte|flete|chofer|viajes/i]);
      return true;

    case 'productos_condicion':
      if (value === 'nuevo') return hasKeyword(adiso, [/nuevo|sin uso|sellado/i]);
      if (value === 'usado') return hasKeyword(adiso, [/usado|seminuevo|segunda mano/i]);
      return true;

    case 'productos_categoria':
      if (value === 'tecnologia') return hasKeyword(adiso, [/celular|laptop|tv|computador|aud[ií]fonos|reloj|iphone|tablet/i]);
      if (value === 'ropa') return hasKeyword(adiso, [/ropa|zapatillas|pantal[oó]n|polo|casaca|vestido|calzado/i]);
      if (value === 'hogar') return hasKeyword(adiso, [/mueble|sof[aá]|cama|cocina|refrigeradora|mesa|silla|adorno/i]);
      if (value === 'entretenimiento') return hasKeyword(adiso, [/juego|consola|ps5|ps4|libro|pel[ií]cula|m[uú]sica|juguete/i]);
      if (value === 'deportes') return hasKeyword(adiso, [/bicicleta|pelota|gimnasio|mancuerna|zapatillas running|deporte/i]);
      return true;

    case 'eventos_tipo':
      if (value === 'gratis') return adiso.tipoPrecio === 'gratis' || hasKeyword(adiso, [/gratis|entrada libre|sin costo/i]);
      if (value === 'pago') return (adiso.precio != null && adiso.precio > 0) || hasKeyword(adiso, [/entrada|ticket|costo/i]);
      return true;

    case 'eventos_categoria':
      if (value === 'concierto') return hasKeyword(adiso, [/concierto|m[uú]sica en vivo|banda|orquesta|show|recital/i]);
      if (value === 'conferencia') return hasKeyword(adiso, [/charla|conferencia|taller|webinar|seminario|clase/i]);
      if (value === 'deportivo') return hasKeyword(adiso, [/partido|carrera|marat[oó]n|f[uú]tbol|torneo/i]);
      if (value === 'cultural') return hasKeyword(adiso, [/teatro|exposici[oó]n|museo|arte|danza|galer[ií]a/i]);
      if (value === 'fiesta') return hasKeyword(adiso, [/fiesta|party|discoteca|celebraci[oó]n|evento social/i]);
      return true;

    case 'negocios_rubro':
      if (value === 'gastronomia') return hasKeyword(adiso, [/restaurante|caf[eé]|bar|comida|gastronom/i]);
      if (value === 'salud') return hasKeyword(adiso, [/cl[ií]nica|salud|farmacia|m[eé]dico/i]);
      if (value === 'retail') return hasKeyword(adiso, [/tienda|retail|comercio|boutique/i]);
      if (value === 'servicios') return hasKeyword(adiso, [/servicio|consultor/i]);
      if (value === 'tecnologia') return hasKeyword(adiso, [/software|desarrollo|tecnolog[ií]a|sistemas|agencia digital/i]);
      if (value === 'construccion') return hasKeyword(adiso, [/ferreter[ií]a|construcci[oó]n|obra|materiales|diseño de interiores/i]);
      return true;

    case 'comunidad_tipo':
      if (value === 'trueque') return hasKeyword(adiso, [/trueque|intercambio/i]);
      if (value === 'donacion') return hasKeyword(adiso, [/donaci[oó]n|regalo|gratis/i]);
      if (value === 'grupo') return hasKeyword(adiso, [/grupo|comunidad|club/i]);
      if (value === 'ayuda') return hasKeyword(adiso, [/ayuda|apoyo|solidario|voluntario|social/i]);
      if (value === 'mascotas') return hasKeyword(adiso, [/mascota|perro|gato|adopci[oó]n|veterinaria/i]);
      return true;

    default:
      return true;
  }
}

export function adisoMatchesFacets(adiso: Adiso, facets: Record<string, string | string[] | boolean>): boolean {
  for (const [facetId, raw] of Object.entries(facets)) {
    if (raw === false || raw === '' || (Array.isArray(raw) && raw.length === 0)) continue;

    if (typeof raw === 'boolean' && raw) {
      if (facetId === 'empleos_con_sueldo') {
        const ok = (adiso.precio != null && adiso.precio > 0) || /sueldo|salario|s\/\s*\d/i.test(textBlob(adiso));
        if (!ok) return false;
      }
      if (facetId === 'productos_entrega') {
        if (!hasKeyword(adiso, [/entrega|delivery|env[ií]o|a domicilio/i])) return false;
      }
      continue;
    }

    const values = Array.isArray(raw) ? raw : [raw];
    const anyMatch = values.some((v) => matchFacetValue(adiso, facetId, v));
    if (!anyMatch) return false;
  }
  return true;
}

export function adisoPublicadoDentroDe(adiso: Adiso, ventana: '24h' | '7d' | '30d'): boolean {
  if (!adiso.fechaPublicacion) return false;
  const iso = adiso.horaPublicacion
    ? `${adiso.fechaPublicacion}T${adiso.horaPublicacion}`
    : adiso.fechaPublicacion;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const hours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
  if (ventana === '24h') return hours <= 24;
  if (ventana === '7d') return hours <= 24 * 7;
  return hours <= 24 * 30;
}

export { adisoTieneImagen };
