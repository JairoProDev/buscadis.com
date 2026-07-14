# Guía técnica experta — `buscadis.com`

> Para **ti** (dueño del código): entender carpetas, archivos, extensiones, front/back, estilos, integraciones y el “por qué” de cada zona.  
> Complemento no técnico: `docs/GUIA-PROYECTO-PARA-SOCIOS.md`  
> Mapa Publicadis externo: `docs/PUBLICADIS-MAPA.md`

---

## 0. Lectura rápida (mapa mental)

```
Navegador (React UI)
    │
    ├─ pages/UI ─────────────── app/* + components/*
    ├─ estado cliente ──────── contexts/ + hooks/
    ├─ lógica de dominio ───── lib/*
    ├─ llamadas HTTP ────────── fetch → app/api/*
    │                              │
    │                              ├─ Supabase (Postgres + Auth + Storage)
    │                              ├─ OpenAI / Gemini / Replicate (IA)
    │                              ├─ Resend, MercadoPago, Sentry, Vercel Analytics…
    │                              └─ Typesense / crons / mobile bridge
    └─ estáticos ────────────── public/
```

**Stack base:** Next.js 15 (App Router) + React 18 + TypeScript + Tailwind + Supabase.

Esto es un **monolito full-stack**: el “front” y el “back” viven en el **mismo repo**.  
El back no es un servidor Express separado: son **Route Handlers** en `app/api/**/route.ts`.

---

## 1. Extensiones: qué significa cada una

| Extensión | Qué es | Dónde la ves |
|-----------|--------|--------------|
| `.tsx` | TypeScript + JSX (React). UI con tipado. | `components/`, `app/**/page.tsx`, hooks UI |
| `.ts` | TypeScript puro (sin HTML/JSX). Lógica, APIs, utilidades. | `lib/`, `app/api/**/route.ts`, `types/` |
| `.js` / `.mjs` | JavaScript (scripts o configs). `.mjs` = módulos ES nativos. | `scripts/*.mjs`, algunos scripts legacy |
| `.css` | Estilos globales / CSS variables. | `app/globals.css` |
| `.json` | Datos / config / manifests. | `package.json`, `messages/`, seeds |
| `.sql` | SQL de base de datos. | `supabase/migrations/`, `sql/` |
| `.md` | Documentación. | `docs/`, `README.md` |
| `.env.local` | Secretos locales (no se sube a Git). | raíz |
| `.env.example` | Plantilla de variables sin secretos. | raíz |
| `.webmanifest` / icons | PWA / favicons. | `public/` |

**Alias de imports:** `@/` = raíz del proyecto.  
Ejemplo: `import { supabase } from '@/lib/supabase'` → archivo `lib/supabase.ts`.

---

## 2. Árbol de la raíz (qué es cada carpeta/archivo)

```
buscadis.com/
├── app/                 # RUTAS Next.js (páginas + API)  ← corazón del routing
├── components/          # UI reutilizable (front)
├── contexts/            # Estado global React (Auth, UI, Favoritos…)
├── hooks/               # Hooks React (useAuth, useBusinessData…)
├── lib/                 # Lógica de negocio + clientes + helpers (front y server)
├── types/               # Tipos TypeScript compartidos (contratos de datos)
├── packages/            # Paquetes internos (workspace): profile-engine
├── public/              # Archivos estáticos servidos tal cual (imágenes, PWA)
├── supabase/            # Migraciones SQL oficiales del schema
├── sql/                 # SQL suelto / setup legacy (menos “canónico” que migrations)
├── scripts/             # Scripts de seed, sync, mantenimiento (CLI)
├── docs/                # Documentación
├── actions/             # Server Actions de Next (IA/search u otras)
├── data/                # Datos estáticos del repo (si hay)
├── messages/            # i18n (next-intl)
├── utils/               # Utilidades genéricas (capa fina; preferir lib/)
├── output/              # Artefactos locales (revistas, prompts) — no es runtime web
├── middleware.ts        # Corre ANTES de cada request coincidente (redirects/@)
├── next.config.js       # Config Next: redirects, rewrites, PWA, images
├── tailwind.config.ts   # Design tokens Tailwind (colores, theme)
├── postcss.config.js    # Pipeline CSS (Tailwind)
├── package.json         # Dependencias + scripts npm
├── instrumentation.ts   # Hooks de arranque (Sentry, etc.)
└── .env.local           # Credenciales (NUNCA commit)
```

### Carpetas que NO son “el producto en producción”

