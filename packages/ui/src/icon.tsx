import * as React from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  Plus,
  Search,
  Sun,
  User,
  X,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';
import { cn } from './lib/cn';

export const ICON_SIZES = [16, 20, 24, 32] as const;
export type IconSize = (typeof ICON_SIZES)[number];

/** Icons needed for Header / Auth / Publish migrations (expand over time). */
export const iconRegistry = {
  search: Search,
  menu: Menu,
  bell: Bell,
  message: MessageCircle,
  user: User,
  x: X,
  close: X,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  plus: Plus,
  sun: Sun,
  moon: Moon,
  mapPin: MapPin,
  check: Check,
  loader: Loader2,
} as const;

export type IconName = keyof typeof iconRegistry;

export interface IconProps extends Omit<LucideProps, 'size' | 'ref'> {
  name: IconName;
  size?: IconSize;
  className?: string;
}

export function Icon({ name, size = 20, className, strokeWidth = 2, ...props }: IconProps) {
  const Comp: LucideIcon = iconRegistry[name];
  return (
    <Comp
      size={size}
      strokeWidth={strokeWidth}
      className={cn('shrink-0', className)}
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
    />
  );
}

export type { LucideIcon };
