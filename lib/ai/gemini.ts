/**
 * Google Gemini AI Client
 * High-performance, cost-effective AI for catalog extraction
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import type { ZodType, ZodTypeDef } from 'zod';

if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY no está configurado. Las funciones de IA estarán deshabilitadas.');
}

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

/** Whether Gemini is configured (used by the Vector engine to degrade gracefully). */
export function isGeminiConfigured(): boolean {
    return genAI !== null;
}

// Gemini 2.0 Flash - Ultra barato y rápido
const MODEL_FLASH = 'gemini-2.0-flash-exp';

// Gemini 2.0 Flash Thinking - Para razonamiento complejo
const MODEL_THINKING = 'gemini-2.0-flash-thinking-exp';

/**
 * Convierte archivo a formato base64 para Gemini
 */
async function fileToGenerativePart(file: File | Blob): Promise<{ inlineData: { data: string; mimeType: string } }> {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
        inlineData: {
            data: base64,
            mimeType: file.type
        }
    };
}

/**
 * Convierte URL de imagen a formato Gemini
 */
async function urlToGenerativePart(imageUrl: string): Promise<{ inlineData: { data: string; mimeType: string } }> {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';

    return {
        inlineData: {
            data: base64,
            mimeType
        }
    };
}

// ============================================================
// PRODUCT EXTRACTION FROM IMAGES
// ============================================================

export interface ExtractedProduct {
    title: string;
    description?: string;
    price?: number;
    currency?: string;
    attributes?: {
        color?: string;
        size?: string;
        brand?: string;
        material?: string;
        condition?: string;
        [key: string]: any;
    };
    confidence: number;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

/**
 * Detecta y extrae productos de una imagen
 * Puede detectar múltiples productos en una sola imagen
 */
export async function detectProductsInImage(
    imageSource: File | Blob | string
): Promise<ExtractedProduct[]> {
    if (!genAI) throw new Error('Gemini API no configurado');

    const model = genAI.getGenerativeModel({ model: MODEL_FLASH });

    const imagePart = typeof imageSource === 'string'
        ? await urlToGenerativePart(imageSource)
        : await fileToGenerativePart(imageSource);

    const prompt = `
Analiza esta imagen y detecta TODOS los productos visibles.

Para CADA producto encontrado, extrae:
1. Título descriptivo y comercial (máx 60 caracteres)
2. Descripción detallada (80-120 palabras)
3. Precio (si es visible)
4. Atributos: color, talla/tamaño, marca, material, condición
5. Nivel de confianza (0-1)

REGLAS:
- Si hay múltiples productos, retorna un array
- Si es un catálogo/grid, detecta cada producto individual
- Sé preciso con colores y características
- Infiere marca si es reconocible
- Para precios, detecta moneda (S/, $, etc.)

Responde SOLO con JSON válido:
{
  "products": [
    {
      "title": "Zapatillas Nike Air Max 90 - Negro/Blanco",
      "description": "Zapatillas deportivas icónicas con diseño clásico...",
      "price": 299.90,
      "currency": "PEN",
      "attributes": {
        "color": "Negro con detalles blancos",
        "brand": "Nike",
        "category": "Calzado Deportivo",
        "size": "Tallas disponibles: 38-44"
      },
      "confidence": 0.95
    }
  ]
}
`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();

    // Extraer JSON del response (puede venir con markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No se pudo parsear respuesta de Gemini');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.products || [];
}

// ============================================================
// CONTENT GENERATION
// ============================================================

export interface GeneratedContent {
    title: string;
    description: string;
    suggestedPrice?: number;
    category?: string;
    tags?: string[];
}

/**
 * Genera título y descripción desde una imagen de producto
 */
export async function generateProductContent(
    imageSource: File | Blob | string,
    options?: {
        includePrice?: boolean;
        includeTags?: boolean;
        style?: 'professional' | 'casual' | 'premium';
    }
): Promise<GeneratedContent> {
    if (!genAI) throw new Error('Gemini API no configurado');

    const model = genAI.getGenerativeModel({ model: MODEL_FLASH });

    const imagePart = typeof imageSource === 'string'
        ? await urlToGenerativePart(imageSource)
        : await fileToGenerativePart(imageSource);

    const style = options?.style || 'professional';
    const styleGuide = {
        professional: 'Tono profesional y objetivo, enfócate en beneficios y características técnicas',
        casual: 'Tono amigable y cercano, como recomendar a un amigo',
        premium: 'Tono elegante y aspiracional, resalta exclusividad y calidad superior'
    };

    const prompt = `
Genera contenido comercial persuasivo para este producto.

ESTILO: ${styleGuide[style]}

GENERAR:
1. TÍTULO: Corto, descriptivo, con marca si es visible (máx 60 caracteres)
2. DESCRIPCIÓN: Persuasiva, 80-120 palabras, estructura:
   - Apertura atractiva (1 línea)
   - Características principales (3-4 bullets mentales)
   - Beneficio principal
   - Llamado a la acción sutil
${options?.includePrice ? '3. PRECIO SUGERIDO: Estimación basada en apariencia/marca' : ''}
${options?.includeTags ? '4. TAGS: 5-8 palabras clave para búsqueda' : ''}
5. CATEGORÍA: Categoría principal del producto

Responde SOLO con JSON válido:
{
  "title": "...",
  "description": "...",
  ${options?.includePrice ? '"suggestedPrice": 299.90,' : ''}
  "category": "...",
  ${options?.includeTags ? '"tags": ["tag1", "tag2", ...]' : ''}
}
`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No se pudo parsear respuesta de Gemini');
    }