| Carpeta | Nota |
|---------|------|
| `node_modules/` | Dependencias instaladas (`npm install`). No editar. |
| `.next/` | Build cache de Next. Se regenera. |
| `.git/` | Historial Git. |
| `.vercel/` | Link local al proyecto Vercel. |
| `output/` | Pipelines offline (digitalizar revistas, prompts). |
| CSV enormes en raíz | Exports históricos de adisos; no forman parte del runtime. |

---

## 3. Front vs Back en este proyecto

### Front (lo que renderiza UI)

| Capa | Ubicación | Rol |
|------|-----------|-----|
| Rutas/páginas | `app/**/page.tsx` | URL → pantalla |
| Layouts | `app/**/layout.tsx` | Cascada de envoltorios (metadata, providers) |
| Componentes | `components/**` | Piezas UI |
| Contextos | `contexts/**` | Estado compartido (sesión, favoritos…) |
| Hooks | `hooks/**` | Encapsulan fetch/efectos |
| Estilos | `app/globals.css` + Tailwind classes + `tailwind.config.ts` | Look & feel |
| Cliente Supabase | `lib/supabase.ts` (y similares) | Lecturas con RLS desde el browser |

Muchos `page.tsx` son **`'use client'`**: el componente corre en el navegador.  
Otros son Server Components (sin `'use client'`): corren en el servidor de Next.

### Back (APIs y servidor)

| Capa | Ubicación | Rol |
|------|-----------|-----|
| API Routes | `app/api/**/route.ts` | Endpoints HTTP (`GET`/`POST`/…) |
| Server libs | `lib/*-server.ts`, `lib/business-server-auth.ts` | Lógica solo servidor |
| Service role | usa `SUPABASE_SERVICE_ROLE_KEY` | Bypass RLS (admin) |
| Middleware | `middleware.ts` | Redirects/rewrites de URL |
| Server Actions | `actions/` | Funciones invocables desde UI (patrón Next) |
| Crons | `app/api/cron/**` + `vercel.json` | Tareas programadas |

**Regla práctica:**

- ¿Es pantalla? → `app/.../page.tsx` + `components/`
- ¿Es endpoint JSON? → `app/api/.../route.ts`
- ¿Es regla de negocio reusable? → `lib/`
- ¿Es forma de los datos? → `types/`

---

## 4. `app/` — el router (App Router de Next)

Cada carpeta bajo `app/` es un **segmento de URL**, salvo convenios especiales.

### 4.1 Archivos especiales de Next

| Archivo | Significado |
|---------|-------------|
| `page.tsx` | La página de esa ruta |
| `layout.tsx` | Layout que envuelve `page` y rutas hijas |
| `route.ts` | API endpoint (solo en `app/api`) |
| `loading.tsx` | UI de carga (si existe) |
| `error.tsx` / `global-error.tsx` | Manejo de errores |
| `not-found.tsx` | 404 |
| `[slug]` | Parámetro dinámico (`/negocio/villachaco`) |
| `[...slug]` | Catch-all (`/a/b/c`) |
| `(grupo)` | Agrupa layouts **sin** aparecer en la URL (si usas route groups) |

### 4.2 Rutas de producto importantes

| Carpeta | URL | Qué hace |
|---------|-----|----------|
| `app/page.tsx` | `/` | Home / feed marketplace |
| `app/publicar/` | `/publicar` | Publicar adiso |
| `app/login/` | `/login` | Auth |
| `app/perfil/` | `/perfil` | Perfil de persona |
| `app/mi-negocio/` | `/mi-negocio` | Panel del negocio |
| `app/mi-negocio/catalogo/` | `/mi-negocio/catalogo` | Gestión de productos |
| `app/negocio/[slug]/` | `/negocio/:slug` | Perfil negocio (interno) |
| `app/[...slug]/` | catch-all | SEO ads, bare slug → perfil, etc. |
| `app/deals/` | `/deals` | Clips / deals |
| `app/mapa/` | `/mapa` | Mapa |
| `app/chat/` | `/chat` | Mensajería |
| `app/favoritos/` | `/favoritos` | Favoritos |
| `app/q/` | `/q/:code` | Redirects de QR |
| `app/admin/` | `/admin/*` | Tools internas |
| `app/api/` | `/api/*` | Backend HTTP |

### 4.3 Cómo llega la gente a `/@villachaco`

