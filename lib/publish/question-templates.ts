export const FIELD_QUESTIONS: Record<string, string> = {
  categoria: '¿En qué categoría encaja mejor tu aviso? (empleos, inmuebles, vehículos, etc.)',
  subcategoria: '¿Qué tipo específico es? (ej. apartamento, moto, tiempo completo)',
  titulo: '¿Cómo titularías tu aviso en una línea?',
  descripcion: 'Cuéntame más detalles: condiciones, características, horarios…',
  contacto: '¿Cuál es tu WhatsApp para que te contacten?',
  ubicacion: '¿En qué zona o distrito está?',
  precio: '¿Cuál es el precio o rango? (o "a convenir")',
  'inmuebles_operacion': '¿Es venta o alquiler?',
  'vehiculos_condicion': '¿El vehículo es nuevo o usado?',
  'empleos_modalidad': '¿El trabajo es presencial, remoto o híbrido?',
};

export function getQuestionForField(fieldId: string, context?: { categoria?: string }): string {
  if (FIELD_QUESTIONS[fieldId]) return FIELD_QUESTIONS[fieldId];
  if (fieldId.startsWith('empleos') && context?.categoria === 'empleos') {
    return '¿Algún detalle más sobre el empleo? (horario, sueldo, requisitos)';
  }
  return `¿Podrías darme más información sobre "${fieldId.replace(/_/g, ' ')}"?`;
}

export function parseAnswerForField(
  fieldId: string,
  answer: string
): string | number | boolean | string[] {
  const t = answer.trim().toLowerCase();
  if (fieldId === 'precio' || fieldId.includes('sueldo') || fieldId.includes('area') || fieldId.includes('km') || fieldId.includes('anio')) {
    const num = parseFloat(answer.replace(/[^\d.]/g, ''));
    return isNaN(num) ? answer : num;
  }
  if (t === 'sí' || t === 'si' || t === 'yes') return true;
  if (t === 'no') return false;
  return answer.trim();
}
