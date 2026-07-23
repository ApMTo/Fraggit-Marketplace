'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ModerationShell } from '@/features/moderation/components/moderation-shell';
import { useDebouncedValue } from '@/hooks';
import { useModUsers } from '@/hooks/use-moderation';

type Props = { title: string };

export function ModerationUsersPage({ title }: Props) {
  const t = useTranslations('moderation.users');
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 300);
  const { data, isLoading, isError } = useModUsers({
    search: debounced || undefined,
    limit: 30,
  });

  return (
    <ModerationShell title={title}>
      <div className="mb-4 max-w-sm">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError || !data ? (
        <EmptyState title={t('error')} />
      ) : data.items.length === 0 ? (
        <EmptyState title={t('empty')} />
      ) : (
        <div className="surface-card overflow-x-auto rounded-lg">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">{t('columns.user')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.role')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.status')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.created')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((user) => (
                <tr key={user.id} className="border-b border-border/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/moderation/users/${user.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {user.displayName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      @{user.username} · {user.email}
                    </p>
                  </td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{user.status}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ModerationShell>
  );
}
