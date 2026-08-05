# Professional Catalog Product Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish Villa Chaco's real 250 g whole-bean coffee box everywhere and establish a safe, reusable catalog publication path for every business.

**Architecture:** Keep business catalog JSON as reviewable source data, move mutations into a shared validated publisher, and enforce database invariants for SKU identity, publication lifecycle, and atomic ordering. Unify catalog products with the server search consumed by the web and AI chat, while retaining Villa Chaco's existing static Publicadis storefront.

**Tech Stack:** Next.js 15, React 18, TypeScript 5.9, Supabase/PostgreSQL/Storage, Zod, Node.js/tsx, static HTML/CSS/JavaScript, Vercel.

## Global Constraints

- The supplied three images are real production assets.
- The existing bag product `VC-CAFE-TOSTADO-250` must remain published and unchanged.
- The new box product uses SKU `VC-CAFE-GRANO-CAJA-250`.
- Price remains null and customer-facing copy says “Consultar”.
- Never use `updated_at` as marketplace publication recency.
- Never refresh `published_at` during ordinary updates or reorder operations.
- Never expose the Supabase service-role key to browser code or logs.
- Do not create a duplicate search-only `adiso`; `catalog_products` remains canonical.
- Do not commit changes unless the user separately requests a commit.

---

## File map

### Buscadis

- Create `lib/catalog/product-schema.ts`: runtime schemas and normalized catalog seed types.
- Create `lib/catalog/publish-product.ts`: image upload, idempotent upsert, and post-write verification.
- Create `scripts/publish-catalog-product.ts`: generic CLI entry point.
- Create `lib/catalog/__tests__/product-schema.test.ts`: validation and naming tests.
- Create `lib/catalog/__tests__/publish-product.test.ts`: lifecycle/idempotency tests with an injected fake gateway.
- Create `lib/search/catalog-search.ts`: server-side catalog lookup and score mapping.
- Create `lib/search/__tests__/catalog-search.test.ts`: accent-insensitive matching and merge tests.
- Modify `package.json`: add focused test/publish commands.
- Modify the exact migration file emitted by `npx supabase migration new catalog_publish_lifecycle`: unique SKU index, publication lifecycle trigger, and atomic reorder RPC.
- Modify `app/api/catalog/products/reorder/route.ts`: call the atomic RPC.
- Modify `lib/catalog/reorder.ts`: route reorder calls through the authenticated API rather than independent client updates.
- Modify `lib/business.ts`: map catalog dates from `published_at`, order marketplace catalog rows by true publication time, and reuse exported mapping.
- Modify `lib/search/execute-search.ts`: merge scored catalog results server-side.
- Modify `app/api/ai/chat/route.ts`: consume `executeSearch` so chat and web use one search path.
- Modify `components/HomePageClient.tsx`: remove the now-duplicated client-side catalog merge.
- Modify `scripts/seed-villachaco-catalog.ts`: delegate focused product publishing to the shared module and preserve existing publication dates.
- Modify `scripts/data/villachaco-catalog.json`: add the new product and canonical order.
- Add three named production images under `public/villachaco/images/`.

### Publicadis

- Modify `/home/jairoprodev/proyectos/publicadis.com/public/villachaco/index.html`: first catalog card, responsive gallery/modal, WhatsApp CTA, and structured product data.
- Add the same three named production images under `/home/jairoprodev/proyectos/publicadis.com/public/villachaco/images/`.

---

### Task 1: Database catalog invariants

**Files:**
- Create via CLI: the exact `supabase/migrations/` file printed by `npx supabase migration new catalog_publish_lifecycle`
- Modify: `app/api/catalog/products/reorder/route.ts`
- Modify: `lib/catalog/reorder.ts`

**Interfaces:**
- Produces RPC `public.reorder_catalog_products(p_business_id uuid, p_ordered_ids uuid[]) returns integer`.
- Produces a partial unique SKU index scoped to business.
- Produces publication lifecycle behavior: first transition to `published` sets `published_at`; later edits preserve it.

- [ ] **Step 1: Inspect the installed command and generate the migration**

Run:

