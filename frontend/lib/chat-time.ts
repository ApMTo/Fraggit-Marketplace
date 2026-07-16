function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isYesterday(date: Date, now: Date): boolean {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return isSameDay(date, yesterday);
}

export function formatChatListTime(
  value: string | null | undefined,
  locale: string,
): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();

  if (isSameDay(date, now)) {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  if (isYesterday(date, now)) {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
    }).format(date);
  }

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function formatMessageTime(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();

  if (isSameDay(date, now)) {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatMessageDayLabel(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();

  if (isSameDay(date, now)) {
    return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
  }

  if (isYesterday(date, now)) {
    return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
  }

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  }).format(date);
}

export function shouldShowDaySeparator(
  current: string,
  previous: string | null,
): boolean {
  if (!previous) {
    return true;
  }

  const currentDate = new Date(current);
  const previousDate = new Date(previous);

  if (
    Number.isNaN(currentDate.getTime()) ||
    Number.isNaN(previousDate.getTime())
  ) {
    return false;
  }

  return !isSameDay(currentDate, previousDate);
}
