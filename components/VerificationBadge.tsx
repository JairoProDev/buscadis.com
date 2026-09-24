'use client';

import React from 'react';
import { bsMix, semantic } from '@/lib/bs-tokens';

interface VerificationBadgeProps {
  esVerificado: boolean;
  tipo?: 'identidad' | 'telefono' | 'email' | 'negocio';
  size?: 'small' | 'medium' | 'large';
}

export default function VerificationBadge({ esVerificado, tipo, size = 'small' }: VerificationBadgeProps) {
  if (!esVerificado) return null;

  const sizeStyles = {
    small: {
      fontSize: '0.7rem',
      padding: '0.25rem 0.5rem',
      gap: '0.25rem'
    },
    medium: {
      fontSize: '0.75rem',
      padding: '0.35rem 0.65rem',
      gap: '0.35rem'
    },
    large: {
      fontSize: '0.875rem',
      padding: '0.5rem 0.75rem',
      gap: '0.5rem'
    }
  };

  const estilo = sizeStyles[size];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: estilo.gap,
        backgroundColor: bsMix('--bs-success-fg', 15),
        color: semantic.successFg,
        border: `1px solid ${bsMix('--bs-success-fg', 30)}`,
        borderRadius: '6px',
        padding: estilo.padding,
        fontSize: estilo.fontSize,
        fontWeight: 600,
        lineHeight: 1
      }}
      title={tipo ? `Verificado: ${tipo}` : 'Cuenta verificada'}
    >
      <span>✓</span>
      <span>{tipo ? tipo.charAt(0).toUpperCase() + tipo.slice(1) : 'Verificado'}</span>
    </div>
  );
}













