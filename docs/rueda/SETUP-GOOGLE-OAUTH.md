# Google Sheets — OAuth para jairoprodev@gmail.com

No puedo crear credenciales en tu cuenta Google desde aquí; **tú autorizas una vez** y el repo queda conectado.

## A. OAuth (recomendado para tu correo)

1. [Google Cloud Console](https://console.cloud.google.com/) → proyecto **buscadis** (o crea uno).
2. **APIs & Services → Enable**: Google Sheets API + Google Drive API.
3. **Credentials → Create OAuth client ID** → tipo **Desktop app**.
4. En `.env.local`:

```env
GOOGLE_OAUTH_CLIENT_ID=....apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-...
RUEDA_SHEETS_SHARE_EMAIL=jairoprodev@gmail.com
```

5. Ejecuta:

```bash
npx tsx scripts/rueda/google-oauth-setup.ts
```

6. Abre la URL con **jairoprodev@gmail.com**, acepta permisos.
7. Copia `GOOGLE_OAUTH_REFRESH_TOKEN=...` a `.env.local`.

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
