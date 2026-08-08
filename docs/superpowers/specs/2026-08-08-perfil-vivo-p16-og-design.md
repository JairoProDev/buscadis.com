# Perfil Vivo — P16 promo + OG dinámico

## Promo (P16)
- `promocionSiVigente` / `sanitizePerfilPayload`: si `venceEn` ≤ now → `promocion: null` y `conteos.promociones: 0` (módulo oculto).
- Shell + handoff usan la misma regla.

## OG
- Ruta: `/og/perfil/[slug]` (`next/og`, 1200×630).
- Metadata: `buildPerfilVivoShareMetadata` en `/v/[slug]` y cutover `/@` (negocio).
