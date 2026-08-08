/**
 * Skeleton Loading Components
 *
 * These are shown while the AI is processing (searching, analyzing images, etc.)
 * to provide instant visual feedback.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function SearchingSkeleton() {
  return (
    <div style={{ padding: '16px' }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
        }}
      >
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            width: '24px',
            height: '24px',
            border: '3px solid var(--accent-color)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '4px',
          }}>
            Buscando en el marketplace...
          </div>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}>
            Analizando miles de avisos para ti
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function AnalyzingImageSkeleton() {
  const steps = [
    { label: 'Identificando objeto', delay: 0 },
    { label: 'Analizando condición', delay: 0.5 },
    { label: 'Verificando precios de mercado', delay: 1 },
    { label: 'Generando descripción', delay: 1.5 },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '20px',
      }}>
        <div style={{
          fontSize: '15px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>📸</span>
          <span>Analizando tu imagen...</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.delay }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: step.delay,
                }}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--accent-color)',
                }}
              />
              <span style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}>
                {step.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ThinkingSkeleton({ message = 'Pensando...' }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        background: 'var(--bg-secondary)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
      }}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
        }}
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'var(--accent-color)',
        }}
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: 0.2,
        }}
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'var(--accent-color)',
        }}
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: 0.4,
        }}
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'var(--accent-color)',
        }}
      />
      <span style={{
        fontSize: '13px',
        color: 'var(--text-secondary)',
        marginLeft: '4px',
      }}>
        {message}
      </span>
    </motion.div>
  );
}

export function ListingCardSkeleton() {
  return (
    <div
      className="mb-3 rounded-xl border p-4"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="skeleton-shimmer mb-3 h-5 w-[70%]" />
      <div className="skeleton-shimmer mb-3 h-10 w-full" />
      <div className="flex items-center justify-between">
        <div className="skeleton-shimmer h-3.5 w-[40%]" />
        <div className="skeleton-shimmer h-8 w-20" />
      </div>
    </div>
  );
}
