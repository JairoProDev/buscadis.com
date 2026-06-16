import { supabaseAdmin } from '@/lib/supabase-admin';
import { DealPromotionTier } from '@/types';
import { dealTierPrice } from '@/lib/deals/config';

export type DealOrderStatus = 'pending' | 'paid' | 'dev_bypass' | 'failed' | 'cancelled';

export interface DealPromotionOrderRow {
  id: string;
  user_id: string;
  clip_id: string;
  tier: DealPromotionTier;
  amount_pen: number;
  status: DealOrderStatus;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  paid_at: string | null;
  fulfilled_at: string | null;
}

export function isDealPromotionDevBypassEnabled(): boolean {
  return process.env.PROMOTION_DEV_BYPASS === 'true';
}

export async function createDealPromotionOrder(params: {
  userId: string;
  clipId: string;
  tier: DealPromotionTier;
  status?: DealOrderStatus;
}): Promise<DealPromotionOrderRow | null> {
  const amount = dealTierPrice(params.tier);
  const isPrepaid = params.status === 'paid' || params.status === 'dev_bypass' || amount === 0;

  const { data, error } = await supabaseAdmin
    .from('deal_promotion_orders')
    .insert({
      user_id: params.userId,
      clip_id: params.clipId,
      tier: params.tier,
      amount_pen: amount,
      status: params.status || (amount > 0 ? 'pending' : 'paid'),
      paid_at: isPrepaid ? new Date().toISOString() : null,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('[deal-promotion] create order error:', error?.message);
    return null;
  }

  return data as DealPromotionOrderRow;
}

export async function fulfillDealPromotionOrder(orderId: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc('fn_fulfill_deal_order', { p_order_id: orderId });
  if (error) throw new Error(error.message);
}

export async function getDealOrderById(orderId: string): Promise<DealPromotionOrderRow | null> {
  const { data, error } = await supabaseAdmin
    .from('deal_promotion_orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !data) return null;
  return data as DealPromotionOrderRow;
}

export async function markDealOrderPaid(orderId: string, mpPaymentId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('deal_promotion_orders')
    .update({
      status: 'paid',
      mp_payment_id: mpPaymentId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('status', 'pending');

  if (error) throw new Error(error.message);
}
