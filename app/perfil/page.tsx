'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';
import { useNavigation } from '@/contexts/NavigationContext';
import ProfileHubShell from '@/components/profile/ProfileHubShell';
import { ProfileTabId } from '@/components/profile/ProfileTabs';

const VALID_TABS: ProfileTabId[] = [
  'inicio',
  'guardados',
  'historial',
  'mensajes',
  'ocultos',
  'publicar',
  'negocios',
  'ajustes',
];

function PerfilContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as ProfileTabId | null;
  const initialTab =
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'inicio';
  const highlight = searchParams.get('highlight');

  return <ProfileHubShell initialTab={initialTab} highlightId={highlight} />;
}

export default function PerfilPage() {
  const { setSidebarExpanded } = useNavigation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    setSidebarExpanded(false);
  }, [setSidebarExpanded]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-secondary)] pb-16 md:pb-0">
      <Header
        onToggleLeftSidebar={() => setSidebarOpen(true)}
        seccionActiva={'perfil' as never}
      />

      <main className="container mx-auto flex-1 px-4 py-6 max-w-3xl">
        <Suspense fallback={<div className="skeleton-shimmer h-64 rounded-2xl" />}>
          <PerfilContent />
        </Suspense>
      </main>

      <LeftSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="block md:hidden">
        <NavbarMobile
          seccionActiva={'perfil' as never}
          tieneAdisoAbierto={false}
          onCambiarSeccion={() => {}}
        />
      </div>
    </div>
  );
}
