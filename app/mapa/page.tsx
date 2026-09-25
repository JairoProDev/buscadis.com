'use client';

import React from 'react';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';
import { useNavigation } from '@/contexts/NavigationContext';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const MapExperience = dynamic(() => import('@/components/map/MapExperience'), {
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[var(--bg-secondary)]">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--border-color)] border-t-[var(--brand-blue)]" />
      <p className="text-xs font-medium text-[var(--text-tertiary)]">Cargando mapa…</p>
    </div>
  ),
  ssr: false,
});

export default function MapaPage() {
  const { setSidebarExpanded } = useNavigation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setSidebarExpanded(false);
  }, [setSidebarExpanded]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 dark:bg-zinc-900">
      <Header onToggleLeftSidebar={() => setSidebarOpen(true)} seccionActiva={'mapa' as never} />

      <main className="relative h-[calc(100vh-var(--bs-header-height,56px))] w-full flex-1">
        <MapExperience variant="page" onOpen={(listing) => router.push(listing.href)} />
      </main>

      <LeftSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="block pb-safe md:hidden">
        <NavbarMobile seccionActiva={'mapa' as never} tieneAdisoAbierto={false} onCambiarSeccion={() => {}} />
      </div>
    </div>
  );
}
