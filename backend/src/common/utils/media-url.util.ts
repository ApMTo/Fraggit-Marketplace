const ABSOLUTE_URL_RE = /^https?:\/\//i;

const CLOUDINARY_UPLOAD_PREFIX_RE =
  /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:v\d+\/)?/i;

export const MEDIA_URL_KEYS = new Set([
  'avatarUrl',
  'previewUrl',
  'iconUrl',
  'coverUrl',
  'url',
]);

export function isAbsoluteMediaUrl(value: string): boolean {
  return ABSOLUTE_URL_RE.test(value);
}

export function isAllowedStoredMediaRef(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith('https://')) {
    return true;
  }

  if (trimmed.startsWith('http://')) {
    return false;
  }

  if (trimmed.includes('..') || trimmed.includes('\\')) {
    return false;
  }

  return /^[a-zA-Z0-9][a-zA-Z0-9_./-]*$/.test(trimmed);
}

export function resolveMediaUrl(
  value: string | null | undefined,
  baseUrl: string,
): string | null {
  if (value == null || value === '') {
    return value ?? null;
  }

  if (isAbsoluteMediaUrl(value)) {
    return value;
  }

  const base = baseUrl.replace(/\/$/, '');
  const path = value.replace(/^\//, '');

  if (!base) {
    return path;
  }

  return `${base}/${path}`;
}

export function toStoredMediaPath(value: string): string {
  if (!value.startsWith('https://res.cloudinary.com/')) {
    return value;
  }

  return value.replace(CLOUDINARY_UPLOAD_PREFIX_RE, '');
}

export function resolveMediaUrlsInTree<T>(value: T, baseUrl: string): T {
  return resolveMediaUrlsInTreeInner(value, baseUrl, new WeakSet());
}

function resolveMediaUrlsInTreeInner<T>(
  value: T,
  baseUrl: string,
  seen: WeakSet<object>,
): T {
  if (value == null || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (seen.has(value)) {
    return value;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    const items = value as unknown[];
    for (let i = 0; i < items.length; i++) {
      items[i] = resolveMediaUrlsInTreeInner(items[i], baseUrl, seen);
    }
    return value;
  }

  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    const child = obj[key];
    if (typeof child === 'string' && MEDIA_URL_KEYS.has(key)) {
      obj[key] = resolveMediaUrl(child, baseUrl);
    } else if (child != null && typeof child === 'object') {
      obj[key] = resolveMediaUrlsInTreeInner(child, baseUrl, seen);
    }
  }

  return value;
}

export function buildCloudinaryBaseUrl(cloudName: string): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload`;
}
