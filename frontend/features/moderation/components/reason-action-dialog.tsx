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
  /** When true, second field is shown — text the restricted user will see on login. */
  collectUserMessage?: boolean;
  onClose: () => void;
  onConfirm: (reason: string, userMessage?: string) => void | Promise<void>;
};

export function ReasonActionDialog({
  open,
  title,
  confirmLabel,
  loading,
  collectUserMessage = false,
  onClose,
  onConfirm,
}: ReasonActionDialogProps) {
  const t = useTranslations('moderation.actions');
  const [reason, setReason] = useState('');
  const [userMessage, setUserMessage] = useState('');

  const handleClose = () => {
    setReason('');
    setUserMessage('');
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
            disabled={
              reason.trim().length < 3 ||
              loading ||
              (collectUserMessage && userMessage.trim().length < 3)
            }
            onClick={async () => {
              await onConfirm(
                reason.trim(),
                collectUserMessage ? userMessage.trim() : undefined,
              );
              setReason('');
              setUserMessage('');
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
        {collectUserMessage ? (
          <>
            <Label htmlFor="mod-user-message" className="pt-2">
              {t('userMessageLabel')}
            </Label>
            <textarea
              id="mod-user-message"
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[88px] w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder={t('userMessagePlaceholder')}
              minLength={3}
            />
          </>
        ) : null}
      </div>
    </Dialog>
  );
}
