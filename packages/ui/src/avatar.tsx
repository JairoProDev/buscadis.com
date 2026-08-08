import * as React from 'react';
import { cn } from './lib/cn';

const SIZE: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-lg',
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Stable pastel-ish hue from name (brand-tinted). */
function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `oklch(0.55 0.12 ${hue})`;
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name: string;
  size?: keyof typeof SIZE;
}

export function Avatar({
  className,
  src,
  alt,
  name,
  size = 'md',
  ...props
}: AvatarProps) {
  const [failed, setFailed] = React.useState(false);
  const showImage = Boolean(src) && !failed;
  const initials = initialsFromName(name);

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white',
        SIZE[size],
        className
      )}
      style={showImage ? undefined : { backgroundColor: colorFromName(name) }}
      aria-label={alt || name}
      role="img"
      {...props}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- primitive package, no Next Image
        <img
          src={src!}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </div>
  );
}
