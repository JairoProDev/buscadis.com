import { supabaseAdmin } from '@/lib/supabase-admin';

async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  if (!tokens.length) return false;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (process.env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }

  const messages = tokens.map((to) => ({
    to,
    title: title.slice(0, 200),
    body: body.slice(0, 2000),
    data,
    sound: 'default' as const,
    channelId: 'opportunities',
  }));

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(messages),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  const { data: rows } = await supabaseAdmin
    .from('expo_push_tokens')
    .select('expo_push_token')
    .eq('user_id', userId)
    .limit(5);

  const tokens = (rows || []).map((r) => r.expo_push_token as string).filter(Boolean);
  return sendExpoPush(tokens, title, body, data);
}

export async function sendOpportunityEmail(
  userId: string,
  title: string,
  body: string,
  adisoId: string
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return false;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .maybeSingle();

  const { data: prefs } = await supabaseAdmin
    .from('user_preferences')
    .select('notificaciones_email')
    .eq('user_id', userId)
    .maybeSingle();

  if (prefs?.notificaciones_email === false) return false;

  const email = profile?.email;
  if (!email) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!authUser?.user?.email) return false;
    return sendEmailTo(authUser.user.email, title, body, adisoId, apiKey);
  }

  return sendEmailTo(email, title, body, adisoId, apiKey);
}

async function sendEmailTo(
  to: string,
  title: string,
  body: string,
  adisoId: string,
  apiKey: string
): Promise<boolean> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://buscadis.com').replace(/\/$/, '');
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'oportunidades@buscadis.com',
        to: [to],
        subject: title,
        text: `${body}\n\nVer oportunidad: ${appUrl}/?adiso=${adisoId}`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deliverOpportunityToUser(params: {
  userId: string;
  campaignId: string;
  title: string;
  body: string;
  adisoId: string;
  matchScore: number;
}): Promise<{ inApp: boolean; push: boolean; email: boolean }> {
  const data = {
    adiso_id: params.adisoId,
    match_score: params.matchScore,
    campaign_id: params.campaignId,
  };

  const { error: notifErr } = await supabaseAdmin.from('notifications').insert({
    user_id: params.userId,
    type: 'system',
    title: params.title,
    message: `${params.body} Ver anuncio: /?adiso=${params.adisoId}`,
    data,
  });

  const pushOk = await sendPushToUser(params.userId, params.title, params.body, data);
  const emailOk = await sendOpportunityEmail(params.userId, params.title, params.body, params.adisoId);

  await supabaseAdmin.from('campaign_deliveries').insert([
    {
      campaign_id: params.campaignId,
      user_id: params.userId,
      channel: 'in_app',
      match_score: params.matchScore,
      status: notifErr ? 'failed' : 'sent',
      sent_at: notifErr ? null : new Date().toISOString(),
    },
    {
      campaign_id: params.campaignId,
      user_id: params.userId,
      channel: 'push',
      match_score: params.matchScore,
      status: pushOk ? 'sent' : 'failed',
      sent_at: pushOk ? new Date().toISOString() : null,
    },
    {
      campaign_id: params.campaignId,
      user_id: params.userId,
      channel: 'email',
      match_score: params.matchScore,
      status: emailOk ? 'sent' : 'failed',
      sent_at: emailOk ? new Date().toISOString() : null,
    },
  ]);

  return { inApp: !notifErr, push: pushOk, email: emailOk };
}
