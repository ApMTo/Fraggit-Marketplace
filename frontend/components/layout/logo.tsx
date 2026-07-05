import Image from 'next/image';
import Link from 'next/link';

type LogoProps = {
  href?: string;
  className?: string;
};

export function Logo({ href = '/', className = '' }: LogoProps) {
  const image = (
    <Image
      src="/logo.svg"
      alt="Fraggit"
      width={125}
      height={30}
      priority
      className={className}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {image}
      </Link>
    );
  }

  return image;
}
