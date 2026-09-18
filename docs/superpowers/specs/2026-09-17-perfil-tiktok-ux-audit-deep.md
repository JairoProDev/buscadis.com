# Auditoría UX profunda — Perfil de negocio Buscadis (skin TikTok + doctrina Perfil Vivo)

**Fecha:** 2026-09-17  
**Superficie auditada:** `/v/demo-buscadis` → `TikTokPerfilShell`  
**Contraste:** Gemini (1 captura) · Claude (3 capturas) · código + specs internas · evidencia LatAm 2026  
**Canvas vivo:** abrir junto al chat `perfil-ux-audit-2026.canvas.tsx`

---

## 0. Veredicto (mi perspectiva, no la de Gemini/Claude)

El skin TikTok es un **moodboard de deseo social** que, en el estado actual, **contradice decisiones de producto ya cerradas** en el Master Program de Perfil Vivo (ago 2026):

| Regla Buscadis | Skin TikTok hoy |
|----------------|-----------------|
| D10 / P18: QR **solo** panel dueño | QR en header público |
| Una CTA primaria + sticky (`BarraAccion`) | Mensaje + Seguir 50/50, sin sticky |
| Sin vanity metrics / stats inventadas | Visitas = `contactos30d × 10` |
| Empty-day-1 first; no dark-pattern social proof | Catálogo y reseñas “llenos” de demo SaaS |
| Catálogo = oferta comercial real | 5 “productos” = features de pricing |
| LCP &lt; 1.8s; chrome contenido | ~27 controles antes del primer SKU |

**Gemini** acierta la densidad y el stacking; falla el encuadre (no ve multi-tenant ni doctrina).  
**Claude** acierta confianza, WA y empty states; se equivoca en la math del 4.8 (hay una reseña 4★ en fixture → 29/6 ≈ 4.83).  
**Yo** priorizo: alinear el skin con Perfil Vivo Visual 2.0 + recuperar componentes ya buenos de la plataforma, no inventar un tercer sistema.

---

## 1. Objetivos del perfil (qué debe causar)

Un visitante en &lt; 5 segundos debe responder:

1. **¿Quién es?** (nombre, categoría, ciudad, verificado con criterio)
2. **¿Qué vende?** (catálogo con foto/precio legible above-the-fold)
3. **¿Cómo lo contacto ahora?** (WhatsApp explícito, sticky)

North star de producto (Master Program): *el perfil es la superficie de marketing*; el dueño debe querer compartirlo por WA más que mantener un sitio aparte.

KPIs de diseño:

| Métrica | Meta |
|---------|------|
| Interactivos antes del 1er producto | ≤ 10 |
| Altura hasta grid (390×844) | ≤ 420px |
| Tap rate CTA primario | +30–60% vs baseline |
| Fuga a redes externas | &lt; 3% sesiones |
| LCP | &lt; 1.8s (D9) |
| Test 5s (Cusco, n=10) | ≥ 7/10 saben qué vende + cómo contactar |

---

## 2. P0 — Bloqueantes

### P0-1 — QR en perfil público (viola D10)

- **Evidencia:** `TikTokPerfilShell` botón QR; spec P18: *“QR solo en panel del dueño — no en el perfil público”*; Master Program non-goal: “QR inside the public profile”.
- **Fix:** Quitar del chrome público. Usar `QrMinimalIcon` / QrStudio solo en `/mi-negocio`. Público: back + share (`IconShare` de `BarraAccion` / `IconShareAlt`) + overflow.

### P0-2 — Jerarquía CTA rota + sin sticky

- **Evidencia LatAm:** WA es canal primario de venta SMB (p.ej. Sebrae BR ~72% SMB; interacción negocio &gt;70% en mercados clave; conversacional &gt;&gt; web checkout). Sticky ATC es patrón ecommerce 2026.
- **Evidencia código:** `BarraAccion` ya implementa sticky WA + share; el skin TikTok no la monta.
- **Fix:** Primario `WhatsApp` ~70% ancho; secundarios iconográficos (guardar / más); sticky al salir el CTA del viewport.

### P0-3 — Catálogo que no es catálogo

- **Evidencia:** `demo-buscadis.ts` productos = Free/Pro/IA/QR — pricing page.
- **Fix:** Demo con SKUs reales (o pack comercial claro en sección Planes). El perfil plantilla **enseña** a los inquilinos qué poner.

