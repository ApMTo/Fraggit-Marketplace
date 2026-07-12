import Image, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

type AppImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  src: string;
  alt?: string;
};

function isLocalObjectUrl(src: string): boolean {
  return src.startsWith('blob:') || src.startsWith('data:');
}

export function AppImage({
  src,
  alt = '',
  className,
  fill,
  width,
  height,
  style,
  unoptimized,
  ...props
}: AppImageProps) {
  if (isLocalObjectUrl(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- blob/data previews
      <img
        src={src}
        alt={alt}
        width={typeof width === 'number' ? width : undefined}
        height={typeof height === 'number' ? height : undefined}
        className={cn(fill && 'absolute inset-0 size-full', className)}
        style={style}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={cn(className)}
      fill={fill}
      width={width}
      height={height}
      style={style}
      unoptimized={unoptimized}
      {...props}
    />
  );
}
