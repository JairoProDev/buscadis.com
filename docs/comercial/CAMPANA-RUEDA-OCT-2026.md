# Campaña Rueda de Negocios (WhatsApp, sep–oct 2026)

## Dos listas distintas en el CRM

| Vista en `/admin/comercial` | Qué es |
|-----------------------------|--------|
| **Campaña Rueda (contactados)** | ~60–90 negocios que **sí** contactaste por WA (este documento). `metadata.campaign = rueda-negocios-2026-10` |
| **Leads PDF R2764** | ~340 avisos **extraídos del PDF** con backfill automático; **no** implica que les hayas escrito |

## Fuente de verdad

- Datos estructurados: `data/comercial/campana-rueda-oct-2026.json`
- Import / actualización: `npx tsx scripts/comercial/import-campana-rueda-oct-2026.ts --apply`
- Etapa visible en tarjeta: `metadata.campana_etapa` (PAGÓ, ESPERANDO PAGO, EVALÚA, PAUSA, etc.)

## Cómo registrar nuevas interacciones

1. **En el CRM (recomendado):** abre la oportunidad → nota o «Registrar envío WA» / pega respuesta del cliente como nota.
2. **Para actualizar el JSON:** edita `campana-rueda-oct-2026.json` y vuelve a correr import con `--apply` (hace upsert por WhatsApp).
3. **Pegarme chats en Cursor:** dime teléfono o nombre del prospecto; yo actualizo JSON + te doy `wa.me` con texto; tú ejecutas import o anotas en la ficha.

## Cobros documentados (oct 2026)

S/110 cobrados (Mapacho, Servicios Varios, Casa Carbajal); Black Llama S/50 pendiente (factura E001-1); Raquel S/15 y Mountain S/50 en espera.

Cuenta empresa: ADIS TECHNOLOGICAL PLATFORMS S.A.C., RUC 20614390779, Interbank 420-3008882613, CCI 003-420-003008882613-73.
