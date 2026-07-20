/**
 * Integración mínima con Mercado Pago Checkout Pro (REST, sin SDK).
 * https://www.mercadopago.com.pe/developers/es/docs/checkout-pro
 */

export interface MercadoPagoPreferenceResult {
  preferenceId: string;
  initPoint: string;
  sandboxInitPoint?: string;
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN?.trim());
}

export type MercadoPagoCheckoutKind =
  | 'adiso'
  | 'story'
  | 'package'
  | 'deal'
  | 'catalog_order'
  | 'business_subscription';

export async function createMercadoPagoPreference(params: {
  orderId: string;
  title: string;
  unitPricePen: number;
  payerEmail?: string;
  kind?: MercadoPagoCheckoutKind;
  metadata?: Record<string, string>;
}): Promise<MercadoPagoPreferenceResult | null> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token || params.unitPricePen <= 0) return null;

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const kind = params.kind || 'adiso';
  const notificationUrl =
    kind === 'catalog_order'
      ? `${appUrl}/api/business/checkout/webhook`
      : kind === 'business_subscription'
        ? `${appUrl}/api/business/subscription/webhook`
      : kind === 'deal'
      ? `${appUrl}/api/deals/promote/webhook`
      : kind === 'story'
      ? `${appUrl}/api/stories/promote/webhook`
      : kind === 'package'
        ? `${appUrl}/api/adisos/package/webhook`
        : `${appUrl}/api/adisos/promote/webhook`;
  const typeQuery =
    kind === 'catalog_order'
      ? '&type=catalog_order'
      : kind === 'business_subscription'
        ? '&type=business_subscription'
      : kind === 'deal'
      ? '&type=deal'
      : kind === 'story'
        ? '&type=story'
        : kind === 'package'
          ? '&type=package'
          : '';

  const slugForReturn = params.metadata?.slug?.trim();
  const businessReturnBase = slugForReturn
    ? `${appUrl}/@${slugForReturn}?edit=true`
    : `${appUrl}/mi-negocio`;
  const subJoin = businessReturnBase.includes('?') ? '&' : '?';

  const successUrl =
    kind === 'business_subscription'
      ? `${businessReturnBase}${subJoin}subscription=success`
      : kind === 'catalog_order'
      ? `${appUrl}/checkout/exito?order=${params.orderId}${typeQuery}`
      : `${appUrl}/promocionar/exito?order=${params.orderId}${typeQuery}`;
  const failureUrl =
    kind === 'business_subscription'
      ? `${businessReturnBase}${subJoin}subscription=error`
      : kind === 'catalog_order'
      ? `${appUrl}/checkout/error?order=${params.orderId}${typeQuery}`
      : `${appUrl}/promocionar/error?order=${params.orderId}${typeQuery}`;
  const pendingUrl =
    kind === 'business_subscription'
      ? `${businessReturnBase}${subJoin}subscription=pending`
      : kind === 'catalog_order'
      ? `${appUrl}/checkout/pendiente?order=${params.orderId}${typeQuery}`
      : `${appUrl}/promocionar/pendiente?order=${params.orderId}${typeQuery}`;

  const body: Record<string, unknown> = {
    items: [
      {
        id: params.orderId,
        title: params.title.slice(0, 256),
        quantity: 1,
        unit_price: params.unitPricePen,
        currency_id: 'PEN',
      },
    ],
    external_reference: params.orderId,
    back_urls: {
      success: successUrl,
      failure: failureUrl,
      pending: pendingUrl,
    },
    auto_return: 'approved',
    notification_url: notificationUrl,
    statement_descriptor: 'BUSCADIS',
  };

  if (params.payerEmail) {
    body.payer = { email: params.payerEmail };
  }

  if (params.metadata) {
    body.metadata = params.metadata;
  }

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error('[mercadopago] preference error:', res.status, errText);
    return null;
  }

  const data = (await res.json()) as {
    id?: string;
    init_point?: string;
    sandbox_init_point?: string;
  };

  if (!data.id || !data.init_point) return null;

  return {
    preferenceId: data.id,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point,
  };
}

export async function getMercadoPagoPayment(paymentId: string): Promise<{
  status: string;
  externalReference: string | null;
} | null> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) return null;

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    status?: string;
    external_reference?: string;
  };

  return {
    status: data.status || 'unknown',
    externalReference: data.external_reference || null,
  };
}
