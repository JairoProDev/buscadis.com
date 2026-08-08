# Perfil Vivo — §23 ADIS AI (+ corpus)

## Alcance
- Módulo `ia` tras el catálogo (plan **Max** / demos Max).
- 3 sugerencias desde catálogo / horario / FAQ / ubicación.
- Respuestas solo con datos del perfil; sin afirmar stock.
- Si no sabe → WhatsApp (`/r/` en chips) + evento `ia_unanswered` en `page_analytics.metadata.pregunta`.
- Panel dueño (Confianza): agrega preguntas sin respuesta 30d + tip.
- Feed interno: `GET /api/feed/negocios?desde=` (Bearer CRON_SECRET / FEED_SECRET).

## Fuera de alcance
LLM real / RAG; billing Max automatizado (se activa con equipo).
