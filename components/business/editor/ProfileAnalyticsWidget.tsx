'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ProfileAnalyticsWidgetProps {
  businessProfileId?: string;
}

export default function ProfileAnalyticsWidget({ businessProfileId }: ProfileAnalyticsWidgetProps) {
  const [stats, setStats] = useState({ views: 0, whatsapp: 0 });

  useEffect(() => {
    if (!businessProfileId) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    void (async () => {
      try {
        const { data } = await supabase!
          .from('page_analytics')
          .select('event_type')
          .eq('business_profile_id', businessProfileId)
          .gte('created_at', weekAgo.toISOString());
        const rows = data || [];
        setStats({
          views: rows.filter((r) => r.event_type === 'page_view' || r.event_type === 'profile_view').length,
          whatsapp: rows.filter((r) => r.event_type === 'whatsapp_click').length,
        });
      } catch {
        /* RLS or offline */
      }
    })();
  }, [businessProfileId]);

  if (!businessProfileId) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
      <span className="font-bold text-slate-800">Esta semana: </span>
      {stats.views} visitas · {stats.whatsapp} clics WhatsApp
    </div>
  );
}
