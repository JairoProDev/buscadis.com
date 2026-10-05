# Importar historial de WhatsApp al CRM (sin extensiones raras)

## Lo que Meta permite (oficial y seguro)

No existe un botón “exportar todos los chats de negocio” de una vez en la app. Lo **oficial** es **por conversación**:

### En el teléfono (WhatsApp / WhatsApp Business)

1. Abre el chat del cliente.
2. Menú **⋮** → **Más** → **Exportar chat**.
3. Elige **Sin archivos** (más liviano; el texto basta para el CRM) o **Incluir archivos** si necesitas audios/imágenes aparte.
4. Guarda el `.txt` (o envíatelo por correo / Drive).

El archivo trae líneas con **fecha, hora, nombre del remitente y mensaje**. Eso es lo que importamos.

### Qué no recomendamos

- Extensiones de Chrome que piden acceso total a WhatsApp Web (riesgo de baneo y de robo de sesión).
- Apps “backup” no oficiales.
- Automatizar clics masivos en Web.

### Hacia adelante (cuando tengas Cloud API)

Solo los mensajes **después** de conectar el número quedan en servidor; el historial previo hay que traerlo con export `.txt` una vez.

## Qué capturamos al importar

| Dato | Origen |
|------|--------|
| Fecha y hora | Cada línea del `.txt` |
| Remitente | Nombre en el export |
| Mensaje | Texto (multilínea soportado) |
| Entrante / saliente | Si el nombre coincide con `CRM_WA_OUTBOUND_NAMES` (Jairo, Buscadis, Shantall, ADIS) |

**Nombre de perfil WA / foto:** el export **no** incluye el perfil completo; en el CRM ya tienes `contact_whatsapp` y `business_name` en la oportunidad. Si hace falta, añade una nota manual con el nombre de perfil.

## Cómo importar en Buscadis

1. Entra a `/admin/comercial` → abre la oportunidad del cliente.
2. Sección **Importar chat WhatsApp** → pega el contenido del `.txt` o súbelo como texto.
3. **Vista previa** (opcional) → **Importar** → los mensajes aparecen en **Actividades**.

API: `POST /api/ops/comercial/opportunities/{id}/import-whatsapp`  
Body: `{ "export_text": "...", "dry_run": true }` para probar.

## Ritmo sugerido para los ~60 contactados

- Prioridad: clientes **PAGÓ**, **ESPERANDO PAGO** y **EVALÚA** activos.
- 5–10 exportaciones por sesión; pegar e importar en cada ficha.
- Carpeta local: `exports-wa/984759634-mapacho.txt` (número + slug).

## Script masivo (opcional)

```bash
# Próximo paso: script que lea exports-wa/*.txt, matchee por teléfono en el nombre del archivo
# npx tsx scripts/comercial/import-whatsapp-exports-dir.ts --dir=./exports-wa --apply
```
