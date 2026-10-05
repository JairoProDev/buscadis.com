# Importar historial de WhatsApp al CRM

## ¿Puede Cursor/la IA entrar a mi WhatsApp?

**No.** Nadie externo puede leer tus chats sin que exportes archivos o conectes la API oficial. No hay forma mágica ni segura de “hacerlo por ti” sin datos del teléfono.

## WhatsApp Web vs celular

**Exportar chat solo está en la app móvil** (⋮ → Más → Exportar chat). En **WhatsApp Web / escritorio no aparece** esa opción. Es normal.

## La forma más rápida para ~100 contactos

No es uno por uno en el CRM, sino **muchos exports + una sola subida**:

1. **En el celular** (puedes hacerlo en varias sesiones): abre chat → Exportar → Sin archivos → guardar o enviar a Drive/correo.
2. En el PC, renombra cada `.txt` con el **número de 9 dígitos** al inicio, por ejemplo:
   - `984759634-mapacho.txt`
   - `955009160-black-llama.txt`
3. En **`/admin/comercial`**, bloque **「Importar muchos chats」** → selecciona **todos** los `.txt` → importa de golpe.
4. O en local: carpeta `exports-wa/` y  
   `npx tsx scripts/comercial/import-whatsapp-exports-dir.ts --dir=./exports-wa --apply`

El sistema **empareja por número** con la oportunidad del CRM y crea actividades (entrante/saliente).

### Truco para ir más rápido en el teléfono

- Exporta solo chats con actividad de campaña (los que tienen mensajes tuyos).
- Si usas **etiquetas** en WhatsApp Business, filtra por etiqueta y exporta ese lote.
- Comparte los `.txt` a **Google Drive** desde el móvil y descarga la carpeta en el PC de una vez.

## Qué datos trae el export oficial

| Sí | No |
|----|-----|
| Fecha, hora, nombre en el chat, texto | Foto de perfil WA completa |
| | Export masivo de todos los chats en un clic |

## Un solo chat en la ficha

En la oportunidad: pegar `.txt` en **Importar chat WhatsApp**.

## API

- Un chat: `POST /api/ops/comercial/opportunities/{id}/import-whatsapp`
- Varios: `POST /api/ops/comercial/import-whatsapp/batch` (multipart `files`)

Variable opcional: `CRM_WA_OUTBOUND_NAMES=jairo,buscadis,shantall,adis` para marcar mensajes salientes.

## Hacia adelante

WhatsApp **Cloud API**: solo mensajes desde el día de conexión; el pasado sigue siendo export `.txt` una vez.
