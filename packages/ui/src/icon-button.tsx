import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { Button, buttonVariants, type ButtonProps } from './button';
import { cn } from './lib/cn';

type IconButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

export interface IconButtonProps
  extends Omit<ButtonProps, 'iconLeft' | 'iconRight' | 'children' | 'aria-label'> {
  /** Required for accessibility — icon-only controls must name their action. */
  'aria-label': string;
  children: React.ReactNode;
  size?: IconButtonSize;
  /** Optional notification count badge. */
  badge?: number;
  badgeTone?: 'action' | 'warm' | 'muted';
}

const sizeSquare: Record<IconButtonSize, string> = {
  sm: 'h-9 w-9 min-h-9 min-w-9 p-0',
  md: 'h-11 w-11 min-h-11 min-w-11 p-0',
  lg: 'h-[52px] w-[52px] min-h-[52px] min-w-[52px] p-0',
};

const BADGE_TONE: Record<NonNullable<IconButtonProps['badgeTone']>, string> = {
  action: 'bg-[var(--bs-action)] text-[var(--bs-fg-on-action)]',
  warm: 'bg-[var(--bs-publish-bg)] text-[var(--bs-fg-on-warm)]',
  muted: 'bg-[var(--bs-fg-muted)] text-[var(--bs-fg-on-action)]',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      size = 'md',
      variant = 'ghost',
      children,
      badge,
      badgeTone = 'action',
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn('relative', sizeSquare[size], className)}
        {...props}
      >
        {children}
        {badge != null && badge > 0 && (
          <span
            className={cn(
              'absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none',
              BADGE_TONE[badgeTone]
            )}
            aria-hidden
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </Button>
    );
  }
);
IconButton.displayName = 'IconButton';
