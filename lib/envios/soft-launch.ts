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
    hub: '/envios',
    request: '/envios/nueva',
    rider: '/envios/conductor',
    riderRegister: '/envios/conductor/registro',
    adminKyc: '/admin/envios/riders',
    adminStats: '/admin/envios',
  },
  whatsappCohortTarget: 10,
  steps: [
    '1. Aplicar migración supabase/migrations/040_envios.sql (y buckets moto-kyc, moto-packages).',
    '2. Invitar a los ~10 motorizados ya verificados del grupo WhatsApp al deep link /envios/conductor/registro (prioridad revisión en admin).',
    '3. Aprobar en lote desde /admin/envios/riders (comparar DNI | selfie).',
    '4. Pedir que activen Online en picos 07:00–10:00 y 16:00–20:00.',
    '5. En el grupo WA: “También pide en Buscadis Envíos” + link; no apagar el grupo hasta que tiempo-a-aceptación app ≤ WA.',
    '6. Usuarios: categoría Otro + descripción clara para traslados (camuflaje); no mencionar pasajero en marketing.',
    '7. KPI semana 1: solicitudes, riders online en pico, % uso_detectado posible_viaje (solo admin), discovery marketplace post-entrega.',
  ],
} as const;

/**
 * SQL de referencia para marcar un rider existente como aprobado (tras subir docs):
 *
 * update moto_riders
 * set estado = 'aprobado', reviewed_at = now(), zonas = array['San Sebastián','Centro','San Jerónimo','Wanchaq']
 * where telefono_whatsapp = '9XXXXXXXX';
 */
