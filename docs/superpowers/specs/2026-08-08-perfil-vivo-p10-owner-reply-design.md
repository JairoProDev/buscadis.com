# Perfil Vivo — P10 respuesta del dueño

## Qué
- `PATCH /api/business/{slug}/reviews/{id}` → `response_text` + `responded_at`
- Panel Confianza → Responder reseñas
- Bridge/public leen `response_text` (además de aliases legacy)

## Regla
Una respuesta por reseña en lite (editar = sobrescribir con otro PATCH futuro si se pide).