1. Usuario visita `buscadis.com/@villachaco`
2. `middleware.ts` hace **rewrite** interno a `/negocio/villachaco` (la URL en barra sigue con `@`)
3. `next.config.js` también tiene rewrite `/@:slug` → `/negocio/:slug` (capa config)
4. `app/negocio/[slug]/page.tsx` carga el perfil (vía `useBusinessData`)

Legacy:

- `/p/slug` → redirect 308 a `/@slug` (middleware)
- `/slug` bare → catch-all intenta redirect a perfil si existe en DB

---

## 5. `app/api/` — el backend por carpetas

Cada carpeta suele mapear un **dominio**:

| Carpeta API | Dominio |
|-------------|---------|
| `adisos/` | CRUD / pago / flujos de clasificados |
| `business/` | Perfiles de negocio, uploads, QR, reviews, track-view, publish… |
| `catalog/` | Productos, reorder, process, AI categorize, upload |
| `public/` | APIs públicas (ej. catálogo para Publicadis) |
| `ai/` | Endpoints de IA |
| `chatbot/` | Chatbot |
| `conversations/` | Chat entre usuarios |
| `deals/` | Deal clips |
| `stories/` | Stories |
| `search/` | Búsqueda |
| `publish/` | Studio / audience publish |
| `profile/` | Historia de vistas de perfil |
| `auth/` | Callbacks auth |
| `cron/` | Jobs Vercel Cron |
| `admin/` | Admin |
| `geo/` | Geolocalización |
| `notifications/` | Notificaciones |
| `upload-image/` | Subida genérica |
| `mobile-*` | Bridge app móvil |
| `v1/` | API versionada (si aplica) |

**Patrón de archivo:**

```ts
// app/api/business/by-slug/[slug]/route.ts
export async function GET(req, { params }) { ... }
```

- `params` = segmentos dinámicos `[slug]`
- Respuesta típica: `NextResponse.json(...)`
- Auth típica: header `Authorization: Bearer <jwt>` + service role para acciones privilegiadas

---

## 6. `components/` — el front visual, por dominio

```
components/
├── HomePageClient.tsx      # Cerebro del feed home
├── Header.tsx / LeftSidebar / NavbarMobile
├── ModalAdiso.tsx / AdisoCard / GrillaAdisos
├── Buscador.tsx / Ordenamiento.tsx
├── FormularioPublicar.tsx
├── business/               # Perfil negocio, editor, catálogo público, QR, cart
├── catalog/                # AddProductModal, SortableProductList, sort UI
├── profile/                # Wireframe profile engine UI
├── publish/                # Wizard de publicación
├── deals/ / stories/       # Contenido corto
├── filters/ / search/      # Filtros y command palette
├── chat/ / Chatbot*        # Mensajes + bots
├── ai/                     # UI de IA
├── pwa/                    # Install / offline
├── analytics/              # Providers analytics
├── trust/                  # Badges / reputación
├── Icons.tsx               # Iconos centralizados
└── ...
```

**Por qué nombres en español a veces (`Buscador`, `GrillaAdisos`):**  
el producto nació local (Cusco/Perú). Dominios nuevos suelen ir en inglés (`business/`, `catalog/`).  
Convención práctica actual: **español legacy OK; código nuevo preferible inglés en módulos de dominio**.

**Business UI clave:**

| Archivo / carpeta | Rol |
|-------------------|-----|
| `business/public/BusinessCatalogTab.tsx` | Catálogo en el perfil (ordenar, vistas, filtros) |
| `business/public/BusinessHero.tsx` | Banner/logo |
| `business/public/BusinessProfileShellV2.tsx` | Shell del perfil |
| `business/ProductEditor.tsx` | Editor de producto |
| `business/editor/*` | Hubs del editor de perfil |
| `catalog/SortableProductList.tsx` | Drag & drop reorder |

---

## 7. `lib/` — el cerebro (donde mirar primero)

Aquí está el 70% de la “inteligencia” del producto.

### 7.1 Archivos “estrella” en la raíz de `lib/`

| Archivo | Qué hace |
|---------|----------|
| `supabase.ts` | Cliente browser + helpers de mapeo adiso↔DB |
| `supabase-admin.ts` / `supabase-server.ts` | Clientes con privilegios / server |
| `business.ts` | Perfiles, catálogo→adiso, **feed marketplace** (`getMarketplaceFeed`) |
| `api.ts` | Fetchs legacy/compat |
| `auth.ts` | Helpers auth |
| `offline-cache.ts` | Cache localStorage TTL |
| `media-url.ts` | Cache-bust `?v=` en imágenes |
| `mercadopago.ts` | Pagos |
| `analytics.ts` | Tracking |

