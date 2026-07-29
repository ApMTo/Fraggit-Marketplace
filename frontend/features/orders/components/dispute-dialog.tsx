'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useModerationMutations } from '@/hooks/use-moderation';
import { resolveApiError } from '@/lib/api-errors';

type DisputeDialogProps = {
  open: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
};

export function DisputeDialog({
  open,
  onClose,
  orderId,
  orderNumber,
}: DisputeDialogProps) {
  const t = useTranslations('orders.dispute');
  const tErrors = useTranslations('errors');
  const { createTicket } = useModerationMutations();
  const [body, setBody] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleClose = () => {
    setBody('');
    setFormError(null);
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
            disabled={createTicket.isPending || body.trim().length < 3}
            isLoading={createTicket.isPending}
            onClick={async () => {
              try {
                setFormError(null);
                await createTicket.mutateAsync({
                  type: 'ORDER_DISPUTE',
                  orderId,
                  subject: t('subject', { number: orderNumber }),
                  body: body.trim(),
                });
                toast.success(t('success'));
                handleClose();
              } catch (error) {
                const resolved = resolveApiError(error);
                setFormError(tErrors(resolved.key, resolved.values));
              }
            }}
          >
            {t('submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-muted">{t('hint')}</p>
        <div className="space-y-2">
          <Label htmlFor="dispute-body">{t('body')}</Label>
          <Textarea
            id="dispute-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('bodyPlaceholder')}
            rows={5}
            hasError={Boolean(formError)}
          />
          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}
        </div>
      </div>
    </Dialog>
  );
}
