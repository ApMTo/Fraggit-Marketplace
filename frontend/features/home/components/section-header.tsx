type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
};

export function SectionHeader({
  title,
  subtitle,
  align = 'center',
}: SectionHeaderProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <header className={`mb-12 max-w-2xl space-y-3 sm:mb-16 ${alignClass}`}>
      <h2 className="page-title text-3xl sm:text-4xl">{title}</h2>
      {subtitle ? (
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
