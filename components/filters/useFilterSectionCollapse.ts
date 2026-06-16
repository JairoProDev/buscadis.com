'use client';

import { useEffect, useState } from 'react';
import { readFilterSectionsCollapsed, writeFilterSectionCollapsed } from '@/lib/filters/section-collapse';

export function useFilterSectionCollapse(sectionId: string, defaultOpen = false) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const stored = readFilterSectionsCollapsed();
    if (sectionId in stored) {
      setOpen(!stored[sectionId]);
    }
  }, [sectionId]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    writeFilterSectionCollapsed(sectionId, !next);
  };

  return { open, toggle };
}
