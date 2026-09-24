import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Adiso, Categoria, ContactoMultiple, TamañoAdiso } from '@/types';
import { extraerNumerosTelefono, extraerEmails, esWhatsApp, limpiarContactosDeDescripcion } from '@/lib/limpiar-contactos';
import { adisoToDb } from '@/lib/supabase';
import { generarIdUnico } from '@/lib/utils';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const CARPETAS_BASE = '/home/jairoprodev/proyectos/adisos-processing/procesamiento/04-anuncios-separados';

const MESES: { [key: string]: string } = {
  'Ene': '01', 'Feb': '02', 'Mar': '03', 'Abr': '04', 'May': '05', 'Jun': '06',
  'Jul': '07', 'Ago': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dic': '12',
  'Jan': '01', 'Apr': '04', 'Aug': '08', 'Dec': '12'
};

// Estadísticas globales
interface Stats {
  totalProcesados: number;
  porCategoria: Record<Categoria, number>;
  filtrados: number;
  errores: number;
}

const stats: Stats = {
  totalProcesados: 0,
  porCategoria: {
    inmuebles: 0,
    empleos: 0,
    vehiculos: 0,
    servicios: 0,
    productos: 0,
    eventos: 0,
    negocios: 0
  },
  filtrados: 0,
  errores: 0
};

/**
 * Extrae el número de página del nombre del archivo
 * Ej: "pagina-02.txt" -> 2
 */
