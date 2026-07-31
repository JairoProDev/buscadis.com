/**
 * Batch QA: extrae varias páginas y reporta calidad (sin subir a DB).
 *
 *   npx tsx scripts/qa-extraccion-rueda.ts
 *   npx tsx scripts/qa-extraccion-rueda.ts --ediciones=R2747,R2745 --paginas=4-10
 */
import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');
import { estructurarAnuncios, esPublicable, type AnuncioExtraido } from '../lib/extraer-anuncios-rueda';

const ARCHIVE = '/home/jairoprodev/proyectos/ads/archive/pages';

function parsePaginas(spec: string): number[] {
  // "4-10" o "5,6,7"
  if (spec.includes('-')) {
    const [a, b] = spec.split('-').map(Number);
    return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  }
  return spec.split(',').map((s) => Number(s.trim())).filter(Boolean);
}

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=').slice(1).join('=');
}

function findEditionDir(ed: string): string | null {
  const dirs = fs.readdirSync(ARCHIVE).filter((d) => d.startsWith(ed + '-') || d === ed);
  if (!dirs.length) return null;
  return path.join(ARCHIVE, dirs[0]);
}

interface PageResult {
  edicion: string;
  pagina: number;
  chars: number;
  total: number;
  avgScore: number;
  porCategoria: Record<string, number>;
  issueCounts: Record<string, number>;
  peores: { score: number; titulo: string; issues: string[]; phones: number; chars: number }[];
  anuncios: AnuncioExtraido[];
}

async function processPage(edicion: string, dir: string, pagina: number): Promise<PageResult | null> {
  const pdf = path.join(dir, `pagina-${String(pagina).padStart(2, '0')}.pdf`);
  if (!fs.existsSync(pdf)) return null;
  const parsed = await pdfParse(fs.readFileSync(pdf));
  const anuncios = estructurarAnuncios(parsed.text);
  const porCategoria: Record<string, number> = {};
  const issueCounts: Record<string, number> = {};
  for (const a of anuncios) {
    porCategoria[a.categoria] = (porCategoria[a.categoria] || 0) + 1;
    for (const i of a.issues) issueCounts[i] = (issueCounts[i] || 0) + 1;
  }
  const avgScore = anuncios.length
    ? Math.round(anuncios.reduce((s, a) => s + a.score, 0) / anuncios.length)
    : 0;
  const peores = [...anuncios]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((a) => ({
      score: a.score,
      titulo: a.titulo.slice(0, 70),
      issues: a.issues,
      phones: a.telefonos.length,
      chars: a.textoRaw.length,
    }));

  return {
    edicion,
    pagina,
    chars: parsed.text.length,
    total: anuncios.length,
    avgScore,
    porCategoria,
    issueCounts,
    peores,
    anuncios,
  };
}

async function main() {
  const ediciones = (arg('ediciones') || 'R2747,R2745,R2746').split(',').map((s) => s.trim());
  const paginas = parsePaginas(arg('paginas') || '4-10');
  const outRoot = path.join(process.cwd(), 'output', 'qa-extraccion');
  fs.mkdirSync(outRoot, { recursive: true });

  const pages: PageResult[] = [];
  for (const ed of ediciones) {
    const dir = findEditionDir(ed);
    if (!dir) {
      console.warn(`skip ${ed}: no pages dir`);
      continue;
    }
    for (const p of paginas) {
      const r = await processPage(ed, dir, p);
      if (r) pages.push(r);
    }
  }

  // Persist per-page separados + summary
  let publicables = 0;
  let revision = 0;
  for (const p of pages) {
    for (const a of p.anuncios) {
      if (esPublicable(a)) publicables++;
      else revision++;
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    pages: pages.map(({ anuncios, ...rest }) => rest),
    totals: {
      paginas: pages.length,
      anuncios: pages.reduce((s, p) => s + p.total, 0),
      publicables,
      revision_manual: revision,
      avgScore: Math.round(
        pages.reduce((s, p) => s + p.avgScore * p.total, 0) /
          Math.max(1, pages.reduce((s, p) => s + p.total, 0))
      ),
      issues: pages.reduce<Record<string, number>>((acc, p) => {
        for (const [k, v] of Object.entries(p.issueCounts)) acc[k] = (acc[k] || 0) + v;
        return acc;
      }, {}),
      categorias: pages.reduce<Record<string, number>>((acc, p) => {
        for (const [k, v] of Object.entries(p.porCategoria)) acc[k] = (acc[k] || 0) + v;
        return acc;
      }, {}),
    },
  };

  for (const p of pages) {
    const folder = path.join(outRoot, `${p.edicion}-p${String(p.pagina).padStart(2, '0')}`);
    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(
      path.join(folder, 'separados.txt'),
      p.anuncios.map((a, i) => `${i + 1}. [${a.score}] [${a.categoria}] ${a.titulo}\n   ${a.descripcion}\n   phones: ${a.telefonos.join(', ')} | issues: ${a.issues.join(',') || 'ok'}`).join('\n\n')
    );
    fs.writeFileSync(path.join(folder, 'anuncios.json'), JSON.stringify(p.anuncios, null, 2));
  }

  fs.writeFileSync(path.join(outRoot, 'summary.json'), JSON.stringify(summary, null, 2));

  // Also copy to ads reports
  const reportDir = '/home/jairoprodev/proyectos/ads/reports/qa-extraccion';
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'summary.json'), JSON.stringify(summary, null, 2));

  // Markdown report
  const md: string[] = [
    `# QA extracción Rueda`,
    ``,
    `Generado: ${summary.generatedAt}`,
    ``,
    `## Totales`,
    `- Páginas: **${summary.totals.paginas}**`,
    `- Anuncios: **${summary.totals.anuncios}**`,
    `- Score medio: **${summary.totals.avgScore}/100**`,
    `- Categorías: ${JSON.stringify(summary.totals.categorias)}`,
    `- Issues: ${JSON.stringify(summary.totals.issues)}`,
    ``,
    `## Por página`,
    `| Ed | Pag | Ads | Score | Issues top |`,
    `|----|-----|-----|-------|------------|`,
  ];
  for (const p of pages) {
    const topIssues = Object.entries(p.issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => `${k}:${v}`)
      .join(', ');
    md.push(`| ${p.edicion} | ${p.pagina} | ${p.total} | ${p.avgScore} | ${topIssues || '—'} |`);
  }
  md.push(``, `## Peores (score bajo)`, ``);
  for (const p of pages) {
    for (const w of p.peores.filter((x) => x.score < 85)) {
      md.push(`- **${p.edicion} p${p.pagina}** score=${w.score} · ${w.issues.join(',')} · \`${w.titulo}\` (${w.chars}c, ${w.phones} tel)`);
    }
  }
  fs.writeFileSync(path.join(reportDir, 'REPORT.md'), md.join('\n'));
  fs.writeFileSync(path.join(outRoot, 'REPORT.md'), md.join('\n'));

  console.log(JSON.stringify(summary.totals, null, 2));
  console.log('\n' + md.slice(0, 30).join('\n'));
  console.log(`\n→ ${reportDir}/REPORT.md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
