import { google, type sheets_v4 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

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

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  let refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const tokenFile = path.join(process.cwd(), 'data', 'rueda', 'google-oauth-refresh.txt');
  if (!refreshToken && fs.existsSync(tokenFile)) {
    refreshToken = fs.readFileSync(tokenFile, 'utf8').trim();
  }
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

const UPLOAD_CHUNK_ROWS = 400;

export async function uploadCsvToSheet(params: {
  spreadsheetId: string;
  sheetName: string;
  csvText: string;
  quiet?: boolean;
}): Promise<{ rows: number; cols: number }> {
  const { sheets } = getSheetsClient();
  const lines = params.csvText.trim().split(/\r?\n/).filter(Boolean);
  const values = lines.map((line) => parseCsvLine(line));
  const log = (msg: string) => {
    if (!params.quiet) console.log(msg);
  };

  log(`→ ${params.sheetName}: limpiando…`);
  await sheets.spreadsheets.values.clear({
    spreadsheetId: params.spreadsheetId,
    range: `${params.sheetName}!A:ZZ`,
  });

  for (let start = 0; start < values.length; start += UPLOAD_CHUNK_ROWS) {
    const chunk = values.slice(start, start + UPLOAD_CHUNK_ROWS);
    const rowStart = start + 1;
    const rowEnd = start + chunk.length;
    log(`→ ${params.sheetName}: subiendo filas ${rowStart}–${rowEnd} de ${values.length}…`);
    await sheets.spreadsheets.values.update({
      spreadsheetId: params.spreadsheetId,
      range: `${params.sheetName}!A${rowStart}`,
      valueInputOption: 'RAW',
      requestBody: { values: chunk },
    });
  }

  log(`✓ ${params.sheetName}: listo (${values.length} filas)`);
  return { rows: values.length, cols: values[0]?.length || 0 };
}

function sheetTabName(raw: string): string {
  const s = raw.replace(/[^\w\s-]/g, '').trim() || 'Sin mes';
  return s.slice(0, 100);
}

export async function ensureSheetTabs(spreadsheetId: string, titles: string[]): Promise<Map<string, number>> {
  const { sheets } = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = new Map<string, number>();
  for (const sh of meta.data.sheets || []) {
    const t = sh.properties?.title;
    const id = sh.properties?.sheetId;
    if (t != null && id != null) existing.set(t, id);
  }
  const toAdd = titles.filter((t) => !existing.has(t));
  if (toAdd.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: toAdd.map((title) => ({ addSheet: { properties: { title } } })),
      },
    });
    const meta2 = await sheets.spreadsheets.get({ spreadsheetId });
    for (const sh of meta2.data.sheets || []) {
      const t = sh.properties?.title;
      const id = sh.properties?.sheetId;
      if (t != null && id != null) existing.set(t, id);
    }
  }
  return existing;
}

async function resizeSheetGrid(
  spreadsheetId: string,
  sheetId: number,
  rowCount: number,
  colCount: number,
): Promise<void> {
  const { sheets } = getSheetsClient();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId,
              gridProperties: { rowCount: Math.max(rowCount, 100), columnCount: Math.max(colCount, 26) },
            },
            fields: 'gridProperties.rowCount,gridProperties.columnCount',
          },
        },
      ],
    },
  });
}

/** Sube CSV completo + pestañas por columna de agrupación (ej. mes_edicion). */
export async function uploadCsvGroupedByColumn(params: {
  spreadsheetId: string;
  masterSheetName: string;
  groupColumn: string;
  csvText: string;
}): Promise<{ master: { rows: number; cols: number }; tabs: Record<string, number> }> {
  const lines = params.csvText.trim().split(/\r?\n/).filter(Boolean);
  const values = lines.map((line) => parseCsvLine(line));
  if (!values.length) throw new Error('CSV vacío');
  const header = values[0];
  const groupIdx = header.indexOf(params.groupColumn);
  if (groupIdx < 0) throw new Error(`Columna ${params.groupColumn} no encontrada`);

  const groups = new Map<string, string[][]>();
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const key = sheetTabName(row[groupIdx] || 'sin-grupo');
    if (!groups.has(key)) groups.set(key, [header]);
    groups.get(key)!.push(row);
  }

  const tabTitles = ['Indice', params.masterSheetName, ...[...groups.keys()].sort()];
  console.log(
    `Google Sheets: ${values.length - 1} avisos, ${groups.size} pestañas por mes (puede tardar 3–8 min)…`,
  );
  const sheetIds = await ensureSheetTabs(params.spreadsheetId, tabTitles);

  const master = await uploadCsvToSheet({
    spreadsheetId: params.spreadsheetId,
    sheetName: params.masterSheetName,
    csvText: params.csvText,
  });
  const masterId = sheetIds.get(params.masterSheetName);
  if (masterId != null) {
    await resizeSheetGrid(params.spreadsheetId, masterId, master.rows + 50, master.cols + 2);
  }

  const tabs: Record<string, number> = {};
  for (const [title, rows] of groups) {
    const csvBlock = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
    const r = await uploadCsvToSheet({
      spreadsheetId: params.spreadsheetId,
      sheetName: title,
      csvText: csvBlock,
    });
    tabs[title] = r.rows - 1;
    const sid = sheetIds.get(title);
    if (sid != null) await resizeSheetGrid(params.spreadsheetId, sid, r.rows + 20, r.cols + 2);
  }

  const indiceRows: string[][] = [
    ['mes_edicion', 'filas', 'nota'],
    ...[...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([title, rows]) => [title, String(rows.length - 1), 'Avisos empleo Cusco con celular 9xxxxxxxx']),
  ];
  indiceRows.push(['TOTAL', String(values.length - 1), params.masterSheetName]);
  const { sheets } = getSheetsClient();
  await sheets.spreadsheets.values.clear({
    spreadsheetId: params.spreadsheetId,
    range: 'Indice!A:Z',
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: params.spreadsheetId,
    range: 'Indice!A1',
    valueInputOption: 'RAW',
    requestBody: { values: indiceRows },
  });

  return { master, tabs };
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