```bash
npx supabase migration new --help
npx supabase migration new catalog_publish_lifecycle
```

Expected: one new migration file is printed under `supabase/migrations/`. Use that exact CLI-generated file for the following steps.

- [ ] **Step 2: Write migration precondition checks**

Add a guarded block that fails if duplicate normalized non-empty SKUs exist:

```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.catalog_products
    WHERE NULLIF(btrim(sku), '') IS NOT NULL
    GROUP BY business_profile_id, lower(btrim(sku))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate catalog SKUs must be resolved before migration';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_products_business_sku
ON public.catalog_products (business_profile_id, lower(btrim(sku)))
WHERE NULLIF(btrim(sku), '') IS NOT NULL;
```

- [ ] **Step 3: Add publication lifecycle trigger**

Implement a `BEFORE INSERT OR UPDATE OF status` trigger with this behavior:

```sql
IF NEW.status = 'published'
   AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published')
   AND NEW.published_at IS NULL THEN
  NEW.published_at := now();
ELSIF TG_OP = 'UPDATE' AND OLD.published_at IS NOT NULL THEN
  NEW.published_at := OLD.published_at;
END IF;
```

The function must be `SECURITY INVOKER`, have an explicit `SET search_path = public`, and only mutate `NEW`.

- [ ] **Step 4: Add atomic reorder RPC**

The function must:

```sql
-- Required checks, in order:
-- 1. p_ordered_ids is non-empty.
-- 2. cardinality equals count(DISTINCT id).
-- 3. every ID belongs to p_business_id.
-- 4. caller owns or is an active business member with catalog write access.
-- 5. update all positions from ordinality - 1 in one statement.
```

Revoke default public execution, then grant only to `authenticated` and `service_role`.

- [ ] **Step 5: Verify the migration locally/read-only before applying**

Run:

```bash
npx supabase migration list --linked
npx supabase db lint --linked
```

Expected: the new migration is pending and no new SQL errors are reported.

- [ ] **Step 6: Apply through the repository migration flow**

Run:

```bash
npm run db:push
```

Expected: migration succeeds once.

- [ ] **Step 7: Change the reorder API to call the RPC**

Replace the `Promise.all` update block with:

```ts
const { data: count, error } = await supabase.rpc('reorder_catalog_products', {
  p_business_id: profile.id,
  p_ordered_ids: filtered,
});
if (error) throw error;
```

Return the RPC count and retain current authentication/permission checks.

- [ ] **Step 8: Verify atomic reorder**

Call the route with a valid full Villa Chaco order and confirm contiguous positions. Then call it with one foreign or duplicate ID and confirm a 4xx response with no changed positions.

---

### Task 2: Shared validated product publisher

**Files:**
- Create: `lib/catalog/product-schema.ts`
- Create: `lib/catalog/publish-product.ts`
- Create: `scripts/publish-catalog-product.ts`
- Create: `lib/catalog/__tests__/product-schema.test.ts`
- Create: `lib/catalog/__tests__/publish-product.test.ts`
- Modify: `package.json`
- Modify: `scripts/seed-villachaco-catalog.ts`

**Interfaces:**
- Produces `CatalogProductInputSchema`.
- Produces `publishCatalogProduct(input, deps): Promise<PublishCatalogProductResult>`.
- Produces CLI `npm run catalog:publish -- --business villachaco --sku VC-CAFE-GRANO-CAJA-250 [--dry-run] [--promote]`.

- [ ] **Step 1: Add focused test commands**

Add:

```json
"test:catalog": "tsx --test lib/catalog/__tests__/*.test.ts lib/search/__tests__/*.test.ts",
"catalog:publish": "tsx scripts/publish-catalog-product.ts"
```

- [ ] **Step 2: Write failing runtime-schema tests**

Cover:

