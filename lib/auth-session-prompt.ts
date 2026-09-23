export const AUTH_PROMPT_DISMISS_KEY = 'buscadis.auth.dismissed';

export function markAuthPromptDismissed() {
  try {
    sessionStorage.setItem(AUTH_PROMPT_DISMISS_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function isAuthPromptDismissed(): boolean {
  try {
    return Boolean(sessionStorage.getItem(AUTH_PROMPT_DISMISS_KEY));
  } catch {
    return false;
  }
}
