import { NextRequest, NextResponse } from 'next/server';
import { verificarTokenHandoff } from '@buscadis/perfil-vivo/server';

export const runtime = 'nodejs';

type RouteCtx = { params: Promise<{ token: string }> };

/**
 * Handoff medido: verifica token, registra evento, 302 al destino.
 * Sprint 1: log en servidor (panel/DB en P14).
 */
export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { token: raw } = await ctx.params;
  const token = decodeURIComponent(raw);
  const payload = verificarTokenHandoff(token);

  if (!payload) {
    return NextResponse.redirect(new URL('/', req.url), 302);
  }

  console.info(
    JSON.stringify({
      event: 'handoff_redirigido',
      canal: payload.canal,
      negocio_id: payload.negocioId,
      slug: payload.slug,
      modulo: payload.modulo,
      producto_id: payload.productoId ?? null,
      token_ts: payload.ts,
    })
  );

  return NextResponse.redirect(payload.destino, 302);
}
