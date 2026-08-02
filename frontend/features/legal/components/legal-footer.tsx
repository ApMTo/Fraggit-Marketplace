'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function LegalFooter() {
  const t = useTranslations('legal.footer');
  const currentYear = new Date().getFullYear();

  const links = [
    { href: '/terms', label: t('terms') },
    { href: '/privacy', label: t('privacy') },
    { href: '/marketplace-rules', label: t('marketplaceRules') },
    { href: '/seller-policy', label: t('sellerPolicy') },
  ];

  return (
    <footer className="mt-auto border-t border-border bg-surface/40">
      <div className="mx-auto flex w-full max-w-site flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-subtle">
          {t('copyright', { year: currentYear })}
        </p>
        <nav aria-label="Legal">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs text-muted transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
