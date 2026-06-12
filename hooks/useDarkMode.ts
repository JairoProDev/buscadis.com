'use client';

import { useEffect, useState } from 'react';

function readDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  const root = document.documentElement;
  return root.classList.contains('dark-mode') || root.classList.contains('dark');
}

/** Sincronizado con ThemeToggle / layout (clases `dark-mode` y `dark` en html). */
export function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(readDarkMode());
    const root = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(readDarkMode()));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
