import { NextResponse } from 'next/server';

/** @deprecated Use POST /api/adisos/publish with daily Yape pricing instead */
export async function POST() {
  return NextResponse.json(
    {
      error: 'deprecated',
      message: 'Los paquetes MercadoPago fueron reemplazados por pricing diario. Usa POST /api/adisos/publish',
      redirect: '/publicar',
    },
    { status: 410 }
  );
}
