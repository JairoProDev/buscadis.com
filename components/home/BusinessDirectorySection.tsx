'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getBusinessProfilePath } from '@/lib/seo/business-metadata';
import { IconStore, IconVerified } from '@/components/Icons';

interface DirectoryBusiness {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  theme_color?: string;
  is_verified?: boolean;
  contact_address?: string;
}

interface BusinessDirectorySectionProps {
  className?: string;
}

export default function BusinessDirectorySection({ className }: BusinessDirectorySectionProps) {
  const [businesses, setBusinesses] = useState<DirectoryBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/business/directory')
      .then((r) => r.json())
      .then((data: { profiles?: DirectoryBusiness[] }) => {
        if (!cancelled) setBusinesses(data.profiles || []);
      })
      .catch(() => {
        if (!cancelled) setBusinesses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className={className} aria-label="Directorio de negocios">
        <div className="mb-3 flex items-center gap-2">
          <IconStore size={18} color="var(--brand-blue)" />
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Negocios en Buscadis</h2>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[120px] w-[140px] shrink-0 animate-pulse rounded-2xl bg-[var(--bg-secondary)]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (businesses.length === 0) return null;

  return (
    <section className={className} aria-label="Directorio de negocios">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconStore size={18} color="var(--brand-blue)" />
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Negocios en Buscadis</h2>
        </div>
        <span className="text-xs text-[var(--text-tertiary)]">{businesses.length} perfiles</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {businesses.map((biz) => (
          <Link
            key={biz.id}
            href={getBusinessProfilePath(biz.slug)}
            className="group flex w-[148px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
          >
            <div
              className="relative h-16 w-full"
              style={{
                background: biz.banner_url
                  ? undefined
                  : `linear-gradient(135deg, ${biz.theme_color || 'var(--brand-blue)'}, var(--brand-yellow))`,
              }}
            >
              {biz.banner_url && (
                <Image src={biz.banner_url} alt="" fill className="object-cover" sizes="148px" />
              )}
              <div className="absolute -bottom-5 left-3 h-10 w-10 overflow-hidden rounded-xl border-2 border-[var(--bg-primary)] bg-[var(--bg-secondary)] shadow">
                {biz.logo_url ? (
                  <Image src={biz.logo_url} alt={biz.name} fill className="object-cover" sizes="40px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                    {biz.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-0.5 px-3 pb-3 pt-7">
              <div className="flex items-center gap-1">
                <span className="truncate text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-blue)]">
                  {biz.name}
                </span>
                {biz.is_verified && <IconVerified size={12} color="var(--brand-blue)" />}
              </div>
              {(biz.tagline || biz.contact_address) && (
                <p className="line-clamp-2 text-[0.7rem] leading-snug text-[var(--text-tertiary)]">
                  {biz.tagline || biz.contact_address}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
