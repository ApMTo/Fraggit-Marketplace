'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { isMediaRole } from '@/lib/media';

type BlogPostEditLinkProps = {
  slug: string;
  label: string;
};

export function BlogPostEditLink({ slug, label }: BlogPostEditLinkProps) {
  const { user } = useAuth();

  if (!isMediaRole(user?.role)) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3 pt-1">
      <Link
        href={`/blog/${slug}/edit`}
        className="text-sm font-medium text-accent-foreground hover:underline"
      >
        {label}
      </Link>
    </div>
  );
}
