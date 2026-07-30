/**
 * Soft-launch checklist — Buscadis Envíos
 * Corredor piloto: San Sebastián ↔ Centro ↔ San Jerónimo (+ Wanchaq)
 *
 * No ejecuta nada solo: guía operativa + SQL de referencia para seed manual.
 */

export const PILOT_LAUNCH = {
  corridor: ['San Sebastián', 'Centro', 'San Jerónimo', 'Wanchaq'] as const,
  farePerKm: 1,
  deepLinks: {
    hub: '/delivery',
    request: '/delivery/pedir',
    rider: '/delivery/llevar',
    riderRegister: '/delivery/llevar/registro',
    adminKyc: '/admin/envios/riders',
    adminStats: '/admin/envios',
  },
  whatsappCohortTarget: 10,
  heroGroupMessage: `Ahora también puedes pedir en *Buscadis Delivery* (app): mismo formato de siempre — nombre, recojo, destino y hora — pero tu número no se publica a todo el grupo. Motorizados verificados, chat privado y tu historial queda guardado.

Link: https://buscadis.com/delivery

Los motorizados ganan reputación permanente y ven solo pedidos reales, sin spam. Sin comisión.`,
  steps: [
    '1. Aplicar migraciones 040/041/047 (tablas + RPC accept_moto_request_service + buckets + viewers/favorites/claims).',
    '2. Invitar a los ~10 motorizados ya verificados del grupo WhatsApp al deep link /delivery/llevar/registro (prioridad revisión en admin).',
    '3. Aprobar en lote desde /admin/envios/riders (comparar DNI | selfie) — la capability rider se activa sola.',
    '4. Pedir que activen Online en picos 07:00–10:00 y 16:00–20:00.',
    '5. En el grupo WA: mensaje héroe (PILOT_LAUNCH.heroGroupMessage); no apagar el grupo hasta que tiempo-a-aceptación app ≤ WA.',
    '6. Marketing solo Envíos / mandados; asistencia con carga para casos especiales — sin lenguaje de taxi.',
    '7. KPI semana 1: solicitudes, riders online en pico, % chat-only (sin share teléfono), discovery marketplace post-entrega.',
  ],
} as const;

/**
 * SQL de referencia para marcar un rider existente como aprobado (tras subir docs):
 *
 * update moto_riders
 * set estado = 'aprobado', reviewed_at = now(), zonas = array['San Sebastián','Centro','San Jerónimo','Wanchaq']
 * where telefono_whatsapp = '9XXXXXXXX';
 */
