# Plan de Mejora del Chatbot - Opción Rápida

## Problemas Actuales

1. **Detección de intención muy básica** - Solo busca palabras clave
2. **No extrae términos de búsqueda** - Busca el mensaje completo
3. **Búsqueda TOON limitada** - PostgreSQL FTS básico
4. **Sin filtros inteligentes** - No detecta categoría/ubicación automáticamente

## Mejoras Rápidas (Sin IA Externa)

### 1. Extractor de Términos Inteligente

```typescript
function extraerTerminosBusqueda(mensaje: string): {
  terminos: string[];
  categoria?: Categoria;
  ubicacion?: string;
  filtros: any;
} {
  const texto = mensaje.toLowerCase();
  
  // Remover palabras de relleno
  const stopWords = ['quiero', 'busco', 'necesito', 'me', 'interesa', 'un', 'una', 'el', 'la', 'en', 'de', 'para'];
  const palabras = texto.split(' ').filter(p => !stopWords.includes(p));
  
  // Detectar categoría
  const categoria = extraerCategoria(mensaje);
  
  // Detectar ubicación
  const ubicacion = extraerUbicacion(mensaje);
  
  // Términos clave
  const terminos = palabras.filter(p => p.length > 3);
  
  return { terminos, categoria, ubicacion, filtros: {} };
}
```

### 2. Búsqueda Multi-Campo

```typescript
async function buscarMejorada(consulta: string) {
  const { terminos, categoria, ubicacion } = extraerTerminosBusqueda(consulta);
  
  let query = supabase
    .from('adisos')
    .select('*')
    .eq('esta_activo', true);
  
  // Filtrar por categoría si se detectó
  if (categoria) {
    query = query.eq('categoria', categoria);
  }
  
  // Filtrar por ubicación si se detectó
  if (ubicacion) {
    query = query.ilike('ubicacion', `%${ubicacion}%`);
  }
  
  // Buscar en título y descripción
  if (terminos.length > 0) {
    const terminosBusqueda = terminos.join(' | ');
    query = query.or(`titulo.ilike.%${terminosBusqueda}%,descripcion.ilike.%${terminosBusqueda}%`);
  }
  
  return query.limit(10);
}
```

### 3. Ranking por Relevancia

```typescript
function rankearResultados(resultados: Adiso[], terminos: string[]): Adiso[] {
  return resultados
    .map(adiso => {
      let score = 0;
      const textoCompleto = `${adiso.titulo} ${adiso.descripcion}`.toLowerCase();
      
      // Puntos por término en título (más importante)
      terminos.forEach(termino => {
        if (adiso.titulo.toLowerCase().includes(termino)) score += 10;
        if (adiso.descripcion?.toLowerCase().includes(termino)) score += 5;
      });
      
      // Bonus por adisos recientes
      const diasDesdePublicacion = daysSince(adiso.fechaPublicacion);
      if (diasDesdePublicacion < 7) score += 3;
      
      return { adiso, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ adiso }) => adiso);
}
```

## Implementación

### Archivos a Modificar:

1. **`app/api/chatbot/procesar/route.ts`**
   - Agregar `extraerTerminosBusqueda()`
   - Mejorar detección de intención
   - Usar búsqueda multi-campo

2. **`lib/busqueda-toon.ts`** (o crear `lib/busqueda-mejorada.ts`)
   - Implementar búsqueda multi-campo
   - Agregar ranking por relevancia
   - Agregar detección de sinónimos básicos

3. **Opcional: Crear diccionario de sinónimos**
   ```typescript
   const sinonimos = {
     'casa': ['vivienda', 'hogar', 'residencia'],
     'departamento': ['depa', 'flat', 'apartamento'],
     'barato': ['económico', 'accesible', 'bajo costo']
   };
   ```

## Ventajas de Esta Opción

✅ No requiere API externa (gratis)
✅ Implementación rápida (1-2 horas)
✅ Mejora significativa en precisión
✅ Control total sobre la lógica

## Desventajas

❌ No entiende lenguaje natural complejo
❌ Requiere mantenimiento manual de sinónimos
❌ Limitado a patrones predefinidos
