# Ecosistema ADIS — Arquitectura Buscadis × Publicadis

> Plan maestro para escalar a cientos de miles de negocios sin deuda técnica.
> Estado: **Fase 0 implementada** (rutas `/p/{slug}`, seed Villa Chaco, datos fuera del repo).

---

## 1. Visión del ecosistema


| Plataforma      | Rol                                            | Analogía                                      | URL                             |
| --------------- | ---------------------------------------------- | --------------------------------------------- | ------------------------------- |
| **Buscadis**    | Tarjeta digital + descubrimiento + marketplace | Perfil Instagram × Linktree                   | `buscadis.com/p/{slug}`         |
| **Publicadis**  | Sitio web profesional completo + publicidad    | Web corporativa / e-commerce / Ads Management | `publicadis.com/p/{slug}`       |
| **ADIS (auth)** | Cuenta única del ecosistema                    | Google Account / futuro Conectadis            | `auth.adis.lat` / Supabase Auth |


Un negocio = **un `business_profile_id`** en base de datos. Dos presentaciones distintas del mismo negocio, datos compartidos.

```
                    ┌─────────────────────────────────┐
                    │     ADIS Account (Supabase)      │
                    │  profiles · business_members     │
                    └───────────────┬─────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
     business_profiles      catalog_products           adisos
     (identidad)            (catálogo)                 (clasificados)
              │                     │                     │
     ┌────────┴────────┐           │                     │
     ▼                 ▼           ▼                     ▼
 Buscadis          Publicadis   Marketplace          Feed/Búsqueda
 /p/{slug}         /p/{slug}    (productos)          (anuncios)
 linktree          sitio pro
```

---

## 2. Separación de responsabilidades

### Buscadis — Perfil (`site_tier: buscadis_profile`)

- Banner, logo, bio corta, ubicación
- Botones: WhatsApp, carrito, compartir
- Tabs: Catálogo · Ofertas · Información · Reseñas
- Plantillas básicas: colores, tipografía, orden de bloques
- Aparece en: buscador, feed, filtros, categorías
- **No** es el sitio web completo del negocio

### Publicadis — Sitio profesional (`site_tier: publicadis_site`)

- Landing multi-sección (hero, historia, proceso, catálogo, contacto)
- Nivel e-commerce avanzado
- Personalización total (futuro: modo Lovable — IA genera y edita por instrucciones)
- Dominio propio opcional (`custom_domain`)
- SEO independiente, sitemap propio

### Fuente de verdad (siempre base de datos)


| Dato                  | Tabla / Storage                   | ❌ No en repo                        |
| --------------------- | --------------------------------- | ----------------------------------- |
| Perfil negocio        | `business_profiles`               |                                     |
| Productos             | `catalog_products`                |                                     |
| Imágenes producto     | Supabase `catalog-images`         | `public/*/images/` solo transitorio |
| Anuncios clasificados | `adisos`                          |                                     |
| Imágenes avisos       | `avisos-images` / `adisos-images` |                                     |
| Equipo / permisos     | `business_members`                |                                     |
| Bloques perfil        | `profile_blocks` JSONB            |                                     |
| Sitio Publicadis      | `publicadis_sites` *(nueva)*      | HTML estático en `public/`          |


---

## 3. Rutas (implementado y pendiente)

### ✅ Implementado hoy


| Ruta                      | Destino                                        |
| ------------------------- | ---------------------------------------------- |
| `buscadis.com/p/{slug}`   | `app/p/[slug]/page.tsx` → perfil Buscadis      |
| `buscadis.com/{slug}`     | Perfil legacy (mantener redirect gradual)      |
| `buscadis.com/villachaco` | Sitio estático temporal (`public/villachaco/`) |


### 🔜 Fase 1 — Publicadis routing

```
publicadis.com/p/villachaco  →  sitio profesional Villa Chaco
buscadis.com/p/villachaco    →  perfil linktree + catálogo
```

**Opciones de implementación:**

1. **Mismo repo, middleware por host** (`middleware.ts`):
  - `Host: publicadis.com` → renderer Publicadis o rewrite a `public/sites/{slug}/`
  - `Host: buscadis.com` → App Router actual
2. **Monorepo Turborepo** (recomendado a escala):
  - `apps/buscadis` — marketplace + perfiles
  - `apps/publicadis` — sitios profesionales
  - `packages/adis-core` — tipos, Supabase client, auth
  - `packages/catalog` — productos, imágenes
  - `packages/ui-blocks` — bloques compartidos
