'use client';

import React from 'react';
import Header from '@/components/Header';
import NavbarMobile from '@/components/NavbarMobile';
import LeftSidebar from '@/components/LeftSidebar';
import { useNavigation } from '@/contexts/NavigationContext';
import AdisosGratuitos from '@/components/AdisosGratuitos';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function GratuitosPage() {
    const { setSidebarExpanded } = useNavigation();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const isDesktop = useMediaQuery('(min-width: 768px)');

    React.useEffect(() => {
        setSidebarExpanded(false);
    }, [setSidebarExpanded]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-[calc(var(--bs-nav-height,56px)+env(safe-area-inset-bottom,0px))] md:pb-0">
            <Header
                onToggleLeftSidebar={() => setSidebarOpen(true)}
                seccionActiva={'gratuitos' as any}
            />
            <main className="flex-1 container mx-auto px-4 py-6">
                <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-6">
                    <h1 className="text-2xl font-bold mb-6 dark:text-white">Anuncios Gratuitos</h1>

                    {!isDesktop ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 text-amber-900 dark:text-amber-100">
                            <p className="font-medium mb-2">Disponible en escritorio</p>
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                Los anuncios gratuitos de prueba están pensados para verse y publicarse desde una
                                pantalla ancha (tablet o PC). Abre Buscadis desde un navegador en escritorio o amplía la
                                ventana para usar esta sección.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Aprovecha estas ofertas de productos y servicios gratuitos cerca de ti.
                            </p>
                            <AdisosGratuitos todosLosAdisos={[]} />
                        </>
                    )}
                </div>
            </main>
            <LeftSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'gratuitos' as any}
                    tieneAdisoAbierto={false}
                    onCambiarSeccion={() => { }}
                />
            </div>
        </div>
    );
}