### P0-4 — Credibilidad de datos

- Dirección Javier Prado / Surco en seed (Buscadis ≈ Cusco/LATAM).
- Reseñas con copy de landing; UI no muestra fechas (existen en data).
- Math 4.8: **sí cuadra** (5+5+5+4+5+5)/6 ≈ 4.83 — Claude exageró; igual falta histograma.
- **Fix:** Ubicación real o módulo omitido si digital; fechas + histograma P10; empty state honesto si 0.

### P0-5 — Hick: ~27 controles pre-producto

Header 4 + CTAs 2 + sociales 8 + highlights 4 + tabs 5 + search + chips 5+ ≈ **27**.  
**Fix:** ≤ 10; sociales → Info; highlights solo si contenido real; tabs 3; search si ≥ 12 ítems.

---

## 3. Detalle por capa (completo)

### 3.1 Tipografía e iconografía (pedido explícito del founder)

| Elemento | Hoy | Problema | Decisión |
|----------|-----|----------|----------|
| `.tt-name` | `letter-spacing: -0.035em` | Nombre “apagado”, sin aire | `letter-spacing: 0` a `+0.01em`; display Bricolage (Visual 2.0) |
| Share | SVG custom “flecha curva” | No es el de la plataforma | Reusar path de `BarraAccion` IconShare o `IconShareAlt` |
| QR | SVG grid improvisado | Ilegal en público + feo | `QrMinimalIcon` solo dueño |
| Tabs icons | Mezcla genérica | “Novedades” poco claro | 3 tabs; labels holgados; contador en Reseñas |

### 3.2 Header / cover

- Scrim más fuerte + círculos `bg-black/32` detrás de iconos (covers arbitrarios).
- Título “Buscadis” en top: oculto en scroll 0 (patrón X/Airbnb); evita colisión con cover.
- Cover: **prohibir tipografía quemada** (OG actual con OFERTAS + fila EMPLEOS es ruido confuso con highlights). Asset 3:1, safe area documentada en uploader.
- Stock “gente señalando teléfono” → percepción low-trust en LatAm; preferir foto real de comercio o textura de marca.

### 3.3 Identidad

- Avatar 84px (hoy ~92–112).
- Categoría chip **debajo** del nombre, tappable → browse categoría (hoy MARKETPLACE tapado).
- Si handle ≈ nombre, ocultar handle; usar línea para `Responde ~12 min`.
- Verificado → bottom sheet con criterio D11; si no hay criterio público, quitar check.

### 3.4 Métricas

Sustituir Visitas públicas por trío de confianza:

`4.8★ (6)` · `Responde ~12 min` · `Verificado` / `Miembro desde`

Visitas → dashboard dueño (P14).

### 3.5 Bio / horario

- Tagline ≤ 60 caracteres (campo dedicado); resto en Info.
- Framing: `Abre mañana 9:00` (no liderar con “Cerrado”).
- Condicional por arquetipo: digital puro → no módulo horario.

### 3.6 Sociales

- WA ya es CTA → no repetir con mismo peso en fila.
- Resto monocromo outline → Info o chip `+N enlaces`.
- Motivo: **leak de tráfico** &gt; tamaño táctil (44pt Apple OK; problema es producto).

### 3.7 Highlights

- Solo si hay novedad con imagen real (P16).
- Nunca screenshot del banner ni logo×2.
- Si son atajos: chips, no círculos (Jakob: círculo = story).

### 3.8 Tabs

**Catálogo | Info | Reseñas (n)**  

- Novedades → chip `Nuevos` o feed secundario, no 5º tab competidor.
- Guardados → bookmark en header (propiedad del visitante), no tab del negocio ajeno.

### 3.9 Catálogo / cards

- 2 columnas si hay título+precio; 3 solo imagen pura.
- Un badge; precio tipográficamente dominante; sin “Gratis” duplicado.
- Fallback determinístico por categoría (no HSL arcoíris).
- Buscador solo si ≥ 12 ítems; chips: una dimensión + `Ordenar`; fade + medio chip visible.

### 3.10 Info / Reseñas

- Info: mapa estático, RUC si aplica, pagos, cobertura, redes movidas aquí; horario colapsado “hoy + ver todos”.
- Reseñas: histograma obligatorio; fechas; reply dueño; empty state; “verificado” explicado.

### 3.11 FAB “N”

