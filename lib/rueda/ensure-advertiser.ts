import { supabaseAdmin } from '@/lib/supabase-admin';

const OPS_FALLBACK_USER_ID =
  process.env.RUEDA_OPS_USER_ID || 'ef81f31b-a11d-4417-9325-e737daaad32e';

/** Normaliza a dígitos con código país Perú (51…) cuando aplica. */
export function normalizePeruPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('51') && digits.length >= 11) return digits.slice(0, 11);
  if (digits.length === 9 && digits.startsWith('9')) return `51${digits}`;
  if (digits.length >= 9) return digits.slice(0, 15);
  return null;
}

async function findProfileIdByPhone(phone: string): Promise<string | null> {
  const variants = [phone, phone.replace(/^51/, ''), `+${phone}`];
  for (const v of variants) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .or(`whatsapp.eq.${v},telefono.eq.${v}`)
      .limit(1)
      .maybeSingle();
    if (data?.id) return data.id as string;
  }
  return null;
}

/**
 * Crea (o reutiliza) una cuenta stub del anunciante a partir del teléfono del aviso.
 * Si no hay teléfono, usa la cuenta de operaciones Buscadis.
 */
export async function ensureRuedaAdvertiserUser(params: {
  phone?: string | null;
  displayName?: string;
}): Promise<{ userId: string; created: boolean; phone: string | null }> {
  const phone = normalizePeruPhone(params.phone);
  if (!phone) {
    return { userId: OPS_FALLBACK_USER_ID, created: false, phone: null };
  }

  const existing = await findProfileIdByPhone(phone);
  if (existing) {
    return { userId: existing, created: false, phone };
  }

  const email = `rueda.${phone}@anunciantes.buscadis.internal`;
  const nombre = (params.displayName || 'Anunciante').slice(0, 80);

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: nombre,
      nombre,
      source: 'rueda_stub',
      whatsapp: phone,
    },
    app_metadata: {
      rueda_stub: true,
    },
  });

  if (createError || !created.user?.id) {
    // Email ya existe u otro conflicto → buscar de nuevo / fallback ops
    const { data: byEmail } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (byEmail?.id) {
      return { userId: byEmail.id as string, created: false, phone };
    }
    console.error('[ensureRuedaAdvertiserUser]', createError?.message);
    return { userId: OPS_FALLBACK_USER_ID, created: false, phone };
  }

  const userId = created.user.id;
  await supabaseAdmin.from('profiles').upsert(
    {
      id: userId,
      email,
      nombre,
      telefono: phone,
      whatsapp: phone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  return { userId, created: true, phone };
}

/** Asigna user_id al aviso (y reutiliza stub) si faltaba. */
export async function ensureAdisoSellerUserId(adisoId: string): Promise<{
  sellerUserId: string;
  phone: string | null;
  created: boolean;
} | null> {
  const { data: row, error } = await supabaseAdmin
    .from('adisos')
    .select('id, user_id, contacto, titulo, contactos_multiples')
    .eq('id', adisoId)
    .maybeSingle();

  if (error || !row) return null;
  if (row.user_id) {
    return {
      sellerUserId: row.user_id as string,
      phone: normalizePeruPhone(row.contacto as string),
      created: false,
    };
  }

  let phone = normalizePeruPhone(row.contacto as string);
  if (!phone && row.contactos_multiples) {
    try {
      const multi =
        typeof row.contactos_multiples === 'string'
          ? JSON.parse(row.contactos_multiples)
          : row.contactos_multiples;
      if (Array.isArray(multi)) {
        for (const c of multi) {
          phone = normalizePeruPhone(c?.valor);
          if (phone) break;
        }
      }
    } catch {
      /* ignore */
    }
  }

  const ensured = await ensureRuedaAdvertiserUser({
    phone,
    displayName: (row.titulo as string)?.slice(0, 40) || 'Anunciante',
  });

  await supabaseAdmin
    .from('adisos')
    .update({ user_id: ensured.userId })
    .eq('id', adisoId)
    .is('user_id', null);

  return {
    sellerUserId: ensured.userId,
    phone: ensured.phone,
    created: ensured.created,
  };
}
