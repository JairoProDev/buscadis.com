'use client';

import Image from 'next/image';
import { Adiso } from '@/types';
import { getPublisherAvatar, getPublisherAvatarSize } from '@/lib/publisher-avatar';
import { cardSignalClassName, pickCardSignal } from '@/lib/social-proof';

interface AdisoPublisherStripProps {
  adiso: Adiso;
  tamaño: string;
  vista: string;
}

export default function AdisoPublisherStrip({ adiso, tamaño, vista }: AdisoPublisherStripProps) {
  const avatar = getPublisherAvatar(adiso);
  const signal = pickCardSignal(adiso);
  const size = getPublisherAvatarSize(tamaño, vista);
  const radius = tamaño === 'miniatura' ? 6 : 8;
  const fontSize = tamaño === 'miniatura' ? 9 : 10;

  return (
    <div
      className="absolute top-2 left-2 z-10 flex items-center gap-1.5 max-w-[calc(100%-3.5rem)] pointer-events-none"
    >
      <div
        className="flex-shrink-0 overflow-hidden border border-white/80 shadow-sm"
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: avatar.backgroundColor,
        }}
        title={avatar.label}
      >
        {avatar.kind === 'photo' && avatar.imageUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={avatar.imageUrl}
              alt={avatar.label}
              fill
              sizes={`${size}px`}
              className="object-cover"
            />
          </div>
        ) : avatar.kind === 'buscadis' && avatar.imageUrl ? (
          <div className="relative w-full h-full p-1">
            <Image
              src={avatar.imageUrl}
              alt="Buscadis"
              fill
              sizes={`${size}px`}
              className="object-contain p-0.5"
            />
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-bold leading-none"
            style={{
              color: avatar.textColor,
              fontSize: size <= 24 ? 10 : 12,
            }}
          >
            {avatar.initials}
          </div>
        )}
      </div>

      {signal && (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold backdrop-blur-md border truncate ${cardSignalClassName(signal.tone)}`}
          style={{ fontSize }}
        >
          {signal.label}
        </span>
      )}
    </div>
  );
}
