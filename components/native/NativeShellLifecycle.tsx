'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isBuscadisNativeApp, notifyNativeShellReady } from '@/lib/mobile-app-bridge';

/** Tells the Expo shell when a route has finished loading (clears load errors / watchdog). */
export default function NativeShellLifecycle() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isBuscadisNativeApp()) return;

    const signal = () => notifyNativeShellReady(pathname || '/');

    if (document.readyState === 'complete') {
      signal();
    } else {
      window.addEventListener('load', signal, { once: true });
      return () => window.removeEventListener('load', signal);
    }
  }, [pathname]);

  return null;
}
