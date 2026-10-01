const INTRO_SESSIONS_KEY = 'buscadis.social-float.intro-sessions-shown';
const INTRO_SESSION_MARK = 'buscadis.social-float.intro-marked-session';
export const SOCIAL_FLOAT_INTRO_MAX_SESSIONS = 0;

/** Primeras N sesiones en móvil: menú de redes abierto para descubrir el cierre (X). */
export function shouldAutoOpenSocialFloatOnMobile(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const shown = parseInt(localStorage.getItem(INTRO_SESSIONS_KEY) || '0', 10);
    return shown < SOCIAL_FLOAT_INTRO_MAX_SESSIONS;
  } catch {
    return false;
  }
}

/** Una sola vez por sesión: cuenta visita para el intro automático. */
export function markSocialFloatIntroSessionIfNeeded(): void {
  if (typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem(INTRO_SESSION_MARK)) return;
    sessionStorage.setItem(INTRO_SESSION_MARK, '1');
    const shown = parseInt(localStorage.getItem(INTRO_SESSIONS_KEY) || '0', 10);
    if (shown < SOCIAL_FLOAT_INTRO_MAX_SESSIONS) {
      localStorage.setItem(INTRO_SESSIONS_KEY, String(shown + 1));
    }
  } catch {
    /* ignore */
  }
}
