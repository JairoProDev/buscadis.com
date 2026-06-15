'use client';

import React from 'react';
import { countryFlagSrcSet, countryFlagUrl } from '@/lib/geo/flags';

interface CountryFlagProps {
  code: string;
  size?: number;
  className?: string;
  title?: string;
}

export default function CountryFlag({
  code,
  size = 18,
  className,
  title,
}: CountryFlagProps) {
  const c = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return null;

  const height = Math.round(size * 0.72);

  return (
    <img
      src={countryFlagUrl(c, size)}
      srcSet={countryFlagSrcSet(c, size)}
      width={size}
      height={height}
      alt={title || ''}
      title={title}
      loading="lazy"
      decoding="async"
      className={className}
      style={{
        width: size,
        height,
        objectFit: 'cover',
        borderRadius: 3,
        boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
        flexShrink: 0,
        display: 'block',
      }}
    />
  );
}