    return JSON.parse(jsonMatch[0]);
}

/**
 * Genera solo el título de un producto
 */
export async function generateProductTitle(imageSource: File | Blob | string): Promise<string> {
    if (!genAI) throw new Error('Gemini API no configurado');

    const model = genAI.getGenerativeModel({ model: MODEL_FLASH });

    const imagePart = typeof imageSource === 'string'
        ? await urlToGenerativePart(imageSource)
        : await fileToGenerativePart(imageSource);

    const prompt = `
Genera un título de producto corto y descriptivo.

REGLAS:
- Máximo 60 caracteres
- Incluye marca si es visible
- Describe atributo principal (color, modelo, etc.)
- Lenguaje comercial claro
- En español

Responde SOLO el título, sin comillas ni formato adicional.
`;

    const result = await model.generateContent([prompt, imagePart]);
    return result.response.text().trim();
}

/**
 * Genera solo la descripción de un producto
 */
export async function generateProductDescription(
    imageSource: File | Blob | string,
    title?: string
): Promise<string> {
    if (!genAI) throw new Error('Gemini API no configurado');

    const model = genAI.getGenerativeModel({ model: MODEL_FLASH });

    const imagePart = typeof imageSource === 'string'
        ? await urlToGenerativePart(imageSource)
        : await fileToGenerativePart(imageSource);

    const titleContext = title ? `El producto se llama: "${title}"` : '';

    const prompt = `
${titleContext}

Genera una descripción persuasiva para este producto.

ESTRUCTURA:
1. Apertura atractiva (1 línea que enganche)
2. Características principales (3-4 puntos clave)
3. Beneficio principal
4. Call to action sutil

ESTILO:
- Profesional pero cercano
- Resalta beneficios, no solo características
- 80-120 palabras
- En español

Responde SOLO la descripción, sin formato adicional.
`;

    const result = await model.generateContent([prompt, imagePart]);
    return result.response.text().trim();
}

// ============================================================
// ATTRIBUTE EXTRACTION
// ============================================================

export interface ProductAttributes {
    color?: string;
    size?: string;
    brand?: string;
    material?: string;
    condition?: string;
    style?: string;
    [key: string]: any;
}

/**
 * Extrae atributos estructurados de un producto
 */
export async function extractProductAttributes(
    imageSource: File | Blob | string
): Promise<ProductAttributes> {
    if (!genAI) throw new Error('Gemini API no configurado');

    const model = genAI.getGenerativeModel({ model: MODEL_FLASH });

    const imagePart = typeof imageSource === 'string'
        ? await urlToGenerativePart(imageSource)
        : await fileToGenerativePart(imageSource);

    const prompt = `
Extrae todos los atributos visibles de este producto.

ATRIBUTOS A DETECTAR:
- color: Nombre preciso del color
- size/talla: Si es visible o se puede inferir
- brand/marca: Si está visible en el producto
- material: Si es identificable
- condition/estado: "Nuevo" o "Usado" (inferir por apariencia)
- style/estilo: "Moderno", "Clásico", "Deportivo", "Casual", etc.

Responde SOLO con JSON válido (no incluyas atributos si no estás seguro):
{
  "color": "Negro con detalles blancos",
  "brand": "Nike",
  "style": "Deportivo",
  "condition": "Nuevo"
}
`;

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        return {};
    }

    return JSON.parse(jsonMatch[0]);
}

// ============================================================
// PDF PROCESSING
// ============================================================

