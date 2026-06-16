'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterPanelFooterProps {
  resultCount: number;
  totalPool: number;
  insight: string;
  children?: React.ReactNode;
}

export default function FilterPanelFooter({
  resultCount,
  totalPool,
  insight,
  children,
}: FilterPanelFooterProps) {
  return (
    <div className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)] px-3.5 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={resultCount}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="m-0 text-sm font-bold tabular-nums text-[var(--text-primary)]"
          >
            {resultCount}
            <span className="ml-1 text-[10px] font-semibold text-[var(--text-tertiary)]">
              resultado{resultCount === 1 ? '' : 's'}
            </span>
          </motion.p>
        </AnimatePresence>
        {totalPool > 0 && resultCount < totalPool && (
          <span className="shrink-0 text-[9px] font-medium text-[var(--text-tertiary)]">
            de {totalPool}
          </span>
        )}
      </div>
      <p className="m-0 mt-1 text-[10px] leading-snug text-[var(--text-tertiary)]">{insight}</p>
      {children && <div className="mt-2 space-y-1.5">{children}</div>}
    </div>
  );
}
