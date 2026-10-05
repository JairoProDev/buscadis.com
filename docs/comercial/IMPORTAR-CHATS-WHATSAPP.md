# Importar historial de WhatsApp al CRM

## Flujo principal (oct 2026)

**Chat por chat en Cursor** → ver `docs/comercial/CHATS-MANUAL.md` y carpeta `data/comercial/wa-chats/`.

## ¿Puede la IA entrar a mi WhatsApp?

**No.** Solo trabaja con texto que pegas o exports `.txt`.

## Formato al pegar

WhatsApp suele copiar así:

```text
[17:46, 2/10/2026] Publicadis Buscadis: mensaje…
[18:02, 2/10/2026] +51 984 646 887: respuesta…
```

El parser también acepta exports clásicos del celular (`[fecha, hora]`).

## Sincronizar a Supabase (local)

```bash
npx tsx scripts/comercial/import-whatsapp-exports-dir.ts --dir=data/comercial/wa-chats --apply
```

Archivos: `984759634-nombre.txt` (9 dígitos peruanos al inicio).

## Un solo chat en la ficha

En `/admin/comercial/opportunities/[id]`: pegar texto en **Importar chat WhatsApp**.

## API (ops)

- Un chat: `POST /api/ops/comercial/opportunities/{id}/import-whatsapp`
- Varios archivos: `POST /api/ops/comercial/import-whatsapp/batch` (sin UI; scripts o Postman)

`CRM_WA_OUTBOUND_NAMES=jairo,buscadis,publicadis,shantall,adis`

## Futuro

WhatsApp Cloud API: solo mensajes desde el día de conexión; el pasado sigue siendo este registro manual.
