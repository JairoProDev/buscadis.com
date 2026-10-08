export interface RuedaExtractedAd {
  batch_id: string;
  edicion: string;
  pagina: number;
  import_key: string;
  titulo: string;
  categoria: string;
  subcategoria?: string;
  ubicacion: string;
  vacantes: string[];
  descripcion: string;
  telefonos: string[];
  whatsapp: string | null;
  email: string | null;
  es_empresa: boolean;
  confianza: number;
  requiere_revision: boolean;
  recurrente: boolean;
  score: number;
  issues: string[];
  texto_raw: string;
  flyer_template: string;
  hide_generic_location: boolean;
}
