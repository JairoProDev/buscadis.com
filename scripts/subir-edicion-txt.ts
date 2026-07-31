/**
 * Script para subir anuncios desde archivos TXT de edición separada.
 * Este script está adaptado para integrarse con adis.lat
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import { Adiso, Categoria, TamañoPaquete, ContactoMultiple } from '../types';
import { adisoToDb } from '../lib/supabase';
import { limpiarContactosDeDescripcion, extraerNumerosTelefono, esWhatsApp } from '../lib/limpiar-contactos';

// Cargar variables de entorno
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Faltan variables de entorno de Supabase en .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Utilidades ---

function generateShortId(size = 10) {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let id = '';
    const bytes = crypto.randomBytes(size);
    for (let i = 0; i < size; i++) {
        id += alphabet[bytes[i] % alphabet.length];
    }
    return id;
}

function detectarCategoria(texto: string): Categoria {
    const t = texto.toLowerCase();
    // Orden: más específico primero (evitar que "vendo" mande todo a inmuebles/productos)
    if (
        /trabajo|empleo|necesito personal|requiere|requeri|vacante|cocinero|mozo|ayudante|asistente|vendedor|chofer|conductor|curriculum|currículum|\bcv\b|sueldo/.test(
            t
        )
    ) {
        return 'empleos';
    }
    if (
        /anticresis|habitaci[oó]n|departamento|alquilo|se alquila|en alquiler|terreno|casa ampl|local comercial|oficina en |inmueble|canch[oó]n|lote de |airbnb/.test(
            t
        )
    ) {
        return 'inmuebles';
    }
    if (/auto |carro |camioneta|\bmoto\b|motocicleta|kilometraje|toyota|hyundai|nissan/.test(t)) {
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
    // "vendo/venta" genérico → productos solo si no parece inmueble
    if (/vendo|venta|remato/.test(t) && !/departamento|casa |terreno|local |oficina|habitaci|alquilo/.test(t)) {
        return 'productos';
    }
    return 'productos';
}

async function procesarArchivo(ruta: string, edicion: string, fecha: string, hora: string): Promise<Adiso[]> {
    const contenido = fs.readFileSync(ruta, 'utf-8');
    const lineas = contenido.split('\n');
    const adisos: Adiso[] = [];

    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i].trim();
        if (!linea || linea.length < 10 || linea.startsWith('+') || linea.startsWith('Página') || linea.startsWith('Conteo')) continue;

        const partes = linea.split(':');
        let titulo = '';
        let descripcion = '';

        if (partes.length > 1) {
            titulo = partes[0].trim();
            descripcion = partes.slice(1).join(':').trim();
        } else {
            const palabras = linea.split(' ');
            titulo = palabras.slice(0, 3).join(' ').trim();
            descripcion = linea.trim();
        }

        const numeros = extraerNumerosTelefono(descripcion);
        const contactos: ContactoMultiple[] = numeros.map((n, idx) => ({
            tipo: esWhatsApp(linea, n) ? 'whatsapp' : 'telefono',
            valor: n,
            principal: idx === 0
        }));

        const descLimpia = limpiarContactosDeDescripcion(descripcion, contactos);
        const categoria = detectarCategoria(linea);

        adisos.push({
            id: generateShortId(10),
            categoria,
            titulo: titulo.substring(0, 100),
            descripcion: descLimpia.substring(0, 2000),
            contacto: contactos[0]?.valor || '',
            ubicacion: { pais: 'Perú', departamento: 'Cusco', provincia: 'Cusco', distrito: 'Cusco' },
            fechaPublicacion: fecha,
            horaPublicacion: hora,
            tamaño: 'pequeño',
            esHistorico: true,
            estaActivo: true,
            fuenteOriginal: 'rueda_negocios',
            edicionNumero: edicion,
            fechaPublicacionOriginal: fecha,
            contactosMultiples: contactos,
            fechaExpiracion: new Date(new Date(fecha).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
        });
    }

    return adisos;
}

async function main() {
    const args = process.argv.slice(2);
    const carpetaArg = args.find(a => a.startsWith('--carpeta='))?.split('=')[1];
    const edicionArg = args.find(a => a.startsWith('--edicion='))?.split('=')[1];
    const fechaArg = args.find(a => a.startsWith('--fecha='))?.split('=')[1];

    if (!carpetaArg || !edicionArg || !fechaArg) {
        console.log('❌ Uso: npx tsx scripts/subir-edicion-txt.ts --carpeta=NOMBRE_CARPETA --edicion=RXXXX --fecha=YYYY-MM-DD');
        process.exit(1);
    }

    const baseDir = path.join(process.cwd(), 'output', 'adis-separados', carpetaArg);
    const ahora = new Date();
    // Usar la hora actual si es la fecha de hoy para que el "Time Ago" diga "Hace instantes"
    const hoy = ahora.toISOString().split('T')[0];
    const horaDefault = fechaArg === hoy
        ? ahora.toTimeString().split(' ')[0].substring(0, 5)
        : '09:00';

    console.log(`🚀 Iniciando carga de adisos de ${carpetaArg}...`);

    if (!fs.existsSync(baseDir)) {
        console.error(`❌ No existe el directorio: ${baseDir}`);
        process.exit(1);
    }

    const archivos = fs.readdirSync(baseDir).filter(f => !f.includes('.'));
    archivos.sort((a, b) => {
        const numA = parseInt(a.replace('pag', ''));
        const numB = parseInt(b.replace('pag', ''));
        return numA - numB;
    });

    for (const archivo of archivos) {
        const ruta = path.join(baseDir, archivo);
        console.log(`📄 Procesando ${archivo}...`);

        const adisos = await procesarArchivo(ruta, edicionArg, fechaArg, horaDefault);
        console.log(`✅ ${adisos.length} anuncios encontrados.`);

        if (adisos.length > 0) {
            console.log(`📤 Cargando a Supabase...`);
            const lotes = [];
            for (let i = 0; i < adisos.length; i += 50) {
                lotes.push(adisos.slice(i, i + 50));
            }

            for (const lote of lotes) {
                const dataDb = lote.map(adisoToDb);
                const { error } = await supabase.from('adisos').upsert(dataDb);
                if (error) {
                    console.error(`❌ Error al subir lote:`, error.message);
                } else {
                    console.log(`✅ Lote de ${lote.length} subido correctamente.`);
                }
            }
        }
    }

    console.log('\n🏁 Proceso finalizado.');
}

main().catch(console.error);
