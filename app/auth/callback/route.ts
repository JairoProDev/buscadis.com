import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { claimPendingBusinessOwnership } from '@/lib/business/claim-pending-ownership';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    try {
      const supabase = await createServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Error al intercambiar código por sesión:', error);
        return NextResponse.redirect(new URL('/?error=auth_error', requestUrl.origin));
      }

      try {
        await claimPendingBusinessOwnership();
      } catch (claimError) {
        console.warn('claim_pending_business_ownership en callback:', claimError);
      }
    } catch (error) {
      console.error('Error en callback de autenticación:', error);
      return NextResponse.redirect(new URL('/?error=auth_error', requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
