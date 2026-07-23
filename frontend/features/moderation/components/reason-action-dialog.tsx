'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ReasonActionDialogProps = {
  open: boolean;
  title: string;
  confirmLabel?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
};

export function ReasonActionDialog({
  open,
  title,
  confirmLabel,
  loading,
  onClose,
  onConfirm,
}: ReasonActionDialogProps) {
  const t = useTranslations('moderation.actions');
  const [reason, setReason] = useState('');

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={title}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            disabled={reason.trim().length < 3 || loading}
            onClick={async () => {
              await onConfirm(reason.trim());
              setReason('');
            }}
          >
            {confirmLabel ?? t('confirm')}
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        <Label htmlFor="mod-reason">{t('reason')}</Label>
        <Input
          id="mod-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('reasonPlaceholder')}
          minLength={3}
        />
      </div>
    </Dialog>
  );
}
