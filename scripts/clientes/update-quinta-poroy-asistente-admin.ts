/**
 * Añade vacante Asistente administrativo — adiso ZbJTPPJpXr
 * npx tsx scripts/clientes/update-quinta-poroy-asistente-admin.ts
 */
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { getAdisoUrl } from '../../lib/url';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const ADISO_ID = 'ZbJTPPJpXr';
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://buscadis.com').replace(/\/$/, '');

const TITULO =
  'Quinta campestre Poroy | Cocina, mozos, cajera, niñera y asistente admin — urgente';

const DESCRIPCION = [
  '¡Urgente! Quinta campestre en Poroy (Cusco) busca personal para sumarse al equipo.',
  '',
  'Vacantes:',
  '• Ayudantes de cocina (con experiencia)',
  '• Mozos con o sin experiencia',
  '• Cajera',
  '• Niñera',
  '• Asistente administrativo',
  '',
  'Se brinda:',
  '• Buen pago / excelente sueldo',
  '• Movilidad (transporte ida y vuelta)',
  '• Alimentación cubierta',
  '',
  'Modalidad: trabajo permanente o fines de semana (tiempo completo o parcial).',
  '',
  'Ubicación: carretera principal Cusco–Abancay, carril de subida, a 20 m del puente peatonal de Poroy (Quinta Campestre Antonios).',
  '',
  'Contacto WhatsApp: 966 364 330',
].join('\n');

async function main() {
  const { supabaseAdmin } = await import('../../lib/supabase-admin');
  const { data: row, error: fetchErr } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, atributos, private_data')
    .eq('id', ADISO_ID)
    .maybeSingle();
  if (fetchErr || !row) throw new Error(fetchErr?.message || 'Adiso no encontrado');

  const atributos = {
    ...(typeof row.atributos === 'object' && row.atributos ? row.atributos : {}),
    areas: [
      'Ayudante de cocina',
      'Mozo',
      'Cajera',
      'Niñera',
      'Asistente administrativo',
    ],
  };

  const { error } = await supabaseAdmin
    .from('adisos')
    .update({
      titulo: TITULO.slice(0, 120),
      descripcion: DESCRIPCION.slice(0, 2000),
      atributos,
    })
    .eq('id', ADISO_ID);
  if (error) throw new Error(error.message);

  try {
    const { generateAndStoreEmbedding } = await import('../../lib/ai/embeddings');
    await generateAndStoreEmbedding(ADISO_ID);
  } catch (e) {
    console.warn('[embedding]', e);
  }

  const shareUrl = `${SITE}${getAdisoUrl({ id: ADISO_ID, titulo: TITULO, categoria: 'empleos' })}`;
  console.log(JSON.stringify({ updated: true, adisoId: ADISO_ID, shareUrl }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
