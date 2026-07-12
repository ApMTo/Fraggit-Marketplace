import { getApiErrorCode } from '@/lib/api-error';

const PARAMETERIZED_ERROR_CODES = new Set([
  'attribute_required',
  'unsupported_attribute_type',
  'invalid_attribute_value',
  'invalid_attribute_option',
  'unknown_filter_key',
  'invalid_filter_value',
]);

export type ResolvedApiError = {
  key: string;
  values?: { key: string };
};

function normalizeApiErrorCode(code: string): string {
  return code
    .replace(/^errors\./, '')
    .replace(/^validation\./, '')
    .replace(/^messages\./, '');
}

export function resolveApiError(error: unknown): ResolvedApiError {
  const code = getApiErrorCode(error);

  if (!code) {
    return { key: 'generic' };
  }

  const normalized = normalizeApiErrorCode(code);
  const [base, param] = normalized.split(':');

  if (param && PARAMETERIZED_ERROR_CODES.has(base)) {
    return { key: base, values: { key: param } };
  }

  return { key: base || 'generic' };
}

export function resolveApiErrorKey(error: unknown): string {
  return resolveApiError(error).key;
}
