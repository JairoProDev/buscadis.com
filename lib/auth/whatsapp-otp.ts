import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function normalizePeruWhatsapp(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (/^9\d{8}$/.test(digits)) return `51${digits}`;
  if (/^51\d{9}$/.test(digits)) return digits;
  if (/^\+51\d{9}$/.test(input.trim())) return digits;
  return null;
}

export function hashOtp(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

export function isWhatsappOtpConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_API_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  );
}

type GraphSendResult = { ok: true } | { ok: false; status: number; body: string };

async function postWhatsAppTemplate(payload: unknown): Promise<GraphSendResult> {
  const token = process.env.WHATSAPP_API_TOKEN!;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const body = await res.text().catch(() => '');
  if (!res.ok) return { ok: false, status: res.status, body };
  return { ok: true };
}

/**
 * Meta AUTHENTICATION templates typically use body + button sub_type "url"
 * (COPY_CODE / autofill). We try that first, then body-only, then legacy "otp".
 */
async function sendWhatsAppAuthTemplate(
  phoneE164NoPlus: string,
  code: string
): Promise<void> {
  const templateName =
    process.env.WHATSAPP_OTP_TEMPLATE_NAME?.trim() || 'buscadis_auth_otp';
  const lang = process.env.WHATSAPP_OTP_TEMPLATE_LANG?.trim() || 'es';

  const base = {
    messaging_product: 'whatsapp',
    to: phoneE164NoPlus,
    type: 'template',
    template: {
      name: templateName,
      language: { code: lang },
    },
  };

  const attempts = [
    {
      ...base,
      template: {
        ...base.template,
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: code }],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: code }],
          },
        ],
      },
    },
    {
      ...base,
      template: {
        ...base.template,
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: code }],
          },
        ],
      },
    },
    {
      ...base,
      template: {
        ...base.template,
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: code }],
          },
          {
            type: 'button',
            sub_type: 'otp',
            index: '0',
            parameters: [{ type: 'text', text: code }],
          },
        ],
      },
    },
  ];

  const errors: string[] = [];
  for (const payload of attempts) {
    const result = await postWhatsAppTemplate(payload);
    if (result.ok) return;
    errors.push(`${result.status}: ${result.body.slice(0, 280)}`);
  }

  throw new Error(`WhatsApp API error — ${errors.join(' | ')}`);
}

export type SendOtpResult =
  | {
      ok: true;
      channel: 'whatsapp' | 'dev_log' | 'skipped';
      /** When true, UI must NOT wait for a code — number is already usable. */
      skipVerification?: boolean;
      devCode?: string;
      message?: string;
    }
  | { ok: false; error: string };

export async function createAndSendWhatsappOtp(
  userId: string,
  phoneRaw: string
): Promise<SendOtpResult> {
  const phone = normalizePeruWhatsapp(phoneRaw);
  if (!phone) {
    return { ok: false, error: 'Número inválido. Usa un celular peruano (9 dígitos).' };
  }

  // Without Meta credentials: don't fake a verification step that never delivers.
  if (!isWhatsappOtpConfigured()) {
    const allowDevUi =
      process.env.NODE_ENV === 'development' ||
      process.env.OTP_DEV_LOG === '1';

    if (allowDevUi && process.env.NODE_ENV === 'development') {
      const code = generateCode();
      const codeHash = hashOtp(code);
      const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
      await supabaseAdmin.from('whatsapp_otp_challenges').insert({
        user_id: userId,
        phone,
        code_hash: codeHash,
        expires_at: expiresAt,
      });
      console.info(`[OTP_DEV_LOG] WhatsApp code for ${phone}: ${code}`);
      return {
        ok: true,
        channel: 'dev_log',
        devCode: code,
        message: 'Modo desarrollo: usa el código mostrado en pantalla.',
      };
    }

    return {
      ok: true,
      channel: 'skipped',
      skipVerification: true,
      message:
        'Número guardado. La verificación automática por WhatsApp se activará cuando configuremos Meta.',
    };
  }

  const code = generateCode();
  const codeHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error: insertError } = await supabaseAdmin.from('whatsapp_otp_challenges').insert({
    user_id: userId,
    phone,
    code_hash: codeHash,
    expires_at: expiresAt,
  });

  if (insertError) {
    console.error('whatsapp_otp insert', insertError);
    return { ok: false, error: 'No se pudo crear el código. Intenta de nuevo.' };
  }

  try {
    await sendWhatsAppAuthTemplate(phone, code);
    return {
      ok: true,
      channel: 'whatsapp',
      message: 'Te enviamos un código por WhatsApp. Revisa tus chats.',
    };
  } catch (e) {
    console.error('whatsapp send failed', e);
    const detail = e instanceof Error ? e.message : String(e);

    if (process.env.NODE_ENV === 'development' || process.env.OTP_DEV_LOG === '1') {
      console.info(`[OTP_DEV_LOG] WhatsApp fallback code for ${phone}: ${code}`);
      return {
        ok: true,
        channel: 'dev_log',
        devCode: code,
        message: `No se pudo enviar por WhatsApp (${detail.slice(0, 120)}). Usa el código de desarrollo.`,
      };
    }

    return {
      ok: false,
      error:
        'No pudimos enviar el código por WhatsApp. Revisa el número o intenta más tarde. Tu número ya quedó guardado si lo confirmaste antes.',
    };
  }
}

export type VerifyOtpResult = { ok: true; phone: string } | { ok: false; error: string };

export async function verifyWhatsappOtp(
  userId: string,
  phoneRaw: string,
  code: string
): Promise<VerifyOtpResult> {
  const phone = normalizePeruWhatsapp(phoneRaw);
  if (!phone) {
    return { ok: false, error: 'Número inválido' };
  }
  const cleanCode = code.replace(/\D/g, '');
  if (!/^\d{6}$/.test(cleanCode)) {
    return { ok: false, error: 'Código inválido (6 dígitos)' };
  }

  const { data: rows, error } = await supabaseAdmin
    .from('whatsapp_otp_challenges')
    .select('id, code_hash, expires_at, attempts, consumed_at')
    .eq('user_id', userId)
    .eq('phone', phone)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !rows?.length) {
    return { ok: false, error: 'No hay un código activo. Solicita uno nuevo.' };
  }

  const row = rows[0];
  if (row.consumed_at) {
    return { ok: false, error: 'Código ya usado' };
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: 'Código expirado. Solicita uno nuevo.' };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: 'Demasiados intentos. Solicita un código nuevo.' };
  }

  const match = row.code_hash === hashOtp(cleanCode);
  await supabaseAdmin
    .from('whatsapp_otp_challenges')
    .update({
      attempts: row.attempts + 1,
      ...(match ? { consumed_at: new Date().toISOString() } : {}),
    })
    .eq('id', row.id);

  if (!match) {
    return { ok: false, error: 'Código incorrecto' };
  }

  return { ok: true, phone };
}
