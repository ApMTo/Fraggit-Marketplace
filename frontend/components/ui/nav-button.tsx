import Link from 'next/link';
import { type ComponentProps } from 'react';

type BrandButtonProps = ComponentProps<typeof Link> & {
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-sm',
  lg: 'h-[52px] px-8 text-base',
};

export function BrandButton({
  size = 'md',
  className = '',
  ...props
}: BrandButtonProps) {
  return (
    <Link
      className={`btn-primary ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}

type SecondaryButtonProps = ComponentProps<typeof Link> & {
  size?: 'sm' | 'md' | 'lg';
};

export function SecondaryButton({
  size = 'md',
  className = '',
  ...props
}: SecondaryButtonProps) {
  return (
    <Link
      className={`btn-secondary ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
