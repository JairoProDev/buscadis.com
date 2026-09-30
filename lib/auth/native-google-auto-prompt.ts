const NATIVE_AUTO_PROMPT_SESSION_KEY = 'buscadis.native-google-auto-prompted';

/** Una vez por sesión de la app nativa (evita repetir el sheet de Google en cada navegación). */
export function markNativeGoogleAutoPrompted(): void {
  try {
    sessionStorage.setItem(NATIVE_AUTO_PROMPT_SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function wasNativeGoogleAutoPromptedThisSession(): boolean {
  try {
    return sessionStorage.getItem(NATIVE_AUTO_PROMPT_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}
