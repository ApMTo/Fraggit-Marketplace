type ApiSuccessEnvelope<T> = {
  status: 'success';
  result: T;
};

export function isApiSuccessEnvelope<T>(
  value: unknown,
): value is ApiSuccessEnvelope<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    (value as ApiSuccessEnvelope<T>).status === 'success' &&
    'result' in value
  );
}

export function unwrapApiResponse<T>(value: unknown): T {
  if (isApiSuccessEnvelope<T>(value)) {
    return value.result;
  }

  return value as T;
}
