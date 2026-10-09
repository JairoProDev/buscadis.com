/**
 * Paso único para obtener refresh token (cuenta jairoprodev@gmail.com).
 *
 *   npm run rueda:google-oauth
 *   npm run rueda:google-oauth -- --code=4/0A...
 *
 * Ver docs/rueda/SETUP-GOOGLE-OAUTH.md
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { google } from 'googleapis';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const REDIRECT =
  process.env.GOOGLE_SHEETS_OAUTH_REDIRECT || 'http://localhost:3333/oauth2callback';
const PORT = Number(
  process.env.GOOGLE_SHEETS_OAUTH_PORT ||
    new URL(REDIRECT).port ||
    (REDIRECT.includes('localhost') ? '3333' : '80'),
);

function argCode(): string | undefined {
  const hit = process.argv.find((a) => a.startsWith('--code='));
  return hit?.split('=').slice(1).join('=');
}

function saveRefreshToken(refresh: string): void {
  const tokenPath = path.join(process.cwd(), 'data', 'rueda', 'google-oauth-refresh.txt');
  fs.mkdirSync(path.dirname(tokenPath), { recursive: true });
  fs.writeFileSync(tokenPath, refresh.trim() + '\n', { mode: 0o600 });
  console.log('\nGuardado en', tokenPath);
  console.log('Opcional en .env.local: GOOGLE_OAUTH_REFRESH_TOKEN=(mismo valor)\n');
}

async function exchangeCode(oauth2: InstanceType<typeof google.auth.OAuth2>, code: string) {
  const { tokens } = await oauth2.getToken(code);
  const refresh = tokens.refresh_token;
  if (!refresh) {
    console.error(
      'No refresh_token — en https://myaccount.google.com/permissions revoca Buscadis y repite con prompt=consent',
    );
    process.exit(1);
  }
  saveRefreshToken(refresh);
}

function waitForAuthCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const server = http.createServer((req, res) => {
      const u = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
      if (u.pathname !== '/oauth2callback') {
        res.writeHead(404);
        res.end('not found');
        return;
      }

      const err = u.searchParams.get('error');
      if (err) {
        const desc = u.searchParams.get('error_description') || err;
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h1>OAuth error</h1><p>${desc}</p><p>Vuelve a la terminal.</p>`);
        console.error('\nGoogle devolvió error:', err, desc, '\n');
        finish(() => {
          server.close();
          reject(new Error(`OAuth error: ${err}`));
        });
        return;
      }

      const c = u.searchParams.get('code');
      if (!c) {
        // Favicon, prefetch o abrir localhost antes de autorizar — no cerrar el servidor.
        console.log('(Petición a callback sin code — sigue esperando. Completa Allow en Google.)');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(
          '<h1>Esperando autorización</h1><p>Vuelve a la pestaña de Google, elige Allow, y regresa aquí.</p>',
        );
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>OK — vuelve a la terminal</h1>');
      finish(() => {
        server.close();
        resolve(c);
      });
    });

    server.on('error', (e: NodeJS.ErrnoException) => {
      if (e.code === 'EADDRINUSE') {
        reject(
          new Error(
            `Puerto ${PORT} ocupado. Cierra el otro proceso o usa GOOGLE_SHEETS_OAUTH_PORT=3334`,
          ),
        );
      } else reject(e);
    });

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor en http://127.0.0.1:${PORT} (y localhost:${PORT})`);
      console.log(
        'WSL: abre la URL de Google en el navegador de Windows; el redirect debe llegar a este puerto.\n',
      );
    });

    setTimeout(
      () =>
        finish(() => {
          server.close();
          reject(
            new Error(
              'timeout 5min — si el navegador no redirige, copia code= de la URL y: npm run rueda:google-oauth -- --code=...',
            ),
          );
        }),
      300_000,
    );
  });
}

async function main() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error('Falta GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET en .env.local');
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT);
  const manual = argCode();
  if (manual) {
    await exchangeCode(oauth2, manual);
    return;
  }

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
  console.log('\n2) Tras Allow, Google redirige a', REDIRECT);
  console.log('   Si falla el redirect, copia el parámetro code= de la barra y pásalo con --code=\n');

  const code = await waitForAuthCode();
  await exchangeCode(oauth2, code);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
