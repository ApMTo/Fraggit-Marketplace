import Link from 'next/link';
import type { LegalDocument } from '../types';

type LegalDocumentPageProps = {
  document: LegalDocument;
  relatedLinks: Array<{ href: string; label: string }>;
  versionLabel: string;
  lastUpdatedLabel: string;
  relatedTitle: string;
};

export function LegalDocumentPage({
  document,
  relatedLinks,
  versionLabel,
  lastUpdatedLabel,
  relatedTitle,
}: LegalDocumentPageProps) {
  return (
    <div className="mx-auto w-full max-w-site px-5 py-10 sm:py-14">
      <article className="mx-auto max-w-3xl">
        <header className="mb-10 space-y-3 border-b border-border pb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {document.title}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span>
              {versionLabel}: {document.version}
            </span>
            <span>
              {lastUpdatedLabel}: {document.lastUpdated}
            </span>
          </div>
          <p className="text-base leading-relaxed text-muted">{document.intro}</p>
        </header>

        <div className="space-y-8">
          {document.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="mb-3 text-lg font-semibold text-foreground">
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="mb-3 text-sm leading-relaxed text-muted last:mb-0"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
                  {section.bullets.map((bullet) => (
                    <li key={bullet.slice(0, 40)}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <aside className="mt-12 rounded-[var(--radius-md)] border border-border bg-surface/60 p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            {relatedTitle}
          </h2>
          <ul className="space-y-2">
            {relatedLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-link hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <p className="mt-8 text-xs leading-relaxed text-subtle">
          {document.disclaimer}
        </p>
      </article>
    </div>
  );
}
