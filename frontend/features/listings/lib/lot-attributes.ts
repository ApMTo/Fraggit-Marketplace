import type { AttributeDefinitionPublic } from '@/types/category';
import type { LotAttributeInputValue } from '@/types/lot';

export function emptyAttributeValue(
  type: AttributeDefinitionPublic['type'],
): LotAttributeInputValue {
  switch (type) {
    case 'BOOLEAN':
      return false;
    case 'MULTISELECT':
      return [];
    case 'NUMBER':
      return '';
    default:
      return '';
  }
}

export function hasAttributeValue(value: LotAttributeInputValue): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (typeof value === 'boolean') {
    return true;
  }

  return value.length > 0;
}

export function buildAttributeInputs(
  definitions: AttributeDefinitionPublic[],
  values: Record<string, LotAttributeInputValue>,
) {
  return definitions
    .filter((definition) => hasAttributeValue(values[definition.id] ?? ''))
    .map((definition) => {
      const raw = values[definition.id];
      let value: LotAttributeInputValue = raw;

      if (definition.type === 'NUMBER' && typeof raw === 'string') {
        value = Number(raw);
      }

      if (definition.type === 'BOOLEAN') {
        value = Boolean(raw);
      }

      return {
        attributeId: definition.id,
        value,
      };
    });
}