```ts
assert.equal(CatalogProductInputSchema.parse(valid).sku, 'VC-CAFE-GRANO-CAJA-250');
assert.throws(() => CatalogProductInputSchema.parse({ ...valid, title: '' }));
assert.throws(() => CatalogProductInputSchema.parse({ ...valid, images: [] }));
assert.equal(normalizeSku(' vc-cafe-grano-caja-250 '), 'VC-CAFE-GRANO-CAJA-250');
assert.equal(toStableImageName('Café Caja Abierta.png'), 'cafe-caja-abierta.png');
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```bash
npm run test:catalog
```

Expected: failure because the schema module does not exist.

- [ ] **Step 4: Implement product and image schemas**

Define:

```ts
export const CatalogImageInputSchema = z.object({
  file: z.string().min(1),
  is_primary: z.boolean(),
  alt: z.string().min(10),
});

export const CatalogProductInputSchema = z.object({
  sku: z.string().min(3).transform(normalizeSku),
  title: z.string().min(3),
  description: z.string().min(30),
  category: z.string().min(2),
  tags: z.array(z.string().min(2)).min(3),
  brand: z.string().min(2),
  attributes: z.record(z.string(), z.string()),
  images: z.array(CatalogImageInputSchema).min(1),
  sort_order: z.number().int().nonnegative(),
  is_featured: z.boolean(),
});
```

Add a refinement requiring exactly one primary image.

- [ ] **Step 5: Write failing publisher tests**

Use an injected gateway with in-memory rows and assert:

```ts
// first publish inserts one row and sets published_at
// second publish with same SKU updates the same ID
// ordinary update preserves published_at
// --promote calls reorder only after successful upsert
// invalid/missing image fails before any gateway mutation
```

- [ ] **Step 6: Implement the publisher with dependency injection**

Use:

```ts
export interface CatalogPublishGateway {
  findBusinessBySlug(slug: string): Promise<{ id: string } | null>;
  findProductBySku(businessId: string, sku: string): Promise<CatalogProductRow | null>;
  uploadImage(args: UploadImageArgs): Promise<string>;
  insertProduct(row: CatalogProductInsert): Promise<CatalogProductRow>;
  updateProduct(id: string, patch: CatalogProductUpdate): Promise<CatalogProductRow>;
  reorderProducts(businessId: string, orderedIds: string[]): Promise<number>;
}
```

Build the real Supabase gateway with `supabaseAdmin`. Only set `published_at` on insertion/first publication. Never write a fresh timestamp during an idempotent update.

- [ ] **Step 7: Implement CLI argument validation**

Require `--business` and `--sku`; support `--dry-run` and `--promote`. Load the business catalog JSON path from an explicit map, not arbitrary user-controlled filesystem paths.

- [ ] **Step 8: Delegate Villa Chaco's seed path**

Use the shared schema/publisher for per-product work. Add focused SKU behavior so running one product cannot update the entire profile or every catalog row.

- [ ] **Step 9: Run tests**

Run:

```bash
npm run test:catalog
npx tsc --noEmit
```

Expected: catalog publisher tests pass and TypeScript reports no new errors.

---

### Task 3: True marketplace recency and unified catalog search

**Files:**
- Create: `lib/search/catalog-search.ts`
- Create: `lib/search/__tests__/catalog-search.test.ts`
- Modify: `lib/business.ts`
- Modify: `lib/search/execute-search.ts`
- Modify: `app/api/ai/chat/route.ts`
- Modify: `components/HomePageClient.tsx`

**Interfaces:**
- Produces `searchCatalogProducts(params): Promise<ScoredAdiso[]>`.
- `executeSearch` becomes the single server result source for both listings and catalog products.

- [ ] **Step 1: Write failing catalog-search tests**

Test fixtures must prove:

```ts
// "cafe" matches "Café Gourmet" without requiring the accent.
// tags and brand can match when title does not.
// unpublished products are excluded.
// catalog rows map published_at to fechaPublicacion/horaPublicacion.
// duplicate IDs are merged once.
// true publication time, not updated_at, controls freshness.
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
npm run test:catalog
```

Expected: failure because `catalog-search.ts` does not exist.

- [ ] **Step 3: Export a stable catalog-to-Adiso mapper**

In `lib/business.ts`, make the mapper consume:

```ts
const rawDate = product.published_at || product.created_at;
```

Remove the current image/`updated_at` recency heuristic.

- [ ] **Step 4: Change catalog marketplace ordering**

Replace:

```ts
.order('updated_at', { ascending: false })
.order('created_at', { ascending: false })
```

with:

```ts
.order('published_at', { ascending: false, nullsFirst: false })
.order('created_at', { ascending: false })
```

- [ ] **Step 5: Implement normalized catalog search**

Tokenize query text with Unicode normalization and accent removal. Query published products broadly enough for title/description, then rank exact normalized title, description, category, brand, tags, SKU, and searchable attributes. Return `ScoredAdiso[]` with deterministic lexical scores.

- [ ] **Step 6: Merge catalog results in `executeSearch`**

Run listing hybrid search and catalog search concurrently, merge by ID, and pass the combined scored list through `rerankSearchResults`. Respect the requested category: catalog products participate in `todos` and `productos`.

- [ ] **Step 7: Make AI chat call `executeSearch`**

Replace direct `hybridSearch` usage with:

```ts
const results = await executeSearch({
  query: body.message,
  category: body.context?.category,
  location: body.context?.location,
  maxResults: 10,
  userId: body.userId,
});
items = results.adisos;
```

Keep the budget guard and response payload contract.

- [ ] **Step 8: Remove duplicate browser-side catalog merge**

In `HomePageClient.tsx`, trust `/api/search` as the unified result and delete the second `getCatalogProductsAsAdisos` call and duplicate local matching block.

- [ ] **Step 9: Verify search**

Run:

```bash
npm run test:catalog
npx tsc --noEmit
npm run build
```

Expected: all checks pass; an API request for `café` includes catalog products.

---

### Task 4: Add and publish the real Villa Chaco product

**Files:**
- Modify: `scripts/data/villachaco-catalog.json`
- Add: `public/villachaco/images/cafe-gourmet-en-grano-caja-250g-villa-chaco.png`
- Add: `public/villachaco/images/cafe-gourmet-en-grano-caja-abierta-250g-villa-chaco.png`
- Add: `public/villachaco/images/cafe-gourmet-en-grano-beneficios-villa-chaco.png`

**Interfaces:**
- Consumes the shared CLI from Task 2.
- Produces one published Supabase product with three Storage images.

- [ ] **Step 1: Copy the three supplied files to canonical names**

Map:

```text
closed-box lifestyle -> cafe-gourmet-en-grano-caja-250g-villa-chaco.png
open-box product     -> cafe-gourmet-en-grano-caja-abierta-250g-villa-chaco.png
benefits composition -> cafe-gourmet-en-grano-beneficios-villa-chaco.png
```

- [ ] **Step 2: Validate image files**

Run a Sharp inspection script and confirm each file decodes, has non-zero dimensions, and uses PNG. Reject accidental conversion or truncation.

- [ ] **Step 3: Add the product source record**

Use:

```json
{
  "sku": "VC-CAFE-GRANO-CAJA-250",
  "title": "Café Gourmet en Grano 100% Puro 250 g — Caja",
  "description": "Café gourmet Villa Chaco en grano, 100% puro y sin mezclas, presentado en caja de 250 g. Granos seleccionados de La Convención, Cusco, Perú, ideales para moler al momento y disfrutar un café fresco y aromático.",
  "category": "Café",
  "tags": ["cafe", "café en grano", "100% puro", "gourmet", "250g", "villa chaco", "la convencion", "cusco"],
  "brand": "Villa Chaco",
  "attributes": {
    "weight": "250 g",
    "origin": "La Convención, Cusco, Perú",
    "presentation": "Caja",
    "type": "Café en grano",
    "ingredients": "100% granos de café",
    "additives": "Sin mezclas ni aditivos"
  },
  "sort_order": 0,
  "is_featured": true
}
```

Attach the three image records in the approved order with specific Spanish alt text. Shift existing source order values to remain contiguous.

- [ ] **Step 4: Dry-run only the new SKU**

Run:

```bash
npm run catalog:publish -- --business villachaco --sku VC-CAFE-GRANO-CAJA-250 --dry-run --promote
```

Expected: one insert, three uploads, and one reorder are planned; no other product update is planned.

- [ ] **Step 5: Publish only the new SKU**

Run:

```bash
npm run catalog:publish -- --business villachaco --sku VC-CAFE-GRANO-CAJA-250 --promote
```

Expected: one new row and three public Storage URLs.

- [ ] **Step 6: Verify idempotency**

Run the same command again. Expected: same product ID, no duplicate row, same Storage object paths, and unchanged `published_at`.

---

### Task 5: Upgrade `villachaco.adis.lat`

**Files:**
- Modify: `/home/jairoprodev/proyectos/publicadis.com/public/villachaco/index.html`
- Add three images under `/home/jairoprodev/proyectos/publicadis.com/public/villachaco/images/`
- Modify source mirror under `public/villachaco/` only if the established sync direction requires it.

**Interfaces:**
- Produces the live static storefront presentation for the new SKU.

- [ ] **Step 1: Copy the three canonical images without deleting unrelated assets**

Use targeted copies. Do not run `rsync --delete` until source and destination inventories are confirmed equivalent.

- [ ] **Step 2: Add the first catalog card**

The card must have:

```html
<div class="product-card" data-category="cafe" id="producto-cafe-grano-caja-250">
  <!-- primary image, Nuevo badge, title, 250 g/origin details,
       Consultar price, gallery button, product-specific WhatsApp CTA -->
