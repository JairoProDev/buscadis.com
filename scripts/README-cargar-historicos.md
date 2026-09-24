# Script de Carga Masiva de Adisos Históricos

Este script procesa y carga adisos históricos desde archivos TXT organizados en carpetas.

## Estructura de Archivos

```
/home/jairoprodev/proyectos/adisos-processing/procesamiento/04-anuncios-separados/
├── R2538-Jun20-26/
│   ├── pagina-01.txt
│   ├── pagina-02.txt
│   └── ...
├── R2539-Jun27-30/
│   └── ...
└── ...
```

**Formato de cada línea en los archivos TXT:**
```
NÚMERO. TÍTULO: DESCRIPCIÓN
```

Ejemplo:
```
1. BUSCO DEPARTAMENTO EN ALQUILER: NECESITO UN DEPARTAMENTO MODERNO: Ubicado en zonas como: Marcavalle, Magisterio, Manuel Prado o cerca de la Plaza De Armas de cusco. Requisitos: de 3 habitaciones, 3 o 2 baños completos. Si tienes alguna propiedad disponible. No dudes en contactarme a los Cels. 981813470, 930234266.
```

## Características del Script

- ✅ Parsea automáticamente título y descripción separados por ":"
- ✅ Extrae números de teléfono (9 dígitos empezando con 9)
- ✅ Extrae emails
- ✅ Detecta si es WhatsApp o teléfono normal
- ✅ Limpia la descripción removiendo información de contacto
- ✅ Detecta categoría automáticamente (empleos, inmuebles, vehículos, etc.)
- ✅ Marca adisos como históricos (`esHistorico: true`)
- ✅ Marca como no contactables (`estaActivo: false`)
- ✅ Carga en lotes de 100 para optimizar rendimiento
- ✅ Maneja errores y duplicados

## Uso

### Probar con una carpeta específica
Es necesario especificar el año (`--anio`) ya que las carpetas no lo incluyen.
También puedes limitar el número de archivos para probar (`--limit`).

```bash
npx tsx scripts/cargar-adisos-historicos.ts --carpeta=R2538-Jun20-26 --anio=2024 --limit=3
```

### Probar sin cargar (dry-run)

```bash
npx tsx scripts/cargar-adisos-historicos.ts --carpeta=R2538-Jun20-26 --anio=2024 --limit=3 --dry-run
```

### Cargar todas las carpetas (Asume año actual si no se especifica)

```bash
npx tsx scripts/cargar-adisos-historicos.ts --todas --anio=2024
```

## Parámetros

- `--carpeta=NOMBRE`: Procesa solo una carpeta específica
- `--todas`: Procesa todas las carpetas encontradas
- `--dry-run`: Solo procesa y muestra estadísticas, NO carga a Supabase
- `--anio=YYYY`: Año origen de los datos (Requerido para la fecha correcta, por defecto año actual)
- `--limit=N`: Procesa solo los primeros N archivos (Útil para pruebas)

## Proceso de Carga

1. **Lectura**: Lee todos los archivos .txt de la(s) carpeta(s)
2. **Parseo**: Cada línea se parsea como "TÍTULO: DESCRIPCIÓN"
3. **Extracción**: Extrae números de teléfono y emails de la descripción
4. **Limpieza**: Remueve contactos de la descripción
5. **Detección**: Detecta categoría automáticamente
6. **Creación**: Crea objetos Adiso con:
   - `esHistorico: true`
   - `estaActivo: false` (no contactable directamente)
   - `fuenteOriginal: 'rueda_negocios'`
   - `edicionNumero`: Extraído del nombre de carpeta
   - Contactos en `contactosMultiples`
7. **Carga**: Inserta en Supabase en lotes de 100

## Sistema de Intereses

Cuando un usuario intenta contactar un adiso histórico:

1. Se registra el interés en `intereses_anuncios_caducados`
2. Se muestra mensaje: "Este es un anuncio histórico. Hemos registrado tu interés y notificaremos al anunciante. Si decide republicar su anuncio oficialmente, podrás contactarlo directamente o le pasaremos tu información de contacto."
3. El anunciante puede:
   - Ver los intereses registrados
   - Pagar para republicar su anuncio
   - Recibir información de contactos interesados

## Estadísticas

El script muestra:
- Total de carpetas procesadas
- Total de archivos procesados
- Total de líneas leídas
- Adisos procesados exitosamente
- Adisos cargados a Supabase
- Errores (si los hay)

## Notas Importantes

- ⚠️ Los adisos históricos NO son contactables directamente
- ✅ Los usuarios pueden registrar interés
- ✅ El anunciante puede republicar pagando
- ✅ Se pueden pasar datos de contactos interesados al anunciante

## Solución de Problemas

### Error: "Faltan variables de entorno"
Asegúrate de tener `.env.local` con:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Error: "Carpeta no encontrada"
Verifica que la ruta en `CARPETAS_BASE` sea correcta.

### Errores de duplicados
El script maneja duplicados automáticamente, intentando insertar uno por uno si falla el lote.

---

# Script de Exportación a CSV

Si tienes problemas de conexión o prefieres cargar los datos manualmente a través del dashboard de Supabase, puedes usar el script de exportación a CSV.

Este script realiza **exactamente el mismo procesamiento** (parseo, limpieza, detección de categoría, etc.) pero guarda el resultado en un archivo CSV compatible con la importación de Supabase.

## Mejoras del Script v2.0

### ✨ Detección Inteligente de Categorías por Página

El script ahora utiliza la estructura conocida de la revista para mejorar la precisión:

- **Páginas 2-6**: Inmuebles (alquileres, ventas, terrenos, locales)
- **Páginas 7-14**: Empleos (convocatorias, vacantes, personal)
- **Página 15**: Mixto (empleos en primera mitad, luego variado)
- **Páginas 1 y 16**: Detección automática por contenido

### 🛡️ Filtrado de Contenido Editorial

Automáticamente filtra:
- Recomendaciones de la revista (ej: "COMO EVITAR ESTAFAS INMOBILIARIAS")
- Adisos institucionales
- Contenido sin información de contacto

### 📏 Tamaño Automático

- **Pequeño**: Por defecto para históricos (contenido < 250 caracteres)
- **Mediano**: Para adisos más largos (> 400 caracteres)

### 📊 Estadísticas Detalladas

El script muestra:
- Total de adisos procesados
- Adisos filtrados (editorial/spam)
- Distribución por categoría
- Errores encontrados

## Uso

### Exportar una carpeta específica

```bash
npx tsx scripts/exportar-adisos-csv.ts --carpeta=R2538-Jun20-26 --anio=2024
```

### Exportar TODAS las carpetas (47 revistas)

```bash
npx tsx scripts/exportar-adisos-csv.ts --todas --anio=2024
```

### Probar con límite de archivos

```bash
npx tsx scripts/exportar-adisos-csv.ts --carpeta=R2538-Jun20-26 --anio=2024 --limit=3
```

## Importar en Supabase

1. Ve a tu proyecto en Supabase -> **Table Editor**.
2. Selecciona la tabla `adisos`.
3. Haz clic en **Insert** -> **Import Data from CSV**.
4. Sube el archivo `.csv` generado (ubicado en la raíz del proyecto).
5. Asegúrate de que las columnas coincidan (el script usa los nombres exactos de la base de datos).
6. Haz clic en **Import data**.

El archivo CSV maneja correctamente los campos complejos como JSON y saltos de línea.

## Ejemplo de Resultado

Procesando las 47 carpetas completas:
- **Total adisos**: ~22,000+
- **Inmuebles**: ~10,600
- **Empleos**: ~10,300
- **Servicios**: ~1,100
- **Negocios**: ~335
- **Productos**: ~73
- **Vehículos**: ~25
- **Eventos**: ~1
- **Filtrados**: ~52 (contenido editorial)



