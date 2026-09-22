# Buscador Buscadis — UX Design Spec

**Fecha:** 2026-09-22  
**Estado:** Aprobado para implementación  
**Alcance:** Experiencia completa (chrome + flujos + zero-results + analytics)

---

## 1. Problema

En home (`searchOnly`) el composer muestra **dos lupas**: una decorativa a la izquierda (`FaSearch`) y otra en el CTA azul. Eso viola el patrón de toda referencia seria (Mercado Libre, Amazon, Airbnb, Bing, TikTok) y satura la barra móvil junto a embudo, mic y lens.

Además: sugerencias de query solo rellenan, voz/visual no ejecutan, no hay historial al focus vacío, y `alternativeQueries` del API no llega a la UI.

---

## 2. Investigación comparativa

| Plataforma | Señal buscar | Secundarios | Filtros | Lección |
|---|---|---|---|---|
| Mercado Libre | 1 lupa derecha | — | Fuera | Modelo mental LatAm |
| Amazon | 1 lupa en botón contraste | — | Categoría en barra | CTA claro |
| Airbnb | Lupa + “Search” | Facetas Where/When/Who | En composer | Una acción |
| Booking | Texto “Search” | Segmentado | Fuera | Filtros ≠ input |
| Google / Bing | 1 CTA | Mic + Lens | N/A | Modalidades OK a la derecha |
| FB Marketplace | 1 lupa en input | — | Sidebar | Contexto marketplace |
| TikTok | “Buscar” texto | Cámara | — | CTA textual móvil |
| Craigslist | 1 lupa botón | — | Chips debajo | Densidad baja |

**Patrón elegido:** híbrido Mercado Libre + Google.

```
[ campo …  (X si hay texto)  | mic | lens | CTA lupa ]
```

Filtros fuera de la barra (toolbar).

---

## 3. Diseño ideal

### 3.1 Rol
Marketplace + red social local. Confianza ML, descubrimiento FB Marketplace, voz/visual como diferencial sin ruido.

### 3.2 Anatomía chrome
1. Campo — placeholder “Buscar ofertas y oportunidades…”
2. Clear (X) — solo con texto
3. Divider
4. Mic
5. Lens
6. CTA — lupa móvil; lupa + “Buscar” desde `sm`
7. **Nunca** lupa izquierda si hay CTA primario
8. Embudo — toolbar (junto a conteo / vistas), no dentro del input

Home: `searchOnly` (Publicar en nav). Dual composer solo fuera de home.

### 3.3 Flujos

| Camino | Comportamiento |
|---|---|
| Focus vacío | Recientes (localStorage) + Populares (API) |
| Escribir ≥2 | Anuncios + búsquedas |
| Tap anuncio | Abrir detalle + `suggest_click` |
| Tap query | Fill + **submit** + `suggest_click` |
| Enter / CTA | Submit |
| Voz OK | Fill + **auto-submit** |
| Visual OK | Fill + categoría opcional + **auto-submit** |
| Clear | Vacía; reset si había `?buscar=` |
| 0 resultados | `alternativeQueries` + limpiar filtros + publicar demanda |

### 3.4 Qué no hacer
- Segunda lupa decorativa
- Embudo dentro de la barra
- Dual Publicar en home
- Ghost-text visual en v1 (Tab completion sí se mantiene)

### 3.5 Analytics
Eventos en `lib/search/analytics.ts`:
- `search.submit`
- `search.suggest_impression`
- `search.suggest_click`
- `search.zero_results`

### 3.6 A11y
- `aria-expanded` / `aria-controls` en el campo ↔ listbox
- Live region al escuchar voz
- Targets ≥44px en acciones

### 3.7 Métricas de éxito
- 0 pantallas con dos lupas
- Suggest query ejecuta búsqueda
- Voz/visual → resultados sin segundo toque
- Focus vacío muestra recientes si existen
- Eventos suggest/zero en analytics
- Móvil: ≤3 acciones a la derecha (mic, lens, CTA)

---

## 4. Gaps actuales → ideal

| Área | Hoy | Ideal |
|---|---|---|
| Lupas | 2 | 1 |
| Filtro | En barra | Toolbar |
| Query suggest | Solo fill | Submit |
| Voz/visual | Solo fill | Auto-submit |
| Focus vacío | Nada | Historial + populares |
| Clear X | No | Sí |
| Zero results | Genérico | + alternativas |
| Analytics | Solo submit | + impression/click/zero |

### Archivos
- `components/Buscador.tsx`
- `components/search/MarketplaceSearchComposer.tsx`
- `components/search/SearchSuggestionsDropdown.tsx`
- `components/search/useSearchSuggestions.ts`
- `lib/search/recent-searches.ts` (nuevo)
- `components/HomePageClient.tsx`
- `components/BrowseEmptyState.tsx`
- `app/api/search/suggest/route.ts` / `lib/search/suggest.ts`

---

## 5. Fuera de alcance
- Dual composer en home
- Typesense sync / merge catálogo server-side
- `PlatformCommandPalette`
- Ghost autocomplete visual
