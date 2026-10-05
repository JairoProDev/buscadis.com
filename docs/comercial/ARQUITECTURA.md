# Módulo comercial (Buscadis → Vectorify)

## Ubicación en el monorepo

| Ruta | Rol |
|------|-----|
| `lib/comercial/` | Dominio portable (oportunidades, cuentas, IA borradores, sync Rueda y clientes pagados) |
| `lib/ops/require-ops.ts` | Auth admin plataforma |
| `app/api/ops/comercial/*` | API REST interna |
| `app/admin/comercial/` | UI pipeline |
| `supabase/migrations/056_sales_commercial.sql` | Tablas `sales_*` |
| `scripts/comercial/` | Backfill y mantenimiento |
| `docs/clientes/` | Casos operativos (enlazados vía `metadata.docs_path` / `sales_accounts.docs_path`) |

## Flujo

1. **Rueda** importa adisos (`lib/rueda`, `scripts/rueda/import-r2764.ts`) y puede crear oportunidades al vuelo.
2. **Backfill Rueda** — `scripts/comercial/backfill-rueda-opportunities.ts` o botón «Importar leads Rueda» en `/admin/comercial`.
3. **Clientes pagados** — al publicar (`scripts/clientes/*`) se llama `syncPaidClientAdisoToCrm`; backfill con `scripts/comercial/backfill-paid-clients.ts` o «Sync clientes pagados» en admin.
4. **Ops** mueve etapas, registra WA, tareas de seguimiento, borradores **IA**.
5. **Ganado** → `sales_accounts` automático (con `docs_path` si aplica) → operación en `docs/clientes/`.

## Acceso

- URL: `/admin/comercial` (enlace desde `/admin/intelligence`)
- Requiere `profiles.rol = admin` o email en `PLATFORM_ADMIN_EMAILS`.

## API (Bearer session)

- `GET /api/ops/comercial/pipeline`
- `GET|POST /api/ops/comercial/opportunities`
- `GET|PATCH /api/ops/comercial/opportunities/[id]`
- `POST .../activities`, `POST .../tasks`, `POST /api/ops/comercial/tasks/[taskId]/complete`
- `POST /api/ops/comercial/ai/suggest-reply`
- `POST /api/ops/comercial/rueda/backfill`
- `POST /api/ops/comercial/paid/backfill`

## Roadmap Vectorify

Objetivo: mismo modelo de datos y `lib/comercial` como paquete compartido, con contexto de negocio unificado.

| Capacidad | En Buscadis hoy | En Vectorify (futuro) |
|-----------|-----------------|------------------------|
| Pipeline / CRM | `/admin/comercial` | Workspace comercial por negocio |
| IA borradores | OpenAI vía `ai-suggest.ts` | Modelo + prompts con memoria del cliente |
| WhatsApp | Enlace `wa.me` + registro manual de actividad | Inbox conectado (envío/recepción, sugerencias en tiempo real) |
| Código / entregables | Repo monorepo + `docs/clientes` | Abrir cualquier repo/proyecto como en un IDE; agente con acceso al código y al CRM |
| Humanos + IA | Ops mueve etapas; IA propone | Copiloto en ventas/soporte; humano aprueba o edita |

**Migración sugerida:** extraer `@vectorify/commercial` desde `lib/comercial`, mantener API compatible; Vectorify consume la misma Supabase o réplica por tenant. El trabajo en Cursor en `buscadis.com` sigue siendo la fuente hasta que Vectorify tenga paridad de editor + agente.

## Scripts útiles

```bash
npx tsx scripts/comercial/backfill-rueda-opportunities.ts
npx tsx scripts/comercial/backfill-paid-clients.ts
```

## Rueda + WhatsApp

- Protocolo edición → CRM: `docs/rueda/PROTOCOLO.md`
- PDFs y repos: `docs/REPOSITORIOS.md`
- WhatsApp Business API: `docs/comercial/WHATSAPP-BUSINESS.md`
