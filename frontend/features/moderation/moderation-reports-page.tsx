'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { ModerationShell } from '@/features/moderation/components/moderation-shell';
import { ReasonActionDialog } from '@/features/moderation/components/reason-action-dialog';
import { useModerationMutations, useModReports } from '@/hooks/use-moderation';
import type { ReportStatus } from '@/types/moderation';

type Props = { title: string };

type ReportAction = {
  id: string;
  status: Extract<ReportStatus, 'RESOLVED' | 'DISMISSED' | 'IN_REVIEW'>;
};

export function ModerationReportsPage({ title }: Props) {
  const t = useTranslations('moderation.reports');
  const { data, isLoading, isError } = useModReports({ limit: 40 });
  const { updateReport } = useModerationMutations();
  const [action, setAction] = useState<ReportAction | null>(null);

  return (
    <ModerationShell title={title}>
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
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">{t('columns.target')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.reason')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.status')}</th>
                <th className="px-4 py-3 font-medium">{t('columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((report) => (
                <tr key={report.id} className="border-b border-border/60">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {report.targetType} · {report.targetId.slice(0, 8)}…
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{report.reporter.username}
                    </p>
                  </td>
                  <td className="px-4 py-3">{report.reason}</td>
                  <td className="px-4 py-3">{report.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setAction({ id: report.id, status: 'IN_REVIEW' })
                        }
                      >
                        {t('actions.review')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setAction({ id: report.id, status: 'RESOLVED' })
                        }
                      >
                        {t('actions.resolve')}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setAction({ id: report.id, status: 'DISMISSED' })
                        }
                      >
                        {t('actions.dismiss')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ReasonActionDialog
        open={Boolean(action)}
        title={t('reasonTitle')}
        onClose={() => setAction(null)}
        onConfirm={async (reason) => {
          if (!action) return;
          try {
            await updateReport.mutateAsync({
              id: action.id,
              payload: { status: action.status, reason },
            });
            toast.success(t('actionSuccess'));
            setAction(null);
          } catch {
            toast.error(t('actionError'));
          }
        }}
      />
    </ModerationShell>
  );
}
