# Soft launch — Buscadis Envíos

## Corredor piloto

San Sebastián ↔ Centro ↔ San Jerónimo (+ Wanchaq).

## Links

| Rol | URL |
|-----|-----|
| Hub | `/envios` |
| Pedir | `/envios/nueva` |
| Motorizado | `/envios/conductor` |
| Registro KYC | `/envios/conductor/registro` |
| Admin KYC | `/admin/envios/riders` |
| Admin métricas | `/admin/envios` |

## Checklist

1. Aplicar `supabase/migrations/040_envios.sql` (tablas + RPC `accept_moto_request` + buckets `moto-kyc` / `moto-packages`).
2. Invitar cohorte WhatsApp (~10 ya filtrados) a `/envios/conductor/registro`.
3. Revisar DNI|selfie en admin y aprobar en lote.
4. Online en picos 7–10h y 16–20h.
5. Mensaje en grupo WA con link a la app; mantener grupo hasta que la app iguale tiempo de respuesta.
6. Marketing solo “Envíos”; traslados vía categoría **Otro** + descripción.
7. Medir en `/admin/envios`: volumen, zonas, `uso_detectado` (interno).

## Mensaje sugerido para el grupo

> Ahora también puedes pedir en **Buscadis Envíos** (app): recojo, destino y hora — igual que el formato del grupo. Motorizados verificados. Link: https://buscadis.com/envios
