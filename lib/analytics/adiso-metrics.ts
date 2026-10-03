import { supabaseAdmin } from '@/lib/supabase-admin';

export type AdisoMetricRow = {
  adisoId: string;
  titulo: string;
  categoria: string | null;
  estaActivo: boolean;
  legacyVistas: number;
  legacyContactos: number;
  impressions: number;
  clicks: number;
  favorites: number;
  contacts: number;
  shares: number;
  viewStarts: number;
  viewEnds: number;
  dismisses: number;
  ctr: number;
  contactRate: number;
};

export type AdisoMetricsSummary = {
  days: number;
  totals: {
    impressions: number;
    clicks: number;
    contacts: number;
    favorites: number;
  };
  adisos: AdisoMetricRow[];
  updatedAt: string;
};

const CONTACT_EVENTS = new Set([
  'ad.contact_whatsapp',
  'ad.contact_chat',
  'ad.contact_copy',
]);

type RawEvent = { entity_id: string | null; event_type: string };

function aggregateEvents(events: RawEvent[]): Map<string, Omit<AdisoMetricRow, 'adisoId' | 'titulo' | 'categoria' | 'estaActivo' | 'legacyVistas' | 'legacyContactos' | 'ctr' | 'contactRate'>> {
  const map = new Map<string, {
    impressions: number;
    clicks: number;
    favorites: number;
    contacts: number;
    shares: number;
    viewStarts: number;
    viewEnds: number;
    dismisses: number;
  }>();

  for (const ev of events) {
    const id = ev.entity_id;
    if (!id) continue;
    let row = map.get(id);
    if (!row) {
      row = {
        impressions: 0,
        clicks: 0,
        favorites: 0,
        contacts: 0,
        shares: 0,
        viewStarts: 0,
        viewEnds: 0,
        dismisses: 0,
      };
      map.set(id, row);
    }
    switch (ev.event_type) {
      case 'ad.impression':
        row.impressions += 1;
        break;
      case 'ad.click':
        row.clicks += 1;
        break;
      case 'ad.favorite':
        row.favorites += 1;
        break;
      case 'ad.share':
        row.shares += 1;
        break;
      case 'ad.view_start':
        row.viewStarts += 1;
        break;
      case 'ad.view_end':
        row.viewEnds += 1;
        break;
      case 'ad.dismiss':
      case 'ad.dismiss_reason':
        row.dismisses += 1;
        break;
      default:
        if (CONTACT_EVENTS.has(ev.event_type)) row.contacts += 1;
    }
  }
  return map;
}

export async function getAdisoMetricsForUser(userId: string, days: 7 | 30 = 30): Promise<AdisoMetricsSummary> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: adisoRows, error: adisoErr } = await supabaseAdmin
    .from('adisos')
    .select('id, titulo, categoria, esta_activo, vistas, contactos')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('fecha_publicacion', { ascending: false })
    .limit(200);

  if (adisoErr) {
    throw new Error(adisoErr.message);
  }

  const adisos = adisoRows || [];
  const ids = adisos.map((a) => a.id as string);

  let events: RawEvent[] = [];
  if (ids.length > 0) {
    const { data: eventRows, error: evErr } = await supabaseAdmin
      .from('behavioral_events')
      .select('entity_id, event_type')
      .eq('entity_type', 'adiso')
      .in('entity_id', ids)
      .gte('created_at', since.toISOString())
      .in('event_type', [
        'ad.impression',
        'ad.click',
        'ad.favorite',
        'ad.share',
        'ad.view_start',
        'ad.view_end',
        'ad.dismiss',
        'ad.dismiss_reason',
        'ad.contact_whatsapp',
        'ad.contact_chat',
        'ad.contact_copy',
      ]);

    if (evErr) {
      throw new Error(evErr.message);
    }
    events = (eventRows || []) as RawEvent[];
  }

  const byAdiso = aggregateEvents(events);

  const rows: AdisoMetricRow[] = adisos.map((a) => {
    const m = byAdiso.get(a.id as string) || {
      impressions: 0,
      clicks: 0,
      favorites: 0,
      contacts: 0,
      shares: 0,
      viewStarts: 0,
      viewEnds: 0,
      dismisses: 0,
    };
    const impressions = m.impressions;
    const clicks = m.clicks;
    const contacts = m.contacts;
    return {
      adisoId: a.id as string,
      titulo: (a.titulo as string) || 'Sin título',
      categoria: (a.categoria as string) || null,
      estaActivo: Boolean(a.esta_activo),
      legacyVistas: Number(a.vistas) || 0,
      legacyContactos: Number(a.contactos) || 0,
      ...m,
      ctr: impressions > 0 ? clicks / impressions : 0,
      contactRate: clicks > 0 ? contacts / clicks : 0,
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      impressions: acc.impressions + r.impressions,
      clicks: acc.clicks + r.clicks,
      contacts: acc.contacts + r.contacts,
      favorites: acc.favorites + r.favorites,
    }),
    { impressions: 0, clicks: 0, contacts: 0, favorites: 0 }
  );

  return {
    days,
    totals,
    adisos: rows,
    updatedAt: new Date().toISOString(),
  };
}
