/**
 * Decolecta / apis.net.pe — consulta DNI y RUC (padrón público).
 * Token solo en servidor: DECOLECTA_API_TOKEN o APIS_NET_PE_TOKEN.
 */

const BASE = 'https://api.decolecta.com/v1';

function getToken(): string | null {
  return (
    process.env.DECOLECTA_API_TOKEN?.trim() ||
    process.env.APIS_NET_PE_TOKEN?.trim() ||
    null
  );
}

export function isDecolectaConfigured(): boolean {
  return Boolean(getToken());
}

export type DniLookupResult = {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
};

export type RucLookupResult = {
  ruc: string;
  razonSocial: string;
  estado: string;
  condicion: string;
  direccion?: string;
  tipo?: string;
};

type DecolectaError = { error: string; status: number };

async function decolectaGet<T>(path: string): Promise<T | DecolectaError> {
  const token = getToken();
  if (!token) {
    return { error: 'API de identidad no configurada (DECOLECTA_API_TOKEN)', status: 503 };
  }

  const res = await fetch(`${BASE}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return {
      error: body || `Error Decolecta (${res.status})`,
      status: res.status >= 400 && res.status < 600 ? res.status : 502,
    };
  }

  return (await res.json()) as T;
}

function isDecolectaError(r: unknown): r is DecolectaError {
  return Boolean(
    r &&
      typeof r === 'object' &&
      'error' in r &&
      'status' in r &&
      !('dni' in r) &&
      !('ruc' in r && 'razonSocial' in (r as object))
  );
}

export function isDniResult(r: DniLookupResult | DecolectaError): r is DniLookupResult {
  return 'dni' in r && 'nombres' in r;
}

export function isRucResult(r: RucLookupResult | DecolectaError): r is RucLookupResult {
  return 'ruc' in r && 'razonSocial' in r;
}

/** Mock útil en local sin token (OTP_DEV / IDENTITY_DEV_MOCK). */
function mockDni(dni: string): DniLookupResult {
  return {
    dni,
    nombres: 'NOMBRES',
    apellidoPaterno: 'APELLIDO',
    apellidoMaterno: 'DEMO',
    nombreCompleto: 'APELLIDO DEMO, NOMBRES',
  };
}

function mockRuc(ruc: string): RucLookupResult {
  return {
    ruc,
    razonSocial: ruc.startsWith('20') ? 'EMPRESA DEMO S.A.C.' : 'PERSONA NATURAL DEMO',
    estado: 'ACTIVO',
    condicion: 'HABIDO',
    tipo: ruc.startsWith('20') ? 'SOCIEDAD ANONIMA CERRADA' : 'PERSONA NATURAL',
  };
}

export async function lookupDni(dni: string): Promise<DniLookupResult | DecolectaError> {
  const clean = dni.replace(/\D/g, '');
  if (!/^\d{8}$/.test(clean)) {
    return { error: 'DNI inválido (8 dígitos)', status: 400 };
  }

  if (!isDecolectaConfigured() && process.env.IDENTITY_DEV_MOCK === '1') {
    return mockDni(clean);
  }

  const raw = await decolectaGet<Record<string, unknown>>(`/reniec/dni?numero=${clean}`);
  if (isDecolectaError(raw)) return raw;

  const nombres = String(raw.nombres || raw.first_name || '');
  const apellidoPaterno = String(
    raw.apellido_paterno || raw.apellidoPaterno || raw.first_last_name || ''
  );
  const apellidoMaterno = String(
    raw.apellido_materno || raw.apellidoMaterno || raw.second_last_name || ''
  );
  const nombreCompleto =
    String(raw.nombre_completo || raw.full_name || '').trim() ||
    `${apellidoPaterno} ${apellidoMaterno}, ${nombres}`.trim();

  if (!nombres && !apellidoPaterno) {
    return { error: 'No se encontraron datos para este DNI', status: 404 };
  }

  return {
    dni: clean,
    nombres,
    apellidoPaterno,
    apellidoMaterno,
    nombreCompleto,
  };
}

export async function lookupRuc(ruc: string): Promise<RucLookupResult | DecolectaError> {
  const clean = ruc.replace(/\D/g, '');
  if (!/^(10|20)\d{9}$/.test(clean)) {
    return { error: 'RUC inválido (11 dígitos, inicia en 10 o 20)', status: 400 };
  }

  if (!isDecolectaConfigured() && process.env.IDENTITY_DEV_MOCK === '1') {
    return mockRuc(clean);
  }

  const raw = await decolectaGet<Record<string, unknown>>(`/sunat/ruc?numero=${clean}`);
  if (isDecolectaError(raw)) return raw;

  const razonSocial = String(
    raw.razon_social || raw.nombre_o_razon_social || raw.razonSocial || raw.name || ''
  );
  if (!razonSocial) {
    return { error: 'No se encontraron datos para este RUC', status: 404 };
  }

  return {
    ruc: clean,
    razonSocial,
    estado: String(raw.estado || raw.status || ''),
    condicion: String(raw.condicion || raw.condition || ''),
    direccion: raw.direccion || raw.address ? String(raw.direccion || raw.address) : undefined,
    tipo: raw.tipo || raw.tipo_contribuyente ? String(raw.tipo || raw.tipo_contribuyente) : undefined,
  };
}
