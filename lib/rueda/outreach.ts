import type { RuedaExtractedAd } from '@/lib/rueda/types';

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
  return `Hola, somos Buscadis. Publicamos gratis su aviso «${titulo.slice(0, 55)}» aquí: ${urlAviso}. Si no lo autorizó, lo retiramos al instante. ¿Desea reclamar su cuenta y editarlo?`;
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
