-- Pending owner email: ADIS pre-creates a business and assigns it when the client signs up.

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS pending_owner_email TEXT;

CREATE INDEX IF NOT EXISTS idx_business_profiles_pending_owner_email
  ON business_profiles (lower(trim(pending_owner_email)))
  WHERE pending_owner_email IS NOT NULL;

COMMENT ON COLUMN business_profiles.pending_owner_email IS
  'Email of the future owner; cleared after claim_pending_business_ownership runs on signup.';

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
    UPDATE business_profiles
    SET
      user_id = v_user,
      pending_owner_email = NULL,
      updated_at = now()
    WHERE id = v_row.id;

    INSERT INTO business_members (business_profile_id, user_id, role, status, accepted_at)
    VALUES (v_row.id, v_user, 'owner', 'active', now())
    ON CONFLICT (business_profile_id, user_id) DO UPDATE
    SET role = 'owner', status = 'active', accepted_at = COALESCE(business_members.accepted_at, now()), updated_at = now();

    v_claimed := array_append(v_claimed, v_row.id);
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'claimed_count', COALESCE(array_length(v_claimed, 1), 0),
    'business_ids', to_jsonb(v_claimed)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_pending_business_ownership() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_pending_business_ownership() TO authenticated;
