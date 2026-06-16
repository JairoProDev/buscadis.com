'use client';

import { motion } from 'framer-motion';
import BentoCard from '@/components/BentoCard';
import BusinessCustomBlocks from './BusinessCustomBlocks';
import { getSocialIcon } from './social-icons';
import type { BusinessProfile } from '@/types/business';
import type { Adiso } from '@/types';
import {
  IconMapMarkerAlt,
  IconPhone,
  IconStore,
  IconWhatsapp,
} from '@/components/Icons';
import { cn } from '@/lib/utils';
import { getWhatsappUrl } from '@/lib/business/public-utils';
import { getAdisoUrl } from '@/lib/url';

interface BusinessInfoTabProps {
  profile: Partial<BusinessProfile>;
  adisos: Adiso[];
  showCustomLinks?: boolean;
}

export default function BusinessInfoTab({ profile, adisos, showCustomLinks = true }: BusinessInfoTabProps) {
  const hasSocials = profile.social_links && profile.social_links.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl shadow-sm border border-[var(--border-subtle)]">
          <h3 className="font-bold text-lg mb-4">Sobre Nosotros</h3>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-6">
            {profile.description || 'Sin descripción disponible.'}
          </p>
          {hasSocials && (
            <div className="flex gap-4 flex-wrap">
              {profile.social_links?.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[var(--bg-secondary)] p-3 rounded-full hover:bg-[var(--brand-color)] hover:text-white transition-all text-[var(--text-secondary)]"
                >
                  {getSocialIcon(link.url)}
                </a>
              ))}
            </div>
          )}
        </div>

        {profile.contact_whatsapp && (
          <div className="bg-[var(--brand-color)] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
            <h3 className="font-bold text-lg mb-4 relative z-10">Contáctanos</h3>
            <div className="space-y-4 relative z-10">
              <a
                href={getWhatsappUrl(profile.contact_whatsapp, profile.name || 'Negocio')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white/20 p-3 rounded-xl hover:bg-white/30 transition-colors"
              >
                <IconWhatsapp size={20} />
                <span className="font-medium">Chatear por WhatsApp</span>
              </a>
              {profile.contact_phone && (
                <a
                  href={`tel:${profile.contact_phone}`}
                  className="flex items-center gap-3 bg-white/20 p-3 rounded-xl hover:bg-white/30 transition-colors"
                >
                  <IconPhone size={20} />
                  <span className="font-medium">Llamar Ahora</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-2 space-y-8">
        <div className="bg-[var(--bg-primary)] p-6 rounded-3xl shadow-sm border border-[var(--border-subtle)]">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <IconMapMarkerAlt className="text-[var(--brand-color)]" /> Ubicación y Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-[var(--text-secondary)] mb-4">
                {profile.contact_address || 'Dirección no especificada'}
              </p>
              <div className="w-full h-48 bg-[var(--bg-secondary)] rounded-xl overflow-hidden border border-[var(--border-color)]">
                <iframe
                  title="Mapa"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(profile.contact_address || 'peru')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                />
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-[var(--text-secondary)] uppercase tracking-wider">
                Horarios
              </h4>
              <div className="space-y-2">
                {Object.entries(profile.business_hours || {}).length > 0 ? (
                  Object.entries(profile.business_hours || {}).map(([day, hours]) => (
                    <div
                      key={day}
                      className="flex justify-between text-sm py-1 border-b border-[var(--border-subtle)] last:border-0 lowercase"
                    >
                      <span className="font-medium capitalize">{day}</span>
                      <span
                        className={
                          hours.closed ? 'text-red-500 font-medium' : 'text-[var(--text-secondary)]'
                        }
                      >
                        {hours.closed ? 'Cerrado' : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--text-tertiary)] italic">
                    Consulte horarios directamente.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {showCustomLinks && profile.custom_blocks && profile.custom_blocks.length > 0 && (
          <BusinessCustomBlocks blocks={profile.custom_blocks} />
        )}

        <div>
          <h3 className="font-bold text-xl mb-6">Destacados</h3>
          {adisos.length > 0 ? (
            <div
              className={cn(
                'grid gap-4',
                profile.layout_style === 'minimal'
                  ? 'grid-cols-1'
                  : profile.layout_style === 'bento'
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                    : 'grid-cols-1 sm:grid-cols-2'
              )}
            >
              {adisos.slice(0, 4).map((adiso, idx) => (
                <div
                  key={adiso.id}
                  className={cn(
                    'transform hover:scale-[1.02] transition-transform',
                    profile.layout_style === 'bento' && idx === 0 ? 'md:col-span-2 md:row-span-2' : ''
                  )}
                >
                  <BentoCard
                    adiso={adiso}
                    icon={<IconStore size={12} />}
                    onClick={() => window.open(getAdisoUrl(adiso), '_blank')}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[var(--bg-primary)] rounded-3xl p-12 text-center border border-[var(--border-subtle)] border-dashed">
              <p className="text-sm text-[var(--text-tertiary)]">Pronto verás productos destacados aquí.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
