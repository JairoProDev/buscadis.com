-- Claim pending ownership: also demote previous owner so unique owner index holds

CREATE OR REPLACE FUNCTION public.claim_pending_business_ownership()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_email text;
  v_row business_profiles%ROWTYPE;
  v_claimed uuid[] := ARRAY[]::uuid[];
  v_old_owner uuid;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT lower(trim(email)) INTO v_email
  FROM auth.users
  WHERE id = v_user;

  IF v_email IS NULL OR v_email = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_email');
  END IF;

  FOR v_row IN
    SELECT *
    FROM business_profiles
    WHERE pending_owner_email IS NOT NULL
      AND lower(trim(pending_owner_email)) = v_email
  LOOP
    SELECT m.user_id INTO v_old_owner
    FROM business_members m
    WHERE m.business_profile_id = v_row.id
      AND m.role = 'owner'::business_member_role
      AND m.status = 'active'
    LIMIT 1;

    PERFORM set_config('app.business_owner_transfer', 'on', true);

    IF v_old_owner IS NOT NULL AND v_old_owner IS DISTINCT FROM v_user THEN
      UPDATE business_members
      SET role = 'admin'::business_member_role, updated_at = now()
      WHERE business_profile_id = v_row.id AND user_id = v_old_owner;
    END IF;

    UPDATE business_profiles
    SET
      user_id = v_user,
      pending_owner_email = NULL,
      updated_at = now()
    WHERE id = v_row.id;

    INSERT INTO business_members (business_profile_id, user_id, role, status, accepted_at)
    VALUES (v_row.id, v_user, 'owner', 'active', now())
    ON CONFLICT (business_profile_id, user_id) DO UPDATE
    SET role = 'owner',
        status = 'active',
        accepted_at = COALESCE(business_members.accepted_at, now()),
        updated_at = now();

    PERFORM set_config('app.business_owner_transfer', '', true);

    v_claimed := array_append(v_claimed, v_row.id);
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'claimed_count', COALESCE(array_length(v_claimed, 1), 0),
    'business_ids', to_jsonb(v_claimed)
  );
END;
$$;