3. **Sitios estáticos generados** (transición):
  - Script exporta desde DB → `public/sites/{slug}/index.html`
  - Publicadis sirve como CDN estático hasta renderer dinámico

### Migración Villa Chaco


| Ahora                          | Destino                                                 |
| ------------------------------ | ------------------------------------------------------- |
| `public/villachaco/index.html` | `publicadis.com/p/villachaco`                           |
| Sin perfil DB                  | `buscadis.com/p/villachaco` (seed listo)                |
| Imágenes en repo               | Supabase Storage (`scripts/seed-villachaco-catalog.ts`) |


```bash
npx tsx scripts/seed-villachaco-catalog.ts
npx tsx scripts/seed-villachaco-catalog.ts --transfer-email dueña@villachaco.com
```

---

## 4. Modelo de datos — extensiones necesarias

### `business_profiles` (columnas nuevas sugeridas)

```sql
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS site_tier TEXT
  DEFAULT 'buscadis_profile'
  CHECK (site_tier IN ('buscadis_profile', 'publicadis_site', 'both'));

ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS publicadis_template_id TEXT;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS publicadis_published BOOLEAN DEFAULT false;
ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS publicadis_config JSONB DEFAULT '{}';
```

### `publicadis_sites` (nueva tabla)

```sql
CREATE TABLE publicadis_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID REFERENCES business_profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  template_id TEXT NOT NULL DEFAULT 'artisan-brand',
  config JSONB NOT NULL DEFAULT '{}',  -- secciones, colores, copy
  custom_css TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_profile_id),
  UNIQUE(slug)
);
```

### `catalog_products.images` (ya existe JSONB)

```json
[
  { "url": "https://...supabase.../catalog-chocolate-dark-fresa.jpg", "is_primary": true, "alt_text": "..." },
  { "url": "https://...supabase.../producto-chocolate-fresa.jpg", "is_primary": false, "alt_text": "Empaque" }
]
```

Múltiples imágenes por producto — **ya soportado** en schema y tipos (`types/catalog.ts`).

---

## 5. Cuentas, ownership y admin

### Flujo de onboarding

```
1. ADIS crea perfil (nosotros)     → business_profiles + seed catálogo
2. Invitamos a la dueña por email  → business_invitations
3. Dueña crea cuenta ADIS          → Supabase Auth
4. Acepta invitación / transfer    → business_members.role = 'owner'
5. Dueña administra en /mi-negocio → catálogo, perfil, equipo
```

### Transferencia de perfil

Script existente como referencia: `scripts/transfer-adisos-owner.ts`

Extender para negocios:

```bash
npx tsx scripts/seed-villachaco-catalog.ts --transfer-email cliente@ejemplo.com
```

### Roles (`business_members`)


| Rol      | Puede                                   |
| -------- | --------------------------------------- |
| `owner`  | Todo + eliminar negocio + transferir    |
| `admin`  | Editar perfil, catálogo, invitar equipo |
| `editor` | Editar catálogo y contenido             |
| `viewer` | Solo lectura                            |


### Super-admin ADIS (siempre acceso total)

- Flag en `profiles`: `is_platform_admin BOOLEAN`
- RLS bypass vía `supabaseAdmin` en API routes internas
- Panel interno: `/admin/negocios/{slug}` (por crear)

---

## 6. Contenido: catálogo vs clasificados


| Tipo                | Tabla              | Buscador                 | Perfil         | Publicadis          |
| ------------------- | ------------------ | ------------------------ | -------------- | ------------------- |
| Producto catálogo   | `catalog_products` | ✅ vía proyección a Adiso | ✅ tab Catálogo | ✅ sección productos |
| Anuncio clasificado | `adisos`           | ✅ feed/búsqueda          | ✅ tab Ofertas  | opcional            |


**Regla:** Ninguna imagen ni texto de producto/anuncio hardcodeado en el repo en producción. Los scripts de seed son solo para migración inicial.

---

## 7. Pipeline de imágenes

```
Cliente envía fotos (WhatsApp, panel, import IA)
        ↓
scripts/ o /api/catalog/upload
        ↓
Supabase Storage (catalog-images/{business_id}/products/)
        ↓
catalog_products.images[] en DB
        ↓
Buscadis perfil + Publicadis sitio + Marketplace feed
```

Villa Chaco — archivos nombrados:


