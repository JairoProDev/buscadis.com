'use client';

import { useEffect } from 'react';
import {
  isChunkLoadError,
  recoverFromChunkError,
} from '@/lib/chunk-recovery';

/**
 * One-shot recovery when a deploy leaves a stale service worker / chunk map.
 */
export default function ChunkRecoveryBootstrap() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.error ?? event.message)) {
        void recoverFromChunkError();
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) {
        event.preventDefault();
        void recoverFromChunkError();
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
