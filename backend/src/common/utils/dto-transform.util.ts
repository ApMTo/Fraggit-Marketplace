type TransformParams = { value: unknown };

export function trimString({ value }: TransformParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export function trimLowerString({ value }: TransformParams): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export function trimOptionalSlug({ value }: TransformParams): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return typeof value === 'string' ? value.trim().toLowerCase() : undefined;
}

export function trimStringArray({ value }: TransformParams): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function trimLowerUsername({ value }: TransformParams): unknown {
  return typeof value === 'string' ? value.toLowerCase().trim() : value;
}

export function trimOptionalNullableText({ value }: TransformParams): unknown {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function defaultStock({ value }: TransformParams): unknown {
  if (value === undefined || value === null || value === '') {
    return 1;
  }

  return value;
}

export function trimOptionalSearch({ value }: TransformParams): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  return value;
}
