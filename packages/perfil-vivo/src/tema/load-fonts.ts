'use client';

import { useEffect, type RefObject } from 'react';

const FONT_CSS =
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;700&display=swap';
const GEIST_CSS =
  'https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/style.css';
const GEIST_MONO_CSS =
  'https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-mono/style.css';

function injectStylesheet(href: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`link[data-pv-font="${href}"]`)) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.pvFont = href;
    link.onload = () => resolve();
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

/** Carga Bricolage + Geist async (swap) y marca .pv-fonts-loaded. */
export function usePerfilFonts(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.all([
        injectStylesheet(FONT_CSS),
        injectStylesheet(GEIST_CSS),
        injectStylesheet(GEIST_MONO_CSS),
      ]);
      if (cancelled) return;
      try {
        await Promise.all([
          document.fonts.load("600 28px 'Bricolage Grotesque'"),
          document.fonts.load("400 15px 'Geist Sans'"),
        ]);
      } catch {
        /* ignore */
      }
      rootRef.current?.classList.add('pv-fonts-loaded');
    })();
    return () => {
      cancelled = true;
    };
  }, [rootRef]);
}
