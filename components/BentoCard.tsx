'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Adiso, PAQUETES } from '@/types';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BentoCardProps {
  adiso: Adiso;
  isSelected?: boolean;
  onClick: () => void;
  icon: ReactNode;
  className?: string;
  onEdit?: (e: React.MouseEvent) => void;
}

/**
 * BentoCard - Premium Ad Card Component
 * Features:
 * - Physics-based hover animations (lift + shadow expansion)
 * - Glassmorphism accent on hover
 * - Tactile feedback on click (scale down)
 * - Subtle zoom-in on images
 * - Tabular numbers for prices
 * - Micro-bordered badges
 */
export default function BentoCard({ adiso, isSelected, onClick, icon, className, onEdit }: BentoCardProps) {
  const tamaño = adiso.tamaño || 'miniatura';
  const paquete = PAQUETES[tamaño];
  const imagenUrl = adiso.imagenesUrls?.[0] || adiso.imagenUrl;
  const hasImage = !!imagenUrl;

  // Responsive sizing based on tamaño
  const sizeClasses = {
    miniatura: 'p-3',
    pequeño: 'p-3.5',
    mediano: 'p-4',
    grande: 'p-5',
    gigante: 'p-6',
  };

  const titleSizes = {
    miniatura: 'text-sm md:text-sm',
    pequeño: 'text-base md:text-base',
    mediano: 'text-lg md:text-xl',
    grande: 'text-xl md:text-2xl',
    gigante: 'text-2xl md:text-3xl',
  };

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'bento-card group relative w-full h-full text-left',
        'flex flex-col gap-3',
        'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden',
        'shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500',
        sizeClasses[tamaño],
        isSelected && 'ring-2 ring-[var(--brand-color)] shadow-xl',
        className
      )}
      style={{
        gridColumn: `span ${paquete.columnas}`,
        gridRow: `span ${paquete.filas}`,
      }}
      whileHover={{
        y: -6,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      }}
      whileTap={{
        scale: 0.97,
        transition: { duration: 0.1 }
      }}
      aria-label={`Ver detalles del adiso: ${adiso.titulo}`}
    >
      {/* Edit Button */}
      {onEdit && (
        <div
          onClick={onEdit}
          className="absolute top-2 right-2 z-20 bg-white/80 hover:bg-white backdrop-blur-sm p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
        </div>
      )}

      {/* Glow highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Image Section */}
      {hasImage ? (
        <motion.div
          className="relative w-full rounded-xl overflow-hidden bg-slate-100"
          style={{
            aspectRatio: tamaño === 'miniatura' ? '4/3' : '1',
            maxHeight: tamaño === 'miniatura' ? '140px' : 'auto'
          }}
        >
          <motion.div
            className="w-full h-full relative"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
          >
            <Image
              src={imagenUrl!}
              alt={adiso.titulo}
              fill
              unoptimized={imagenUrl!.startsWith('data:')}
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover"
              loading="lazy"
            />
          </motion.div>

          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      ) : (
        <div className="w-full aspect-square bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
          {icon}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 flex flex-col gap-1">
        <h3
          className={cn(
            titleSizes[tamaño],
            'font-bold text-slate-800 dark:text-zinc-100 line-clamp-2 leading-tight'
          )}
        >
          {adiso.titulo}
        </h3>

        {tamaño !== 'miniatura' && adiso.descripcion && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {adiso.descripcion.replace('Precio:', '')}
          </p>
        )}
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-2 h-2 rounded-full bg-adis-600"
        />
      )}
    </motion.button>
  );
}
