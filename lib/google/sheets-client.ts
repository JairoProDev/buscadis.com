import { google, type sheets_v4 } from 'googleapis';
import * as fs from 'fs';

export type SheetsAuthMode = 'service_account' | 'oauth_refresh';

export function getSheetsClient(): { sheets: sheets_v4.Sheets; authMode: SheetsAuthMode } {
  const saPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (saPath && fs.existsSync(saPath)) {
    const auth = new google.auth.GoogleAuth({
      keyFile: saPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return { sheets: google.sheets({ version: 'v4', auth }), authMode: 'service_account' };
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (clientId && clientSecret && refreshToken) {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost:3333/oauth2callback');
    oauth2.setCredentials({ refresh_token: refreshToken });
    return { sheets: google.sheets({ version: 'v4', auth: oauth2 }), authMode: 'oauth_refresh' };
  }

  throw new Error(
    'Configura GOOGLE_SERVICE_ACCOUNT_JSON o GOOGLE_OAUTH_CLIENT_ID + SECRET + REFRESH_TOKEN (ver docs/rueda/SETUP-GOOGLE-OAUTH.md)',
  );
}

export async function ensureSpreadsheet(
  title: string,
  shareWithEmail?: string,
): Promise<string> {
  const { sheets, authMode } = getSheetsClient();
  const created = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [{ properties: { title: 'Empleos' } }],
    },
  });
  const id = created.data.spreadsheetId;
  if (!id) throw new Error('No spreadsheetId');

  if (shareWithEmail && authMode === 'service_account') {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });
    await drive.permissions.create({
      fileId: id,
      requestBody: { type: 'user', role: 'writer', emailAddress: shareWithEmail },
      sendNotificationEmail: true,
    });
  }

  return id;
}

export async function uploadCsvToSheet(params: {
  spreadsheetId: string;
  sheetName: string;
  csvText: string;
}): Promise<{ rows: number; cols: number }> {
  const { sheets } = getSheetsClient();
  const lines = params.csvText.trim().split(/\r?\n/).filter(Boolean);
  const values = lines.map((line) => parseCsvLine(line));

  await sheets.spreadsheets.values.clear({
    spreadsheetId: params.spreadsheetId,
    range: `${params.sheetName}!A:ZZ`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: params.spreadsheetId,
    range: `${params.sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });

  return { rows: values.length, cols: values[0]?.length || 0 };
}

/** Parser CSV mínimo (campos entre comillas). */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}
