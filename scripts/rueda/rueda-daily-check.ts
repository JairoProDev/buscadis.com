/**
 * Alertas operativas: última edición en disco, huecos recientes, manifest drift.
 *
 *   npx tsx scripts/rueda/rueda-daily-check.ts
 */
import * as fs from 'fs';
import { getInventoryPath, getEditionGapsPath } from '../../lib/rueda/paths';

function main() {
  const alerts: string[] = [];

  if (!fs.existsSync(getInventoryPath())) {
    alerts.push('Falta inventory.json — ejecuta inventory-report.ts');
  } else {
    const inv = JSON.parse(fs.readFileSync(getInventoryPath(), 'utf8')) as {
      totals?: { edition_max?: string; not_in_manifest?: number; recent_missing_R2755_R2766?: string[] };
    };
    if ((inv.totals?.not_in_manifest ?? 0) > 0) {
      alerts.push(`${inv.totals?.not_in_manifest} PDFs sin entrada en manifest`);
    }
    const recent = inv.totals?.recent_missing_R2755_R2766 || [];
    if (recent.length) {
      alerts.push(`Ediciones recientes faltantes: ${recent.join(', ')}`);
    }
  }

  if (fs.existsSync(getEditionGapsPath())) {
    const gaps = JSON.parse(fs.readFileSync(getEditionGapsPath(), 'utf8')) as {
      priority_recover?: string[];
    };
    if (gaps.priority_recover?.includes('R2760')) {
      alerts.push('R2760 sigue faltando — intentar WP/Wayback');
    }
  }

  const ok = alerts.length === 0;
  console.log(JSON.stringify({ ok, alerts, at: new Date().toISOString() }, null, 2));
  if (!ok) process.exit(1);
}

main();
