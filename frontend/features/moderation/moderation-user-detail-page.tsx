'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { AuditLog } from '@/features/moderation/components/audit-log';
import { ReasonActionDialog } from '@/features/moderation/components/reason-action-dialog';
import { ModerationUsersPage } from '@/features/moderation/moderation-users-page';
import { useAuth } from '@/hooks';
import { useModerationMutations, useModUser } from '@/hooks/use-moderation';
import type { UserRole } from '@/types/auth';
import type { UserStatus } from '@/types/user';

type Props = { title: string; userId: string };

type ActionKind =
  | { type: 'status'; status: UserStatus }
  | { type: 'revoke' }
  | { type: 'reset2fa' }
  | { type: 'role'; role: UserRole };

const STAFF_ADMIN: UserRole[] = ['ADMIN', 'SUPER_ADMIN', 'OWNER'];
const STAFF_SUPER: UserRole[] = ['SUPER_ADMIN', 'OWNER'];

export function ModerationUserDetailPage({ title, userId }: Props) {
  const t = useTranslations('moderation.users');
  const { user: actor } = useAuth();
  const { data, isLoading, isError } = useModUser(userId);
  const mutations = useModerationMutations();
  const [action, setAction] = useState<ActionKind | null>(null);

  const canAdmin = actor && STAFF_ADMIN.includes(actor.role);
  const canSuper = actor && STAFF_SUPER.includes(actor.role);

  const runAction = async (reason: string) => {
    if (!action) return;
    try {
      if (action.type === 'status') {
        await mutations.updateUserStatus.mutateAsync({
          id: userId,
          payload: { status: action.status, reason },
        });
      } else if (action.type === 'revoke') {
        await mutations.revokeSessions.mutateAsync({
          id: userId,
          payload: { reason },
        });
      } else if (action.type === 'reset2fa') {
        await mutations.resetTwoFactor.mutateAsync({
          id: userId,
          payload: { reason },
        });
      } else if (action.type === 'role') {
        await mutations.updateUserRole.mutateAsync({
          id: userId,
          payload: { role: action.role, reason },
        });
      }
      toast.success(t('actionSuccess'));
      setAction(null);
    } catch {
      toast.error(t('actionError'));
    }
  };

  return (
    <ModerationUsersPage title={title}>
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError || !data ? (
        <EmptyState title={t('error')} />
      ) : (
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 sm:p-5">
          <Link
            href="/moderation/users"
            className="inline-block text-sm text-muted-foreground hover:text-foreground lg:hidden"
          >
            ← {t('backToList')}
          </Link>

          <section>
            <h2 className="text-lg font-semibold">
              {data.user.displayName}{' '}
              <span className="text-muted-foreground">
                @{data.user.username}
              </span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.user.email}
            </p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">{t('columns.role')}</dt>
                <dd>{data.user.role}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('columns.status')}</dt>
                <dd>{data.user.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">2FA</dt>
                <dd>{data.user.twoFactorEnabled ? 'on' : 'off'}</dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  setAction({ type: 'status', status: 'SUSPENDED' })
                }
              >
                {t('actions.suspend')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setAction({ type: 'status', status: 'BANNED' })}
              >
                {t('actions.ban')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setAction({ type: 'status', status: 'ACTIVE' })}
              >
                {t('actions.restore')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setAction({ type: 'revoke' })}
              >
                {t('actions.revokeSessions')}
              </Button>
              {canAdmin ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setAction({ type: 'reset2fa' })}
                >
                  {t('actions.reset2fa')}
                </Button>
              ) : null}
              {canSuper ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setAction({ type: 'role', role: 'MODERATOR' })
                  }
                >
                  {t('actions.makeModerator')}
                </Button>
              ) : null}
            </div>
          </section>

          <section>
            <h3 className="font-medium">{t('recentLots')}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {data.lots.length === 0 ? (
                <li className="text-muted-foreground">{t('emptySection')}</li>
              ) : (
                data.lots.map((lot) => (
                  <li key={lot.id}>
                    {lot.title} · {lot.status}
                  </li>
                ))
              )}
            </ul>
          </section>

          <AuditLog
            targetType="USER"
            targetId={userId}
            limit={20}
            title={t('historyTitle')}
          />
        </div>
      )}

      <ReasonActionDialog
        open={Boolean(action)}
        title={t('reasonTitle')}
        onClose={() => setAction(null)}
        onConfirm={runAction}
      />
    </ModerationUsersPage>
  );
}
