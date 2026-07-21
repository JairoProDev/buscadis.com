/**
 * Email when a business is assigned to an owner (pending or transferred).
 * Server-only (Resend).
 */

export async function sendBusinessOwnerAssignEmail(params: {
  toEmail: string;
  businessName: string;
  mode: 'pending' | 'transferred';
  editUrl: string;
  publicUrl: string;
  loginUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('RESEND_API_KEY not set; owner assign email skipped');
    return { ok: false, error: 'email_not_configured' };
  }

  const from = getFromAddress();
  const isPending = params.mode === 'pending';

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(key);

    await resend.emails.send({
      from,
      to: params.toEmail,
      subject: isPending
        ? `Tu negocio ${params.businessName} te espera en Buscadis`
        : `Ya eres dueña de ${params.businessName} en Buscadis`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b;">
  <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
    <h1 style="font-size: 20px; margin: 0 0 16px;">
      ${isPending ? 'Tu página de negocio está lista' : '¡Ya puedes administrar tu negocio!'}
    </h1>
    <p style="margin: 0 0 12px;">
      Te asignaron <strong>${escapeHtml(params.businessName)}</strong> en Buscadis.
    </p>
    <p style="margin: 0 0 24px;">
      ${
        isPending
          ? `Inicia sesión con <strong>${escapeHtml(params.toEmail)}</strong> y el negocio se vinculará solo. Luego podrás editarlo.`
          : `Entra con <strong>${escapeHtml(params.toEmail)}</strong> para ver y editar tu página.`
      }
    </p>
    <a href="${escapeAttr(isPending ? params.loginUrl : params.editUrl)}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
      ${isPending ? 'Iniciar sesión' : 'Editar mi negocio'}
    </a>
    <p style="margin-top: 20px; font-size: 14px;">
      Página pública: <a href="${escapeAttr(params.publicUrl)}">${escapeHtml(params.publicUrl)}</a>
    </p>
  </div>
</body>
</html>`,
    });

    return { ok: true };
  } catch (e: any) {
    console.error('sendBusinessOwnerAssignEmail:', e);
    return { ok: false, error: e?.message || 'send_failed' };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

function getFromAddress(): string {
  const domain = process.env.RESEND_FROM_DOMAIN || 'adis.lat';
  const local = process.env.RESEND_FROM_LOCAL || 'equipo';
  const name = process.env.RESEND_FROM_NAME || 'Buscadis';
  return `${name} <${local}@${domain}>`;
}
