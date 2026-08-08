# Perfil Vivo — perf / LCP lite

## Cambios
- Fuentes system-first (sin webfonts bloqueantes).
- Hero: `<img fetchPriority="high">` con tamaño fijo.
- `content-visibility` solo en módulos under-fold (`pv-modulo--defer`).
- JS: registry eager (hero→servicios); resto `React.lazy`.
- `sanitizePerfilPayload` limita productos/reseñas/FAQ en HTML inicial.
- LHCI: mobile 4G simulada, LCP &lt; 1.8s (`npm run lhci:perfil-vivo`).
