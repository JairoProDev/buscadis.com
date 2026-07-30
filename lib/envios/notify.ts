import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendPushToUser } from '@/lib/notifications/delivery';
import { findEligibleRiders } from './matching';
import { MOTO_CATEGORY_LABELS, type MotoRequest } from './types';
import { formatFareSoles } from './fare';

async function insertInAppNotification(
  userId: string,
  title: string,
  message: string,
  data: Record<string, unknown>
) {
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type: 'system',
    title,
    message,
    data,
  });
}

export async function notifyRidersNewRequest(
  request: MotoRequest
): Promise<{ sent: number; eligible: number; onlineOnly: boolean }> {
  const onlineOnly = true;
  let riders = await findEligibleRiders({
    zona: request.pickup_zona,
    mandadoCompra: request.category === 'mandado',
    onlineOnly,
  });

  // Fallback suave: si nadie online, avisa a aprobados (sin spam push agresivo — in-app only)
  let usedOnlineOnly = true;
  if (riders.length === 0) {
    riders = await findEligibleRiders({
      zona: request.pickup_zona,
      mandadoCompra: request.category === 'mandado',
      onlineOnly: false,
    });
    usedOnlineOnly = false;
  }

  const cat = MOTO_CATEGORY_LABELS[request.category];
  const title = 'Nuevo envío disponible';
  const body = `${cat}: ${request.pickup_text} → ${request.dropoff_text} · ${formatFareSoles(Number(request.fare_estimate))}`;

  let sent = 0;
  await Promise.all(
    riders.map(async (r) => {
      await insertInAppNotification(r.user_id, title, body, {
        kind: 'moto_request_new',
        request_id: request.id,
      });
      // Push solo a online (o a todos si fallback y son pocos)
      if (usedOnlineOnly || riders.length <= 15) {
        const ok = await sendPushToUser(r.user_id, title, body, {
          kind: 'moto_request_new',
          request_id: request.id,
          url: `/delivery/llevar`,
        });
        if (ok) sent += 1;
      }
    })
  );
  return { sent, eligible: riders.length, onlineOnly: usedOnlineOnly };
}

export async function notifyRequesterStatus(
  request: MotoRequest,
  title: string,
  message: string
): Promise<void> {
  await insertInAppNotification(request.requester_id, title, message, {
    kind: 'moto_request_status',
    request_id: request.id,
    status: request.status,
  });
  await sendPushToUser(request.requester_id, title, message, {
    kind: 'moto_request_status',
    request_id: request.id,
    url: `/delivery/${request.id}`,
  });
}

export async function notifyRiderKyc(
  userId: string,
  approved: boolean,
  note?: string | null
): Promise<void> {
  const title = approved ? '¡Ya puedes recibir envíos!' : 'Revisión de documentos';
  const message = approved
    ? 'Tu perfil de motorizado fue aprobado. Activa el modo online para ver solicitudes.'
    : note || 'Necesitamos que corrijas algunos documentos. Revisa tu registro.';

  await insertInAppNotification(userId, title, message, {
    kind: 'moto_kyc',
    approved,
  });
  await sendPushToUser(userId, title, message, {
    kind: 'moto_kyc',
    url: '/delivery/llevar',
  });
}
