# Google Sheets — OAuth para jairoprodev@gmail.com

No puedo crear credenciales en tu cuenta Google desde aquí; **tú autorizas una vez** y el repo queda conectado.

## A. OAuth (proyecto **buscadis**, cliente **Adis Login**)

Ya tienes `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` en `.env.local`.

1. Habilita **Google Sheets API** y **Google Drive API** (Library).
2. **Credentials → Adis Login (Web)** → **Authorized redirect URIs** → añade:
   - `http://localhost:3333/oauth2callback`
3. En la **consola de Chrome** (no solo el panel embebido de Cursor si falla `gstatic`):

```bash
npm run rueda:google-oauth
```

4. Abre la URL que imprime, inicia sesión con **jairoprodev@gmail.com**, acepta permisos de Sheets.
5. El refresh token se guarda en `data/rueda/google-oauth-refresh.txt` (gitignored).

### Si sale `no code` o el redirect no llega (WSL)

- Deja el comando corriendo, vuelve a Google y pulsa **Allow** (no abras `localhost:3333` a mano antes).
- Si el navegador muestra la URL con `?code=4/0A...` pero la terminal no avanza, copia solo el valor de `code` y ejecuta:
  `npm run rueda:google-oauth -- --code=PEGAR_AQUI`
- Puerto ocupado: `GOOGLE_SHEETS_OAUTH_PORT=3334` y añade `http://localhost:3334/oauth2callback` en Google Cloud.

## B. Subir tabla empleos

```bash
npm run rueda:leads-empleos
npm run rueda:sync-sheets -- --create --share=jairoprodev@gmail.com
```

Guarda `RUEDA_LEADS_SPREADSHEET_ID=...` en `.env.local`. Siguientes sync:

```bash
npm run rueda:sync-sheets
```

## C. Corregir en Sheets y volcar

1. Edita columnas `estado_revision`, `titulo_corregido`, `descripcion_corregida`.
2. **Archivo → Descargar → CSV**.
3. `npx tsx scripts/rueda/apply-sheet-corrections.ts --csv=ruta/al.csv`
4. Re-exporta o importa a Supabase.

## D. Service account (alternativa servidor)

JSON de cuenta de servicio en `GOOGLE_SERVICE_ACCOUNT_JSON=/ruta/secret.json` y comparte la hoja con el email `...@...iam.gserviceaccount.com`.
