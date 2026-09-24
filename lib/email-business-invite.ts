/**
 * Sends team invitation email (Resend). Server-only.
 */
import { emailBrand } from '@/lib/email/brand-colors';

export async function sendBusinessTeamInviteEmail(params: {
    toEmail: string;
    businessName: string;
    inviterLabel: string;
    roleLabel: string;
    acceptUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
        console.warn('RESEND_API_KEY not set; invitation email skipped');
        return { ok: false, error: 'email_not_configured' };
    }

    const from = getFromAddress();

    try {
        const { Resend } = await import('resend');
        const resend = new Resend(key);

        await resend.emails.send({
            from,
            to: params.toEmail,
            subject: `Invitación al equipo de ${params.businessName}`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: ${emailBrand.ink};">
  <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
    <h1 style="font-size: 20px; margin: 0 0 16px;">Te invitaron a administrar un negocio</h1>
    <p style="margin: 0 0 12px;"><strong>${escapeHtml(params.inviterLabel)}</strong> te agregó al equipo de <strong>${escapeHtml(params.businessName)}</strong> como <strong>${escapeHtml(params.roleLabel)}</strong>.</p>
    <p style="margin: 0 0 24px;">Acepta la invitación con la misma cuenta de correo (${escapeHtml(params.toEmail)}):</p>
    <a href="${escapeAttr(params.acceptUrl)}" style="display: inline-block; background: ${emailBrand.action}; color: ${emailBrand.onAction}; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Aceptar invitación</a>
    <p style="margin-top: 32px; font-size: 13px; color: ${emailBrand.muted};">Si no esperabas este correo, ignóralo. El enlace caduca en unos días.</p>
  </div>
</body>
</html>`,
        });

        return { ok: true };
    } catch (e: any) {
        console.error('sendBusinessTeamInviteEmail:', e);
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
    const name = process.env.RESEND_FROM_NAME || 'Equipo';
    return `${name} <${local}@${domain}>`;
}

export function getInvitationAcceptUrl(token: string): string {
    const base =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
        'http://localhost:3000';
    const u = new URL('/invitacion/equipo', base.replace(/\/$/, ''));
    u.searchParams.set('token', token);
    return u.toString();
}
