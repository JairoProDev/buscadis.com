/** Campos derivados del texto del aviso para CRM / Sheets. */

export function extractSueldoTexto(text: string): string {
  const m =
    text.match(/SUELDO\s*:?\s*(S\/\.?\s*[\d,.]+(?:\s*soles?)?[^.]{0,40})/i) ||
    text.match(/(S\/\.?\s*[\d,.]+)\s*(?:soles?|mensual)/i) ||
    text.match(/sueldo\s+(?:a\s+tratar|conversable|m[aá]s del promedio)/i);
  return m ? m[0].replace(/\s+/g, ' ').trim() : '';
}

export function extractHorarioTexto(text: string): string {
  const m = text.match(/HORARIO[S]?\s*:?\s*[^.]{10,120}/i);
  return m ? m[0].replace(/\s+/g, ' ').trim().slice(0, 120) : '';
}

export function mensajeWaEmpleoCusco(params: {
  titulo: string;
  empresaHint?: string;
  urlAviso?: string;
}): string {
  const who = params.empresaHint?.slice(0, 40) || 'su aviso de empleo';
  const link = params.urlAviso ? ` Lo tenemos listo aquí: ${params.urlAviso}` : '';
  return (
    `Hola, soy del equipo Buscadis (Cusco). Vimos ${who} en Rueda de Negocios — ` +
    `en la revista cuesta desde S/15 por 3 días; en Buscadis puede aparecer más gente por más tiempo con mejor retorno.${link} ` +
    `¿Le muestro en 2 minutos cómo destacarlo para llenar la vacante más rápido?`
  );
}