### 7.2 Subcarpetas de dominio

| Carpeta | Contenido tipico |
|---------|------------------|
| `lib/business/` | Slug, perfiles públicos, horas, publicadis URL, blocks, templates, analytics de perfil |
| `lib/catalog/` | Sort, reorder, category icons, AI product helpers |
| `lib/feed/` | Ranking del feed (`compareRecientesFeed`) |
| `lib/filters/` | Browse filters + apply |
| `lib/publish/` | Flujos de publicación (free/paid) |
| `lib/qr/` | Generación/resolve de QR |
| `lib/seo/` | Metadata, OG images |
| `lib/ai/` | Integraciones modelo (Gemini, etc.) |
| `lib/deals/` / `stories/` | Feeds de contenido corto |
| `lib/search/` | Search/rerank |
| `lib/geo/` | Países / geodetect |
| `lib/profile/` | Adaptadores al profile-engine |

**Si el feed ordena mal:** mira `lib/feed/ranking.ts` + `lib/business.ts` (`catalogProductToAdiso`, `getMarketplaceFeed`) + `lib/filters/apply.ts`.  
**Si el perfil no carga público:** mira `lib/business/get-public-profile.ts` + `app/api/business/by-slug`.  
**Si Publicadis no ve productos:** mira `app/api/public/catalog/[slug]`.

---

## 8. `hooks/` y `contexts/` — estado en el cliente

### Hooks (piezas con lógica + React)

| Hook | Para qué |
|------|----------|
| `useAuth` | Sesión usuario |
| `useUser` | Perfil + platform admin |
| `useBusinessData` | Carga perfil+catálogo con cache SWR offline |
| `useBusinessCart` | Carrito del perfil |
| `useNetworkStatus` | Online/offline |
| `useToast` | Notificaciones UI |
| `useDebounce` | Autosave / búsqueda |

### Contexts (estado global)

| Context | Para qué |
|---------|----------|
| `AuthContext` | Auth global (envuelve toda la app en `app/layout.tsx`) |
| `UIContext` | Modales UI (auth modal, etc.) |
| `FavoritosContext` | Favoritos |
| `NavigationContext` | Navegación |
| `ProfileEditContext` | Editor de perfil |
| `AdisosGratuitosCache` | Cache de gratuitos |

El cableado raíz está en `app/layout.tsx`: providers anidados alrededor de `{children}`.

---

## 9. `types/` — contratos de datos

| Archivo | Dominio |
|---------|---------|
| `types/index.ts` | `Adiso`, stories, deals, categorías… |
| `types/business.ts` | `BusinessProfile`, reviews, hours… |
| `types/catalog.ts` | Productos, sort, import sessions |

Si cambias columnas de Supabase, **actualiza tipos** o romperás TypeScript/sugerencias.

---

## 10. Base de datos y migraciones

### Fuente canónica del schema

`supabase/migrations/*.sql` (numeradas: `003_…`, `023_publicadis_sites.sql`, `034_profile_views_and_catalog_sort.sql`…).

Comandos en `package.json`:

- `npm run db:migrate` → `scripts/supabase-migrate.mjs`
- `npm run db:push` → push linked
- `npm run db:migrations` → listar

### Tablas mentales clave

| Tabla | Qué guarda |
|-------|------------|
| `adisos` | Clasificados |
| `business_profiles` | Negocios |
| `business_members` | Equipo / RBAC |
| `catalog_products` | Productos |
| `page_analytics` | Eventos (vistas, WhatsApp…) |
| `profile_view_sessions` | Dedup de vistas |
| `publicadis_sites` | Config sitios Publicadis |
| `qr_codes` (+ visual assets) | Sistema QR |
| `deal_clips` / `stories` | Contenido corto |

### Storage buckets (archivos)

Típicamente: `catalog-images`, `avisos-images` (ver `.env.example`), buckets de QR, etc.

---

## 11. Estilos: dónde se ve “cómo se ve”

### Capas de estilo

1. **`app/globals.css`**  
   CSS variables de marca:
   - `--brand-blue`, `--brand-yellow`
   - `--text-*`, `--bg-*`
   - `--cat-empleos`, `--cat-productos`… (colores por categoría)
   - dark mode (clases `.dark-mode` / `.dark`)
   - variables de perfil negocio `--bp-*` (business page)

2. **`tailwind.config.ts`**  
   Extiende tema: `obsidian`, `graphite`, tipografías, animaciones.  
   `content:` le dice a Tailwind qué archivos escanear para generar clases.

