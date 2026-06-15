'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FavoritosPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/perfil?tab=guardados');
  }, [router]);
  return null;
}
