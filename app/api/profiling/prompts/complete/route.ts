import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { isValidPromptId, markPromptCompleted } from '@/lib/profiling/prompt-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isDniResult, lookupDni } from '@/lib/peru-id/decolecta';
import { upsertCapability, type CapabilityKey } from '@/lib/auth/capabilities';

const CAP_KEYS: CapabilityKey[] = ['publish', 'business', 'rider', 'influencer'];
const GENEROS = ['masculino', 'femenino', 'otro', 'prefiero_no_decir'] as const;

export async function POST(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const ip = getClientIP(request);
  const limit = rateLimit(`prompt-complete:${user.id}:${ip}`, {
    windowMs: 60_000,
    maxRequests: 40,
  });
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Demasiadas peticiones' }, { status: 429 });
  }

  let body: {
    prompt_id?: string;
    phone?: string;
    fecha_nacimiento?: string;
    genero?: string;
    dni?: string;
    interests?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!body.prompt_id || !isValidPromptId(body.prompt_id)) {
    return NextResponse.json({ error: 'prompt_id inválido' }, { status: 400 });
  }

  const now = new Date().toISOString();

  try {
    switch (body.prompt_id) {
      case 'whatsapp': {
        const digits = String(body.phone || '').replace(/\D/g, '');
        const local = digits.replace(/^51/, '');
        if (!/^9\d{8}$/.test(local)) {
          return NextResponse.json(
            { error: 'Ingresa un celular peruano válido (9 dígitos)' },
            { status: 400 }
          );
        }
        const phone = `51${local}`;
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            whatsapp: phone,
            telefono: phone,
            updated_at: now,
          })
          .eq('id', user.id);
        if (error) throw error;
        await markPromptCompleted(user.id, 'whatsapp', { phone });
        return NextResponse.json({ ok: true, phone });
      }

      case 'demographics': {
        const fecha = body.fecha_nacimiento?.trim() || null;
        const generoRaw = body.genero?.trim() || '';
        const genero = GENEROS.includes(generoRaw as (typeof GENEROS)[number])
          ? generoRaw
          : null;
        if (!fecha && !genero) {
          return NextResponse.json(
            { error: 'Indica al menos fecha de nacimiento o género' },
            { status: 400 }
          );
        }
        const patch: Record<string, unknown> = { updated_at: now };
        if (fecha) patch.fecha_nacimiento = fecha;
        if (genero) patch.genero = genero;
        const { error } = await supabaseAdmin.from('profiles').update(patch).eq('id', user.id);
        if (error) throw error;
        await markPromptCompleted(user.id, 'demographics', { fecha, genero });
        return NextResponse.json({ ok: true });
      }

      case 'dni_soft': {
        const dniResult = await lookupDni(String(body.dni || ''));
        if (!isDniResult(dniResult)) {
          return NextResponse.json({ error: dniResult.error }, { status: dniResult.status });
        }
        const { data: dniOwner } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('dni', dniResult.dni)
          .neq('id', user.id)
          .maybeSingle();
        if (dniOwner) {
          return NextResponse.json(
            { error: 'Este DNI ya está vinculado a otra cuenta' },
            { status: 409 }
          );
        }
        const nombre = dniResult.nombres;
        const apellido = [dniResult.apellidoPaterno, dniResult.apellidoMaterno]
          .filter(Boolean)
          .join(' ');
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            dni: dniResult.dni,
            dni_verified_at: now,
            nombre,
            apellido,
            updated_at: now,
          })
          .eq('id', user.id);
        if (error) throw error;
        await markPromptCompleted(user.id, 'dni_soft', { dni: dniResult.dni });
        return NextResponse.json({
          ok: true,
          data: {
            dni: dniResult.dni,
            nombreCompleto: dniResult.nombreCompleto,
          },
        });
      }

      case 'intents': {
        const interests = (body.interests || []).filter((c): c is CapabilityKey =>
          CAP_KEYS.includes(c as CapabilityKey)
        );
        const wantsPublish = interests.includes('publish') || interests.includes('business');
        const intencion = interests.includes('business')
          ? 'negocio'
          : wantsPublish
            ? 'anunciante'
            : 'explorador';
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            intencion,
            can_publish: wantsPublish,
            rol: wantsPublish ? 'anunciante' : 'usuario',
            updated_at: now,
          })
          .eq('id', user.id);
        if (error) throw error;
        for (const key of interests) {
          await upsertCapability(user.id, key, 'active');
        }
        await markPromptCompleted(user.id, 'intents', { interests, intencion });
        return NextResponse.json({ ok: true, intencion, interests });
      }

      default:
        return NextResponse.json({ error: 'prompt no soportado' }, { status: 400 });
    }
  } catch (e) {
    console.error('[profiling/complete]', e);
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 });
  }
}
