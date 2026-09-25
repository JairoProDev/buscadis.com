import { getAdisoByIdFromSupabase, getInteresesPorAnuncio, supabase } from './supabase';

interface NotificacionAnunciante {
  adisoId: string;
  cantidadIntereses: number;
  contactoAnunciante: string;
  tituloAnuncio: string;
  urlRenovar: string;
}

/**
 * Envía notificación a un anunciante sobre intereses en su adiso caducado
 */
export async function enviarNotificacionAnunciante(
  notificacion: NotificacionAnunciante
): Promise<boolean> {
  try {
    // Aquí implementarías el envío real de notificación
    // Por ejemplo, usando Resend para email, Twilio para SMS, o WhatsApp Business API
    
    const mensaje = `
Hola,

Tu adiso "${notificacion.tituloAnuncio}" ha recibido ${notificacion.cantidadIntereses} ${notificacion.cantidadIntereses === 1 ? 'interés' : 'intereses'} de personas interesadas.

¡Aún hay personas buscando lo que ofreces! Renueva tu adiso para volver a estar visible:

${notificacion.urlRenovar}

Saludos,
Equipo de Rueda de Negocios
    `.trim();
    
    // Ejemplo con Resend (descomentar y configurar)
    /*
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: 'notificaciones@adis.lat',
      to: notificacion.contactoAnunciante,
      subject: `¡${notificacion.cantidadIntereses} personas interesadas en tu adiso!`,
      text: mensaje
    });
    */
    
    // Por ahora, solo loguear (implementar envío real después)
    console.log('Notificación a enviar:', {
      to: notificacion.contactoAnunciante,
      subject: `¡${notificacion.cantidadIntereses} personas interesadas en tu adiso!`,
      message: mensaje
    });
    
    return true;
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    return false;
  }
}

/**
 * Obtiene adisos con intereses acumulados y envía notificaciones
 */
export async function procesarNotificacionesPendientes(
  minimoIntereses: number = 3
): Promise<{ notificados: number; errores: number }> {
  if (!supabase) {
    throw new Error('Supabase no está configurado');
  }
  
  try {
    // Obtener intereses agrupados por adiso usando la función SQL
    const { data: interesesAgrupados, error } = await supabase
      .rpc('obtener_intereses_por_notificar', { minimo_intereses: minimoIntereses });
    
    if (error) {
      throw error;
    }
    
    if (!interesesAgrupados || interesesAgrupados.length === 0) {
      return { notificados: 0, errores: 0 };
    }
    
    let notificados = 0;
    let errores = 0;
    
    for (const grupo of interesesAgrupados) {
      try {
        // Obtener datos del adiso
        const adiso = await getAdisoByIdFromSupabase(grupo.adiso_id);
        
        if (!adiso) {
          console.error(`Adiso no encontrado: ${grupo.adiso_id}`);
          errores++;
          continue;
        }
        
        // Determinar contacto del anunciante
        const contactoAnunciante = adiso.contactosMultiples?.find(c => c.principal)?.valor || 
                                   adiso.contacto;
        
        if (!contactoAnunciante) {
          console.error(`Sin contacto para adiso: ${grupo.adiso_id}`);
          errores++;
          continue;
        }
        
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://adis.lat';
        const urlRenovar = `${siteUrl}/renovar/${adiso.id}`;
        
        // Enviar notificación
        const enviado = await enviarNotificacionAnunciante({
          adisoId: adiso.id,
          cantidadIntereses: parseInt(grupo.total_intereses),
          contactoAnunciante,
          tituloAnuncio: adiso.titulo,
          urlRenovar
        });
        
        if (enviado) {
          // Marcar intereses como notificados
          await supabase.rpc('marcar_intereses_notificados', {
            p_adiso_id: grupo.adiso_id
          });
          
          notificados++;
        } else {
          errores++;
        }
      } catch (error: any) {
        console.error(`Error al procesar notificación para ${grupo.adiso_id}:`, error);
        errores++;
      }
    }
    
    return { notificados, errores };
  } catch (error: any) {
    console.error('Error al procesar notificaciones:', error);
    throw error;
  }
}


