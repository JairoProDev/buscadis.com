'use client';

import type { ProfileEntity } from '@buscadis/profile-engine';
import { IconMapMarkerAlt, IconStar } from '@/components/Icons';
import VerificationTierBadge, {
  type VerificationTier,
} from '@/components/profile/VerificationTierBadge';
import { resolveLocationDisplayText } from '@/lib/profile/resolve-location-display';
import { cn } from '@/lib/utils';

interface ProfileIdentityRowProps {
  entity: ProfileEntity;
  verificationTier?: VerificationTier | null;
  className?: string;
}

function RatingBadge({
  avgRating,
  reviewCount,
}: {
  avgRating: number;
  reviewCount: number;
}) {
  return (
    <div className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[var(--text-secondary)]">
      <IconStar size={14} className="text-[var(--brand-accent)] shrink-0" />
      <span>{avgRating.toFixed(2)}</span>
      <span className="text-[var(--text-tertiary)] font-normal">({reviewCount})</span>
    </div>
  );
}

export default function ProfileIdentityRow({
  entity,
  verificationTier,
  className,
}: ProfileIdentityRowProps) {
  const { text: locationText, flagUrl } = resolveLocationDisplayText(
    entity.location,
    entity.locationDisplayLevel,
    entity.location?.address
  );
  const rating = entity.reviewSummary;
  const hasRating = Boolean(rating && rating.reviewCount > 0);
  const hasMeta = Boolean(locationText || hasRating);

  return (
    <div className={cn('max-w-6xl mx-auto px-4', className)}>
      <div className="flex flex-col gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] m-0 flex items-center gap-1.5 min-w-0">
            <span className="truncate">{entity.displayName}</span>
            <VerificationTierBadge
              tier={verificationTier}
              isVerified={entity.isVerified}
              size={20}
            />
          </h1>
          {entity.tagline ? (
            <p className="text-[var(--text-tertiary)] font-medium text-sm m-0 mt-1 truncate">
              {entity.tagline}
            </p>
          ) : null}
        </div>

        {hasMeta && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {locationText && (
              <div className="inline-flex items-center gap-1.5 text-[var(--text-tertiary)] text-xs sm:text-sm">
                {flagUrl && (
                  <img
                    src={flagUrl}
                    alt=""
                    width={18}
                    height={13}
                    className="rounded-sm shrink-0 object-cover"
                    loading="lazy"
                  />
                )}
                <IconMapMarkerAlt size={14} className="shrink-0 text-[var(--brand-color)]" />
                <span className="truncate max-w-[12rem] sm:max-w-none">{locationText}</span>
              </div>
            )}
            {hasRating && rating && (
              <RatingBadge avgRating={rating.avgRating} reviewCount={rating.reviewCount} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