function extraerNumeroPagina(nombreArchivo: string): number {
  const match = nombreArchivo.match(/pagina-(\d+)\.txt/i);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Determina si una línea es contenido editorial/spam que debe ser filtrado
 */
function esContenidoEditorial(titulo: string, descripcion: string): boolean {
  const textoCompleto = `${titulo} ${descripcion}`.toLowerCase();

  // Patrones de contenido editorial
  const patronesEditorial = [
    /como evitar.*estafa/i,
    /no permitas.*estafa/i,
    /recomendaciones.*revista/i,
    /consejos.*seguridad/i,
    /advertencia.*lectores/i,
    /adiso.*importante/i
  ];

  // Si el texto es muy largo (>500 caracteres) y no tiene contacto, probablemente es editorial
  if (textoCompleto.length > 500 && !textoCompleto.match(/\b9\d{8}\b/) && !textoCompleto.match(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/)) {
    return true;
  }

  return patronesEditorial.some(patron => patron.test(textoCompleto));
}

/**
 * Parsea una línea de adiso
 */
function parsearLineaAdiso(linea: string): { titulo: string; descripcion: string } | null {
  if (!linea || linea.trim().length === 0) return null;

  const sinNumero = linea.replace(/^\d+\.\s*/, '').trim();
  if (sinNumero.length === 0) return null;

  const indiceSeparador = sinNumero.indexOf(':');

  if (indiceSeparador === -1) {
    const palabras = sinNumero.split(/\s+/);
    if (palabras.length < 3) return null;
    const titulo = palabras.slice(0, Math.min(10, palabras.length - 5)).join(' ');
    const descripcion = palabras.slice(Math.min(10, palabras.length - 5)).join(' ');
    return { titulo: titulo.trim(), descripcion: descripcion.trim() };
  }

  const titulo = sinNumero.substring(0, indiceSeparador).trim();
  const descripcion = sinNumero.substring(indiceSeparador + 1).trim();

  if (!titulo || !descripcion || titulo.length < 3 || descripcion.length < 10) return null;

  return { titulo, descripcion };
}

/**
 * Detecta categoría con lógica mejorada y basada en página
 */
function detectarCategoria(titulo: string, descripcion: string, numeroPagina: number): Categoria {
  const texto = `${titulo} ${descripcion}`.toLowerCase();

  // REGLA 1: Páginas 2-6 son INMUEBLES (con alta prioridad)
  if (numeroPagina >= 2 && numeroPagina <= 6) {
    // Verificar que realmente sea inmueble
    if (texto.match(/\b(alquilo|alquiler|vendo|venta|casa|departamento|terreno|local|oficina|tienda|habitación|dormitorio|m²|metros)\b/)) {
      return 'inmuebles';
    }
  }

  // REGLA 2: Páginas 7-14 son EMPLEOS (con alta prioridad)
  if (numeroPagina >= 7 && numeroPagina <= 14) {
    // Verificar que realmente sea empleo
    if (texto.match(/\b(requiere|necesita|busca|solicita|personal|asesor|vendedor|mozo|cocinero|practicante|cv|curriculum|experiencia|sueldo|planilla)\b/)) {
      return 'empleos';
    }
  }

  // REGLA 3: Página 15 - mitad empleos, mitad mixto
  if (numeroPagina === 15) {
    // Primero intentar detectar empleos
    if (texto.match(/\b(requiere|necesita|busca|solicita|personal|asesor|vendedor|mozo|cocinero|practicante|cv|curriculum|experiencia|sueldo|planilla)\b/)) {
      return 'empleos';
    }
  }

  // REGLA 4: Detección por contenido (para páginas 1, 15-16 y casos especiales)

  // Empleos (patrones más específicos)
  if (texto.match(/\b(requiere|necesita|busca|solicita|convocatoria|vacante|personal|asesor|vendedor|operador|mozo|chef|cocinero|recepcionista|practicante|auxiliar|administrador|gerente|contador|abogado|médico|enfermera|profesor|maestro|barista|housekeeping|limpieza|cajero|ayudante|steward)\b/)) {
    return 'empleos';
  }

  // Inmuebles (patrones más específicos)
  if (texto.match(/\b(alquilo|alquiler|alquila|vendo|venta|remato|casa|departamento|terreno|inmueble|propiedad|local comercial|oficina|tienda|hostal|hotel|habitación|dormitorio|garaje|cochera|sótano|m²|metros cuadrados|lote)\b/)) {
    return 'inmuebles';
  }

  // Vehículos
  if (texto.match(/\b(auto|carro|vehículo|vehiculo|moto|motocicleta|camioneta|camión|toyota|nissan|hyundai|kia|honda|mazda|chevrolet|ford|volkswagen)\b/)) {
    return 'vehiculos';
  }

  // Negocios (antes de productos para evitar confusión con "vendo negocio")
  if (texto.match(/\b(negocio|empresa|franquicia|socio|inversión|inversion|oportunidad|traspaso)\b/)) {
    return 'negocios';
  }

  // Productos
  if (texto.match(/\b(vendo|venta|producto|artículo|articulo|equipo|maquinaria|mueble|electrodoméstico|electrodomestico|laptop|computadora|celular|ropa|zapatos|catálogo|catalogo)\b/)) {
    return 'productos';
  }

  // Eventos
  if (texto.match(/\b(evento|fiesta|celebración|celebracion|concierto|show|espectáculo|espectaculo|festival|presentación|presentacion)\b/)) {
    return 'eventos';
  }

  // Por defecto: servicios
  return 'servicios';
}

/**
 * Determina el tamaño del adiso basado en la longitud del contenido
 */
function determinarTamaño(titulo: string, descripcion: string): TamañoAdiso {
  const longitudTotal = titulo.length + descripcion.length;

  // Para históricos, usamos principalmente pequeño
  if (longitudTotal > 400) return 'mediano';
  if (longitudTotal > 250) return 'pequeño';
  return 'pequeño'; // Por defecto pequeño para históricos (no miniatura)
}

/**
 * Extrae la ubicación más específica del texto
 * Busca patrones como: Urb. X, Av. X, Calle X, Jr. X, Psje. X, etc.
 */
function extraerUbicacion(titulo: string, descripcion: string): string {
  const texto = `${titulo} ${descripcion}`;

  // Lista de distritos de Cusco
  const distritos = [
    'San Sebastián', 'San Jerónimo', 'Wanchaq', 'Wánchaq', 'Santiago',
    'Cusco', 'Poroy', 'Saylla', 'Oropesa', 'Lucre', 'Huasao', 'Chinchero'
  ];

  // Patrones de ubicación (ordenados por especificidad)
  const patronesUbicacion = [
    // Urbanizaciones con código (ej: Urb. Larapa A-6)
    /(?:Urb\.|Urbanización)\s+([A-ZÁ-Úa-zá-ú\s]+?)(?:\s+[A-Z]-?\d+[-\d]*)?(?:\s*,|\s+(?:ubicad|en|de|con|frente|altura|paradero|distrito))/i,

    // Avenidas con número o referencia
    /(?:Av\.|Avenida)\s+([A-ZÁ-Úa-zá-ú\s\.]+?)(?:\s+N[ºo°]?\s*\d+)?(?:\s*,|\s+(?:ubicad|en|de|con|frente|altura|paradero|distrito))/i,

    // Calles
    /(?:Calle|C\/)\s+([A-ZÁ-Úa-zá-ú\s]+?)(?:\s+N[ºo°]?\s*\d+)?(?:\s*,|\s+(?:ubicad|en|de|con|frente|altura|paradero|distrito))/i,

    // Jirones
    /(?:Jr\.|Jirón)\s+([A-ZÁ-Úa-zá-ú\s]+?)(?:\s+N[ºo°]?\s*\d+)?(?:\s*,|\s+(?:ubicad|en|de|con|frente|altura|paradero|distrito))/i,

    // Pasajes
    /(?:Psje\.|Pasaje)\s+([A-ZÁ-Úa-zá-ú\s]+?)(?:\s+N[ºo°]?\s*\d+)?(?:\s*,|\s+(?:ubicad|en|de|con|frente|altura|paradero|distrito))/i,

    // Prolongación
    /Prolongación\s+(?:Av\.|Avenida)\s+([A-ZÁ-Úa-zá-ú\s]+?)(?:\s*,|\s+(?:ubicad|en|de|con|frente))/i,

    // APV (Asociación Pro Vivienda)
    /APV\s+([A-ZÁ-Úa-zá-ú\s]+?)(?:\s*,|\s+(?:ubicad|en|de|con|frente))/i,

    // Asociación
    /Asociación\s+([A-ZÁ-Úa-zá-ú\s"]+?)(?:\s*,|\s+(?:ubicad|en|de|con|frente))/i
  ];

  let ubicacionEspecifica = '';
  let distrito = '';

  // Buscar ubicación específica
  for (const patron of patronesUbicacion) {
    const match = texto.match(patron);
    if (match && match[1]) {
      ubicacionEspecifica = match[1].trim();
      // Limpiar caracteres extraños al final
      ubicacionEspecifica = ubicacionEspecifica.replace(/[,\.\-\s]+$/, '');
      break;
    }
  }

  // Buscar distrito
  for (const dist of distritos) {
    const regex = new RegExp(`\\b${dist}\\b`, 'i');
    if (regex.test(texto)) {
      distrito = dist;
      break;
    }
  }

  // Construir ubicación final
  if (ubicacionEspecifica && distrito) {
    return `${ubicacionEspecifica}, ${distrito}, Cusco, Perú`;
  } else if (ubicacionEspecifica) {
    return `${ubicacionEspecifica}, Cusco, Perú`;
  } else if (distrito) {
    return `${distrito}, Cusco, Perú`;
  }

  return 'Cusco, Perú';
}

function parsearFechaDesdeCarpeta(carpeta: string, anioDefault: number): string {
  const match = carpeta.match(/-([A-Za-z]+)(\d+)-/);
  if (match) {
    const mesStr = match[1];
    const diaStr = match[2];
    const mesKey = Object.keys(MESES).find(k => k.toLowerCase() === mesStr.toLowerCase());
    if (mesKey && diaStr) {
      const mes = MESES[mesKey];
      const dia = diaStr.padStart(2, '0');
      return `${anioDefault}-${mes}-${dia}`;
    }
  }
  return `${anioDefault}-01-01`;
}

function crearAdisoHistorico(
  titulo: string,
  descripcion: string,
  contactos: ContactoMultiple[],
  carpeta: string,
  archivo: string,
  numeroLinea: number,
  fechaPublicacion: string,
  numeroPagina: number,
  horaPublicacion: string = '09:00'
): Adiso {
  const descripcionLimpia = limpiarContactosDeDescripcion(descripcion, contactos);
  const contactoPrincipal = contactos.find(c => c.principal)?.valor ||
    contactos.find(c => c.tipo === 'telefono' || c.tipo === 'whatsapp')?.valor ||
    contactos.find(c => c.tipo === 'email')?.valor ||
    contactos[0]?.valor || '';

  const categoria = detectarCategoria(titulo, descripcionLimpia, numeroPagina);
  const tamaño = determinarTamaño(titulo, descripcionLimpia);
  const ubicacion = extraerUbicacion(titulo, descripcionLimpia);
  const edicionNumero = carpeta.match(/^R\d+/)?.[0] || carpeta;

  // Actualizar estadísticas
  stats.porCategoria[categoria]++;

  return {
    id: generarIdUnico(),
    categoria,
    titulo: titulo.substring(0, 100),
    descripcion: descripcionLimpia.substring(0, 2000),
    contacto: contactoPrincipal,
    ubicacion: ubicacion,
    fechaPublicacion: fechaPublicacion,
    horaPublicacion: horaPublicacion,
    tamaño: tamaño,
    esHistorico: true,
    estaActivo: false,
    fuenteOriginal: 'rueda_negocios',
    edicionNumero: edicionNumero,
    fechaPublicacionOriginal: fechaPublicacion,
    contactosMultiples: contactos.length > 0 ? contactos : undefined
  };
}

function procesarArchivo(
  rutaArchivo: string,
  carpeta: string,
  archivo: string,
  fechaPublicacion: string
): Adiso[] {
  const adisos: Adiso[] = [];
  const numeroPagina = extraerNumeroPagina(archivo);

  try {
    const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
    const lineas = contenido.split('\n');

    lineas.forEach((linea, indice) => {
      const lineaNumero = indice + 1;
      const parseado = parsearLineaAdiso(linea);

      if (!parseado) return;

      const { titulo, descripcion } = parseado;

      // Filtrar contenido editorial
      if (esContenidoEditorial(titulo, descripcion)) {
        stats.filtrados++;
        return;
      }

      const numerosTelefono = extraerNumerosTelefono(descripcion);
      const emails = extraerEmails(descripcion);
      const contactos: ContactoMultiple[] = [];

      numerosTelefono.forEach((numero, index) => {
        const esWA = esWhatsApp(descripcion, numero);
        contactos.push({
          tipo: esWA ? 'whatsapp' : 'telefono',
          valor: numero,
          principal: index === 0
        });
      });

      emails.forEach((email, index) => {
        contactos.push({
          tipo: 'email',
          valor: email,
          principal: contactos.length === 0 && index === 0
        });
      });

      const adiso = crearAdisoHistorico(
        titulo,
        descripcion,
        contactos,
        carpeta,
        archivo,
        lineaNumero,
        fechaPublicacion,
        numeroPagina
      );

      adisos.push(adiso);
      stats.totalProcesados++;
    });
  } catch (error: any) {
    console.error(`  ❌ Error al procesar archivo ${archivo}:`, error.message);
    stats.errores++;
  }

  return adisos;
}

// --- LOGICA DE EXPORTACIÓN A CSV ---

function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '';
  const stringVal = String(val);
  if (stringVal.includes('"') || stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('\r')) {
    return `"${stringVal.replace(/"/g, '""')}"`;
  }
  return stringVal;
}

async function generarCsv(adisos: Adiso[], rutaSalida: string) {
  if (adisos.length === 0) {
    console.log('⚠️  No hay adisos para exportar.');
    return;
  }

  const ejemploDb = adisoToDb(adisos[0]);
  const headers = Object.keys(ejemploDb);

  const stream = fs.createWriteStream(rutaSalida, { encoding: 'utf8' });

  // Escribir BOM para Excel
  stream.write('\uFEFF');

  // Escribir Headers
  stream.write(headers.map(h => escapeCsvValue(h)).join(',') + '\n');

  // Escribir filas
  for (const adiso of adisos) {
    const dbObj = adisoToDb(adiso);
    const row = headers.map(header => {
      const val = dbObj[header];
      return escapeCsvValue(val);
    });
    stream.write(row.join(',') + '\n');
  }

  stream.end();
  console.log(`✅ Archivo CSV generado exitosamente: ${rutaSalida}`);
}

async function main() {
  const args = process.argv.slice(2);
  const carpetaArg = args.find(arg => arg.startsWith('--carpeta='));
  const carpetaEspecifica = carpetaArg ? carpetaArg.split('=')[1] : undefined;

  const anioArg = args.find(arg => arg.startsWith('--anio='));
  const anio = anioArg ? parseInt(anioArg.split('=')[1]) : new Date().getFullYear();

  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 0;

  const todas = args.includes('--todas');

  if (!carpetaEspecifica && !todas) {
    console.log('❌ Debes especificar --carpeta=NOMBRE o --todas');
    process.exit(1);
  }

  // Buscar carpetas a procesar
  let carpetas: string[] = [];
  if (carpetaEspecifica) {
    carpetas = [carpetaEspecifica];
  } else if (todas) {
    if (!fs.existsSync(CARPETAS_BASE)) {
      console.error(`❌ Directorio base no encontrado: ${CARPETAS_BASE}`);
      process.exit(1);
    }
    carpetas = fs.readdirSync(CARPETAS_BASE, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
      .sort();
  }

  console.log(`🚀 Iniciando exportación a CSV...`);
  console.log(`📅 Año base: ${anio}`);
  console.log(`📂 Carpetas a procesar: ${carpetas.length}`);

  const todosLosAdisos: Adiso[] = [];

  for (const carpeta of carpetas) {
    const rutaCarpeta = path.join(CARPETAS_BASE, carpeta);
    if (!fs.existsSync(rutaCarpeta)) {
      console.warn(`⚠️ Carpeta no existe: ${rutaCarpeta}`);
      continue;
    }

    const archivos = fs.readdirSync(rutaCarpeta).filter(f => f.endsWith('.txt')).sort();
    const archivosProcesar = limit > 0 ? archivos.slice(0, limit) : archivos;

    const fecha = parsearFechaDesdeCarpeta(carpeta, anio);
    console.log(`   Procesando ${carpeta} (${archivosProcesar.length} archivos) - Fecha: ${fecha}`);

    for (const archivo of archivosProcesar) {
      const rutaArchivo = path.join(rutaCarpeta, archivo);
      const procesados = procesarArchivo(rutaArchivo, carpeta, archivo, fecha);
      todosLosAdisos.push(...procesados);
    }
  }

  console.log(`\n📊 Total adisos procesados: ${todosLosAdisos.length}`);
  console.log('📈 Estadísticas de procesamiento:');
  console.log(`  Total procesados: ${stats.totalProcesados}`);
  console.log(`  Filtrados (editorial/spam): ${stats.filtrados}`);
  console.log(`  Errores: ${stats.errores}`);
  console.log('  Distribución por categoría:');
  for (const categoria in stats.porCategoria) {
    console.log(`    - ${categoria}: ${stats.porCategoria[categoria as Categoria]}`);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const nombreBase = carpetaEspecifica ? carpetaEspecifica : 'todas-las-carpetas';
  const outputFile = path.join(process.cwd(), `adisos_export_${nombreBase}_${anio}_${timestamp}.csv`);

  await generarCsv(todosLosAdisos, outputFile);
}

main().catch(console.error);