- Next.js dev overlay en demos — no shippear; si hay chat real → bottom-right + padding lista.

---

## 4. Qué recuperar de otras versiones (no tirar)

| Origen | Recuperar | Por qué |
|--------|-----------|---------|
| `BarraAccion.tsx` | Sticky WA + IconShare | Fitts + Peak-End ya resueltos |
| `QrMinimalIcon` + P18 | QR dueño | D10 |
| Visual 2.0 spec | Logo 72px, Bricolage+Geist, redes outline, pill estado | Presumible sin matar conversión |
| `BusinessActionBar` / `BusinessShareTools` | `IconShareAlt`, kit share | Consistencia plataforma |
| P07 | Product sheet + peek | Mejor que grid “TikTok video” |
| P10 | Distribución + reply + captura | Confianza |
| P05 | Live strip respuesta | Métrica que convierte |
| Legacy storefront | Handoff WA medido `/r/{token}` | Analytics reales |

---

## 5. Sistema de diseño (tokens mínimos)

**Espaciado (escala 4):** 4, 8, 12, 16, 24, 32, 48 — intra grupo 16 / inter 32.  

**Tipo (máx 5 roles):** Display 24/700 · Title 16/600 · Body 14/400 · Label 13/600 · Caption 12/400.  

**Color:** un acento `#53ACC5` = **solo** acción primaria / estado activo. Neutros 6 escalones. Semánticos: verde abierto, ámbar warn, rojo error.  

**Radios:** 8 chips/botones · 12 cards · 999 pills/avatar.  

**Elevación:** border 1px neutral; sombra solo sticky/sheet/FAB.  

**Touch:** hit area ≥ 44×44 (Apple HIG); visual puede ser 24px con hit-slop.

---

## 6. SEO / AEO

- Cover sin texto quemado → indexable vía HTML, no JPG.
- JSON-LD LocalBusiness: dirección real o omitir; no Surco seed.
- Productos con `Product` schema y precio (P17).
- Un H1 = nombre negocio; no duplicar “Buscadis” en chrome visible scroll 0.
- LCP: no cargar 8 PNGs de redes above-fold si se mueven a Info.

---

## 7. Wireframe objetivo (resumen)

```
[←]                    [share] [···]     // scrim; sin QR; título al scroll
COVER 3:1 limpia
Logo84  Nombre  ✓
Marketplace · Ciudad     // chip
4.8★(6) · ~12min · 2024
Tagline 60c
[ WhatsApp 70% ] [♡] [···]
—— Catálogo | Info | Reseñas 6 ——  sticky
chips + ordenar
grid 2col (precio dominante)
—— sticky: Desde S/ · [WhatsApp] ——
```

Altura estimada hasta producto: ~410px (hoy ~590+).

---

## 8. Sprints

### S0 — Credibilidad (2–4 h)
1. Quitar QR público  
2. Iconos share/plataforma; letter-spacing nombre  
3. Scrim header; título al scroll  
4. Seed ubicación + fechas reseña en UI  
5. Documentar violación D10 cerrada  

### S1 — Conversión (1–2 d)
6. CTA WhatsApp 70% + sticky `BarraAccion`  
7. Tabs → 3; sociales → Info  
8. Highlights: quitar o contenido real  
9. Métricas: quitar Visitas públicas  

### S2 — Catálogo amor (2–3 d)
10. Demo SKUs reales / planes separados  
11. Grid 2col + anatomía card + fallbacks  
12. Search condicional; histograma reseñas  

### S3 — Sistema (1 sprint)
13. Tokens + tipografía Visual 2.0  
14. Módulos por arquetipo  
15. Cover validator + SEO JSON-LD  
16. Perf LCP + CLS  

---

## 9. Tabla maestra Quitar / Mover / Agregar / Modificar

Ver canvas interactivo para la vista compacta. Destacados:

**Quitar:** QR público, Seguir peso igual (o degradar), Visitas públicas, Guardados tab, Novedades como tab competidor (o fusionar), highlights basura, buscador con &lt;12, tipografía en cover, Destacado en &gt;20% cards.

**Mover:** Sociales → Info; horario condicional; CTA → sticky; visitas → dashboard.

**Agregar:** Sticky WA, histograma, fechas, sheet verificado, mapa estático, empty states, skeletons, fade chips.

**Modificar:** Letter-spacing nombre; iconos; grid 2col; copy `WhatsApp`; framing horario; tabs 3.

