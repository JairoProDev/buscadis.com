'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import DealsFeed from '@/components/deals/DealsFeed';
import { SeccionSidebar } from '@/components/SidebarDesktop';

export default function DealsPageClient() {
  const searchParams = useSearchParams();
  const clipId = searchParams.get('clip') || undefined;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-black">
      <div className="hidden shrink-0 md:block">
        <Header seccionActiva={'adiso' as SeccionSidebar} />
      </div>

      <main className="relative min-h-0 flex-1 md:h-[calc(100dvh-72px)]">
        <DealsFeed initialClipId={clipId} />
      </main>

      <div className="block shrink-0 md:hidden">
        <NavbarMobile
          seccionActiva={null}
          tieneAdisoAbierto={false}
          onCambiarSeccion={() => {}}
        />
      </div>
    </div>
  );
}
