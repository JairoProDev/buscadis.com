'use client';

import { useEffect } from 'react';
import { bootstrapNativeWebView } from '@/lib/native-webview-bootstrap';

/** Runs once on mount — disables PWA caches inside the native shell. */
export default function NativeWebViewBootstrap() {
  useEffect(() => {
    void bootstrapNativeWebView();
  }, []);
  return null;
}
