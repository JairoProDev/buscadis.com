import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { ClaimedBusinessSummary } from '@/lib/business/claimed-business';

export async function POST(req: NextRequest) {
  const user = await getUserFromRouteRequest(req);
  if (!user) {
    return NextResponse.json({ ok: false, skipped: true });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;
  if (!token) {
    return NextResponse.json({ ok: false, skipped: true });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data, error } = await supabase.rpc('claim_pending_business_ownership');
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const claim = (data || {}) as {
    ok?: boolean;
    claimed_count?: number;
    business_ids?: string[];
  };
  const claimedIds = new Set((claim.business_ids || []).map(String));

  // Negocios donde el usuario es miembro activo (para el aviso de bienvenida)
  const { data: memberships } = await supabaseAdmin
    .from('business_members')
    .select('role, business_profile_id, business_profiles!inner(id, slug, name, logo_url, is_published)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .in('role', ['owner', 'admin']);

  const businesses: ClaimedBusinessSummary[] = (memberships || [])
    .map((row: any) => {
      const bp = row.business_profiles;
      if (!bp?.id || !bp?.slug) return null;
      return {
        id: bp.id as string,
        slug: bp.slug as string,
        name: (bp.name as string) || bp.slug,
        logo_url: bp.logo_url as string | null,
        role: row.role as ClaimedBusinessSummary['role'],
        justClaimed: claimedIds.has(String(bp.id)),
      };
    })
    .filter(Boolean) as ClaimedBusinessSummary[];

  // Priorizar los recién reclamados
  businesses.sort((a, b) => Number(b.justClaimed) - Number(a.justClaimed));

  return NextResponse.json({
    ok: Boolean(claim.ok),
    claimed_count: claim.claimed_count || 0,
    business_ids: claim.business_ids || [],
    businesses,
  });
}
