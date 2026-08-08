'use client';

import React from 'react';
import Header from '@/components/Header';
import ChatbotIANew from '@/components/ChatbotIANew';
import LeftSidebar from '@/components/LeftSidebar';
import NavbarMobile from '@/components/NavbarMobile';
import { useRouter } from 'next/navigation';
import { useNavigation } from '@/contexts/NavigationContext';

export default function ChatPage() {
    const router = useRouter();
    const { setSidebarExpanded } = useNavigation();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    React.useEffect(() => {
        setSidebarExpanded(false);
    }, [setSidebarExpanded]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-[calc(var(--bs-nav-height,56px)+env(safe-area-inset-bottom,0px))] md:pb-0">
            <Header
                onToggleLeftSidebar={() => setSidebarOpen(true)}
                seccionActiva={'chatbot' as any}
            />
            <main className="flex-1 flex flex-col relative h-[calc(100vh-var(--bs-header-height,56px)-var(--bs-nav-height,56px))] md:h-[calc(100vh-var(--bs-header-height,64px))]">
                <div className="flex-1 overflow-hidden h-full">
                    <ChatbotIANew
                        onMinimize={() => { }}
                        onPublicar={(adiso) => {
                            console.log('Publicar desde chat:', adiso);
                            router.push('/?action=publicar');
                        }}
                    />
                </div>
            </main>
            <LeftSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'chatbot' as any}
                    tieneAdisoAbierto={false}
                    onCambiarSeccion={(seccion: any) => {
                        // Handle sections that require redirection to home
                        // If navigating to home ('adiso'), NavbarMobile handles it via href
                        // If navigating to 'mapa' or 'publicar', redirect
                        if (seccion === 'adiso') {
                            window.location.href = '/';
                        } else {
                            window.location.href = `/?seccion=${seccion}`;
                        }
                    }}
                />
            </div>
        </div>
    );
}
