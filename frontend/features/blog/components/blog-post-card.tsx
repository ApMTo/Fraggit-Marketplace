import Link from 'next/link';
import { AppImage } from '@/components/ui/app-image';
import type { BlogPostCard } from '@/types/blog';

type BlogPostCardViewProps = {
  post: BlogPostCard;
  readLabel: string;
  formatDate: (iso: string) => string;
};

export function BlogPostCardView({
  post,
  readLabel,
  formatDate,
}: BlogPostCardViewProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-border-strong">
      <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-surface-elevated">
        <AppImage
          src={post.coverUrl}
          alt={post.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <time
          dateTime={post.publishedAt}
          className="text-xs font-medium uppercase tracking-wide text-muted"
        >
          {formatDate(post.publishedAt)}
        </time>

        <h3 className="font-display text-lg font-semibold leading-snug text-foreground">
          <Link
            href={`/blog/${post.slug}`}
            className="transition-colors hover:text-accent-foreground"
          >
            {post.title}
          </Link>
        </h3>

        <div className="mt-auto pt-1">
          <Link
            href={`/blog/${post.slug}`}
            className="text-sm font-medium text-accent-foreground underline-offset-4 hover:underline"
          >
            {readLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
