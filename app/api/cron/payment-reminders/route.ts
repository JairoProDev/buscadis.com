import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data: pendingOrders } = await supabaseAdmin
    .from('adiso_publish_orders')
    .select('id, adiso_id, user_id, total_amount, created_at')
    .eq('payment_status', 'pending')
    .lt('created_at', twoHoursAgo)
    .limit(50);

  let reminded = 0;
  for (const order of pendingOrders || []) {
    // Mark for reminder — actual WhatsApp push in future automation
    await supabaseAdmin
      .from('adiso_publish_orders')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', order.id);
    reminded++;
  }

  return NextResponse.json({ ok: true, reminded, total: pendingOrders?.length ?? 0 });
}
