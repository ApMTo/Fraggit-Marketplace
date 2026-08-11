import Link from 'next/link';

type BlogPaginationProps = {
  page: number;
  totalPages: number;
  prevLabel: string;
  nextLabel: string;
  pageLabel: (page: number, total: number) => string;
};

export function BlogPagination({
  page,
  totalPages,
  prevLabel,
  nextLabel,
  pageLabel,
}: BlogPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const prevHref = page > 1 ? `/blog?page=${page - 1}` : null;
  const nextHref = page < totalPages ? `/blog?page=${page + 1}` : null;

  return (
    <nav
      className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6"
      aria-label="Pagination"
    >
      {prevHref ? (
        <Link
          href={prevHref}
          className="text-sm font-medium text-accent-foreground hover:underline"
        >
          {prevLabel}
        </Link>
      ) : (
        <span className="text-sm text-muted">{prevLabel}</span>
      )}

      <p className="text-sm text-muted">{pageLabel(page, totalPages)}</p>

      {nextHref ? (
        <Link
          href={nextHref}
          className="text-sm font-medium text-accent-foreground hover:underline"
        >
          {nextLabel}
        </Link>
      ) : (
        <span className="text-sm text-muted">{nextLabel}</span>
      )}
    </nav>
  );
}
