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

---

## Preguntas frecuentes (oct 2026)

### ¿Puedo conectar la API sin pagar y ver todos los chats en el repo?

**Parcialmente.** Crear app en Meta y recibir webhooks **no tiene cuota mensual**. Lo que pagas son **mensajes que envías por la API** (sobre todo plantillas de marketing/utilidad). **Leer** eventos entrantes y **eco de lo que escribes en la app** (Coexistence) es el camino oficial para alimentar el CRM.

**Importante:** el historial **anterior** al día de conexión no llega solo al webhook; con **Coexistence** Meta puede sincronizar hasta ~6 meses al empadronar. El resto sigue en `data/comercial/wa-chats/` + import.

### ¿Sigo escribiendo a números nuevos gratis desde el celular?

**Sí**, si usas **Coexistence** en el mismo número de WhatsApp Business:

- Prospección manual (25/día) → **app**, como hoy. No necesitas plantilla para el primer mensaje que tú escribes desde el teléfono.
- Lo que **no** puedes hacer gratis por API: abrir conversación en frío con **plantilla marketing** (cobro por mensaje entregado en Perú ~USD 0,0703; ver [tarifas Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)).
- Conectar la API **no te quita** escribir a mano en la app.

Abre la app al menos **cada 13 días** o Coexistence puede desvincularse. Perú (+51) está en mercados con tarifa propia; Coexistence no aparece en la lista de países bloqueados (Nigeria, Sudáfrica, etc.).

### ¿Qué es gratis y útil al conectar (sin Baileys)?

| Gratis / útil | No resuelve solo |
|---------------|------------------|
| Webhook: mensajes **entrantes** del cliente | Prospección masiva por API |
| `smb_message_echoes`: lo que **envías desde la app** aparece en tu servidor | Chats de **antes** del alta (salvo sync inicial Coexistence) |
| Emparejar teléfono → `sales_opportunities` en Supabase | Sustituir etiquetas y disciplina diaria |
| Cursor lee contexto desde DB/script, no copy-paste | Meta Business verificación (RUC ayuda) |

### Precios Perú desde 1 oct 2026 (verificar en Meta)

- Entrantes del cliente: **gratis** (recibir).
- Respuestas de **servicio** por API: **1 000 gratis/mes** por número; luego ~USD 0,03 (~S/0,10) por mensaje.
- Plantillas **marketing** (frío por API): ~USD 0,0703 por entrega.

**Estrategia Buscadis:** frío **solo app**; API para **registrar** conversación y (futuro) sugerir respuesta en admin. No automatizar envíos de prospección por API.

### ¿Baileys / MCP “solo lectura”?

Técnicamente lee chats como WhatsApp Web, pero:

- Viola términos de WhatsApp; **riesgo de ban** (ya tuviste un bloqueo).
- Sesión en `auth/` = acceso total a chats; MCP de terceros = auditar código antes del QR.
- **No** en el número **Publicadis** de ventas si no puedes perderlo.

Si algún día lo usas: número **secundario**, solo backup, nunca envíos automáticos. No es la base del CRM.

---

## Qué hacer (recomendación Buscadis)

### Fase 0 — ya (0 costo, esta semana)

1. **Etiquetas WA Business:** `Nuevo` · `Respondió` · `Muestra` · `Cotizado` · `Pagó` · `Archivo`.
2. **Solo pegar en Cursor** hilos **🔴/🟠** (`PIPELINE-ESTADO-*.md`), no los 50 grises.
3. Tras sesión WA:

   ```bash
   npx tsx scripts/comercial/import-whatsapp-exports-dir.ts --dir=data/comercial/wa-chats --apply
   ```

4. Borrador siguiente mensaje: `/admin/comercial` → IA o Cursor con `wa-chats/` + `campana-rueda-oct-2026.json`.

### Fase 1 — tú en Meta (1–2 días, sin BSP obligatorio)

1. Meta Business verificado (RUC).
2. App WhatsApp → Cloud API → número Publicadis con **“Connect your existing WhatsApp Business App”** (Coexistence).
3. Webhook URL producción: `https://buscadis.com/api/webhooks/whatsapp` (cuando exista la ruta).
4. Variables en Vercel: `WHATSAPP_*` (ver `.env.example`).

### Fase 2 — implementación en repo (yo)

Cuando tengas `PHONE_NUMBER_ID` + token + verify token:

1. `app/api/webhooks/whatsapp/route.ts` (GET verify + POST).
2. Guardar en `sales_activities` / `sales_messages` (migración si falta).
3. Match `contact_whatsapp` (9 dígitos PE) → oportunidad; si no hay, lead inbound.
4. Script `npx tsx scripts/comercial/wa-context.ts --phone=984271525` para que Cursor imprima últimos mensajes sin pegar.
5. (Opcional) notificación o cola para `suggestWhatsAppReply` en hilos activos.

**No puedo escanear el QR por ti**; eso solo en tu teléfono. Sí puedo dejar el código listo y probar webhook con Meta cuando configures.

### Fase 3 — más adelante

- **Segundo número** solo postulantes / `wa.me` en avisos (API + plantillas utility si hace falta).
- Número de ventas = Coexistence + humano; sin bots de envío masivo.

---

## ¿Nos conviene?

| Opción | ¿Viable? | ¿Conviene ahora? |
|--------|----------|------------------|
| Seguir manual + `wa-chats` + import | Sí | **Sí** — prioriza cerrar ferretera/Julio/Nina |
| Cloud API + Coexistence + webhook | Sí | **Sí** — cuando tengas 2 h para Meta; deja de copiar/pegar **nuevos** mensajes |
| Baileys / Evolution en ventas | Sí técnicamente | **No** — riesgo > beneficio |
| Automatizar 25 cold/día por API | Sí | **No** — caro, plantillas, peor que tu mensaje manual |

**Conclusión:** el CRM **ya está en el repo**; el cuello de botella es **sincronizar texto**, no falta de Supabase. Coexistence + webhook es el siguiente paso oficial. Baileys solo como plan C con número desechable.

Ver también: `IMPORTAR-CHATS-WHATSAPP.md`, `CHATS-MANUAL.md`, `ARQUITECTURA.md`.
