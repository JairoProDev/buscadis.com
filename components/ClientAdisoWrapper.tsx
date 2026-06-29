'use client';

import React, { useEffect, useState } from 'react';
import { Adiso } from '@/types';
import { getAdisoById } from '@/lib/storage';
import AdisoPageContent from '@/components/AdisoPageContent';
import { useRouter } from 'next/navigation';

async function fetchCatalogProductAsAdiso(id: string): Promise<Adiso | null> {
    try {
        const res = await fetch(`/api/catalog/products/${id}`);
        if (!res.ok) return null;
        const data = await res.json();
        return (data?.adiso as Adiso) ?? null;
    } catch {
        return null;
    }
}

interface ClientAdisoWrapperProps {
    id: string;
    initialAdiso: Adiso | null;
}

export default function ClientAdisoWrapper({ id, initialAdiso }: ClientAdisoWrapperProps) {
    const [adiso, setAdiso] = useState<Adiso | null>(initialAdiso);
    const [loading, setLoading] = useState(!initialAdiso);
    const router = useRouter();

    useEffect(() => {
        // If we already have the adiso from server, do nothing
        if (initialAdiso) {
            setAdiso(initialAdiso);
            setLoading(false);
            return;
        }

        // Try to fetch from client storage (local + api fallback)
        const fetchLocal = async () => {
            try {
                const found = await getAdisoById(id);
                if (found) {
                    setAdiso(found);
                    return;
                }

                const catalogAdiso = await fetchCatalogProductAsAdiso(id);
                if (catalogAdiso) {
                    setAdiso(catalogAdiso);
                    return;
                }

                setAdiso(null);
            } catch (e) {
                console.error("Error fetching adiso on client:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchLocal();
    }, [id, initialAdiso]);

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)'
            }}>
                Cargando adiso...
            </div>
        );
    }

    if (!adiso) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                gap: '1rem'
            }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Adiso no encontrado</h1>
                <p>El adiso que buscas no existe o ha sido eliminado.</p>
                <button
                    onClick={() => router.push('/')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'var(--text-primary)',
                        color: 'white',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    Volver al inicio
                </button>
            </div>
        );
    }

    return <AdisoPageContent adiso={adiso} />;
}
