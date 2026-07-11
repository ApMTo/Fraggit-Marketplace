import { BadRequestException } from '@nestjs/common';
import { AttributeType } from '@prisma/client';
import {
  AttributeDefinitionForValidation,
  parseAttributeOptions,
} from '../../attribute-definitions/constants/attribute-definition.select';
import { LotAttributeInputDto } from '../dto/lot-attribute-input.dto';

export type NormalizedLotAttribute = {
  attributeId: string;
  value: string;
};

export function normalizeLotAttributes(
  inputs: LotAttributeInputDto[],
  definitions: AttributeDefinitionForValidation[],
): NormalizedLotAttribute[] {
  const seenAttributeIds = new Set<string>();

  for (const input of inputs) {
    if (seenAttributeIds.has(input.attributeId)) {
      throw new BadRequestException('duplicate_attribute_id');
    }
    seenAttributeIds.add(input.attributeId);
  }

  const definitionById = new Map(
    definitions.map((definition) => [definition.id, definition]),
  );

  for (const input of inputs) {
    if (!definitionById.has(input.attributeId)) {
      throw new BadRequestException('unknown_attribute_id');
    }
  }

  const inputByAttributeId = new Map(
    inputs.map((input) => [input.attributeId, input.value]),
  );

  const normalized: NormalizedLotAttribute[] = [];

  for (const definition of definitions) {
    if (!inputByAttributeId.has(definition.id)) {
      if (definition.required) {
        throw new BadRequestException(`attribute_required:${definition.key}`);
      }
      continue;
    }

    const rawValue = inputByAttributeId.get(definition.id);
    const value = normalizeValue(definition, rawValue);
    normalized.push({ attributeId: definition.id, value });
  }

  return normalized;
}

function normalizeValue(
  definition: AttributeDefinitionForValidation,
  rawValue: string | number | boolean | string[] | undefined,
): string {
  switch (definition.type) {
    case AttributeType.TEXT:
    case AttributeType.TEXTAREA:
      return normalizeTextValue(definition.key, rawValue);

    case AttributeType.NUMBER:
      return normalizeNumberValue(definition.key, rawValue);

    case AttributeType.BOOLEAN:
      return normalizeBooleanValue(definition.key, rawValue);

    case AttributeType.SELECT:
      return normalizeSelectValue(definition, rawValue);

    case AttributeType.MULTISELECT:
      return normalizeMultiselectValue(definition, rawValue);

    default:
      throw new BadRequestException(
        `unsupported_attribute_type:${definition.key}`,
      );
  }
}

function normalizeTextValue(
  key: string,
  rawValue: string | number | boolean | string[] | undefined,
): string {
  if (typeof rawValue !== 'string') {
    throw new BadRequestException(`invalid_attribute_value:${key}`);
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    throw new BadRequestException(`invalid_attribute_value:${key}`);
  }

  return trimmed;
}

function normalizeNumberValue(
  key: string,
  rawValue: string | number | boolean | string[] | undefined,
): string {
  const numeric =
    typeof rawValue === 'number'
      ? rawValue
      : typeof rawValue === 'string'
        ? Number(rawValue.trim())
        : Number.NaN;

  if (!Number.isFinite(numeric)) {
    throw new BadRequestException(`invalid_attribute_value:${key}`);
  }

  return String(numeric);
}

function normalizeBooleanValue(
  key: string,
  rawValue: string | number | boolean | string[] | undefined,
): string {
  if (typeof rawValue === 'boolean') {
    return rawValue ? 'true' : 'false';
  }

  if (typeof rawValue === 'string') {
    const normalized = rawValue.trim().toLowerCase();
    if (normalized === 'true' || normalized === 'false') {
      return normalized;
    }
  }

  throw new BadRequestException(`invalid_attribute_value:${key}`);
}

function normalizeSelectValue(
  definition: AttributeDefinitionForValidation,
  rawValue: string | number | boolean | string[] | undefined,
): string {
  if (typeof rawValue !== 'string') {
    throw new BadRequestException(`invalid_attribute_value:${definition.key}`);
  }

  const value = rawValue.trim();
  const options = parseAttributeOptions(definition.options);

  if (!options || !options.includes(value)) {
    throw new BadRequestException(`invalid_attribute_option:${definition.key}`);
  }

  return value;
}

function normalizeMultiselectValue(
  definition: AttributeDefinitionForValidation,
  rawValue: string | number | boolean | string[] | undefined,
): string {
  const values = parseMultiselectRawValue(definition.key, rawValue);
  const options = parseAttributeOptions(definition.options);

  if (!options) {
    throw new BadRequestException(`invalid_attribute_option:${definition.key}`);
  }

  const optionSet = new Set(options);
  const uniqueValues = [...new Set(values)];

  if (!uniqueValues.length) {
    throw new BadRequestException(`invalid_attribute_value:${definition.key}`);
  }

  for (const value of uniqueValues) {
    if (!optionSet.has(value)) {
      throw new BadRequestException(
        `invalid_attribute_option:${definition.key}`,
      );
    }
  }

  return JSON.stringify(uniqueValues);
}

function parseMultiselectRawValue(
  key: string,
  rawValue: string | number | boolean | string[] | undefined,
): string[] {
  if (Array.isArray(rawValue)) {
    if (!rawValue.every((item) => typeof item === 'string')) {
      throw new BadRequestException(`invalid_attribute_value:${key}`);
    }
    return rawValue
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      throw new BadRequestException(`invalid_attribute_value:${key}`);
    }

    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (
        Array.isArray(parsed) &&
        parsed.every((item): item is string => typeof item === 'string')
      ) {
        return parsed
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      }
    } catch {
      return [trimmed];
    }
  }

  throw new BadRequestException(`invalid_attribute_value:${key}`);
}
