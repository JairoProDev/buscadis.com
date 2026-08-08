# Perfil Vivo — informe dueño + nudge reseña

## Informe
Widget Confianza: toggle 7d / 30d, conversión visita→WA, tip contextual.

## Cron 48h lite
No escribe al cliente (sin teléfono). Notifica al dueño con enlace `/resena/{token}` listo.
Schedule: `0 14 * * *` → `/api/cron/review-invite-nudge`.
