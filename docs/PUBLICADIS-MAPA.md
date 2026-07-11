# Mapa Publicadis — dónde está cada cosa

## Repositorios en tu laptop

| Ruta | Qué es | Deploy Vercel | URL producción |
|------|--------|---------------|----------------|
| `/home/jairoprodev/proyectos/buscadis.com` | Marketplace + perfiles `/@slug` | buscadis.com | `https://www.buscadis.com` |
| `/home/jairoprodev/proyectos/publicadis.com` | Host Publicadis (marketing + sitios) | **publicadis-nextjs** | `https://publicadis.com` |
| `/home/jairoprodev/proyectos/agrilsur/web` | Tienda Agrilsur (Next.js aparte) | **agrilsur** | Proxy → `publicadis.com/p/agrilsur` |
| `/home/jairoprodev/proyectos/villa-chaco` | Legacy estático (opcional) | — | Imágenes en `buscadis.com/public/villachaco/` |

## Sitios por negocio

| Negocio | Buscadis | Publicadis | Código del sitio |
|---------|----------|------------|------------------|
| Villa Chaco | `/@villachaco` | `/p/villachaco` | `publicadis.com/public/villachaco/index.html` (estático) |
| Agrilsur | `/@agrilsur` | `/p/agrilsur` | Repo `agrilsur/web` (rewrite en publicadis next.config) |
| Quival | `/@quival` | `/quival` → redirect `/p/quival` | `publicadis.com/pages/quival.js` |

## Bases de datos Supabase

| Proyecto | ID ref | Uso |
|----------|--------|-----|
| **Buscadis (activo)** | `qegqjshtxotdjjhvxmve` | `business_profiles`, `catalog_products`, analytics |
| **Publicadis Quival (pausado)** | `vonjfqdgopudueplphvm` | Tabla legacy `products` — **no usar**; proyecto pausado |

Quival en Publicadis ahora lee catálogo desde:

```
GET https://www.buscadis.com/api/public/catalog/quival?imagesOnly=1
```

Solo productos **publicados con imagen** (los ~64–72 oficiales).

## Sincronización Buscadis ↔ Publicadis (estado actual)

```
catalog_products (Buscadis DB)
        │
        ▼
/api/public/catalog/{slug}  ──►  publicadis.com/pages/{slug}.js
        │
        └── Futuro: renderer dinámico desde publicadis_sites + IA
```

## Cómo editar cada sitio hoy

- **Perfil Buscadis**: editor en `buscadis.com/@slug?edit=true`
- **Publicadis Quival**: catálogo sincronizado desde Buscadis; edición de productos en Buscadis
- **Publicadis Villa Chaco**: HTML estático en `publicadis.com/public/villachaco/`
- **Publicadis Agrilsur**: repo `agrilsur/web` + deploy propio

## Próximo paso recomendado (un solo backend)

1. Un renderer Publicadis que lea `publicadis_sites` + `catalog_products` (mismo Supabase Buscadis)
2. Plantillas base reutilizables (Villa Chaco informativa, Agrilsur e-commerce, Quival catálogo)
3. IA edita front (bloques JSON) — backend compartido
4. Deprecar tablas `products` del proyecto Quival pausado

## Comandos útiles

```bash
# Sync catálogo Quival (analizar duplicados)
cd buscadis.com && npx tsx scripts/merge-quival-products.ts --dry-run

# Deploy Publicadis
cd publicadis.com && vercel --prod

# Perfil Buscadis showcase (sin view_count fake)
cd buscadis.com && npx tsx scripts/seed-buscadis-profile.ts --dry-run
```
