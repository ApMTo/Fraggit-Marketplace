'use client';

import { UserRound } from 'lucide-react';
import { AppImage } from '@/components/ui/app-image';
import { cn } from '@/lib/utils';

type ChatAvatarProps = {
  src: string | null | undefined;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'size-9',
  md: 'size-11',
  lg: 'size-12',
} as const;

const iconSizes = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
} as const;

export function ChatAvatar({
  src,
  alt,
  size = 'md',
  className,
}: ChatAvatarProps) {
  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full border border-border bg-surface-elevated',
        sizeClasses[size],
        className,
      )}
    >
      {src ? (
        <AppImage
          src={src}
          alt={alt}
          fill
          sizes={size === 'sm' ? '36px' : size === 'md' ? '44px' : '48px'}
          className="object-cover"
        />
      ) : (
        <span className="flex size-full items-center justify-center text-subtle">
          <UserRound className={iconSizes[size]} aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
