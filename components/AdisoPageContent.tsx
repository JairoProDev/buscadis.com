'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Adiso, UbicacionDetallada } from '@/types';
import { getWhatsAppUrl } from '@/lib/utils';
import Header from '@/components/Header';
import SellerReputationCard from '@/components/trust/SellerReputationCard';
import SimilarAdisos from '@/components/SimilarAdisos';
import SidebarDesktop from '@/components/SidebarDesktop';
import {
    IconEmpleos,
    IconInmuebles,
    IconVehiculos,
    IconServicios,
    IconProductos,
    IconEventos,
    IconNegocios,
    IconComunidad,
    IconTodos
} from '@/components/Icons';

interface AdisoPageContentProps {
    adiso: Adiso;
}

// Función helper para formatear ubicación
function formatearUbicacion(ubicacion: string | UbicacionDetallada | undefined): string {
    if (typeof ubicacion === 'object' && ubicacion !== null && 'distrito' in ubicacion) {
        const ubi = ubicacion as UbicacionDetallada;
        let texto = `${ubi.distrito || ''}, ${ubi.provincia || ''}, ${ubi.departamento || ''}`.replace(/^,\s*|,\s*$/g, '');
        if (ubi.direccion) {
            texto += `, ${ubi.direccion}`;
        }
        return texto;
    }
    return typeof ubicacion === 'string' ? ubicacion : 'Sin ubicación';
}

const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
        case 'empleos': return IconEmpleos;
        case 'inmuebles': return IconInmuebles;
        case 'vehiculos': return IconVehiculos;
        case 'servicios': return IconServicios;
        case 'productos': return IconProductos;
        case 'eventos': return IconEventos;
        case 'negocios': return IconNegocios;
        case 'comunidad': return IconComunidad;
        default: return IconTodos;
    }
};

