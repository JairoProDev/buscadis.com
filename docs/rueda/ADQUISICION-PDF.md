# Adquisición de PDFs Rueda

## Fuentes (orden recomendado)

1. **WordPress** — `sync-wordpress-pdf.ts` (URL en `data/rueda/manifest.json`).
2. **Windows Downloads** — `ingest-from-downloads.ts` (WSL `/mnt/c/Users/.../Downloads`).
3. **Repo `ads/archive/editions`** — histórico ya respaldado.
4. **Wayback / uploads WP** — manual para huecos (ej. **R2760**).

## Convención de nombre

`R####-MesDia-MesDia.pdf` — generado por `suggestEditionFilename`.

## Conflictos

- Misma edición, distinto SHA → revisar cabecera p1 (`pdf-edition-meta.py`).
- Dos archivos en Downloads (ej. R2684) → se elige el de mayor tamaño; revisar manualmente.

## Huecos conocidos (2026-10-08)

- **98** números entre R2518 y R2766 sin PDF en archive.
- **R2760** falta entre R2759 y R2761.
- PDFs solo en Downloads: R2635, R2684×2, R2686, R2687, R2690, R2706, R1660.

## Inventario automático

```bash
npm run rueda:inventory
```

Salida: `data/rueda/inventory.json`, `data/rueda/edition-gaps.json`.
