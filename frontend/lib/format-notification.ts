import type { AppNotification } from '@/types/notifications';

type TranslateFn = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

function isI18nKey(value: string): boolean {
  return value.startsWith('items.');
}

function metadataParams(
  metadata: AppNotification['metadata'],
  t: TranslateFn,
): Record<string, string> {
  if (!metadata) {
    return { orderPart: '', note: '' };
  }

  const params: Record<string, string> = {
    orderPart: '',
    note: '',
  };

  for (const key of ['orderNumber', 'listingTitle'] as const) {
    const value = metadata[key];
    if (value != null && String(value).trim()) {
      params[key] = String(value);
    }
  }

  if (params.orderNumber) {
    params.orderPart = t('items.orderPart', {
      orderNumber: params.orderNumber,
    });
  }

  const note = metadata.note;
  if (typeof note === 'string' && note.trim()) {
    params.note = t('items.noteSuffix', { note: note.trim() });
  }

  return params;
}

export function formatNotificationTitle(
  notification: AppNotification,
  t: TranslateFn,
): string {
  if (isI18nKey(notification.title)) {
    return t(notification.title, metadataParams(notification.metadata, t));
  }
  return notification.title;
}

export function formatNotificationBody(
  notification: AppNotification,
  t: TranslateFn,
): string | null {
  if (!notification.body) {
    return null;
  }
  if (isI18nKey(notification.body)) {
    return t(notification.body, metadataParams(notification.metadata, t));
  }
  return notification.body;
}
