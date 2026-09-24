import { tokens } from '@buscadis/tokens';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const EMAIL_UI = {
  text: tokens['--bs-color-neutral-800'],
  muted: tokens['--bs-color-neutral-600'],
  faint: tokens['--bs-color-neutral-500'],
  surface: tokens['--bs-color-neutral-50'],
  panel: tokens['--bs-color-neutral-0'],
  border: tokens['--bs-color-neutral-200'],
  inset: tokens['--bs-color-neutral-25'],
  link: tokens['--bs-color-adis-600'],
  warn: tokens['--bs-color-warning-fg'],
} as const;

// Email opcional para notificaciones (configurar en .env.local)
const NOTIFICATION_EMAIL = process.env.FEEDBACK_NOTIFICATION_EMAIL;
// Dominio de email - configurable por producto
const EMAIL_FROM_DOMAIN = process.env.EMAIL_FROM_DOMAIN || 'adis.lat';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Adis.lat';
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'feedback'; // feedback@adis.lat

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedbacks } = body;

    console.log('📥 Feedback recibido:', { count: feedbacks?.length, feedbacks });

    if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
      console.error('❌ Array de feedbacks inválido o vacío');
      return NextResponse.json(
        { error: 'Se requiere un array de feedbacks' },
        { status: 400 }
      );
    }

    if (!supabase) {
      console.error('⚠️ Supabase no está configurado');
      return NextResponse.json(
        { error: 'Servicio no configurado' },
        { status: 500 }
      );
    }

    // Insertar todos los feedbacks en la base de datos
    const feedbacksToInsert = feedbacks.map((f: any) => ({
      id: f.id,
      tipo: f.tipo,
      texto: f.texto,
      fecha: f.fecha,
      hora: f.hora,
      url: f.url || null,
      user_agent: f.userAgent || null,
      imagen_url: f.imagenUrl || null,
      leido: false
    }));

    console.log('💾 Intentando insertar en Supabase:', feedbacksToInsert);

    let data, error;
    try {
      const result = await supabase
        .from('feedback')
        .insert(feedbacksToInsert)
        .select();
      
      data = result.data;
      error = result.error;
    } catch (fetchError: any) {
      // Error de red/conexión
      console.error('❌ Error de conexión a Supabase:', {
        message: fetchError.message,
        cause: fetchError.cause,
        stack: fetchError.stack
      });
      
      // Si es un error de timeout o conexión, intentar guardar en localStorage como fallback
      return NextResponse.json(
        { 
          error: 'Error de conexión a Supabase',
          details: 'No se pudo conectar al servidor. El feedback se guardó localmente y se enviará cuando la conexión se restablezca.',
          code: 'CONNECTION_ERROR',
          fallback: true
        },
        { status: 503 } // Service Unavailable
      );
    }

    if (error) {
      console.error('❌ Error al guardar feedback en Supabase:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        error
      });
      
      // Si es un error de RLS o permisos, dar mensaje más específico
      if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
        return NextResponse.json(
          { 
            error: 'Error de permisos',
            details: 'Las políticas de seguridad no están configuradas correctamente. Verifica las políticas RLS en Supabase.',
            code: error.code
          },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Error al guardar feedback',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    console.log('✅ Feedback guardado exitosamente:', data);

    // Opcional: Enviar notificación por email si está configurado
    if (NOTIFICATION_EMAIL && feedbacks.length > 0) {
      try {
        await enviarNotificacionEmail(feedbacks);
      } catch (emailError) {
        // No fallar si el email falla, solo loguear
        console.error('Error al enviar notificación por email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      saved: data?.length || 0,
      message: 'Feedback guardado correctamente'
    });
  } catch (error: any) {
    console.error('Error en API de feedback:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función para enviar notificación por email usando Resend
async function enviarNotificacionEmail(feedbacks: any[]) {
  if (!NOTIFICATION_EMAIL) return;

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY no configurada. Las notificaciones por email no se enviarán.');
    return;
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(RESEND_API_KEY);

    const feedback = feedbacks[0];
    const tipoLabel = feedback.tipo === 'sugerencia' ? '💡 Sugerencia' : '🚨 Problema';
    const emoji = feedback.tipo === 'sugerencia' ? '💡' : '🚨';

    const subject = `${emoji} Nuevo ${feedback.tipo}: ${feedback.texto.substring(0, 50)}${feedback.texto.length > 50 ? '...' : ''}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: ${EMAIL_UI.text}; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${EMAIL_UI.surface}; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { background: ${EMAIL_UI.panel}; padding: 20px; border: 1px solid ${EMAIL_UI.border}; border-radius: 8px; }
            .label { font-weight: 600; color: ${EMAIL_UI.muted}; margin-top: 15px; }
            .value { margin-top: 5px; padding: 10px; background: ${EMAIL_UI.inset}; border-radius: 4px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid ${EMAIL_UI.border}; font-size: 12px; color: ${EMAIL_UI.faint}; }
            a { color: ${EMAIL_UI.link}; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">${tipoLabel}</h2>
              <p style="margin: 5px 0 0 0; color: ${EMAIL_UI.muted};">Nuevo feedback recibido en buscadis.com</p>
            </div>
            <div class="content">
              <div class="label">Tipo:</div>
              <div class="value">${feedback.tipo === 'sugerencia' ? '💡 Sugerencia' : '🚨 Problema'}</div>
              
              <div class="label">Mensaje:</div>
              <div class="value" style="white-space: pre-wrap;">${feedback.texto}</div>
              
              <div class="label">Fecha y Hora:</div>
              <div class="value">${feedback.fecha} a las ${feedback.hora}</div>
              
              ${feedback.url ? `
                <div class="label">URL:</div>
                <div class="value"><a href="${feedback.url}" target="_blank">${feedback.url}</a></div>
              ` : ''}
              
              ${feedbacks.length > 1 ? `
                <div class="label" style="margin-top: 20px; color: ${EMAIL_UI.warn};">
                  ⚠️ Se recibieron ${feedbacks.length} feedbacks en este lote
                </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>Este es un email automático de ${EMAIL_FROM_DOMAIN}</p>
              <p>Puedes gestionar los feedbacks desde el dashboard: <a href="${process.env.NEXT_PUBLIC_APP_URL || `https://${EMAIL_FROM_DOMAIN}`}/admin/feedback">Ver Dashboard</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}@${EMAIL_FROM_DOMAIN}>`,
      to: NOTIFICATION_EMAIL,
      subject: subject,
      html: htmlContent
    });

    console.log(`✅ Email de notificación enviado a ${NOTIFICATION_EMAIL}`);
  } catch (error: any) {
    console.error('❌ Error al enviar notificación por email:', {
      message: error.message,
      error
    });
    // No fallar si el email falla, solo loguear
  }
}

