'use client';

import { useMemo } from 'react';
import Ordenamiento, { type OrdenamientoOption } from '@/components/Ordenamiento';
import { IconSort, IconSortDown, IconSortUp } from '@/components/Icons';
import {
  VISITOR_SORT_OPTIONS,
  setStoredVisitorSort,
  type VisitorSortOption,
} from '@/lib/catalog/sort-products';
import { cn } from '@/lib/utils';

const CATALOG_SORT_ICONS: Record<VisitorSortOption, OrdenamientoOption<VisitorSortOption>['icon']> = {
  owner: IconSort,
  title_asc: IconSort,
  title_desc: IconSort,
  price_asc: IconSortUp,
  price_desc: IconSortDown,
  newest: IconSortDown,
};

const CATALOG_SORT_OPTIONS: OrdenamientoOption<VisitorSortOption>[] = VISITOR_SORT_OPTIONS.map((opt) => ({
  valor: opt.id,
  label: opt.label,
  icon: CATALOG_SORT_ICONS[opt.id],
}));

interface ProductSortControlProps {
  value: VisitorSortOption;
  onChange: (sort: VisitorSortOption) => void;
  className?: string;
}

export default function ProductSortControl({ value, onChange, className }: ProductSortControlProps) {
  const options = useMemo(() => CATALOG_SORT_OPTIONS, []);

  const handleChange = (next: VisitorSortOption) => {
    setStoredVisitorSort(next);
    onChange(next);
  };

  return (
    <div className={cn('shrink-0', className)}>
      <Ordenamiento
        valor={value}
        onChange={handleChange}
        options={options}
        variant="icon"
        triggerIcon={IconSort}
        ariaLabel="Ordenar productos"
        sheetTitle="Ordenar productos"
      />
    </div>
  );
}
