'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OcultosPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/perfil?tab=ocultos');
  }, [router]);
  return null;
}
