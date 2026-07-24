/** Zonas operativas Cusco — alineadas con data WhatsApp y chatbot */

export const CUSCO_ENVIOS_ZONES = [
  'San Sebastián',
  'San Jerónimo',
  'Centro',
  'Wanchaq',
  'Santiago',
  'Nogales',
  'Miraflores',
  'Huancaro',
  'Plaza Nazarenas',
  'Cusco',
] as const;

export type CuscoEnviosZone = (typeof CUSCO_ENVIOS_ZONES)[number];

/** Corredor piloto (soft launch) */
export const PILOT_CORRIDOR: CuscoEnviosZone[] = [
  'San Sebastián',
  'Centro',
  'San Jerónimo',
  'Wanchaq',
];

const ZONE_ALIASES: Record<string, CuscoEnviosZone> = {
  'san sebastian': 'San Sebastián',
  'san sebastián': 'San Sebastián',
  sebastian: 'San Sebastián',
  sebastián: 'San Sebastián',
  'san jeronimo': 'San Jerónimo',
  'san jerónimo': 'San Jerónimo',
  jeronimo: 'San Jerónimo',
  jerónimo: 'San Jerónimo',
  centro: 'Centro',
  'cusco centro': 'Centro',
  'plaza de armas': 'Centro',
  wanchaq: 'Wanchaq',
  santiago: 'Santiago',
  nogales: 'Nogales',
  miraflores: 'Miraflores',
  huancaro: 'Huancaro',
  'plaza nazarenas': 'Plaza Nazarenas',
  nazarenas: 'Plaza Nazarenas',
  cusco: 'Cusco',
};

export function normalizeZone(raw: string | null | undefined): CuscoEnviosZone | null {
  if (!raw?.trim()) return null;
  const key = raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const withAccents = raw.trim().toLowerCase();
  return (
    ZONE_ALIASES[withAccents] ||
    ZONE_ALIASES[key] ||
    CUSCO_ENVIOS_ZONES.find(
      (z) =>
        z.toLowerCase() === withAccents ||
        z
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') === key
    ) ||
    null
  );
}

/** Extrae zona desde texto libre de dirección / reverse geocode */
export function detectZoneFromText(text: string): CuscoEnviosZone | null {
  const lower = text.toLowerCase();
  for (const [alias, zone] of Object.entries(ZONE_ALIASES)) {
    if (lower.includes(alias)) return zone;
  }
  for (const zone of CUSCO_ENVIOS_ZONES) {
    if (lower.includes(zone.toLowerCase())) return zone;
  }
  return null;
}
