import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data: clip } = await supabaseAdmin
      .from('deal_clips')
      .select('view_count, like_count, save_count, share_count, cta_click_count')
      .eq('id', id)
      .maybeSingle();

    if (!clip) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { count: whatsappClicks } = await supabaseAdmin
      .from('deal_clip_interactions')
      .select('*', { count: 'exact', head: true })
      .eq('clip_id', id)
      .eq('interaction_type', 'whatsapp_click');

    return NextResponse.json({
      metrics: {
        views: clip.view_count,
        likes: clip.like_count,
        saves: clip.save_count,
        shares: clip.share_count,
        cta_clicks: clip.cta_click_count,
        whatsapp_clicks: whatsappClicks || 0,
      },
    });
  } catch (e) {
    console.error('[api/deals/metrics]', e);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
