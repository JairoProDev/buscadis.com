import * as fs from 'fs';
import * as path from 'path';
import { nanoid } from 'nanoid';
import { adisoToDb } from '@/lib/supabase';
import { featuresForTier } from '@/lib/publish/tiers';
import type { Adiso, ContactoMultiple } from '@/types';
import { parseUbicacionFromText } from '@/lib/rueda/parse-ubicacion';
import { flyerTemplateForRuedaImport } from '@/lib/rueda/listing-quality';
import type { FlyerTemplateId } from '@/lib/flyer/types';
import type { RuedaExtractedAd } from '@/lib/rueda/types';
import type { EditionRunContext } from './batch';
import { ruedaAdvertiserPhoneKey } from './advertiser-key';
import { getRuedaOutputDir } from './paths';

const OPS_USER_ID = process.env.RUEDA_OPS_USER_ID || 'ef81f31b-a11d-4417-9325-e737daaad32e';

export function toAdisoFromRuedaExtract(
  item: RuedaExtractedAd,
  ctx: EditionRunContext,
  scheduledGoLiveAt: string,
  claimToken: string,
): Adiso {
  const phoneKey = ruedaAdvertiserPhoneKey(item.telefonos[0]);

  const contactos: ContactoMultiple[] = item.telefonos.map((n, idx) => ({
    tipo: item.whatsapp === n || /^9\d{8}$/.test(n) ? 'whatsapp' : 'telefono',
    valor: n,
    principal: idx === 0,
  }));

  const features = featuresForTier('free');
  const id = nanoid(10);
  const ubicacion = parseUbicacionFromText(item.texto_raw || item.descripcion);
  const flyerTemplateId =
    (item.flyer_template as FlyerTemplateId) || flyerTemplateForRuedaImport(id, item.categoria);

  return {
    id,
    categoria: item.categoria as Adiso['categoria'],
    titulo: item.titulo,
    descripcion: item.descripcion,
    contacto: item.telefonos[0] || '',
    contactosMultiples: contactos,
    ubicacion,
    fechaPublicacion: ctx.fechaPublicacionOriginal,
    horaPublicacion: '00:00',
    tamaño: 'miniatura',
    user_id: OPS_USER_ID,
    usuario_id: OPS_USER_ID,
    estaActivo: false,
    esHistorico: false,
    esGratuito: true,
    fuenteOriginal: 'rueda_negocios',
    edicionNumero: ctx.edicion,
    fechaPublicacionOriginal: ctx.fechaPublicacionOriginal,
    publishTier: 'free',
    paymentStatus: 'free',
    promotionTier: 'gratis',
    promotionRank: 0,
    contactLocked: false,
    features: features as unknown as Record<string, unknown>,
    privateData: {
      batch_id: ctx.batchId,
      import_pipeline: 'rueda_claimable',
      import_key: item.import_key,
      pending_owner_transfer: true,
      claim_token: claimToken,
      claim_republish_available: true,
      scheduled_go_live_at: scheduledGoLiveAt,
      import_confidence: item.confianza,
      requiere_revision: item.requiere_revision,
      recurrente: item.recurrente,
      es_empresa: item.es_empresa,
      pagina_revista: item.pagina,
      source_label: 'Publicado por Buscadis. ¿Eres el anunciante? Reclámalo o retíralo.',
      coverSource: 'template',
      flyerTemplateId,
      flyerConfig: {},
      hide_generic_location: item.hide_generic_location,
      noindex_until_claimed: true,
      rueda_advertiser_phone_key: phoneKey,
      rueda_edicion: ctx.edicion,
      rueda_import_key: item.import_key,
    },
  };
}

export function loadAvisosPayload(edicion: string): {
  avisos: RuedaExtractedAd[];
  total_avisos: number;
} {
  const jsonPath = path.join(getRuedaOutputDir(edicion), 'avisos.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Falta ${jsonPath} — ejecuta extract-edition primero`);
  }
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as {
    avisos: RuedaExtractedAd[];
    total_avisos: number;
  };
}

export { OPS_USER_ID };
