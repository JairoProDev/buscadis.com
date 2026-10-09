# Archivo por mes + Google Sheets (trabajo en equipo)

## Estructura de archivos (objetivo)

```
ads/archive/
  editions/          # PDF completo por edición
  by-month/
    2025-08/
      R2747-Jul27-Ago2/
        meta.json
        pagina-01.pdf … pagina-16.pdf
        pagina-01.png  (opcional --png)
output/rueda/
  by-month/2025-08/R2747-Jul27-Ago2/
    pagina-01/
      pagina.pdf      # copia de la hoja
      texto.txt       # texto extraído
      avisos.json     # avisos de ESA hoja
  leads/
    empleos-cusco-desde-R2747.csv   # tabla CRM para Sheets
```

### Comandos

```bash
# 1. Partir PDFs por mes y por página
npm run rueda:sync-monthly -- --from=2747

# 2. Extraer aviso por aviso desde cada pagina-NN.pdf
npm run rueda:extract-by-page -- --from=2747

# 3. Exportar tabla empleos (primera categoría a dominar)
npm run rueda:leads-empleos -- --from=2747
```



## Google Sheets (API + OAuth)

```bash
npm run rueda:leads-empleos -- --from=2747
npm run rueda:sync-sheets          # pestañas: Indice, Empleos_todos, 2025-08, …
npm run rueda:sync-sheets -- --single-sheet   # solo una hoja (legacy)
```

- **Empleos_todos**: las **3.377** filas con celular válido (mismo CSV); si la grilla parece corta, revisa fila 3378 o la pestaña del mes.
- **Indice**: conteo por `mes_edicion`.
- Columnas nuevas: `mensaje_wa_sugerido` (gancho primero, sin pitch “somos Buscadis”) y `wa_url` (abrir chat con texto).

Import manual (sin API):

1. Sube `output/rueda/leads/empleos-cusco-desde-R2747.csv` a Google Drive.
2. Abrir con **Google Hojas de cálculo** → Compartir con el equipo (editar).
3. Columnas para ustedes:
  - `estado_revision`: `pendiente` | `OK` | `CORREGIR` | `NO_CONTACTAR`
  - `titulo_corregido`, `descripcion_corregida`, `notas_equipo`
4. Cuando corrijan, exporten **Descargar → CSV** y guarden como
  `output/rueda/leads/empleos-cusco-CORREGIDO.csv`  
   (luego importamos a Supabase / publicación con un script `apply-sheet-corrections` — pendiente si lo piden).

**Sincronización “en vivo”** (Drive ↔ carpeta local) se puede hacer con Google Drive for Desktop en Windows y la ruta WSL `/mnt/c/Users/.../Drive/`; el CSV en esa carpeta se reimporta con un comando.

## QA por hoja

Para una página dudosa: abrir `pagina.pdf` + `texto.txt` + `avisos.json` en la misma carpeta y comparar con la revista impresa.