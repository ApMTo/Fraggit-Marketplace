'use client';

import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { isMediaRole } from '@/lib/media';

type BlogManageNewLinkProps = {
  label: string;
};

export function BlogManageNewLink({ label }: BlogManageNewLinkProps) {
  const { user } = useAuth();

  if (!isMediaRole(user?.role)) {
    return null;
  }

  return (
    <Link
      href="/blog/new"
      className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-accent px-4 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
    >
      {label}
    </Link>
  );
}
