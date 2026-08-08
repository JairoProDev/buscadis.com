# Perfil Vivo Visual 2.0 — presumible sin perder conversión

Fecha: 2026-08-08  
Estado: activo (implementación)

## Problema

El Perfil Vivo 1.0 priorizó ficha útil (SEO, LCP, una CTA) y se siente “directorio”. Los dueños no lo presumén; los mockups IA ganan en deseo (foto, CTAs táctiles, stories, cards).

## Decisión

Actualizar el design system a **Visual 2.0**: más presencia de marca y foto (~70/30 chrome/marca), sin copiar Linktree/dark-gold ni inventar stats.

## Se mantiene

- Una acción primaria en barra sticky (`--mk-accion`)
- Módulos vacíos ocultos
- Métricas verificadas/declaradas honestas (nada “+18K”)
- Arquetipos + handoff `/r/{token}`
- LCP budget; SSR/ISR + JSON-LD
- QR fuera del perfil público

## Cambia

| Área | 2.0 |
|------|-----|
| Hero | Portada ~200px, degradado fuerte, logo 72px, nombre con peso display |
| Acciones | 3 CTAs táctiles (WA verde, llamar marca, llegar outline) + fila secundaria iconos |
| Elevación | Cards producto/promo/reseña con `--el-2`, radios `--rd-lg/xl` |
| Highlights | Anillos 68px cuando hay novedades con imagen |
| Tipografía | Bricolage (display) + Geist (UI/data), swap async |
| Tema | Claro por defecto; oscuro solo si el negocio lo eligió |

## No adoptamos de mockups

QR en perfil, 4 stats inventadas, 20 elementos pelean do en viewport 1, pestañas “3 pantallas”, tres botones saturados que matan la primaria de la barra.

## Checklist presumible

- [ ] Nombre legible al instante
- [ ] Acciones se ven “app”, no admin
- [ ] Catálogo con sombra y precio mono dominante
- [ ] Sin módulos fantasma
- [ ] Dueño diría “esto lo paso por WhatsApp”
- [ ] LCP no se rompe vs baseline demo

## Patrones wow (de mockups + crítica Gemini) — qué sí / qué no

Lo que **sí** hace “instagrameable” (transferible a cualquier rubro):

1. **Identidad como pieza flotante** — logo + nombre en card elevada que solapa la portada (capa, no ficha pegada).
2. **Atmósfera** — fondo con tinte suave de marca / gradiente; no blanco clínico infinito.
3. **Acciones de igual peso visual** — 4 tiles táctiles (ícono + label) con borde/relleno; la jerarquía vive en la barra sticky, no en 3 botones gritando + 2 círculos fantasma.
4. **Estado como pill** — “Abierto ahora · hasta 13:00” en pastilla semántica, no un punto suelto.
5. **Cards de producto con vida** — foto `cover`, precio dominante, CTA corto en card; no caja blanca estéril.
6. **Tipografía display con carácter** — Bricolage en nombre/títulos.
7. **Redes outline** — círculos claros con borde; no blobs de color saturado.
8. **Copy CTA directo** — “Pedir por WhatsApp”, no “Pedir (responden al abrir)” en el botón.

Lo que **no** copiamos (sesgos / Gemini artisanal):

- Cream + terracota + serif “lujo cacao” como default de plataforma
- Mapas teñidos sepia custom (coste alto; enmarcamos el embed)
- Texturas SVG de hojas/cacao en chrome (decoración de mockup, no sistema)
- Stats inventadas / QR en perfil / bottom nav de app

## Archivos

- Spec patches: `docs/tarjetadigitalbuscadis/01`, `05`, `06`
- Código: `packages/perfil-vivo/src/tema/chrome.css` + shells
