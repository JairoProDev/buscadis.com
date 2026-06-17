'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { FaQuestionCircle, FaSearch, FaBook, FaEnvelope, FaWhatsapp } from 'react-icons/fa';
import NavbarMobile from '@/components/NavbarMobile';

import LeftSidebar from '@/components/LeftSidebar';
import { useRouter } from 'next/navigation';

export default function HelpCenterPage() {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 flex flex-col pb-16 md:pb-0">
            <Header onToggleLeftSidebar={() => setSidebarOpen(true)} />

            <main className="flex-1 max-w-4xl mx-auto w-full p-6">
                <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl mb-4">
                        <FaQuestionCircle size={32} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">Centro de Ayuda</h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
                        Todo lo que necesitas saber para aprovechar Buscadis al máximo. Encuentra respuestas a tus preguntas y contacta con nuestro equipo.
                    </p>

                    <div className="relative max-w-lg mx-auto mb-12">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar ayuda..."
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <HelpCard
                        icon={<FaBook />}
                        title="Primeros Pasos"
                        description="Aprende a crear tu cuenta, configurar tu perfil y publicar tu primer anuncio."
                    />
                    <HelpCard
                        icon={<FaBook />}
                        title="Ventas y Pagos"
                        description="Gestión de transacciones, seguridad en pagos y cómo destacar tus anuncios."
                    />
                </div>

                <div className="mb-12 rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Privacidad y eliminacion de cuenta</h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Si quieres solicitar eliminar tu cuenta o algunos datos personales, consulta nuestra{' '}
                        <Link href="/privacidad" className="font-semibold text-blue-700 underline">
                            política de privacidad
                        </Link>{' '}
                        o usa el formulario oficial:
                    </p>
                    <Link
                        href="/account-deletion"
                        className="mt-3 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black"
                    >
                        Ir a solicitud de eliminacion
                    </Link>
                </div>

                <div className="bg-blue-600 rounded-3xl p-8 text-white text-center shadow-xl shadow-blue-500/20">
                    <h2 className="text-2xl font-bold mb-4">¿No encuentras lo que buscas?</h2>
                    <p className="mb-8 opacity-90">Nuestro equipo está listo para ayudarte personalmente.</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <ContactButton
                            icon={<FaWhatsapp />}
                            label="WhatsApp"
                            href="https://wa.me/something"
                        />
                        <ContactButton
                            icon={<FaEnvelope />}
                            label="Email"
                            href="mailto:soporte@buscadis.com"
                        />
                    </div>
                </div>
            </main>

            <LeftSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="block md:hidden">
                <NavbarMobile
                    seccionActiva={'ayuda' as any}
                    tieneAdisoAbierto={false}
                    onCambiarSeccion={(seccion: any) => {
                        router.push('/?seccion=' + seccion);
                    }}
                />
            </div>
        </div>
    );
}

function HelpCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl border border-gray-100 dark:border-zinc-700 hover:shadow-lg transition-all cursor-pointer group">
            <div className="w-10 h-10 bg-gray-50 dark:bg-zinc-700/50 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
        </div>
    );
}

function ContactButton({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white text-blue-600 px-6 py-2 rounded-xl font-bold hover:bg-gray-50 transition-colors">
            {icon}
            {label}
        </a>
    );
}
