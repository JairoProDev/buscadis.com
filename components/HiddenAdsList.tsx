'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAdisosOcultos, restaurarAdisoOculto } from '@/lib/interactions';
import { Adiso, UbicacionDetallada } from '@/types';
import ModalAdiso from './ModalAdiso';
import { IconClose } from './Icons';
import { useToast } from '@/hooks/useToast';

interface HiddenAdsListProps {
    abierto: boolean;
    onCerrar: () => void;
}

// Helper to format location (duplicated from FavoritosList for now)
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

export default function HiddenAdsList({ abierto, onCerrar }: HiddenAdsListProps) {
    const { user } = useAuth();
    const [adisos, setAdisos] = useState<Adiso[]>([]);
    const [cargando, setCargando] = useState(false);
    const [adisoSeleccionado, setAdisoSeleccionado] = useState<Adiso | null>(null);
    const { success, error } = useToast();


    const cargarOcultos = React.useCallback(async () => {
        if (!user?.id) return;

        setCargando(true);
        try {
            const data = await getAdisosOcultos(user.id);
            setAdisos(data);
        } catch (err) {
            console.error('Error al cargar ocultos:', err);
        } finally {
            setCargando(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (abierto && user?.id) {
            cargarOcultos();
        }
    }, [abierto, user?.id, cargarOcultos]);

    const handleRestaurar = async (adisoId: string) => {
        if (!user?.id) return;

        try {
            await restaurarAdisoOculto(user.id, adisoId);
            setAdisos(adisos.filter(a => a.id !== adisoId));
            success('Adiso restaurado. Volverá a aparecer en las búsquedas.');
        } catch (err) {
            console.error('Error al restaurar:', err);
            error('Error al restaurar el adiso');
        }
    };

    if (!abierto) return null;

    return (
        <>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: '1rem'
                }}
                onClick={onCerrar}
            >
                <div
                    style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                            🚫 Adisos que no te interesan
                        </h2>
                        <button
                            onClick={onCerrar}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                padding: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            aria-label="Cerrar"
                        >
                            <IconClose size={20} />
                        </button>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        Estos adisos están ocultos de tu vista. Puedes restaurarlos si cambias de opinión.
                    </p>

                    {/* Lista */}
                    {cargando ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            Cargando...
                        </div>
                    ) : adisos.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            No has ocultado ningún adiso.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {adisos.map((adiso) => (
                                <div
                                    key={adiso.id}
                                    style={{
                                        padding: '1rem',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        backgroundColor: 'var(--bg-secondary)',
                                        opacity: 0.8
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setAdisoSeleccionado(adiso)}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.5rem 0', textDecoration: 'line-through' }}>
                                                {adiso.titulo}
                                            </h3>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                                                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', marginRight: '0.5rem', fontWeight: 'bold' }}>{adiso.categoria}</span>
                                                {formatearUbicacion(adiso.ubicacion)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRestaurar(adiso.id);
                                            }}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                color: 'var(--text-primary)',
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.75rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                fontWeight: 600
                                            }}
                                        >
                                            Restaurar ↩️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de adiso seleccionado (Solo lectura si quisieran verlo) */}
            {adisoSeleccionado && (
                <ModalAdiso
                    adiso={adisoSeleccionado}
                    onCerrar={() => setAdisoSeleccionado(null)}
                    onAnterior={() => { }}
                    onSiguiente={() => { }}
                    puedeAnterior={false}
                    puedeSiguiente={false}
                />
            )}
        </>
    );
}
