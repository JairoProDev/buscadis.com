'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { FaBook, FaBullhorn, FaSearch, FaCommentDots, FaUserShield } from 'react-icons/fa';
import NavbarMobile from '@/components/NavbarMobile';

import LeftSidebar from '@/components/LeftSidebar';
import { useRouter } from 'next/navigation';

export default function GuidePage() {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 md:pb-0">
            <Header onToggleLeftSidebar={() => setSidebarOpen(true)} />

            <main className="flex-1 max-w-4xl mx-auto w-full p-6 py-12">
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                        <FaBook size={12} /> Guía Oficial
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">Cómo utilizar Buscadis</h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                        Bienvenido a la plataforma más moderna de anuncios clasificados. Aquí tienes una guía rápida para que empieces a vender y comprar con éxito.
                    </p>
                </div>

                <div className="space-y-8">
                    <GuideStep
                        number="01"
                        icon={<FaBullhorn />}
                        title="Cómo Publicar"
                        content="Simplemente presiona el botón 'Publicar' en el menú. Puedes usar nuestro Asistente IA para que redacte el anuncio por ti o hacerlo manualmente. No olvides subir fotos de buena calidad."
                    />
                    <GuideStep
                        number="02"
                        icon={<FaSearch />}
                        title="Cómo Encontrar"
                        content="Usa la barra de búsqueda o el mapa interactivo para encontrar lo que necesitas cerca de ti. Filtra por categorías o usa filtros de ubicación avanzados."
                    />
                    <GuideStep
                        number="03"
                        icon={<FaCommentDots />}
                        title="Comunicación Segura"
                        content="Contacta a los anunciantes directamente por WhatsApp o mediante nuestro chat interno. Te recomendamos siempre realizar transacciones en lugares públicos y seguros."
                    />
                    <GuideStep
                        number="04"
                        icon={<FaUserShield />}
                        title="Seguridad y Verificación"
                        content="Adisos verificados tienen un check azul. Trabajamos constantemente para mantener la comunidad libre de spam y fraudes. Reporta cualquier actividad sospechosa."
                    />
                </div>

                <div className="mt-16 p-8 bg-zinc-900 dark:bg-black rounded-3xl text-white">
                    <h2 className="text-2xl font-bold mb-4">¿Listo para empezar?</h2>
                    <p className="text-gray-400 mb-8">Únete a miles de personas que ya están conectando en Perú.</p>
                    <Link href="/publicar" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all transform hover:scale-105">
                        Publicar mi primer adiso
                    </Link>
                </div>
            </main>

            <LeftSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'guia' as any}
                    tieneAdisoAbierto={false}
                    onCambiarSeccion={(seccion: any) => {
                        router.push('/?seccion=' + seccion);
                    }}
                />
            </div>
        </div>
    );
}

function GuideStep({ number, icon, title, content }: { number: string, icon: React.ReactNode, title: string, content: string }) {
    return (
        <div className="flex gap-6 items-start">
            <div className="flex-shrink-0 w-12 h-12 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm font-black text-xs relative">
                <span className="absolute -top-2 -left-2 text-[10px] text-gray-400">{number}</span>
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{content}</p>
            </div>
        </div>
    );
}
