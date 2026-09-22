# Publish Studio inmersivo — Design Spec

**Fecha:** 2026-09-22  
**Estado:** Aprobado para implementación

---

## 1. Tesis

- CTA principal: **Publicar en Buscadis** (siempre gratis).
- Pago: beneficios extra (fotos, duración, boost, IA premium), nunca muro.
- Descargar: extra + **auto-descarga al publicar** (TikTok).
- Happy path: foto + voz → IA → 2–4 preguntas → publicar.
- Modos complementarios: Capture | Formulario | Plantilla | Diseño (un solo `PublishDraft`).

## 2. Comparativa

Tomar: TikTok (full-bleed, X, auto-download), IG Stories (canvas), Canva (plantillas), ML form (estructura).  
No copiar: menú Crear multi-tipo, CTA rosa/amarillo discordante, Canva-desktop steps.

**Océano azul:** clasificado listo en ~30s con foto+voz + portada + datos estructurados para discovery.

## 3. Shell `/publicar`

- Sin Header / NavbarMobile / LeftSidebar.
- Solo X → `/` o `router.back()`.
- Full-bleed (sin `max-w-xl` / gutters).
- Stage captura + barra inferior; detalle en sheets.

## 4. CTA nav global

- Fill: azul de acción (`--bs-action` / brand-blue), ícono/label blanco.
- Amarillo solo para upsell “promocionado”.

## 5. Flujos y modos

Ver plan adjunto. Capture default; Formulario / Plantilla / Diseño como switcher.

## 6. Monetización

Gratis: 1 foto o flyer, 24h, publicar + auto-download.  
Pago: más fotos/días, boost, enhance, flyer HD.

## 7. Métricas de éxito

- Sin chrome en `/publicar`.
- CTA Publicar no amarillo.
- Foto+voz → ≤4 preguntas → Publicar gratis.
- Auto-download al publicar.
- Modos sin perder borrador.
