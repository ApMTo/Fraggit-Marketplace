'use client';

import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { useModAudit } from '@/hooks/use-moderation';
import type { ModerationTargetType } from '@/types/moderation';

type AuditLogProps = {
  targetType?: ModerationTargetType;
  targetId?: string;
  limit?: number;
  title?: string;
};

export function AuditLog({
  targetType,
  targetId,
  limit = 20,
  title,
}: AuditLogProps) {
  const t = useTranslations('moderation.audit');
  const { data, isLoading, isError } = useModAudit({
    targetType,
    targetId,
    limit,
  });

  return (
    <section className="surface-card rounded-lg p-5">
      <h3 className="font-medium">{title ?? t('title')}</h3>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : isError || !data ? (
        <p className="mt-3 text-sm text-muted-foreground">{t('error')}</p>
      ) : data.items.length === 0 ? (
        <div className="mt-3">
          <EmptyState title={t('empty')} />
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {data.items.map((item) => (
            <li
              key={item.id}
              className="rounded-md border border-border/70 px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{item.actionType}</p>
                <time className="text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString()}
                </time>
              </div>
              <p className="mt-1 text-muted-foreground">
                @{item.actor.username} · {item.targetType} ·{' '}
                {item.targetId.slice(0, 8)}…
              </p>
              <p className="mt-1">{item.reason}</p>
              {(item.before != null || item.after != null) && (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {JSON.stringify(item.before)} → {JSON.stringify(item.after)}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
