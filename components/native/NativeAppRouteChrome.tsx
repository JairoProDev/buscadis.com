'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { isBuscadisNativeApp } from '@/lib/mobile-app-bridge';

/** Minimal nav on server-rendered routes (e.g. /buscar/*) that lack the home feed shell. */
export function NativeAppRouteChrome() {
  const [native, setNative] = useState(false);

  useEffect(() => {
    setNative(isBuscadisNativeApp());
  }, []);

  if (!native) return null;

  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--bs-border-subtle)] bg-[var(--bs-bg-default)]/95 px-4 py-3 backdrop-blur"
    >
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--bs-action)]"
      >
        ← Volver al inicio
      </Link>
    </header>
  );
}
