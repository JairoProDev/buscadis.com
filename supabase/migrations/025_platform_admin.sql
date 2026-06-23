-- Platform superadmins (e.g. buscadiss@gmail.com) can edit any business profile.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_platform_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT COALESCE(
    (
      SELECT (p.rol = 'admin' OR p.is_platform_admin = true)
      FROM public.profiles p
      WHERE p.id = p_user_id
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_business_profile(p_business_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT public.is_platform_admin(p_user_id)
  OR EXISTS (
    SELECT 1 FROM business_members m
    WHERE m.business_profile_id = p_business_id
      AND m.user_id = p_user_id
      AND m.status = 'active'
      AND m.role IN ('owner'::business_member_role, 'admin'::business_member_role, 'editor'::business_member_role)
  );
$$;

DROP POLICY IF EXISTS "Platform admin read any business" ON business_profiles;
CREATE POLICY "Platform admin read any business"
  ON business_profiles FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

-- Catalog CRUD: align with business_members RBAC + platform admin
DROP POLICY IF EXISTS "Users can create their own products" ON catalog_products;
CREATE POLICY "Editors create catalog products"
  ON catalog_products FOR INSERT
  WITH CHECK (public.can_edit_business_profile(business_profile_id, auth.uid()));

DROP POLICY IF EXISTS "Users can update their own products" ON catalog_products;
CREATE POLICY "Editors update catalog products"
  ON catalog_products FOR UPDATE
  USING (public.can_edit_business_profile(business_profile_id, auth.uid()))
  WITH CHECK (public.can_edit_business_profile(business_profile_id, auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own products" ON catalog_products;
CREATE POLICY "Editors delete catalog products"
  ON catalog_products FOR DELETE
  USING (public.can_edit_business_profile(business_profile_id, auth.uid()));

COMMENT ON COLUMN public.profiles.is_platform_admin IS 'When true, user can edit any business profile on the platform.';
