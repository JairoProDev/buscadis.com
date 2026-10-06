# Runbook — deploy SEO / marketplace

## Antes del deploy

- [ ] `NEXT_PUBLIC_SITE_URL=https://www.buscadis.com` en producción
- [ ] PR pasa `npm run lint` y tests SEO (`npm run test:seo`)

## Inmediatamente después

1. Smoke manual (10 URLs):
   - `/`
   - `/categoria/empleos`
   - `/l/cusco/empleos`
   - `/buscar?q=empleo`
   - Un `/a/{id}/{slug}` real
   - Un `/@{slug}` publicado
2. Verificar redirect 308: `https://buscadis.com/` → `https://www.buscadis.com/`
3. Verificar redirect: `/?categoria=empleos` → `/categoria/empleos`
4. `curl -sI https://www.buscadis.com/sitemap.xml` → 200

## Si hay errores de chunk en clientes

- PWA conservadora: sin cache agresivo de navegación
- `ChunkRecoveryBootstrap` limpia SW y recarga una vez
- Usuario puede “Intentar de nuevo” en error global (limpia cache)

## Typesense (opcional)

Tras migración masiva de adisos:

```bash
npm run search:sync-marketplace
```

## GSC

Solicitar reindexación de URLs que mostraron “Algo salió mal” en snippets.
