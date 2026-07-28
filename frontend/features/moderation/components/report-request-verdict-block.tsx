'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { ReasonActionDialog } from '@/features/moderation/components/reason-action-dialog';
import { useModerationMutations } from '@/hooks/use-moderation';
import { resolveApiErrorKey } from '@/lib/api-errors';
import type { ModReport } from '@/types/moderation';
import type { UserRole } from '@/types/auth';

const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN', 'OWNER'];

type Props = {
  report: ModReport;
  currentUserId: string;
  currentUserRole: UserRole;
};

export function ReportRequestVerdictBlock({
  report,
  currentUserId,
  currentUserRole,
}: Props) {
  const t = useTranslations('moderation.reports.workflow');
  const { requestReportVerdict } = useModerationMutations();
  const [open, setOpen] = useState(false);

  if (report.targetType !== 'USER') {
    return null;
  }

  const isAdmin = ADMIN_ROLES.includes(currentUserRole);
  const isAssignee = report.assignedToId === currentUserId;
  const closed =
    report.status === 'RESOLVED' || report.status === 'DISMISSED';

  if (closed) {
    return null;
  }

  const canRequest =
    !isAdmin &&
    isAssignee &&
    report.status === 'IN_REVIEW';

  return (
    <section className="rounded-lg border border-border bg-muted/10 p-4">
      <h3 className="text-sm font-semibold">{t('handoffTitle')}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t('handoffHint')}</p>

      {report.status === 'OPEN' && !isAdmin ? (
        <p className="mt-2 text-sm text-muted-foreground">
          {t('takeInReviewFirst')}
        </p>
      ) : null}

      {report.assignedTo ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {t('assignee', { username: report.assignedTo.username })}
        </p>
      ) : null}

      {report.status === 'AWAITING_VERDICT' ? (
        <p className="mt-3 text-sm font-medium text-[var(--warning)]">
          {isAdmin ? t('awaitingVerdictAdmin') : t('awaitingVerdictMod')}
        </p>
      ) : null}

      {canRequest ? (
        <Button
          type="button"
          size="sm"
          className="mt-3"
          variant="secondary"
          disabled={requestReportVerdict.isPending}
          onClick={() => setOpen(true)}
        >
          {t('requestVerdict')}
        </Button>
      ) : null}

      {report.resolutionNote &&
      (report.status === 'AWAITING_VERDICT' || closed) ? (
        <div className="mt-4 rounded-md border border-dashed border-border/80 bg-background/60 p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('modSummary')}
          </p>
          <p className="mt-1 whitespace-pre-wrap">{report.resolutionNote}</p>
        </div>
      ) : null}

      <ReasonActionDialog
        open={open}
        title={t('requestVerdictTitle')}
        onClose={() => setOpen(false)}
        onConfirm={async (summary) => {
          try {
            await requestReportVerdict.mutateAsync({
              id: report.id,
              summary,
            });
            toast.success(t('requestVerdictSuccess'));
            setOpen(false);
          } catch (err) {
            const key = resolveApiErrorKey(err);
            toast.error(
              key === 'errors.report_already_awaiting_verdict'
                ? t('requestVerdictAlready')
                : t('requestVerdictError'),
            );
          }
        }}
      />
    </section>
  );
}