/**
 * Extrae productos de un PDF (catálogo digital)
 * Gemini puede procesar PDFs directamente
 */
export async function extractProductsFromPDF(
    pdfFile: File | Blob | string
): Promise<ExtractedProduct[]> {
    if (!genAI) throw new Error('Gemini API no configurado');

    const model = genAI.getGenerativeModel({
        model: MODEL_FLASH,
        generationConfig: {
            temperature: 0.1, // Más determinístico para extracción
        }
    });

    let pdfPart;
    if (typeof pdfFile === 'string') {
        const response = await fetch(pdfFile);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        pdfPart = {
            inlineData: {
                data: base64,
                mimeType: 'application/pdf'
            }
        };
    } else {
        pdfPart = await fileToGenerativePart(pdfFile);
    }

    const prompt = `
Analiza este catálogo PDF y extrae TODOS los productos.

Para CADA producto, extrae:
1. Título (basado en nombre visible)
2. Descripción (si existe)
3. Precio (busca símbolos S/, $, USD, PEN, etc.)
4. Código/SKU (si está visible)
5. Atributos: color, talla, marca, material

REGLAS:
- Extrae TODO: no omitas productos
- Si el precio tiene formato "S/ 299.90" o "$45" o "45.00 soles", extráelo
- Detecta moneda (PEN, USD, EUR, etc.)
- Si hay variantes de un producto (ej: diferentes colores), créalas como productos separados
- Infiere categorías si es posible

Responde SOLO con JSON válido:
{
  "products": [
    {
      "title": "...",
      "description": "...",
      "price": 299.90,
      "currency": "PEN",
      "sku": "...",
      "attributes": {
        "color": "...",
        "brand": "..."
      },
      "confidence": 0.95
    }
  ]
}
`;

    const result = await model.generateContent([prompt, pdfPart]);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No se pudo parsear productos del PDF');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.products || [];
}

// ============================================================
// CATEGORIZATION
// ============================================================

/**
 * Sugiere categorías óptimas para un conjunto de productos
 */
