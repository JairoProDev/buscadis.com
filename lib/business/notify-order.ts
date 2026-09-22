import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendPushToUser } from '@/lib/notifications/delivery';
import { getSiteUrl } from '@/lib/seo/og-image';

/**
 * Avisa al dueño del negocio cuando llega un pedido estructurado
 * (in-app + push Expo si hay token).
 */
export async function notifyBusinessOwnerOfOrder(params: {
  ownerUserId: string | null | undefined;
  businessName: string;
  orderId: string;
  orderNumber: string;
  total: number;
  itemCount: number;
  slug: string;
}): Promise<{ inApp: boolean; push: boolean }> {
  const ownerUserId = params.ownerUserId?.trim();
  if (!ownerUserId) {
    return { inApp: false, push: false };
  }

  const managePath = `/mi-negocio/pedidos?orden=${encodeURIComponent(params.orderId)}`;
  const title = `Nuevo pedido ${params.orderNumber}`;
  const body = `${params.itemCount} ítem${params.itemCount === 1 ? '' : 's'} · S/ ${params.total.toFixed(2)} en ${params.businessName}`;
  const data = {
    type: 'commerce_order',
    order_id: params.orderId,
    order_number: params.orderNumber,
    business_slug: params.slug,
    link: managePath,
    url: `${getSiteUrl()}${managePath}`,
  };

  let inApp = false;
  try {
    const { error } = await supabaseAdmin.from('notifications').insert({
      user_id: ownerUserId,
      type: 'system',
      title: title.slice(0, 200),
      message: body.slice(0, 2000),
      data,
      read: false,
    });
    if (error) {
      console.error('[notifyBusinessOwnerOfOrder] in-app', error.message);
    } else {
      inApp = true;
    }
  } catch (err) {
    console.error('[notifyBusinessOwnerOfOrder] in-app', err);
  }

  const push = await sendPushToUser(ownerUserId, title, body, data).catch(() => false);

  return { inApp, push };
}
