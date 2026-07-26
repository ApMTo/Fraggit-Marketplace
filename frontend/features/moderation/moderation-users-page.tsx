'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ModerationShell } from '@/features/moderation/components/moderation-shell';
import { useDebouncedValue } from '@/hooks';
import { useModUsers } from '@/hooks/use-moderation';
import { cn } from '@/lib/utils';

type Props = { title: string; children?: React.ReactNode };

export function ModerationUsersPage({ title, children }: Props) {
  const t = useTranslations('moderation.users');
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 300);
  const { data, isLoading, isError } = useModUsers({
    search: debounced || undefined,
    limit: 50,
  });
  const users = data?.items ?? [];
  const selectedId = pathname.startsWith('/moderation/users/')
    ? pathname.slice('/moderation/users/'.length).split('/')[0] || null
    : null;
  const hasDetail = Boolean(children);

  return (
    <ModerationShell title={title}>
      {isLoading && !data ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError ? (
        <EmptyState title={t('error')} />
      ) : (
        <div className="grid min-h-[560px] gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
          <aside
            className={cn(
              'surface-card flex min-h-0 flex-col overflow-hidden rounded-lg',
              hasDetail ? 'hidden lg:flex' : 'flex',
            )}
          >
            <div className="shrink-0 space-y-3 border-b border-border px-3 py-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('listTitle')}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t('listCount', { count: users.length })}
                </p>
              </div>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
              />
            </div>
            {users.length === 0 ? (
              <div className="p-3">
                <EmptyState title={t('empty')} />
              </div>
            ) : (
              <ul className="min-h-0 flex-1 overflow-y-auto p-1">
                {users.map((user) => {
                  const isSelected = user.id === selectedId;
                  return (
                    <li key={user.id}>
                      <Link
                        href={`/moderation/users/${user.id}`}
                        className={cn(
                          'flex w-full flex-col gap-0.5 rounded-md px-3 py-2.5 transition-colors',
                          isSelected
                            ? 'bg-foreground text-background'
                            : 'hover:bg-muted',
                        )}
                      >
                        <span className="line-clamp-1 text-sm font-medium">
                          {user.displayName}
                        </span>
                        <span
                          className={cn(
                            'line-clamp-1 text-xs',
                            isSelected
                              ? 'text-background/70'
                              : 'text-muted-foreground',
                          )}
                        >
                          @{user.username} · {user.status}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <main
            className={cn(
              'surface-card min-h-0 overflow-hidden rounded-lg',
              hasDetail ? 'flex flex-col' : 'hidden lg:flex lg:flex-col',
            )}
          >
            {hasDetail ? (
              children
            ) : (
              <div className="flex flex-1 items-center justify-center p-6">
                <EmptyState
                  icon={Users}
                  title={t('selectTitle')}
                  description={t('selectDescription')}
                />
              </div>
            )}
          </main>
        </div>
      )}
    </ModerationShell>
  );
}
