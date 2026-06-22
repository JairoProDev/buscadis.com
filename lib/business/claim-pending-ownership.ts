import { createServerClient } from '@/lib/supabase-server';

export type ClaimPendingOwnershipResult = {
  ok: boolean;
  claimed_count?: number;
  business_ids?: string[];
  error?: string;
};

export async function claimPendingBusinessOwnership(): Promise<ClaimPendingOwnershipResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'not_authenticated' };
  }

  const { data, error } = await supabase.rpc('claim_pending_business_ownership');

  if (error) {
    console.error('claim_pending_business_ownership:', error);
    return { ok: false, error: error.message };
  }

  const result = (data || {}) as ClaimPendingOwnershipResult;
  return { ...result, ok: Boolean(result.ok) };
}