3. **Clases en JSX**  
   Utility-first: `className="flex gap-2 text-slate-600"`  
   Helpers: `cn()` en `lib/utils` (merge de clases + `tailwind-merge`).

4. **Framer Motion**  
   Animaciones en componentes (`motion`).

5. **Temas por negocio**  
   `theme_color`, `theme_preset`, `profile_style` en el perfil → se aplican en shells de negocio.

**No hay CSS Modules masivos:** el estilo vive en Tailwind + variables CSS.

---

## 12. Integraciones (externas)

| Integración | Dónde suele vivir | Para qué |
|-------------|-------------------|----------|
| **Supabase** | `lib/supabase*.ts`, casi todo `app/api` | DB, Auth, Storage, RLS |
| **OpenAI / AI SDK** | `lib/ai`, `app/api/ai`, `actions/` | Redacción, features IA |
| **Google Generative AI** | deps + lib AI | Modelo Gemini |
| **Replicate / imgly** | background removal, image AI | Imágenes |
| **Resend** | emails de invite etc. | Correo |
| **MercadoPago** | `lib/mercadopago.ts`, APIs de pago | Cobros |
| **Sentry** | `sentry.*.config.ts`, instrumentation | Errores |
| **Vercel Analytics / Speed Insights** | layout / providers | Métricas |
| **Typesense** | scripts sync + search | Search index (si activo) |
| **PWA Workbox** | `next.config.js` + `@ducanh2912/next-pwa` | Offline / cache imágenes |
| **Leaflet** | mapa | Mapas |
| **Publicadis** | `lib/business/publicadis.ts` + API pública catálogo | Sitios hermano |

Variables: ver `.env.example` completo (Supabase, OpenAI, WhatsApp Business, site URL, Publicadis URL, Sentry…).

---

## 13. `packages/profile-engine`

Workspace interno (`"@buscadis/profile-engine": "workspace:*"`).

Es el **motor de layout de perfiles** (tipos de layout, skins, slots, metrics labels).  
Buscadis adapta `BusinessProfile` → entity del engine en `lib/profile/adapters/business-adapter.ts`, y UI en `components/profile/*`.

Sirve para no acoplar “cómo se pinta un perfil” a un solo JSX monolítico eterno.

---

## 14. `middleware.ts` + `next.config.js` (routing de sistema)

### middleware.ts

Corre en edge, **antes** de la página:

- hosts legacy `adis.lat` → `www.buscadis.com`
- `/p/x` → `/@x`
- `/@x` → rewrite `/negocio/x`

### next.config.js

- `redirects`: `/negocio/:slug` → `/@:slug`, `/feed` → `/deals`, Play Store…
- `rewrites`: `/@:slug` → `/negocio/:slug`
- `images.remotePatterns`: Supabase, Unsplash
- PWA runtimeCaching (imágenes Supabase)
- transpile de `profile-engine`, onnx, etc.

Si una URL “hace cosas raras”, empieza por **middleware → next.config → catch-all `app/[...slug]`**.

---

## 15. `scripts/` — herramientas de operaciones

No son la web; se ejecutan con `npx tsx` / `node`.

Ejemplos:

| Script | Uso |
|--------|-----|
| `seed-villachaco-catalog.ts` | Cargar demo Villa Chaco |
| `seed-agrilsur-catalog.ts` | Agrilsur |
| `seed-buscadis-profile.ts` | Perfil showcase Buscadis |
| `merge-quival-products.ts` | Analizar/fusionar variantes Quival |
| `supabase-migrate.mjs` | Migraciones |
| `sync-typesense.mjs` | Índice search |
| `backfill-qr-*.ts` | Backfills QR |

Datos de seed: `scripts/data/*.json`.

---

## 16. Flujo de datos tipicos (para “ser experto”)

### A) Feed home

```
HomePageClient
  → getMarketplaceFeed() en lib/business.ts
      → getAdisosFromSupabase()   (clasificados)
      → getCatalogProductsAsAdisos() (productos → forma Adiso)
  → applyBrowseFilters() + compareRecientesFeed()
  → GrillaAdisos / ModalAdiso
```

### B) Perfil negocio público

```
/@slug (middleware rewrite)
  → app/negocio/[slug]/page.tsx
  → useBusinessData(slug, isOwner?)
      → dueño: getBusinessProfileBySlug (cliente)
      → visitante: GET /api/business/by-slug/:slug
      → catálogo: supabase catalog_products
  → BusinessPublicView / Shell / CatalogTab
  → trackProfileView → POST /api/business/:id/track-view
```

