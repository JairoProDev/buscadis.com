# Professional Catalog Product Publishing (Design Spec)

**Date:** 2026-08-05  
**Status:** Approved by product owner  
**First production use:** Villa Chaco — Café Gourmet en Grano 100% Puro 250 g (caja)

## Goal

Publish the new Villa Chaco coffee-box presentation professionally across:

- the Buscadis business profile and catalog;
- the unified marketplace, where it should rank naturally as newly published;
- `villachaco.adis.lat`;
- Supabase Storage and `catalog_products`;
- marketplace search and the AI chat.

The work must also establish a reusable, idempotent publication path for future products from any business. The three supplied images are production assets, not examples.

## Product identity

The new product is a separate presentation from the existing `VC-CAFE-TOSTADO-250`, which is toasted ground coffee in a bag.

- **SKU:** `VC-CAFE-GRANO-CAJA-250`
- **Title:** Café Gourmet en Grano 100% Puro 250 g — Caja
- **Brand:** Villa Chaco
- **Category:** Café
- **Presentation:** Box
- **Content:** 100% whole coffee beans
- **Net weight:** 250 g
- **Origin:** La Convención, Cusco, Perú
- **Price:** null; public CTA says “Consultar”
- **Status:** published
- **Featured:** true

The description, tags, attributes, SEO fields, and image alt text must include natural Spanish search terms such as “café”, “café en grano”, “100% puro”, “250 g”, “Villa Chaco”, “La Convención”, and “Cusco”. English packaging terms may be included as secondary metadata, not as the primary customer-facing copy.

## Production images

Use all three supplied images:

1. Closed-box lifestyle image as the primary catalog and marketplace image.
2. Open-box product image as a secondary gallery image.
3. Benefits composition as a secondary informative image.

Store source-controlled copies under `public/villachaco/images/` and upload the same canonical assets to the `catalog-images` bucket. Use descriptive, stable names:

- `cafe-gourmet-en-grano-caja-250g-villa-chaco.png`
- `cafe-gourmet-en-grano-caja-abierta-250g-villa-chaco.png`
- `cafe-gourmet-en-grano-beneficios-villa-chaco.png`

Validate actual MIME type, dimensions, and readability before upload. Preserve the original production files; any optimized web derivative must not replace or degrade the source.

## Architecture decisions

### 1. One reusable product-publication pipeline

Extract the reusable logic currently embedded in business-specific seed scripts into a catalog publication module/CLI. Its responsibilities are:

- runtime validation of business and product data;
- lookup of the business by slug;
- image validation and upload to a deterministic Storage path;
- idempotent product creation/update by `(business_profile_id, sku)`;
- lifecycle-safe publication timestamps;
- optional promotion to the first catalog position;
- dry-run support;
- focused execution for one SKU;
- post-write verification.

Business-specific JSON remains the reviewable source of truth, while the shared publisher performs mutations. Existing Villa Chaco, Agrilsur, Cristalimag, and future seed flows should be able to adopt the same module incrementally.

### 2. SKU uniqueness

Production currently has no duplicate non-empty SKU within a business, but the database does not enforce that invariant. Add a partial unique index for normalized non-empty SKUs scoped to `business_profile_id`, after a migration precheck.

This prevents race-condition duplicates while still allowing products with no SKU.

### 3. Separate catalog order from marketplace recency

`sort_order` controls the owner's catalog order. Marketplace recency must not depend on `updated_at`, because reordering or metadata edits update that timestamp and can make old products look new.

- Profile/catalog: `sort_order ASC`, then true publication date.
- Marketplace: `published_at DESC`, then `created_at DESC`.
- `published_at` is set when a product is first published and is not changed by normal edits or reordering.
- Existing rows fall back safely to `created_at` when `published_at` is null.

The new Villa Chaco product receives the real publication time and `sort_order = 0`. Existing Villa Chaco products are shifted to contiguous positions without inventing future dates.

### 4. Atomic, business-scoped reordering

Replace parallel independent row updates with a database transaction/RPC that:

- verifies all IDs belong to the authenticated business;
- rejects duplicates or foreign IDs;
- writes contiguous positions;
- cannot leave a partially reordered catalog.

Authorization continues to use the existing business membership and `catalog:write` permission model.

### 5. Search and AI chat use the same unified search

The regular web search currently merges catalog products client-side, while the AI chat searches only `adisos`. Move catalog inclusion into the shared server search path so all consumers receive consistent results.

Catalog matching must cover title and description at minimum, with normalized accent-insensitive behavior. Tags, brand, category, SKU, and selected searchable attributes should contribute where supported. Results are mapped through the existing catalog-to-Adiso adapter and deduplicated by ID.

A query for “café” must return both:

- Café Gourmet en Grano 100% Puro 250 g — Caja;
- Café Gourmet Tostado Molido 250 g.

No search-only duplicate `adiso` is created; `catalog_products` remains the canonical product record.

## Villa Chaco website

The live site is served from the `publicadis.com` repository, with `villachaco.adis.lat` rewritten to `public/villachaco/index.html`.

Add the new product at the beginning of the catalog grid with:

- a “Nuevo” badge;
- the primary image;
- complete product name and concise details;
- the existing Café filter;
- a product-specific WhatsApp message;
- access to the two secondary images through a lightweight, responsive gallery or product detail treatment;
- meaningful alt text, fixed dimensions, lazy loading below the fold, and no layout shift.

Mirror the canonical Villa Chaco static assets between the Buscadis source location and Publicadis without deleting unrelated production assets.

## Data flow

1. Copy and validate the three supplied production images.
2. Add the product to the Villa Chaco catalog source file.
3. Run the shared publisher in dry-run mode for the single SKU.
4. Upload images to deterministic Storage paths.
5. Atomically create the product, publish it, and promote it to catalog position zero.
6. Update the static Villa Chaco site and its asset mirror.
7. Deploy through the repository's existing Vercel flow.
8. Verify database, Storage, APIs, marketplace, AI chat, and live website.

## Error handling and safety

- A missing or invalid image aborts before database mutation.
- Storage uploads are deterministic and idempotent.
- A failed database write does not alter catalog order.
- A failed website deploy does not roll back valid catalog data, but must be reported and retried before completion.
- The publisher never refreshes `published_at` for an existing product unless explicitly republishing is requested.
- The focused SKU mode must not update every product or make an entire catalog appear recent.
- Secrets remain server-only; no service-role key is exposed to browser code or logs.

## Verification

### Automated

- Unit tests for product validation, deterministic image naming, idempotent SKU behavior, lifecycle timestamps, and catalog mapping.
- Tests for atomic reorder validation and rollback behavior.
- Search tests proving catalog products are returned by the server search used by AI chat.
- Existing lint/type/build checks for both affected repositories.

### Production/read-only checks

- Exactly one row exists for `VC-CAFE-GRANO-CAJA-250`.
- Existing `VC-CAFE-TOSTADO-250` remains unchanged and published.
- New product has three reachable Storage images in the expected order.
- Villa Chaco catalog positions are contiguous and the new product is zero.
- Public catalog API returns the new product first for owner order.
- Marketplace shows it naturally among the newest products.
- Search and AI chat for “café” return both Villa Chaco presentations.
- `villachaco.adis.lat` renders the new product correctly on mobile and desktop, with working image gallery and WhatsApp CTA.

## Out of scope

- Rebuilding every static customer website as a dynamic renderer.
- Adding checkout or inventing a price.
- Replacing the existing ground-coffee listing.
- Backdating or future-dating products to manipulate ranking.
- Bulk rewriting all historical catalog data beyond the safe timestamp fallback and ordering invariants required here.