export async function suggestCategories(
    productTitles: string[]
): Promise<Array<{ name: string; productIndices: number[] }>> {
    if (!genAI) throw new Error('Gemini API no configurado');

    const model = genAI.getGenerativeModel({ model: MODEL_FLASH });

    const prompt = `
Analiza estos productos y sugiere categorías óptimas para organizarlos:

Productos:
${productTitles.map((title, i) => `${i}. ${title}`).join('\n')}

REGLAS:
- Crea 3-6 categorías lógicas
- Nombres cortos y descriptivos
- Agrupa productos similares
- Una categoría puede tener múltiples productos

Responde SOLO con JSON válido:
{
  "categories": [
    {
      "name": "Calzado Deportivo",
      "productIndices": [0, 3, 5]
    },
    {
      "name": "Ropa Casual",
      "productIndices": [1, 2, 4]
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.categories || [];
}

// ============================================================
// BATCH OPERATIONS
// ============================================================

/**
 * Procesa múltiples imágenes en batch (con límite de rate)
 */
export async function batchGenerateContent(
    images: Array<File | Blob | string>,
    options?: {
        concurrency?: number;
        onProgress?: (completed: number, total: number) => void;
    }
): Promise<GeneratedContent[]> {
    const concurrency = options?.concurrency || 3;
    const results: GeneratedContent[] = [];

    for (let i = 0; i < images.length; i += concurrency) {
        const batch = images.slice(i, i + concurrency);
        const batchResults = await Promise.all(
            batch.map(img => generateProductContent(img).catch(err => {
                console.error('Error procesando imagen:', err);
                return {
                    title: 'Error al procesar',
                    description: 'No se pudo generar contenido',
                    confidence: 0
                } as GeneratedContent;
            }))
        );

        results.push(...batchResults);

        if (options?.onProgress) {
            options.onProgress(Math.min(i + concurrency, images.length), images.length);
        }

        // Rate limiting: esperar 1 segundo entre batches
        if (i + concurrency < images.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    return results;
}

// ============================================================
// MULTIMODAL INGESTION (Vector engine primitives)
// ============================================================

export type GeminiPart = string | { inlineData: { data: string; mimeType: string } };

/** Recursively drop null/undefined values so Zod optionals validate cleanly. */
function stripNulls(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(stripNulls).filter((v) => v !== null && v !== undefined);
    }
    if (value && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
            if (v === null || v === undefined) continue;
            out[k] = stripNulls(v);
        }
        return out;
    }
    return value;
}

/** Build a Gemini inlineData part from a File/Blob or a remote URL. */
export async function toGeminiPart(
    source: File | Blob | string,
    fallbackMime = 'application/octet-stream'
): Promise<{ inlineData: { data: string; mimeType: string } }> {
    if (typeof source === 'string') {
        const response = await fetch(source);
        const buffer = await response.arrayBuffer();
        return {
            inlineData: {
                data: Buffer.from(buffer).toString('base64'),
                mimeType: response.headers.get('content-type') || fallbackMime,
            },
        };
    }
    const part = await fileToGenerativePart(source);
    if (!part.inlineData.mimeType) part.inlineData.mimeType = fallbackMime;
    return part;
}

/**
 * Transcribe an audio clip to text (Gemini native audio understanding).
 * Returns the spoken content verbatim, in its original language.
 */
export async function transcribeAudio(source: File | Blob | string): Promise<string> {
    if (!genAI) throw new Error('Gemini API no configurado');
    const model = genAI.getGenerativeModel({ model: MODEL_FLASH });
    const audioPart = await toGeminiPart(source, 'audio/mpeg');
    const prompt =
        'Transcribe este audio palabra por palabra, en el idioma original (español si aplica). ' +
        'Devuelve SOLO el texto transcrito, sin comentarios ni formato adicional.';
    const result = await model.generateContent([prompt, audioPart]);
    return result.response.text().trim();
}

/**
 * Extract all readable text from a document (PDF handled natively; images OCR'd).
 */
export async function extractTextFromDocument(source: File | Blob | string): Promise<string> {
    if (!genAI) throw new Error('Gemini API no configurado');
    const model = genAI.getGenerativeModel({
        model: MODEL_FLASH,
        generationConfig: { temperature: 0.1 },
    });
    const docPart = await toGeminiPart(source, 'application/pdf');
    const prompt =
        'Extrae TODO el texto legible de este documento, preservando el orden y la estructura ' +
        '(títulos, listas, precios, datos de contacto). Devuelve SOLO el texto, sin comentarios.';
    const result = await model.generateContent([prompt, docPart]);
    return result.response.text().trim();
}

/** Describe an image in natural language for downstream structuring. */
export async function describeImage(source: File | Blob | string): Promise<string> {
    if (!genAI) throw new Error('Gemini API no configurado');
    const model = genAI.getGenerativeModel({ model: MODEL_FLASH });
    const imagePart = await toGeminiPart(source, 'image/jpeg');
    const prompt =
        'Describe minuciosamente esta imagen para un perfil de negocio: ' +
        'qué muestra, nombre/marca visible, productos, precios, datos de contacto, ' +
        'estilo y colores predominantes. Devuelve SOLO la descripción en español.';
    const result = await model.generateContent([prompt, imagePart]);
    return result.response.text().trim();
}

/**
 * Generic structured extraction: run a prompt over arbitrary multimodal parts and
 * return JSON validated against a Zod schema. Throws if Gemini output can't be parsed.
 */
export async function structuredExtract<T>(
    parts: GeminiPart[],
    schema: ZodType<T, ZodTypeDef, unknown>,
    opts?: { systemPrompt?: string; model?: string; temperature?: number }
): Promise<T> {
    if (!genAI) throw new Error('Gemini API no configurado');
    const model = genAI.getGenerativeModel({
        model: opts?.model || MODEL_FLASH,
        systemInstruction: opts?.systemPrompt,
        generationConfig: {
            temperature: opts?.temperature ?? 0.2,
            responseMimeType: 'application/json',
        },
    });

    const result = await model.generateContent(parts as never);
    const text = result.response.text();

    let raw: unknown;
    try {
        raw = JSON.parse(text);
    } catch {
        const match = text.match(/[[{][\s\S]*[\]}]/);
        if (!match) throw new Error('Gemini no devolvió JSON válido');
        raw = JSON.parse(match[0]);
    }

    // LLMs frequently emit `null` for unknown fields; treat those as absent so
    // Zod optionals validate cleanly.
    const parsed = schema.safeParse(stripNulls(raw));
    if (!parsed.success) {
        throw new Error(`Salida de Gemini no cumple el esquema: ${parsed.error.message}`);
    }
    return parsed.data;
}

const GeminiAI = {
    detectProductsInImage,
    generateProductContent,
    generateProductTitle,
    generateProductDescription,
    extractProductAttributes,
    extractProductsFromPDF,
    suggestCategories,
    batchGenerateContent,
    transcribeAudio,
    extractTextFromDocument,
    describeImage,
    structuredExtract,
    toGeminiPart,
    isGeminiConfigured,
};

export default GeminiAI;
