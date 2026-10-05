import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { isPlatformAdminUser } from '@/lib/platform-admin';

export type OpsUser = { id: string; email?: string | null };

/** Acceso a módulo comercial / ops (admin de plataforma). */
export async function requireOpsUser(request: NextRequest): Promise<OpsUser | null> {
  const user = await getUserFromRouteRequest(request);
  if (!user?.id) return null;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('rol, is_platform_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!isPlatformAdminUser(user.email, profile)) {
    return null;
  }

  return { id: user.id, email: user.email };
}
