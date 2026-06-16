'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconArrowLeft } from '@/components/Icons';
import { cn } from '@/lib/utils';

interface StorefrontChromeProps {
  businessName?: string;
  showBack?: boolean;
}

export default function StorefrontChrome({ businessName, showBack }: StorefrontChromeProps) {
  const [fromBuscadis, setFromBuscadis] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ref = document.referrer || '';
    const fromParam = params.get('from') === 'buscadis';
    const fromReferrer =
      ref.includes('buscadis.com') ||
      ref.includes('adis.lat') ||
      ref.includes('market.adis.lat') ||
      ref.includes('localhost');
    setFromBuscadis(showBack ?? (fromParam || fromReferrer));
  }, [showBack]);

  if (!fromBuscadis) return null;

  return (
    <header
      className={cn(
        'sticky top-0 z-[90] print:hidden',
        'bg-[var(--bp-surface)]/90 backdrop-blur-md border-b border-[var(--bp-border)]'
      )}
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="max-w-6xl mx-auto px-4 h-11 flex items-center gap-3">
        <Link
          href="/?utm_source=business_profile&utm_medium=back&utm_campaign=discovery"
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--bp-text-muted)] hover:text-[var(--brand-color)] transition-colors"
        >
          <IconArrowLeft size={16} />
          Buscadis
        </Link>
        {businessName && (
          <span className="text-xs text-[var(--bp-text-muted)] truncate border-l border-[var(--bp-border)] pl-3">
            {businessName}
          </span>
        )}
      </div>
    </header>
  );
}