| Archivo                                             | Producto                       |
| --------------------------------------------------- | ------------------------------ |
| `catalog-chocolate-dark-fresa-70cacao-50g.jpg`      | Chocolate Fresa (hero)         |
| `catalog-chocolate-dark-naranja-70cacao-50g.jpg`    | Chocolate Naranja              |
| `catalog-chocolate-dark-aguaymanto-70cacao-50g.jpg` | Chocolate Aguaymanto           |
| `catalog-chocolate-dark-mango-70cacao-50g.jpg`      | Chocolate Mango                |
| `catalog-chocolate-dark-pina-70cacao-50g.jpg`       | Chocolate Piña                 |
| `catalog-chocolate-dark-pistachos-70cacao-50g.jpg`  | Chocolate Pistachos            |
| `catalog-cafe-gourmet-tostado-molido-250g.jpg`      | Café Tostado Molido 250g       |
| `producto-*.jpeg/jpg`                               | Fotos de empaque (secundarias) |


Metadata completa: `scripts/data/villachaco-catalog.json`

---

## 8. Publicadis modo Lovable (futuro)

```
Usuario: "Quiero una sección de premios y cambiar el hero a video"
        ↓
IA lee publicadis_sites.config + business_profiles + catalog_products
        ↓
Genera/actualiza config JSONB + componentes
        ↓
Preview → Publicar
```

**No implementar aún.** Preparar:

- `publicadis_config` como JSON versionado
- Renderer de bloques (reutilizar `lib/business/blocks/`)
- Historial de cambios (`publicadis_revisions`)

---

## 9. Plan de ejecución por fases

### Fase 0 — Ahora ✅

- [x] Ruta `/p/{slug}` en Buscadis
- [x] Catálogo Villa Chaco en JSON + script seed
- [x] Imágenes nombradas y galería dual en sitio estático
- [x] Café tostado molido 250g agregado
- [x] Este documento de arquitectura

### Fase 1 — Semanas 1-2

- [ ] Migración SQL: `site_tier`, `publicadis_sites`
- [ ] Ejecutar seed Villa Chaco en producción
- [ ] Middleware host `publicadis.com`
- [ ] Mover `public/villachaco/` → servir en Publicadis
- [ ] Redirect `buscadis.com/villachaco` → `publicadis.com/p/villachaco`
- [ ] Link "Ver sitio web" en perfil Buscadis → Publicadis

### Fase 2 — Semanas 3-4

- [ ] Template Publicadis base (`artisan-brand` — Villa Chaco como referencia)
- [ ] Agrilsur: importar desde `./agrilsur` o Vercel a `publicadis_sites`
- [ ] Quival: catálogo 510 productos 100% en DB (sin flyers estáticos)
- [ ] Sitemap: perfiles + sitios Publicadis

### Fase 3 — Mes 2

- [ ] Monorepo o apps separadas si el tráfico lo exige
- [ ] Panel transferencia de ownership UI
- [ ] Super-admin `/admin`
- [ ] IA import catálogo desde imágenes (ya parcial en `/api/catalog/process`)

### Fase 4 — Mes 3+

- [ ] Publicadis modo Lovable
- [ ] Dominios personalizados
- [ ] Sync Typesense para productos de catálogo

---

## 10. Referencias en el repo


| Archivo                                                 | Qué hace                  |
| ------------------------------------------------------- | ------------------------- |
| `app/p/[slug]/page.tsx`                                 | Perfil Buscadis canónico  |
| `app/negocio/[slug]/page.tsx`                           | Implementación del perfil |
| `components/business/public/BusinessProfileShellV2.tsx` | UI perfil                 |
| `scripts/seed-villachaco-catalog.ts`                    | Seed Villa Chaco          |
| `scripts/data/villachaco-catalog.json`                  | Metadata productos        |
| `public/villachaco/index.html`                          | Sitio pro (→ Publicadis)  |
| `sql/create_catalog_system.sql`                         | Schema catálogo           |
| `sql/create_business_profiles.sql`                      | Schema perfiles           |
| `supabase/migrations/003_business_members_rbac.sql`     | RBAC equipo               |


---

## 11. Decisiones clave (para no generar deuda)

1. **Un slug, dos URLs, una DB** — nunca duplicar productos por plataforma.
2. **Imágenes siempre en Storage** — el repo solo tiene scripts de migración.
3. `**/p/{slug}` canónico en Buscadis** — deprecar `/{slug}` con redirect 301 gradual.
4. **Publicadis es otro renderer** del mismo `business_profile_id`, no otro negocio.
5. **Cuenta ADIS única** — `business_members` vincula usuarios a negocios.
6. **Nosotros siempre podemos editar** — `is_platform_admin` + service role.

---

*Última actualización: 2026-06-22 · Villa Chaco como caso piloto*