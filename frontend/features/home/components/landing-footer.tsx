import Link from 'next/link';
import { Logo } from '@/components/layout/logo';

type FooterLink = {
  label: string;
  href: string;
};

type LandingFooterProps = {
  tagline: string;
  copyright: string;
  links: FooterLink[];
  socialLinks: FooterLink[];
};

export function LandingFooter({
  tagline,
  copyright,
  links,
  socialLinks,
}: LandingFooterProps) {
  return (
    <footer className="border-t border-border bg-surface/60">
      <div className="mx-auto w-full max-w-site px-5 py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <Logo />
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              {tagline}
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="space-y-3">
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors duration-300 hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Social">
            <ul className="space-y-3">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors duration-300 hover:text-foreground"
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={
                      link.href.startsWith('http')
                        ? 'noopener noreferrer'
                        : undefined
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-sm text-subtle">
          {copyright}
        </p>
      </div>
    </footer>
  );
}