export default function AdisoPageContent({ adiso }: AdisoPageContentProps) {
    const router = useRouter();

    // Helper for safe date formatting
    const getFormattedDate = () => {
        try {
            if (!adiso.fechaPublicacion || !adiso.horaPublicacion) return 'Recientemente';
            // Check for "Invalid Date" string explicitly just in case
            if (adiso.fechaPublicacion === 'Invalid Date') return 'Recientemente';

            const date = new Date(`${adiso.fechaPublicacion}T${adiso.horaPublicacion}:00`);
            if (isNaN(date.getTime())) return 'Recientemente';

            return `Publicado el ${date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })}`;
        } catch (e) {
            return 'Recientemente';
        }
    };

    const categoriaLabels: Record<string, string> = {
        empleos: 'Empleos',
        inmuebles: 'Inmuebles',
        vehiculos: 'Vehículos',
        servicios: 'Servicios',
        productos: 'Productos',
        eventos: 'Eventos',
        negocios: 'Negocios',
        comunidad: 'Comunidad',
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
            {/* Sidebar Fixed Right (Minimized by default) */}
            <SidebarDesktop
                adisoAbierto={null}
                onCerrarAdiso={() => { }}
                onAnterior={() => { }}
                onSiguiente={() => { }}
                puedeAnterior={false}
                puedeSiguiente={false}
                onPublicar={() => router.push('/?action=publicar')}
                seccionActiva="adiso"
                minimizado={true}
            />

            {/* Main Content Wrapper */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
            }}>
                <Header onChangelogClick={() => router.push('/progreso')} />

                <main style={{ flex: 1, padding: '2rem 1rem', width: '100%' }}>
                    <article
                        itemScope
                        itemType="https://schema.org/Product"
                        style={{
                            maxWidth: '1200px',
                            margin: '0 auto'
                        }}
                    >
                        <meta itemProp="name" content={adiso.titulo} />
                        <meta itemProp="description" content={adiso.descripcion || ''} />

                        {/* Top Section: Grid for Visuals and Details */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                            gap: '2.5rem',
                            alignItems: 'start',
                            marginBottom: '4rem'
                        }}>

                            {/* Left Column: Visuals & Description */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {/* Hero Image Section */}
                                {adiso.imagenesUrls && adiso.imagenesUrls.length > 0 ? (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr',
                                        gap: '1rem',
                                        borderRadius: '16px',
                                        overflow: 'hidden'
                                    }}>
                                        {/* Main Hero Image */}
                                        <div style={{
                                            position: 'relative',
                                            width: '100%',
                                            aspectRatio: '4/3',
                                            borderRadius: '16px',
                                            overflow: 'hidden',
                                            boxShadow: 'var(--shadow-lg)'
                                        }}>
                                            <Image
                                                src={adiso.imagenesUrls[0]}
                                                alt={`${adiso.titulo} - Imagen Principal`}
                                                fill
                                                style={{ objectFit: 'cover' }}
                                                loading="eager"
                                                itemProp="image"
                                            />
                                        </div>

                                        {/* Grid of secondary images */}
                                        {adiso.imagenesUrls.length > 1 && (
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                                                gap: '1rem'
                                            }}>
                                                {adiso.imagenesUrls.slice(1).map((url, index) => (
                                                    <div key={index} style={{
                                                        position: 'relative',
                                                        aspectRatio: '1',
                                                        borderRadius: '12px',
                                                        overflow: 'hidden',
                                                        cursor: 'pointer',
                                                        boxShadow: 'var(--shadow-sm)'
                                                    }}>
                                                        <Image
                                                            src={url}
                                                            alt={`${adiso.titulo} - Imagen ${index + 2}`}
                                                            fill
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Placeholder */
                                    <div style={{
                                        width: '100%',
                                        aspectRatio: '16/9',
                                        backgroundColor: 'var(--bg-primary)',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px dashed var(--border-color)',
                                        gap: '1rem'
                                    }}>
                                        {(() => {
                                            const Icon = getCategoriaIcon(adiso.categoria);
                                            return <Icon size={64} color="var(--text-tertiary)" />;
                                        })()}
                                        <span style={{ color: 'var(--text-tertiary)' }}>Sin imagen disponible</span>
                                    </div>
                                )}

                                {/* Description Section */}
                                <div style={{
                                    padding: '2rem',
                                    backgroundColor: 'var(--bg-primary)',
                                    borderRadius: '16px',
                                    boxShadow: 'var(--shadow-md)',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <h2 style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 600,
                                        marginBottom: '1rem',
                                        color: 'var(--text-primary)'
                                    }}>
                                        Descripción
                                    </h2>
                                    {adiso.descripcion ? (
                                        <div style={{
                                            fontSize: '1.125rem',
                                            color: 'var(--text-secondary)',
                                            lineHeight: 1.7,
                                            whiteSpace: 'pre-wrap'
                                        }} itemProp="description">
                                            {adiso.descripcion}
                                        </div>
                                    ) : (
                                        <p style={{ color: 'var(--text-tertiary)' }}>No hay descripción detallada.</p>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Sticky Action Bar & Details */}
                            <div style={{
                                position: 'sticky',
                                top: '2rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.5rem',
                                height: 'fit-content'
                            }}>
                                <div style={{
                                    padding: '2rem',
                                    backgroundColor: 'var(--glass-bg)',
                                    backdropFilter: 'blur(20px)',
                                    borderRadius: '16px',
                                    boxShadow: 'var(--shadow-lg)',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    {/* Hero Identity Badge - Brand awareness */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        marginBottom: '1.5rem',
                                        padding: '0.6rem',
                                        borderRadius: '12px',
                                        backgroundColor: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        width: 'fit-content',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            backgroundColor: 'var(--bg-secondary)',
                                            border: '1px solid var(--border-color)'
                                        }}>
                                            {adiso.vendedor?.avatarUrl ? (
                                                <Image
                                                    src={adiso.vendedor.avatarUrl}
                                                    alt={adiso.vendedor.nombre}
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'var(--brand-blue)',
                                                    backgroundColor: 'rgba(83, 172, 197, 0.1)'
                                                }}>
                                                    {(() => {
                                                        const IconComponent = getCategoriaIcon(adiso.categoria);
                                                        return <IconComponent size={24} />;
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                textTransform: 'uppercase',
                                                fontWeight: 800,
                                                letterSpacing: '0.05em',
                                                color: 'var(--text-tertiary)',
                                                lineHeight: '1'
                                            }}>
                                                Publicado por
                                            </span>
                                            <span style={{
                                                fontSize: '1rem',
                                                fontWeight: 700,
                                                color: 'var(--text-primary)',
                                                lineHeight: '1.2'
                                            }}>
                                                {adiso.vendedor?.nombre || 'Anunciante'}
                                            </span>
                                        </div>
                                    </div>

                                    <h1 style={{
                                        fontSize: '2.5rem',
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        marginBottom: '1.5rem',
                                        lineHeight: 1.2
                                    }}>
                                        {adiso.titulo}
                                    </h1>

                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        marginBottom: '2rem',
                                        fontSize: '1rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontSize: '1.25rem' }}>📍</span>
                                            <span>{formatearUbicacion(adiso.ubicacion)}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontSize: '1.25rem' }}>📅</span>
                                            <span>{getFormattedDate()}</span>
                                        </div>
                                    </div>

                                    <a
                                        href={getWhatsAppUrl(adiso.contacto, adiso.titulo, adiso)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.75rem',
                                            width: '100%',
                                            padding: '1rem 1.5rem',
                                            backgroundColor: '#25D366',
                                            color: 'white',
                                            borderRadius: '12px',
                                            textDecoration: 'none',
                                            fontWeight: 700,
                                            fontSize: '1.125rem',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.6)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 211, 102, 0.4)';
                                        }}
                                    >
                                        Contactar por WhatsApp
                                    </a>
                                </div>

                                {/* Seller / Trust Section */}
                                {adiso.vendedor ? (
                                    <SellerReputationCard seller={adiso.vendedor} />
                                ) : (
                                    <SellerReputationCard seller={{
                                        nombre: 'Usuario de Buscadis',
                                        esVerificado: false,
                                        stats: {
                                            miembroDesde: adiso.fechaPublicacion,
                                            rating: 0,
                                            totalVentas: 0
                                        }
                                    }} />
                                )}

                                {/* Safety Tips */}
                                <div style={{
                                    padding: '1.5rem',
                                    backgroundColor: 'var(--bg-secondary)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.875rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    <strong>Consejo de seguridad:</strong> Nunca realices pagos por adelantado sin verificar el producto o servicio en persona.
                                </div>
                            </div>
                        </div>

                        {/* Similar Ads Section - Now Outside Grid Layout */}
                        <div style={{ width: '100%' }}>
                            <SimilarAdisos currentAdiso={adiso} />
                        </div>
                    </article>
                </main>
            </div>
        </div>
    );
}
