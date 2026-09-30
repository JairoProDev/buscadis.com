'use client';

import { useEffect } from 'react';
import { bootstrapNativeWebView, isNativeWebViewClient } from '@/lib/native-webview-bootstrap';

/** Runs once on mount — disables PWA caches inside the native shell. */
export default function NativeWebViewBootstrap() {
  useEffect(() => {
    void bootstrapNativeWebView();
    if (isNativeWebViewClient()) {
      void import('@/components/AuthModal');
      void import('@/components/auth/GoogleGisButton');
    }
  }, []);
  return null;
}
