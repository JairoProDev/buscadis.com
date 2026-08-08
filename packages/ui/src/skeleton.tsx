import * as React from 'react';
import { cn } from './lib/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Match real content shape — use width/height/rounded via className. */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
}

const roundedMap = {
  none: 'rounded-none',
  sm: 'rounded-[var(--bs-radius-xs)]',
  md: 'rounded-[var(--bs-radius-sm)]',
  lg: 'rounded-[var(--bs-radius-md)]',
  full: 'rounded-full',
};

export function Skeleton({ className, rounded = 'md', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton-shimmer animate-pulse bg-[var(--bs-bg-sunken)]',
        'motion-reduce:animate-none',
        roundedMap[rounded],
        className
      )}
      aria-hidden
      {...props}
    />
  );
}
