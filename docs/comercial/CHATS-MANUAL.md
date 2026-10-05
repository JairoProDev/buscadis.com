# Chats WA → CRM (manual con Cursor)

El panel **ya no** tiene import masivo. El flujo acordado:

1. **Tú** pegas el chat en Cursor (como export de WhatsApp: `[hora, fecha] Nombre: texto`).
2. **Cursor** guarda el texto en `data/comercial/wa-chats/9XXXXXXXX-nombre.txt`, actualiza `data/comercial/campana-rueda-oct-2026.json` y `data/comercial/campana-insights.md`.
3. **Tú** (o deploy) sincronizas Supabase cuando quieras:

```bash
npx tsx scripts/comercial/import-campana-rueda-oct-2026.ts --apply
npx tsx scripts/comercial/import-whatsapp-exports-dir.ts --dir=data/comercial/wa-chats --apply
```

Opcional: en la ficha de una oportunidad sigue existiendo **pegar un solo chat** (mismo formato).

## Insights

Cada chat debe dejar al menos una línea en `notas_extra` o en `campana-insights.md`: qué funcionó, qué falló, qué cambiar en el mensaje o en el segmento.
