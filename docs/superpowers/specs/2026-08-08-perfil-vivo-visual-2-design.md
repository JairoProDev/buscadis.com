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

## Archivos

- Spec patches: `docs/tarjetadigitalbuscadis/01`, `05`, `06`
- Código: `packages/perfil-vivo/src/tema/chrome.css` + shells
