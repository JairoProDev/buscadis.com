# Optimizar uso en Vercel (plan Hobby / free)

## Qué significa tu panel

| Métrica en rojo/amarillo | Qué es | Por qué sube en Buscadis |
|--------------------------|--------|---------------------------|
| **Image Optimization – Cache Writes** | Cada variante nueva de imagen (`/_next/image?url=…&w=…`) que Vercel guarda en caché | Grilla con miles de fotos distintas (Supabase) + scroll infinito |
| **Fluid Active CPU** | Tiempo de CPU en Functions (API, SSR, crons) | Crons largos, IA, import Excel, mucho tráfico dinámico |
| **CDN / ISR / Storage** (azul, bajo uso) | Normal: no es problema tener margen |

## Cambios ya en código (deploy para aplicar)

1. **`next.config.js`**: menos tamaños de imagen, `minimumCacheTTL` 30 días → menos re-escrituras de caché.
2. **`lib/images/listing-image.ts`**: tarjetas del feed usan **`unoptimized`** para URLs de Supabase → **no pasan por Image Optimization** (gran ahorro en Cache Writes).
3. Detalle/modal puede seguir usando optimización donde convenga.

## Acciones en el dashboard Vercel (tú)

1. **Settings → Usage** → revisar cada ciclo; tras el deploy anterior, **Cache Writes** debería bajar en 1–2 semanas.
2. **Settings → Cron Jobs** → confirma que no hay crons duplicados en otro proyecto.
3. **Deployments** → limita previews automáticos en ramas si generas muchos deploys (cada build consume CPU/storage).
4. Si **CPU** sigue al límite:
   - Mantén `CRON_SECRET` fuerte; evita que bots disparen `/api/cron/*`.
   - Rutas pesadas (`/api/catalog/import/excel`, `enhance-image`, `ai-builder`) solo para usuarios autenticados (ya así en su mayoría).
   - Valora **Pro** solo si tras optimizar imágenes el CPU sigue >90% con tráfico real.

## Qué NO hacer

- No activar **Zaraz + GA4 + GTM** a la vez (doble tracking y más edge work).
- No quitar `minimumCacheTTL` sin motivo (vuelven las escrituras de caché).

## Métricas “desaprovechadas”

Tener CDN/ISR por debajo del límite **no es malo**: significa que puedes crecer tráfico sin pagar extra. El foco es bajar **Image Cache Writes** y **CPU**, no “llenar” ISR.
