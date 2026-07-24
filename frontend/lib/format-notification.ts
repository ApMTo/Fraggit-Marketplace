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
): Record<string, string> {
  if (!metadata) {
    return {};
  }

  const params: Record<string, string> = {};
  for (const key of ['orderNumber', 'listingTitle'] as const) {
    const value = metadata[key];
    if (value != null) {
      params[key] = String(value);
    }
  }
  return params;
}

export function formatNotificationTitle(
  notification: AppNotification,
  t: TranslateFn,
): string {
  if (isI18nKey(notification.title)) {
    return t(notification.title, metadataParams(notification.metadata));
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
    return t(notification.body, metadataParams(notification.metadata));
  }
  return notification.body;
}
