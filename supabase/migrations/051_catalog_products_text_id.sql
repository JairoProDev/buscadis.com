-- catalog_products.id: UUID → text (nanoid 10, mismo espacio de URLs que adisos).

CREATE OR REPLACE FUNCTION public.gen_listing_nanoid(len int DEFAULT 10)
RETURNS text
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  alphabet text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-';
  result text := '';
  i int;
  attempts int := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..len LOOP
      result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    attempts := attempts + 1;
    IF attempts > 50 THEN
      RAISE EXCEPTION 'gen_listing_nanoid: no se pudo generar id único';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.adisos a WHERE a.id = result)
       AND NOT EXISTS (SELECT 1 FROM public.catalog_products c WHERE c.id = result) THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS "Users can view attributes of their products" ON public.product_attributes;
DROP POLICY IF EXISTS "Users can view images of their products" ON public.product_images;

ALTER TABLE public.page_analytics DROP CONSTRAINT IF EXISTS page_analytics_product_id_fkey;
ALTER TABLE public.product_variants DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
ALTER TABLE public.product_attributes DROP CONSTRAINT IF EXISTS product_attributes_product_id_fkey;
ALTER TABLE public.product_images DROP CONSTRAINT IF EXISTS product_images_product_id_fkey;
ALTER TABLE public.duplicate_candidates DROP CONSTRAINT IF EXISTS duplicate_candidates_existing_product_id_fkey;

ALTER TABLE public.page_analytics
  ALTER COLUMN product_id TYPE text USING product_id::text;
ALTER TABLE public.product_variants
  ALTER COLUMN product_id TYPE text USING product_id::text;
ALTER TABLE public.product_attributes
  ALTER COLUMN product_id TYPE text USING product_id::text;
ALTER TABLE public.product_images
  ALTER COLUMN product_id TYPE text USING product_id::text;
ALTER TABLE public.duplicate_candidates
  ALTER COLUMN existing_product_id TYPE text USING existing_product_id::text;

ALTER TABLE public.user_ad_interactions
  ALTER COLUMN adiso_id TYPE text USING adiso_id::text;

ALTER TABLE public.catalog_products
  ALTER COLUMN id DROP DEFAULT;

ALTER TABLE public.catalog_products
  ALTER COLUMN id TYPE text USING id::text;

ALTER TABLE public.page_analytics
  ADD CONSTRAINT page_analytics_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.catalog_products(id) ON DELETE SET NULL;

ALTER TABLE public.product_variants
  ADD CONSTRAINT product_variants_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.catalog_products(id) ON DELETE CASCADE;

ALTER TABLE public.product_attributes
  ADD CONSTRAINT product_attributes_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.catalog_products(id) ON DELETE CASCADE;

ALTER TABLE public.product_images
  ADD CONSTRAINT product_images_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.catalog_products(id) ON DELETE CASCADE;

ALTER TABLE public.duplicate_candidates
  ADD CONSTRAINT duplicate_candidates_existing_product_id_fkey
  FOREIGN KEY (existing_product_id) REFERENCES public.catalog_products(id) ON DELETE CASCADE;

CREATE POLICY "Users can view attributes of their products"
  ON public.product_attributes FOR SELECT
  USING (
    product_id IN (
      SELECT catalog_products.id
      FROM catalog_products
      WHERE catalog_products.business_profile_id IN (
        SELECT business_profiles.id FROM business_profiles WHERE business_profiles.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view images of their products"
  ON public.product_images FOR SELECT
  USING (
    product_id IN (
      SELECT catalog_products.id
      FROM catalog_products
      WHERE catalog_products.business_profile_id IN (
        SELECT business_profiles.id FROM business_profiles WHERE business_profiles.user_id = auth.uid()
      )
    )
  );

-- UUID legados → nanoid corto.
DO $$
DECLARE
  rec RECORD;
  new_id text;
BEGIN
  FOR rec IN
    SELECT id AS old_id
    FROM public.catalog_products
    WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    ORDER BY created_at NULLS LAST
  LOOP
    new_id := public.gen_listing_nanoid(10);
    UPDATE public.page_analytics SET product_id = new_id WHERE product_id = rec.old_id;
    UPDATE public.product_variants SET product_id = new_id WHERE product_id = rec.old_id;
    UPDATE public.product_attributes SET product_id = new_id WHERE product_id = rec.old_id;
    UPDATE public.product_images SET product_id = new_id WHERE product_id = rec.old_id;
    UPDATE public.duplicate_candidates SET existing_product_id = new_id WHERE existing_product_id = rec.old_id;
    UPDATE public.conversations SET adiso_id = new_id WHERE adiso_id = rec.old_id;
    UPDATE public.favoritos SET adiso_id = new_id WHERE adiso_id = rec.old_id;
    UPDATE public.user_view_history SET adiso_id = new_id WHERE adiso_id = rec.old_id;
    UPDATE public.user_ad_interactions SET adiso_id = new_id WHERE adiso_id = rec.old_id;
    UPDATE public.ad_interaction_sessions SET adiso_id = new_id WHERE adiso_id = rec.old_id;
    UPDATE public.catalog_products SET id = new_id WHERE id = rec.old_id;
  END LOOP;
END $$;
