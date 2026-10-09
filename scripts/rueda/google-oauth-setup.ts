/**
 * Paso único para obtener GOOGLE_OAUTH_REFRESH_TOKEN (cuenta jairoprodev@gmail.com).
 *
 * 1. Crea OAuth Client "Desktop" en Google Cloud Console (ver SETUP-GOOGLE-OAUTH.md)
 * 2. Pon GOOGLE_OAUTH_CLIENT_ID y GOOGLE_OAUTH_CLIENT_SECRET en .env.local
 * 3. npx tsx scripts/rueda/google-oauth-setup.ts
 * 4. Abre la URL, autoriza, pega el código
 */
import * as dotenv from 'dotenv';
import * as http from 'http';
import * as path from 'path';
import { google } from 'googleapis';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const PORT = 3333;
const REDIRECT = `http://localhost:${PORT}/oauth2callback`;

async function main() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error('Falta GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET en .env.local');
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT);
  const url = oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });

  console.log('\n1) Abre esta URL e inicia sesión con jairoprodev@gmail.com:\n');
  console.log(url);
  console.log('\n2) Esperando callback en', REDIRECT, '...\n');

  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url || '/', `http://localhost:${PORT}`);
      if (u.pathname !== '/oauth2callback') {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      const c = u.searchParams.get('code');
      if (!c) {
        res.writeHead(400);
        res.end('missing code');
        reject(new Error('no code'));
        server.close();
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>OK — vuelve a la terminal</h1>');
      resolve(c);
      server.close();
    });
    server.listen(PORT, () => {});
    setTimeout(() => reject(new Error('timeout 5min')), 300_000);
  });

  const { tokens } = await oauth2.getToken(code);
  console.log('\nAñade a .env.local:\n');
  console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log('\n(No commitees este valor.)\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
