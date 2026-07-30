# Soft launch — Buscadis Delivery (Envíos)

## Principio

Somos los héroes que resuelven privacidad, reputación y pedidos limpios — no los policías del chat. Toda la coordinación post-match va por el chat de la app; WhatsApp del grupo se mantiene hasta que el SLA de la app iguale o supere al del grupo.

## Corredor piloto

San Sebastián ↔ Centro ↔ San Jerónimo (+ Wanchaq).

## Links canónicos

| Rol | URL |
|-----|-----|
| Hub | `/delivery` |
| Pedir | `/delivery/pedir` |
| Motorizado | `/delivery/llevar` |
| Registro KYC | `/delivery/llevar/registro` |
| Seguimiento público | `/delivery/seguir/[token]` |
| Admin KYC | `/admin/envios/riders` |
| Admin métricas | `/admin/envios` |

(Las rutas legacy `/envios/*` redirigen a `/delivery/*`.)

## Checklist

1. Aplicar migraciones `040_envios.sql`, `041_envios_chat_location.sql`, `047_envios_elevate.sql` (RPC `accept_moto_request_service`, viewers, favorites, claims, evidence, share_token).
2. Buckets `moto-kyc` (privado) y `moto-packages` (público).
3. Invitar cohorte WhatsApp (~10 filtrados) a `/delivery/llevar/registro`.
4. Aprobar en lote en `/admin/envios/riders` (botón “Aprobar todos” + checklist DNI|selfie). La capability `rider` se activa sola.
5. Online en picos 07:00–10:00 y 16:00–20:00.
6. Mensaje héroe en el grupo (abajo). No apagar el grupo hasta `tiempo_aceptacion_app ≤ WA`.
7. Marketing solo **Envíos / mandados**. Categoría “Asistencia con carga” para casos especiales — sin lenguaje de taxi/pasajero.
8. Medir en `/admin/envios`: volumen, zonas, chat-only %, reclamos abiertos, tipo de solicitud (envio/asistencia).

## Mensaje sugerido para el grupo

> Ahora también puedes pedir en **Buscadis Delivery** (app): mismo formato de siempre — nombre, recojo, destino y hora — pero tu número no se publica a todo el grupo. Motorizados verificados, chat privado y tu historial queda guardado.
>
> Link: https://buscadis.com/delivery
>
> Los motorizados ganan reputación permanente y ven solo pedidos reales, sin spam. Sin comisión.

## Cron programados

`GET/POST /api/envios/cron/scheduled` (Bearer `CRON_SECRET` o admin) — notifica riders cuando un pedido programado entra en ventana (~30 min). Configurado en `vercel.json` cada 10 minutos.

## Tests locales

```bash
npm run test:envios
```