---

## 10. Qué no hacer

- No “arreglar” solo estética del skin TikTok sin volver a D1–D14.
- No copiar Instagram Highlights sin efímeros reales.
- No exponer vanity metrics que humillen al 90% de inquilinos.
- No poner checkout web como primaria en LatAm si el negocio vive de WA.
- No inventar un cuarto design system: extender Visual 2.0 + tokens existentes.

---

## 11. Apéndice — hallazgos de exploración paralela (2026-09-17)

### 11.1 Inventario código ([Audit perfil skins código](1303cf50-9067-4c8f-9c3d-a6859246bb1b))

- Skin TikTok = monolito ~905 LOC TSX + ~1280 CSS; **14 SVGs inline** que no usan `components/Icons.tsx` / `QrMinimalIcon`.
- Share/QR “correctos” del producto: `IconShareAlt` + `IconQrcode` → `QrMinimalIcon`; también path share en `BarraAccion`.
- Seed: 4/5 productos a S/0; thumbs SVG; FAQs/reseñas meta-SaaS; `conteos.resenas: 8` vs 6 reseñas reales.
- **SEO gap crítico del skin:** no emite JSON-LD (`BusinessJsonLd` solo en V2); sin `OpeningHoursSpecification` / `geo` aunque el payload tiene datos; FAQ accordion sin `FAQPage` schema.
- Recuperables V2/wireframe: `QrProfileModal` (dueño), commerce dock, `ProfileStickyCta`, `BusinessSocialStrip`, block engine.

### 11.2 Benchmarks industria 2024–26 ([Research 2026 profile UX](847f59f1-1a2f-4597-afbb-a6f3bfb64a90))

- Instagram: **un** action button visible → priorizar una CTA.
- TikTok Shop: shop entry en perfil; **3 piezas fijadas** (bienvenida / prueba / oferta) — copiar función, no UI.
- Highlights: copiar *shelves evergreen* (`Cómo comprar · Reseñas · Envíos · FAQs`), no círculos vacíos.
- Trust strip compacta: rating + count + verificado + tiempo WA (separar negocio verificado ≠ compra/contacto verificado).
- WA LatAm: canal de cierre práctico (a menudo pago fuera: Yape/Pix/link); GBP ya permite WA como contacto.
- Touch: 44–48px reales; above-fold: nombre + trust + 1–2 CTA + ≤4 quick links + peek catálogo.

### 11.3 Recuperar de versiones previas ([Recover prior profile UX](baa252f9-3f87-4262-bc0f-643d1bd18859))

| Tier | Recuperar |
|------|-----------|
| 1 | Tipografía Geist/Bricolage (`tema/chrome.css`); `UbicacionHorarioShell` OSM + estado vivo; `CatalogoShell` sheet + filtros; `BarraAccion` + cart; JSON-LD |
| 2 | `PagoShell` tiles; FAQ `<details>`; empty states; chrome scroll-aware; hero overlap |
| 3 | Highlights solo con imagen real; feed; follow localStorage |

Arquitectura recomendada del agente: **base Perfil Vivo + módulos**, no tercer monolito TikTok.

---

## 12. Fuentes

**Internas:**  
`docs/superpowers/specs/2026-08-08-perfil-vivo-master-program-design.md`  
`docs/superpowers/specs/2026-08-08-perfil-vivo-visual-2-design.md`  
`docs/superpowers/specs/2026-08-08-perfil-vivo-p18-kit-share-design.md`  
`packages/perfil-vivo/src/skins/tiktok/*`  
`packages/perfil-vivo/src/modulos/BarraAccion.tsx`  
`packages/perfil-vivo/src/fixtures/demo-buscadis.ts`  
`components/icons/QrMinimalIcon.tsx`  
`lib/business/seo.ts` · `BusinessJsonLd`

**Externas:** Apple HIG 44pt; WCAG 2.2 target size; Instagram 1 action button; TikTok Shop/Showcase; WhatsApp Business catalog; Mercado Libre seller reputation; GBP WhatsApp contact; OmniChat / Opinion Box / PCMI LatAm commerce.

---

## 13. Próximo paso recomendado

Implementar **S0 + S1** reusando `BarraAccion` + iconos de plataforma + quitar QR público; en paralelo wire JSON-LD al route `/v/[slug]` para demos indexables cuando toque. Validar con test 5s + scroll depth al catálogo antes de S2.
