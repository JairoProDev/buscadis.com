-- Admin-only ownership transfer (service_role). Bypasses owner-role guard via session flag.

CREATE OR REPLACE FUNCTION public.admin_force_transfer_business_owner(
  p_business_id uuid,
  p_new_owner_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_old_owner uuid;
BEGIN
  IF p_business_id IS NULL OR p_new_owner_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_args');
  END IF;

  -- Ensure new owner is an active member (admin/editor/owner)
  INSERT INTO business_members (business_profile_id, user_id, role, status)
  VALUES (p_business_id, p_new_owner_user_id, 'admin'::business_member_role, 'active')
  ON CONFLICT (business_profile_id, user_id) DO UPDATE
    SET status = 'active',
        updated_at = now();

  SELECT m.user_id INTO v_old_owner
  FROM business_members m
  WHERE m.business_profile_id = p_business_id
    AND m.role = 'owner'::business_member_role
    AND m.status = 'active'
  LIMIT 1;

  IF v_old_owner IS NOT NULL AND v_old_owner = p_new_owner_user_id THEN
    UPDATE business_profiles
    SET user_id = p_new_owner_user_id,
        pending_owner_email = null,
        updated_at = now()
    WHERE id = p_business_id;

    RETURN jsonb_build_object('ok', true, 'new_owner_user_id', p_new_owner_user_id, 'already_owner', true);
  END IF;

  PERFORM set_config('app.business_owner_transfer', 'on', true);

  IF v_old_owner IS NOT NULL THEN
    UPDATE business_members
    SET role = 'admin'::business_member_role, updated_at = now()
    WHERE business_profile_id = p_business_id AND user_id = v_old_owner;
  END IF;

  UPDATE business_members
  SET role = 'owner'::business_member_role, status = 'active', updated_at = now()
  WHERE business_profile_id = p_business_id AND user_id = p_new_owner_user_id;

  PERFORM set_config('app.business_owner_transfer', '', true);

  UPDATE business_profiles
  SET user_id = p_new_owner_user_id,
      pending_owner_email = null,
      updated_at = now()
  WHERE id = p_business_id;

  INSERT INTO business_team_audit_log (business_profile_id, actor_user_id, action, target_user_id, metadata)
  VALUES (
    p_business_id,
    NULL,
    'owner_transferred_admin',
    p_new_owner_user_id,
    jsonb_build_object('previous_owner_id', v_old_owner, 'via', 'admin_force_transfer_business_owner')
  );

  RETURN jsonb_build_object(
    'ok', true,
    'new_owner_user_id', p_new_owner_user_id,
    'previous_owner_id', v_old_owner
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_force_transfer_business_owner(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_force_transfer_business_owner(uuid, uuid) TO service_role;

COMMENT ON FUNCTION public.admin_force_transfer_business_owner(uuid, uuid) IS
  'Service-role only: force transfer business ownership (platform ops).';
