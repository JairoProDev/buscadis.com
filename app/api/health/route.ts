import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      storage: 'unknown',
    },
  };

  // Verificar conexión a Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase!
        .from('adisos')
        .select('id')
        .limit(1);

      health.services.database = error ? 'error' : 'ok';
    } catch (error) {
      health.services.database = 'error';
    }

    // Verificar Storage
    try {
      const { data, error } = await supabase!.storage
        .from('adisos-images')
        .list('', { limit: 1 });

      health.services.storage = error ? 'error' : 'ok';
    } catch (error) {
      health.services.storage = 'error';
    }
  } else {
    health.services.database = 'not_configured';
    health.services.storage = 'not_configured';
  }

  const allServicesOk =
    health.services.database === 'ok' &&
    health.services.storage === 'ok';

  return NextResponse.json(health, {
    status: allServicesOk ? 200 : 503,
  });
}















