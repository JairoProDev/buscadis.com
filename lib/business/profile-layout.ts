/** Ancho máximo del perfil en desktop (~estilo red social, no full-width). */
export const PROFILE_PAGE_MAX_CLASS = 'max-w-[960px]';

export const profilePageContainerClass = (extra?: string) =>
  [PROFILE_PAGE_MAX_CLASS, 'mx-auto', 'px-4', extra].filter(Boolean).join(' ');
