import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRouteRequest } from '@/lib/supabase-route-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { listPromptRows } from '@/lib/profiling/prompt-server';
import {
  profileUsefulnessScore,
  resolveNextPrompt,
} from '@/lib/profiling/prompt-queue';
import type { Profile } from '@/types';

export async function GET(request: NextRequest) {
  const user = await getUserFromRouteRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const rows = await listPromptRows(user.id);
  const next = resolveNextPrompt((profile as Profile) || null, rows);
  const usefulness = profileUsefulnessScore((profile as Profile) || null, rows);

  return NextResponse.json({
    ok: true,
    prompt: next
      ? {
          id: next.id,
          title: next.title,
          subtitle: next.subtitle,
          cta: next.cta,
        }
      : null,
    usefulness,
  });
}
