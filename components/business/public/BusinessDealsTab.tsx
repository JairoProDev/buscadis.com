'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DealClip } from '@/types';
import { IconHeart } from '@/components/Icons';
import Link from 'next/link';

interface BusinessDealsTabProps {
  slug: string;
  businessName: string;
}

export default function BusinessDealsTab({ slug, businessName }: BusinessDealsTabProps) {
  const [clips, setClips] = useState<DealClip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/business/${encodeURIComponent(slug)}/deals`);
        const data = await res.json();
        if (!cancelled) setClips(data.clips || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm">Cargando deals…</div>
    );
  }

  if (clips.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white p-8 rounded-3xl text-center shadow-sm border border-slate-100">
          <div className="w-20 h-20 bg-gradient-to-tr from-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg">
            <IconHeart size={32} />
          </div>
          <h3 className="font-bold text-2xl mb-3">Sin deals aún</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            {businessName} aún no publicó ofertas flash. Vuelve pronto o explora el catálogo.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-4"
    >
      {clips.map((clip) => (
        <article
          key={clip.id}
          className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm"
        >
          <div className="aspect-[9/16] max-h-[480px] bg-black relative">
            {clip.media_type === 'video' ? (
              <video
                src={clip.media_url}
                poster={clip.poster_url}
                className="w-full h-full object-cover"
                controls
                playsInline
                muted
              />
            ) : (
              <img src={clip.media_url} alt={clip.title} className="w-full h-full object-cover" />
            )}
            {clip.discount_pct && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full">
                -{clip.discount_pct}%
              </span>
            )}
          </div>
          <div className="p-5">
            <h3 className="font-bold text-lg text-slate-900">{clip.title}</h3>
            {clip.caption && <p className="text-sm text-slate-500 mt-1">{clip.caption}</p>}
            <div className="flex items-center justify-between mt-4">
              {clip.price_display != null && (
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-slate-900">S/ {clip.price_display}</span>
                  {clip.price_original != null && (
                    <span className="text-sm text-slate-400 line-through">S/ {clip.price_original}</span>
                  )}
                </div>
              )}
              <Link
                href={clip.adiso_id ? `/adiso/${clip.adiso_id}` : '/deals'}
                className="text-sm font-bold text-[var(--brand-color)]"
              >
                Ver oferta →
              </Link>
            </div>
          </div>
        </article>
      ))}
    </motion.div>
  );
}
