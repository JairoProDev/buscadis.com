'use client';

import { useRouter } from 'next/navigation';
import { Adiso } from '@/types';
import Header from '@/components/Header';
import AdisoLandingPage from '@/components/adiso/AdisoLandingPage';

interface AdisoPageContentProps {
  adiso: Adiso;
}

export default function AdisoPageContent({ adiso }: AdisoPageContentProps) {
  const router = useRouter();

  const handleVolver = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      const businessSlug = (adiso.privateData as { business_slug?: string } | undefined)?.business_slug;
      if (businessSlug) {
        router.push(`/@${businessSlug}`);
      } else {
        router.push('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <Header onChangelogClick={() => router.push('/progreso')} />
      <AdisoLandingPage adiso={adiso} onVolver={handleVolver} />
    </div>
  );
}
