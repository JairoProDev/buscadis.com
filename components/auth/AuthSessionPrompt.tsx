'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { isAuthPromptDismissed } from '@/lib/auth-session-prompt';
import { promptGoogleSignIn } from '@/lib/auth/google-sign-in-prompt';

function shouldSkipPath(pathname: string): boolean {
  if (pathname.startsWith('/publicar')) return true;
  if (pathname.includes('/checkout')) return true;
  if (pathname.startsWith('/auth')) return true;
  return false;
}

/** Un reintento del prompt de Google en móvil si el primero no se mostró. */
export default function AuthSessionPrompt() {
  const { user, loading, refreshProfile } = useAuth();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const pathname = usePathname();
  const retriedRef = useRef(false);

  useEffect(() => {
    if (!isMobile || loading || user) return;

    const onUnavailable = () => {
      if (retriedRef.current || shouldSkipPath(pathname) || isAuthPromptDismissed()) return;
      retriedRef.current = true;
      window.setTimeout(() => {
        void promptGoogleSignIn(async () => {
          await refreshProfile();
        });
      }, 1000);
    };

    window.addEventListener('buscadis:google-one-tap-unavailable', onUnavailable);
    return () =>
      window.removeEventListener('buscadis:google-one-tap-unavailable', onUnavailable);
  }, [isMobile, loading, user, pathname, refreshProfile]);

  return null;
}
