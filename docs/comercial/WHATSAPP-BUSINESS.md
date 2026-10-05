# WhatsApp Business + CRM (estado y camino)

## ¿Se puede tener todo el historial y que la IA lo mantenga solo?

**Sí, de forma oficial**, pero no conectando el WhatsApp personal como en WhatsApp Web. Hace falta **WhatsApp Business Platform (Cloud API)** de Meta:

| Requisito | Detalle |
|-----------|---------|
| Cuenta | Meta Business + app en [developers.facebook.com](https://developers.facebook.com) |
| Número | Línea dedicada (o migrar la Business actual al API) |
| Webhook | `POST` entrante a Buscadis/Vectorify (`WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, token en `.env`) |
| Historial | Solo mensajes **desde que conectas el API**; el chat previo del teléfono **no** se importa automáticamente a Meta |
| Ventana | Respuestas libres ~24h tras mensaje del cliente; fuera de eso, plantillas aprobadas |

**No recomendado para producción:** bots no oficiales (Baileys, etc.) — riesgo de baneo y sin soporte legal para datos de clientes.

## Qué ya tenemos en Buscadis

- CRM: `sales_opportunities`, `sales_activities` (tipos `whatsapp_outbound` / `whatsapp_inbound`)
- UI: borrador IA + enlace `wa.me` + registro manual del envío
- Variables previstas en `docs/SETUP_GUIDE.md`: `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`

## Siguiente implementación (cuando tengas el número en Cloud API)

1. `app/api/webhooks/whatsapp/route.ts` — verificación GET + eventos POST.
2. Resolver contacto → oportunidad (`contact_whatsapp` normalizado) o crear lead `inbound`.
3. Insertar cada mensaje en `sales_activities` (y tabla opcional `sales_messages` con `wamid`, dirección, cuerpo, timestamp).
4. Job/cola: al mensaje entrante, llamar `suggestWhatsAppReply` con últimas N actividades + contexto del aviso Rueda (`metadata`, `adiso_id`).
5. Modo humano: sugerencia en `/admin/comercial`; modo futuro Vectorify: envío con aprobación o auto según política.

## Migración del historial antiguo

Opciones realistas:

- Export manual de conversaciones importantes (copiar a notas del CRM), o
- Herramientas de backup Business (limitadas), o
- Aceptar “día cero” en API y solo contexto comercial desde publicaciones Rueda + notas ops.

La IA no necesita 5 años de chat si tiene **cada aviso extraído del PDF** + **pipeline de venta** bien ligado al teléfono.
