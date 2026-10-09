import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { newAdisoId } from '@/lib/url';
import { AVISO_VACIO, descripcionDe, telefonoValido, type AvisoEmpleo } from '@/lib/empleo/model';

export const dynamic = 'force-dynamic';

const DIAS = 30;

function leerAviso(body: unknown): AvisoEmpleo | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const whatsapp = telefonoValido(String(b.whatsapp || ''));
  const puesto = String(b.puesto || '').trim().slice(0, 80);
  const negocio = String(b.negocio || '').trim().slice(0, 80);
  if (!whatsapp || puesto.length < 3 || negocio.length < 2) return null;
  const lista = (v: unknown) =>
    (Array.isArray(v) ? v : String(v || '').split('\n'))
      .map((x) => String(x).trim())
      .filter(Boolean)
      .slice(0, 6);
  return {
    ...AVISO_VACIO,
    negocio,
    puesto,
    zona: String(b.zona || 'Cusco').trim().slice(0, 80) || 'Cusco',
    pago: String(b.pago || '').trim().slice(0, 140),
    horario: String(b.horario || '').trim().slice(0, 160),
    requisitos: lista(b.requisitos),
    beneficios: lista(b.beneficios),
    whatsapp,
  };
}

export async function POST(request: NextRequest) {
  try {
    const aviso = leerAviso(await request.json());
    if (!aviso) {
      return NextResponse.json(
        { error: 'Falta el puesto, el negocio o un WhatsApp válido de 9 dígitos.' },
        { status: 400 }
      );
    }

    const id = newAdisoId();
    const editToken = nanoid(24);
    const ahora = new Date();
    const expira = new Date(ahora.getTime() + DIAS * 24 * 60 * 60 * 1000);
    const fecha = ahora.toISOString().slice(0, 10);
    const hora = ahora.toTimeString().slice(0, 8);

    const { error } = await supabaseAdmin.from('adisos').insert({
      id,
      categoria: 'empleos',
      titulo: `${aviso.puesto} — ${aviso.negocio}`.slice(0, 140),
      descripcion: descripcionDe(aviso),
      contacto: aviso.whatsapp,
      ubicacion: aviso.zona,
      fecha_publicacion: fecha,
      hora_publicacion: hora,
      fecha_expiracion: expira.toISOString(),
      expires_at: expira.toISOString(),
      esta_activo: true,
      es_historico: false,
      atributos: { empleo: aviso },
      contact_locked: false,
      payment_status: 'free',
      publish_tier: 'free',
      private_data: { editToken, origen: 'empleo-creador' },
      subcategoria: 'oferta',
    });

    if (error) {
      console.error('empleo publish', error);
      return NextResponse.json({ error: 'No se pudo guardar el aviso.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      id,
      editToken,
      path: `/empleo/a/${id}`,
      expira: expira.toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Error al publicar';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
