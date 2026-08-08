# Perfil Vivo — P15/P16 lite: cita + novedades

## Decisión
- Arquetipo **cita**: demo `/v/demo-cita` (Barbería Norte), módulos `servicios` + `equipo`, CTA «Agendar».
- **Novedades** (P16 lite): carrusel desde `story_highlights` + anuncio activo; retail demo incluye 2 items.
- Bridge real siempre emite `novedades: []` / `equipo: []` (nunca omitidos).
- Equipo público solo si `profile_blocks` type=`team` tiene miembros.

## Fuera de alcance (full)
Seis arquetipos completos, feed social, cron de novedades, mapeo automático retail→cita por categoría.

## Demos
| Slug | Arquetipo |
|------|-----------|
| `/v/demo` | retail |
| `/v/demo-cita` | cita |
| `/v/demo-comida` | comida (+ Categorías) |
