export interface ParsedWhatsAppMessage {
  at: string;
  sender: string;
  body: string;
  direction: 'outbound' | 'inbound' | 'system';
}

const LINE_PATTERNS = [
  // [04/10/2026, 10:30:15] Nombre: mensaje
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\]\s([^:]+):\s(.*)$/i,
  // 04/10/2026, 10:30 - Nombre: mensaje
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\s+-\s+([^:]+):\s(.*)$/i,
];

const SYSTEM_MARKERS = [
  'los mensajes y las llamadas están cifrados',
  'creó el grupo',
  'cambió el asunto',
  'security code',
  'omitted',
  'eliminó este mensaje',
  'waiting for this message',
];

function parseDateParts(date: string, time: string): string {
  const t = time.replace(/\s?(AM|PM)/i, (m) => m.toUpperCase());
  const isoGuess = `${date} ${t}`;
  const parsed = new Date(isoGuess);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return new Date().toISOString();
}

function isOutboundSender(sender: string, outboundNames: string[]): boolean {
  const s = sender.toLowerCase().trim();
  return outboundNames.some((n) => s.includes(n.toLowerCase()));
}

export function parseWhatsAppExportText(
  raw: string,
  outboundSenderNames: string[] = ['jairo', 'buscadis', 'shantall', 'adis'],
): ParsedWhatsAppMessage[] {
  const lines = raw.split(/\r?\n/);
  const messages: ParsedWhatsAppMessage[] = [];
  let current: ParsedWhatsAppMessage | null = null;

  for (const line of lines) {
    let matched = false;
    for (const re of LINE_PATTERNS) {
      const m = line.match(re);
      if (!m) continue;
      if (current) messages.push(current);
      const [, d, t, sender, body] = m;
      const bodyLower = body.toLowerCase();
      const system = SYSTEM_MARKERS.some((x) => bodyLower.includes(x));
      const direction = system
        ? 'system'
        : isOutboundSender(sender, outboundSenderNames)
          ? 'outbound'
          : 'inbound';
      current = {
        at: parseDateParts(d, t),
        sender: sender.trim(),
        body: body.trim(),
        direction,
      };
      matched = true;
      break;
    }
    if (!matched && current && line.trim()) {
      current.body += `\n${line}`;
    }
  }
  if (current) messages.push(current);
  return messages.filter((m) => m.body.trim().length > 0);
}
