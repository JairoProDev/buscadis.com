import React from 'react';
import Image from 'next/image';
import { IconStar, IconClock, IconMedal } from '../Icons';
import { semantic } from '@/lib/bs-tokens';
import TrustBadge from './TrustBadge';

interface SellerReputationCardProps {
    seller: {
        nombre: string;
        avatarUrl?: string;
        esVerificado: boolean;
        nivelVerificacion?: 'basico' | 'identidad' | 'negocio';
        badges?: Array<'vendedor_destacado' | 'respuesta_rapida' | 'antiguo'>;
        stats?: {
            tiempoRespuesta?: string;
            miembroDesde?: string;
            totalVentas?: number;
            rating?: number;
        };
    };
}

export default function SellerReputationCard({ seller }: SellerReputationCardProps) {
    // Configuración de badges adicionales
    const badgeConfig = {
        'vendedor_destacado': { label: 'Top Seller', icon: IconMedal, color: semantic.warningFg },
        'respuesta_rapida': { label: 'Responde Rápido', icon: IconClock, color: semantic.infoFg },
        'antiguo': { label: 'Veterano', icon: IconMedal, color: semantic.muted },
    };

    return (
        <div style={{
            padding: '1.5rem',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Avatar */}
                <div style={{
                    position: 'relative',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '2px solid var(--bg-primary)',
                    boxShadow: '0 0 0 2px var(--border-color)'
                }}>
                    {seller.avatarUrl ? (
                        <Image
                            src={seller.avatarUrl}
                            alt={seller.nombre}
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
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            color: 'var(--text-tertiary)',
                            backgroundColor: 'var(--bg-secondary)'
                        }}>
                            {seller.nombre.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)'
                    }}>
                        {seller.nombre}
                    </h3>

                    {/* Badge Principal de Verificación */}
                    {seller.esVerificado && (
                        <TrustBadge
                            type={seller.nivelVerificacion === 'negocio' ? 'business' : seller.nivelVerificacion === 'identidad' ? 'identity' : 'verified'}
                            size="sm"
                        />
                    )}
                </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', width: '100%' }} />

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
            }}>
                {seller.stats?.rating && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Calificación</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            <IconStar size={14} color={semantic.warningFg} />
                            <span>{seller.stats.rating.toFixed(1)}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                                ({seller.stats.totalVentas || 0})
                            </span>
                        </div>
                    </div>
                )}

                {seller.stats?.tiempoRespuesta && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Responde en</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            <IconClock size={14} color="var(--text-tertiary)" />
                            <span>{seller.stats.tiempoRespuesta}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Badges Adicionales */}
            {seller.badges && seller.badges.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {seller.badges.map(badge => {
                        const config = badgeConfig[badge];
                        if (!config) return null;
                        const BadgeIcon = config.icon;
                        return (
                            <div key={badge} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.75rem',
                                padding: '2px 8px',
                                backgroundColor: 'var(--bg-secondary)',
                                borderRadius: '4px',
                                color: 'var(--text-secondary)'
                            }}>
                                <BadgeIcon size={12} color={config.color} />
                                <span>{config.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {seller.stats?.miembroDesde && (
                <div style={{
                    marginTop: 'auto',
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)',
                    textAlign: 'center'
                }}>
                    Miembro desde {new Date(seller.stats.miembroDesde).getFullYear()}
                </div>
            )}
        </div>
    );
}
