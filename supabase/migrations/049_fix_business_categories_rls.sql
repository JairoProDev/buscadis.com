-- Fix business_categories write RLS: allow profile owners, team editors,
-- and platform admins (same rule as catalog_products via can_edit_business_profile).
-- Also ensure can_edit_business_profile includes the profile owner (user_id).

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
    SELECT 1 FROM public.business_profiles bp
    WHERE bp.id = p_business_id
      AND bp.user_id = p_user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.business_members m
    WHERE m.business_profile_id = p_business_id
      AND m.user_id = p_user_id
      AND m.status = 'active'
      AND m.role IN (
        'owner'::business_member_role,
        'admin'::business_member_role,
        'editor'::business_member_role
      )
  );
$$;

DROP POLICY IF EXISTS "business_categories_write_owner" ON public.business_categories;
CREATE POLICY "business_categories_write_editors"
  ON public.business_categories
  FOR ALL
  USING (public.can_edit_business_profile(business_profile_id, auth.uid()))
  WITH CHECK (public.can_edit_business_profile(business_profile_id, auth.uid()));
