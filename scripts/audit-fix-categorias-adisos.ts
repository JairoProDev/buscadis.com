/**
 * Audita TODOS los adisos publicados y corrige categoría errónea.
 * Solo actualiza `categoria` (+ marca en private_data). No toca fechas ni promoted_at.
 *
 *   npx tsx scripts/audit-fix-categorias-adisos.ts --dry
 *   npx tsx scripts/audit-fix-categorias-adisos.ts
 *   npx tsx scripts/audit-fix-categorias-adisos.ts --report-only
 */
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Categoria } from '../types';
import { shouldCorrectCategory } from '../lib/adiso/classify-category';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const dry = process.argv.includes('--dry');
const reportOnly = process.argv.includes('--report-only');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Row = {
  id: string;
  titulo: string;
  descripcion: string | null;
  categoria: Categoria;
  fecha_publicacion: string | null;
  promoted_at: string | null;
  private_data: Record<string, unknown> | null;
  esta_activo: boolean;
  deleted_at: string | null;
};

async function fetchPublished(): Promise<Row[]> {
  const pageSize = 1000;
  let from = 0;
  const all: Row[] = [];
  while (true) {
    const { data, error } = await sb
      .from('adisos')
      .select(
        'id,titulo,descripcion,categoria,fecha_publicacion,promoted_at,private_data,esta_activo,deleted_at',
      )
      .eq('esta_activo', true)
      .is('deleted_at', null)
      .order('id')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...(data as Row[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

async function main() {
  console.log(dry ? 'DRY RUN' : reportOnly ? 'REPORT ONLY' : 'APPLYING CATEGORY FIXES');
  const rows = await fetchPublished();
  console.log('adisos activos publicados:', rows.length);

  const changes: {
    id: string;
    from: Categoria;
    to: Categoria;
    confidence: string;
    margin: number;
    titulo: string;
  }[] = [];
  const skippedLow: { id: string; from: Categoria; titulo: string }[] = [];

  for (const r of rows) {
    const decision = shouldCorrectCategory(r.categoria, r.titulo, r.descripcion || '');
    if (decision.fix) {
      changes.push({
        id: r.id,
        from: r.categoria,
        to: decision.next,
        confidence: decision.confidence,
        margin: decision.margin,
        titulo: r.titulo.slice(0, 120),
      });
    } else if (decision.confidence === 'low' && decision.next !== r.categoria) {
      skippedLow.push({ id: r.id, from: r.categoria, titulo: r.titulo.slice(0, 80) });
    }
  }

  const byTransition: Record<string, number> = {};
  for (const c of changes) {
    const key = `${c.from}→${c.to}`;
    byTransition[key] = (byTransition[key] || 0) + 1;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    total: rows.length,
    fixes: changes.length,
    skippedAmbiguous: skippedLow.length,
    byTransition,
    changes,
    skippedSample: skippedLow.slice(0, 30),
  };

  const reportPath = path.join(process.cwd(), 'scripts', 'output', 'categoria-audit-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('report:', reportPath);
  console.log('fixes:', changes.length, byTransition);
  console.log('ambiguous (no change):', skippedLow.length);

  if (dry || reportOnly) return;

  const chunk = 25;
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < changes.length; i += chunk) {
    const slice = changes.slice(i, i + chunk);
    await Promise.all(
      slice.map(async (c) => {
        const row = rows.find((r) => r.id === c.id);
        const prevPrivate = (row?.private_data && typeof row.private_data === 'object'
          ? row.private_data
          : {}) as Record<string, unknown>;

        const { error } = await sb
          .from('adisos')
          .update({
            categoria: c.to,
            private_data: {
              ...prevPrivate,
              categoria_correccion: {
                at: new Date().toISOString(),
                from: c.from,
                to: c.to,
                confidence: c.confidence,
                margin: c.margin,
                reason: 'audit-fix-categorias-adisos',
              },
            },
          })
          .eq('id', c.id);

        if (error) {
          fail += 1;
          console.error(c.id, error.message);
        } else ok += 1;
      }),
    );
    process.stdout.write(`\r${Math.min(i + chunk, changes.length)}/${changes.length}`);
  }
  console.log(`\nOK: ${ok}  FAIL: ${fail}`);

  // Verificación post-fix
  const verify = await fetchPublished();
  let remaining = 0;
  for (const r of verify) {
    const d = shouldCorrectCategory(r.categoria, r.titulo, r.descripcion || '');
    if (d.fix) remaining += 1;
  }
  console.log('remaining auto-fixable mismatches:', remaining);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
