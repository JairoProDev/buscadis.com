# Imágenes Open Graph por categoría (Buscadis)

Sube **8 archivos PNG** en esta carpeta. WhatsApp, Facebook e iMessage usan estas imágenes al compartir links como:

- `https://buscadis.com/?categoria=productos`
- `https://buscadis.com/categoria/productos`

## Archivos requeridos (nombres exactos)

| Archivo | Categoría |
|---------|-----------|
| `empleos.png` | Empleos |
| `inmuebles.png` | Inmuebles |
| `vehiculos.png` | Vehículos |
| `servicios.png` | Servicios |
| `productos.png` | Productos |
| `eventos.png` | Eventos |
| `negocios.png` | Negocios |
| `comunidad.png` | Comunidad |

## Especificaciones técnicas

- **Tamaño:** 1200 × 630 px (ratio 1.91:1)
- **Formato:** PNG (calidad 85–90%) o PNG
- **Peso:** ideal &lt; 300 KB por imagen
- **Zona segura:** deja márgenes ~80 px; el texto no debe tocar los bordes (WhatsApp recorta esquinas)

Los textos del preview (título y descripción) ya están en código (`lib/seo/category-metadata.ts`). La imagen solo necesita refuerzo visual por categoría + marca Buscadis discreta.

## Verificar después de subir

```bash
ls -la public/og/categories/*.png
```

Luego comparte el link en WhatsApp y espera ~1 min (caché de OG). Si no actualiza, prueba con:

`https://developers.facebook.com/tools/debug/` pegando la URL.