</div>
```

Use fixed image width/height, meaningful alt text, `loading="lazy"`, and `decoding="async"`.

- [ ] **Step 3: Add a lightweight accessible gallery**

Implement a native dialog or ARIA-correct modal with:

```html
<dialog id="cafe-grano-gallery" aria-labelledby="cafe-grano-gallery-title">
```

Support click/tap open, close button, Escape close, backdrop close, three images, visible captions, and focus return to the opener.

- [ ] **Step 4: Add structured product data**

Extend JSON-LD with a `Product` node containing product name, brand, category, images, description, SKU, and seller. Omit `Offer.price` because no price was provided.

- [ ] **Step 5: Validate the static site**

Run:

```bash
yarn build
```

Expected: Publicadis build succeeds.

- [ ] **Step 6: Browser-test locally**

Verify desktop and mobile:

```text
new card is first
Café filter shows both coffee presentations
gallery opens, navigates, and closes
all three images load
WhatsApp message names the whole-bean box
no horizontal overflow or layout shift
```

---

### Task 6: Production verification and deployment

**Files:**
- No new source files unless verification reveals a scoped defect.

**Interfaces:**
- Confirms all acceptance criteria across Supabase, Buscadis, chat, and `villachaco.adis.lat`.

- [ ] **Step 1: Run final Buscadis checks**

Run:

```bash
npm run test:catalog
npx tsc --noEmit
npm run build
```

- [ ] **Step 2: Query Supabase invariants**

Confirm:

```sql
-- exactly one new SKU
-- old bag SKU still exists and is unchanged
-- three image records, primary first
-- new sort_order = 0 and business positions are contiguous
-- published_at is real and remains stable after idempotent rerun
```

- [ ] **Step 3: Verify public APIs**

Check:

```text
GET https://www.buscadis.com/api/public/catalog/villachaco
POST https://www.buscadis.com/api/search  {"query":"café","maxResults":20}
POST https://www.buscadis.com/api/ai/chat with a search message for café
```

Expected: public catalog lists the box first; search/chat include box and bag.

- [ ] **Step 4: Deploy Buscadis through its existing Vercel project**

Use the repository's linked Vercel configuration and production deployment command. Do not expose environment values. Capture the deployment URL and wait for a successful build.

- [ ] **Step 5: Deploy Publicadis**

Run from `/home/jairoprodev/proyectos/publicadis.com` using its linked production project. Capture the deployment URL and verify the `villachaco.adis.lat` alias resolves to it.

- [ ] **Step 6: Browser-test production**

Verify Buscadis profile, marketplace, search/chat, and `https://villachaco.adis.lat/` on mobile and desktop. Take screenshots of the final product card and gallery.

- [ ] **Step 7: Report completion**

Report product ID, three Storage URLs, catalog/API/search/chat verification, deployment URLs, and any unrelated pre-existing warnings. Do not claim completion if either production deployment or live verification failed.
