import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from('deal_challenges')
      .select('*')
      .eq('is_active', true)
      .order('starts_at', { ascending: false });

    return NextResponse.json({ challenges: data || [] });
  } catch (e) {
    console.error('[api/deals/challenges]', e);
    return NextResponse.json({ challenges: [] });
  }
}