### C) Guardar producto

```
ProductEditor / AddProductModal
  → supabase catalog_products insert/update
  → (o APIs /api/catalog/*)
  → reloadCatalog()
```

### D) Publicadis pide productos

```
publicadis.com/quival
  → GET www.buscadis.com/api/public/catalog/quival?imagesOnly=1
  → service role lee catalog_products published (+ imágenes)
```

---

## 17. Convenciones de nombres (para no perderte)

| Patrón | Significa |
|--------|-----------|
| `useX` | Hook React |
| `getX` / `listX` | Lectura |
| `createX` / `updateX` / `deleteX` | Mutación |
| `*Server` / `*-server.ts` | Solo servidor |
| `*Admin` | Usa service role |
| `route.ts` | Endpoint HTTP |
| `page.tsx` | Pantalla |
| `*Tab.tsx` | Pestaña de UI |
| `*Modal.tsx` | Overlay |
| `[id]` / `[slug]` / `[businessId]` | Parámetro dinámico (a veces `businessId` en URL es slug) |
| `privateData.source === 'catalog_product'` | Aviso que en realidad es producto de catálogo |

---

## 18. Cómo navegar el repo como experto (checklist)

1. **¿Qué URL?** → busca carpeta en `app/`.  
2. **¿Qué UI?** → `components/` del dominio.  
3. **¿De dónde salen datos?** → `hooks/` o `lib/` llamados por la page.  
4. **¿Hay endpoint?** → `app/api/.../route.ts`.  
5. **¿Tabla/columna?** → `supabase/migrations` + `types/`.  
6. **¿Estilo?** → clases Tailwind + `globals.css` vars.  
7. **¿Redirect raro?** → `middleware.ts` + `next.config.js`.  
8. **¿Solo en prod?** → env Vercel vs `.env.local`, PWA cache, RLS.

### Atajos de búsqueda útiles

```bash
# ¿Quién usa una función?
rg "getMarketplaceFeed" -g'*.{ts,tsx}'

# ¿Dónde está un endpoint?
rg "track-view" app/api -g'*.ts'

# ¿Qué toca catalog_products?
rg "catalog_products" -g'*.{ts,tsx,sql}'
```

---

## 19. Qué NO es este repo

- **No** es el host completo de `publicadis.com` (eso vive en `/proyectos/publicadis.com`).
- **No** es la tienda Agrilsur completa (`/proyectos/agrilsur`).
- **Sí** es la fuente de verdad de perfiles/productos/avisos de Buscadis y de APIs públicas para Publicadis.

---

## 20. Mini glosario técnico del repo

| Término | En Buscadis |
|---------|-------------|
| **App Router** | Sistema de carpetas `app/` de Next 13+ |
| **RSC** | React Server Component (sin `'use client'`) |
| **Route Handler** | `route.ts` = API |
| **RLS** | Row Level Security de Postgres (quién ve filas) |
| **Service role** | Llave admin que ignora RLS — solo servidor |
| **Rewrite** | Cambia destino interno sin cambiar la URL visible |
| **Redirect** | Manda al navegador a otra URL (308/301/302) |
| **SWR / stale-while-revalidate** | Mostrar cache y refrescar en segundo plano |
| **Slug** | Identificador URL del negocio |
| **Workspace** | Monorepo npm (`packages/*`) |

---

## 21. Orden recomendado para estudiar el código (1–2 días)

1. `app/layout.tsx` → providers globales  
2. `components/HomePageClient.tsx` → feed  
3. `lib/business.ts` → marketplace + catálogo→adiso  
4. `lib/feed/ranking.ts` → orden  
5. `middleware.ts` + `app/negocio/[slug]/page.tsx` → perfiles  
6. `hooks/useBusinessData.ts` → data layer del perfil  
7. `app/api/business/**` + `app/api/catalog/**` → backend de negocios  
8. `components/business/**` → UI de negocio  
9. `supabase/migrations/021+` → schema moderno de negocios  
10. `packages/profile-engine` → motor de perfiles  

Cuando puedas explicar el flujo **home → producto catálogo → perfil → track-view** sin mirar este doc, ya eres operativo como experto de tu propio código.

---

*Mantén este archivo actualizado cuando añadas dominios nuevos (`lib/<nuevo>`, `app/api/<nuevo>`). Es tu mapa mental versionado.*
