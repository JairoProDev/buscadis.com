import type { RuedaExtractedAd } from '@/lib/rueda/types';
import { limpiarTituloVacante } from '@/lib/rueda/lead-fields';

export interface OutreachRow {
  edicion: string;
  pagina: number;
  titulo: string;
  telefono: string;
  url_aviso: string;
  url_reclamar: string;
  wa_url: string;
  estado: string;
  requiere_revision: boolean;
  import_key: string;
}

export function buildOutreachMessage(titulo: string, urlAviso: string): string {
  const rol = limpiarTituloVacante(titulo, 48);
  return (
    `¿Publicó el aviso de ${rol}? Ya está visible aquí: ${urlAviso} ` +
    `Si no fue usted, lo retiramos al toque. Si sí, puede reclamar la ficha y editarla cuando quiera.`
  );
}

export function outreachRowsFromAds(
  avisos: RuedaExtractedAd[],
  edicion: string,
  resolveUrls: (ad: RuedaExtractedAd) => { urlAviso: string; urlReclamar: string },
): OutreachRow[] {
  return avisos
    .filter((a) => a.telefonos[0])
    .map((a) => {
      const telefono = a.telefonos[0].replace(/\D/g, '').slice(-9);
      const { urlAviso, urlReclamar } = resolveUrls(a);
      const msg = encodeURIComponent(buildOutreachMessage(a.titulo, urlAviso));
      return {
        edicion,
        pagina: a.pagina,
        titulo: a.titulo,
        telefono,
        url_aviso: urlAviso,
        url_reclamar: urlReclamar,
        wa_url: `https://wa.me/51${telefono}?text=${msg}`,
        estado: 'pendiente_import',
        requiere_revision: a.requiere_revision,
        import_key: a.import_key,
      };
    });
}

export function outreachToCsv(rows: OutreachRow[]): string {
  const header =
    'edicion,pagina,titulo,telefono,url_aviso,url_reclamar,wa_url,estado,requiere_revision,import_key';
  const lines = rows.map((r) =>
    [
      r.edicion,
      r.pagina,
      `"${r.titulo.replace(/"/g, '""')}"`,
      r.telefono,
      r.url_aviso,
      r.url_reclamar,
      r.wa_url,
      r.estado,
      r.requiere_revision,
      r.import_key,
    ].join(','),
  );
  return [header, ...lines].join('\n') + '\n';
}
