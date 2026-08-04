import {
  TELEGRAM_DEFAULT_LOCALE,
  type TelegramLocale,
  isTelegramLocale,
} from './constants/telegram.constants';
import en from './i18n/en.json';
import ru from './i18n/ru.json';

type Catalog = {
  bot: Record<string, string>;
  notifications: Record<string, string>;
};

const catalogs: Record<TelegramLocale, Catalog> = {
  en: en,
  ru: ru,
};

const RAW_PARAM_KEYS = new Set(['href', 'openLink']);

export type TelegramNotifyAction = {
  href: string;
  labelKey: 'open' | 'openLot' | 'openChat' | 'openOrder';
};

export function normalizeTelegramLocale(
  locale?: string | null,
): TelegramLocale {
  if (locale && isTelegramLocale(locale)) {
    return locale;
  }

  return TELEGRAM_DEFAULT_LOCALE;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function htmlLink(href: string, label: string): string {
  const safeHref = href.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<a href="${safeHref}">${escapeHtml(label)}</a>`;
}

function enrichParams(
  locale: TelegramLocale,
  params: Record<string, string | number | undefined | null>,
  openLabelKey: TelegramNotifyAction['labelKey'] = 'open',
): Record<string, string> {
  const enriched: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value == null) {
      continue;
    }

    const asString = String(value);
    enriched[key] = RAW_PARAM_KEYS.has(key) ? asString : escapeHtml(asString);
  }

  if (enriched.orderNumber && !params.orderPart) {
    enriched.orderPart =
      locale === 'ru'
        ? ` по заказу #${enriched.orderNumber}`
        : ` for order #${enriched.orderNumber}`;
  }

  if (params.note != null && String(params.note).trim()) {
    const note = escapeHtml(String(params.note).trim());
    enriched.note =
      locale === 'ru' ? `\n\n📝 <i>${note}</i>` : `\n\n📝 <i>${note}</i>`;
  } else {
    enriched.note = '';
  }

  if (!enriched.orderPart) {
    enriched.orderPart = '';
  }

  if (!enriched.preview) {
    enriched.preview = '';
  } else if (params.preview != null && String(params.preview).trim()) {
    // preview used inside chat template as italic body; keep escaped value
  }

  if (enriched.href) {
    enriched.openLink = htmlLink(enriched.href, tBot(locale, openLabelKey));
  } else if (!enriched.openLink) {
    enriched.openLink = '';
  }

  return enriched;
}

function applyTemplate(
  template: string,
  params: Record<string, string>,
): string {
  return template.replace(
    /\{(\w+)\}/g,
    (_, name: string) => params[name] ?? '',
  );
}

export function tBot(locale: string | null | undefined, key: string): string {
  const normalized = normalizeTelegramLocale(locale);
  return catalogs[normalized].bot[key] ?? catalogs.en.bot[key] ?? key;
}

export function tNotification(
  locale: string | null | undefined,
  key: string,
  params: Record<string, string | number | undefined | null> = {},
  openLabelKey: TelegramNotifyAction['labelKey'] = 'open',
): string {
  const normalized = normalizeTelegramLocale(locale);
  const template =
    catalogs[normalized].notifications[key] ??
    catalogs.en.notifications[key] ??
    key;

  return applyTemplate(
    template,
    enrichParams(normalized, params, openLabelKey),
  );
}

export function formatNotificationMessage(
  locale: string | null | undefined,
  titleKey: string,
  bodyKey: string | null | undefined,
  params: Record<string, string | number | undefined | null> = {},
  href?: string,
  openLabelKey: TelegramNotifyAction['labelKey'] = 'openOrder',
): string {
  const title = tNotification(locale, titleKey, params, openLabelKey);
  const body = bodyKey
    ? tNotification(locale, bodyKey, params, openLabelKey)
    : '';

  const parts = [`<b>${title}</b>`];
  if (body.trim()) {
    parts.push(body);
  }

  if (href) {
    const label = tBot(locale, openLabelKey);
    parts.push(htmlLink(href, label));
  }

  return parts.join('\n\n');
}
