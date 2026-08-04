'use client';

import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  useCreateTelegramLink,
  useTelegramStatus,
  useUnlinkTelegram,
} from '@/hooks/use-telegram';
import { resolveApiError } from '@/lib/api-errors';

export function TelegramLinkForm() {
  const t = useTranslations('settings.telegram');
  const tErrors = useTranslations('errors');
  const { data, isLoading, isError, refetch, isFetching } = useTelegramStatus();
  const createLink = useCreateTelegramLink();
  const unlink = useUnlinkTelegram();

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-muted">{t('loadError')}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  const onConnect = async () => {
    try {
      const result = await createLink.mutateAsync();
      window.open(result.deepLink, '_blank', 'noopener,noreferrer');
      toast.success(t('linkOpened'));
      window.setTimeout(() => {
        void refetch();
      }, 2500);
    } catch (error) {
      const resolved = resolveApiError(error);
      toast.error(tErrors(resolved.key, resolved.values));
    }
  };

  const onUnlink = async () => {
    try {
      await unlink.mutateAsync();
      toast.success(t('unlinked'));
    } catch (error) {
      const resolved = resolveApiError(error);
      toast.error(tErrors(resolved.key, resolved.values));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="mt-1 text-sm text-muted">{t('subtitle')}</p>
      </div>

      {data.linked ? (
        <div className="space-y-4">
          <div className="space-y-1 text-sm">
            <p className="text-foreground">
              {t('linkedAs', {
                username: data.telegramUsername
                  ? `@${data.telegramUsername}`
                  : t('linkedAnonymous'),
              })}
            </p>
            <p className="text-muted">
              {t('localeLabel', {
                locale:
                  data.telegramLocale === 'ru' ? t('localeRu') : t('localeEn'),
              })}
            </p>
            <p className="text-muted">{t('localeHint')}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void onUnlink()}
            disabled={unlink.isPending}
          >
            {unlink.isPending ? t('unlinking') : t('unlink')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted">{t('notLinked')}</p>
          <Button
            type="button"
            onClick={() => void onConnect()}
            disabled={createLink.isPending}
          >
            {createLink.isPending ? t('connecting') : t('connect')}
          </Button>
        </div>
      )}
    </div>
  );
}
