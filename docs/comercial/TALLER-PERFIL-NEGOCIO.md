# Taller: de cuenta a perfil de negocio (facilitador)

## Enlace para proyectar / QR

**QR corto (recomendado):**  
`https://www.buscadis.com/taller`

**URL completa:**  
`https://www.buscadis.com/mi-negocio/crear?taller=1`

> **Compartir vs. publicar:** el enlace `/v/tu-negocio` funciona para WhatsApp e Instagram en cuanto Adis arma el perfil. “Publicar” en el buscador de Buscadis puede requerir plan; no bloquea el taller.
>
> Solo para pruebas internas del día: `PUBLISH_DEV_BYPASS=true` en Vercel (no dejar en producción permanente).

## Fase 1 — Descarga y cuenta (~5 min)

1. Play Store → **Buscadis** → instalar.
2. Abrir → **Continuar con Google** (un toque).
3. Mensaje clave: *“No es otra red social vacía: es tu vitrina + catálogo + WhatsApp en un solo enlace.”*

## Fase 2 — El momento wow (~10 min)

1. Todos abren el enlace de arriba (o **Mi negocio → Crear** en la app).
2. **Micrófono**: 30–45 s contando qué venden, dónde están y su WhatsApp.
   - Alternativa: escribir 2–3 líneas o pegar link de Facebook/Instagram.
   - Opcional: 1–3 fotos de productos o del local.
3. Pestaña **«Mi página»** — así verán tus clientes.
4. **Compartir enlace** (WhatsApp, Instagram o copiar al portapapeles).

### Frase para el salón

> “En Instagram tardas media hora en armar la bio, los highlights y el link. Aquí hablas 30 segundos y ya tienes página con catálogo.”

## Fase 3 — Afinar (quien termine rápido)

- **Afinar en editor** → cambiar colores, más fotos, catálogo.
- Guía clásica (si alguien prefiere): `?modo=guia`

## Si falla la IA

- Verificar que iniciaron sesión con Google.
- Probar solo **texto** (sin audio) primero.
- Fallback: `?modo=guia` paso a paso.

## Requisito producción

`GOOGLE_GEMINI_API_KEY` configurada en Vercel para `/api/business/ai-builder`.
