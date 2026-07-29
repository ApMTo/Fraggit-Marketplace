'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useModerationMutations } from '@/hooks/use-moderation';
import type { ReportReason, ReportTargetType } from '@/types/moderation';

const REASONS: ReportReason[] = ['SPAM', 'SCAM', 'ABUSE', 'STOLEN', 'OTHER'];

type ReportDialogProps = {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
};

export function ReportDialog({
  open,
  onClose,
  targetType,
  targetId,
}: ReportDialogProps) {
  const t = useTranslations('moderation.report');
  const { createReport } = useModerationMutations();
  const [reason, setReason] = useState<ReportReason>('SPAM');
  const [details, setDetails] = useState('');

  const handleClose = () => {
    setReason('SPAM');
    setDetails('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={t('title')}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            disabled={createReport.isPending}
            onClick={async () => {
              try {
                await createReport.mutateAsync({
                  targetType,
                  targetId,
                  reason,
                  details: details.trim() || undefined,
                });
                toast.success(t('success'));
                handleClose();
              } catch {
                toast.error(t('error'));
              }
            }}
          >
            {t('submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="report-reason">{t('reason')}</Label>
          <select
            id="report-reason"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {t(`reasons.${r}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="report-details">{t('details')}</Label>
          <Input
            id="report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={t('detailsPlaceholder')}
          />
        </div>
      </div>
    </Dialog>
  );
}
