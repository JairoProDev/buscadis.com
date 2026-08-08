import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './lib/cn';

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 16 | 20 | 24 | 32;
  label?: string;
}

/** Inline spinner for buttons / small blocks — never for full-page loads. */
export function Spinner({ size = 20, label = 'Cargando', className, ...props }: SpinnerProps) {
  return (
    <Loader2
      size={size}
      className={cn('animate-spin text-[var(--bs-action)] motion-reduce:animate-none', className)}
      role="status"
      aria-label={label}
      {...props}
    />
  );
}
